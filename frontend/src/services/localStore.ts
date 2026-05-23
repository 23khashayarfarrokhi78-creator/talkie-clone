import type {
  BackgroundMediaItem,
  Character,
  Conversation,
  Message,
} from '../types';
import { DEFAULT_CHARACTERS } from './seedCharacters';

const DB_NAME = 'talkie-clone';
const DB_VERSION = 1;

const STORE_CHARACTERS = 'characters';
const STORE_CONVERSATIONS = 'conversations';
const STORE_MESSAGES = 'messages';
const STORE_META = 'meta';

const META_KEY_SEEDED = 'seeded_v1';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_CHARACTERS)) {
        const store = db.createObjectStore(STORE_CHARACTERS, { keyPath: 'id' });
        store.createIndex('by_category', 'category');
      }
      if (!db.objectStoreNames.contains(STORE_CONVERSATIONS)) {
        const store = db.createObjectStore(STORE_CONVERSATIONS, {
          keyPath: 'id',
        });
        store.createIndex('by_character', 'character_id');
      }
      if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
        const store = db.createObjectStore(STORE_MESSAGES, { keyPath: 'id' });
        store.createIndex('by_conversation', 'conversation_id');
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB upgrade blocked'));
  });
  return dbPromise;
}

function tx<T>(
  stores: string | string[],
  mode: IDBTransactionMode,
  run: (
    t: IDBTransaction,
    s: (name: string) => IDBObjectStore,
  ) => Promise<T> | T,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(stores, mode);
        let result: T;
        let pending = true;
        const getStore = (name: string) => transaction.objectStore(name);
        Promise.resolve(run(transaction, getStore))
          .then((value) => {
            result = value;
            pending = false;
          })
          .catch((err) => {
            transaction.abort();
            reject(err);
          });
        transaction.oncomplete = () => {
          if (pending) {
            // Promise still resolving — resolve once it settles.
            setTimeout(() => resolve(result), 0);
          } else {
            resolve(result);
          }
        };
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('transaction aborted'));
      }),
  );
}

function reqAsPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function ensureSeeded(): Promise<void> {
  const seeded = await tx<boolean>(
    [STORE_META],
    'readonly',
    async (_t, s) => {
      const rec = await reqAsPromise<{ key: string; value: boolean } | undefined>(
        s(STORE_META).get(META_KEY_SEEDED) as IDBRequest<
          { key: string; value: boolean } | undefined
        >,
      );
      return Boolean(rec?.value);
    },
  );
  if (seeded) return;

  await tx<void>(
    [STORE_CHARACTERS, STORE_META],
    'readwrite',
    (_t, s) => {
      const charStore = s(STORE_CHARACTERS);
      const metaStore = s(STORE_META);
      for (const seed of DEFAULT_CHARACTERS) {
        const character: Character = {
          ...seed,
          id: `default-${seed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          avatar_url: '',
          background_url: '',
          background_media: [],
          created_at: nowIso(),
        };
        charStore.put(character);
      }
      metaStore.put({ key: META_KEY_SEEDED, value: true });
    },
  );
}

export const localStore = {
  async listCharacters(category?: string): Promise<Character[]> {
    await ensureSeeded();
    return tx<Character[]>(
      [STORE_CHARACTERS],
      'readonly',
      (_t, s) =>
        new Promise<Character[]>((resolve, reject) => {
          const req = s(STORE_CHARACTERS).getAll();
          req.onsuccess = () => {
            let rows = req.result as Character[];
            if (category) {
              rows = rows.filter((c) => c.category === category);
            }
            rows.sort((a, b) => {
              // Defaults first, then newest user-created.
              if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
              return b.created_at.localeCompare(a.created_at);
            });
            resolve(rows);
          };
          req.onerror = () => reject(req.error);
        }),
    );
  },

  async getCharacter(id: string): Promise<Character> {
    await ensureSeeded();
    const character = await tx<Character | undefined>(
      [STORE_CHARACTERS],
      'readonly',
      (_t, s) => reqAsPromise(s(STORE_CHARACTERS).get(id) as IDBRequest<Character | undefined>),
    );
    if (!character) throw new Error('Character not found');
    return character;
  },

  async createCharacter(data: Partial<Character>): Promise<Character> {
    const character: Character = {
      id: genId(),
      name: data.name ?? '',
      tagline: data.tagline ?? '',
      description: data.description ?? '',
      personality: data.personality ?? '',
      scenario: data.scenario ?? '',
      greeting: data.greeting ?? '',
      avatar_url: data.avatar_url ?? '',
      avatar_color: data.avatar_color ?? '#6366f1',
      background_url: data.background_url ?? '',
      background_media: data.background_media ?? [],
      category: data.category ?? 'custom',
      is_default: false,
      created_at: nowIso(),
    };
    await tx<void>([STORE_CHARACTERS], 'readwrite', (_t, s) => {
      s(STORE_CHARACTERS).put(character);
    });
    return character;
  },

  async updateCharacter(id: string, data: Partial<Character>): Promise<Character> {
    const existing = await this.getCharacter(id);
    const updated: Character = { ...existing, ...data, id, is_default: existing.is_default };
    await tx<void>([STORE_CHARACTERS], 'readwrite', (_t, s) => {
      s(STORE_CHARACTERS).put(updated);
    });
    return updated;
  },

  async deleteCharacter(id: string): Promise<void> {
    await tx<void>(
      [STORE_CHARACTERS, STORE_CONVERSATIONS, STORE_MESSAGES],
      'readwrite',
      async (_t, s) => {
        s(STORE_CHARACTERS).delete(id);
        const convIndex = s(STORE_CONVERSATIONS).index('by_character');
        const convs = await reqAsPromise<Conversation[]>(
          convIndex.getAll(IDBKeyRange.only(id)) as IDBRequest<Conversation[]>,
        );
        for (const conv of convs) {
          s(STORE_CONVERSATIONS).delete(conv.id);
          const msgIndex = s(STORE_MESSAGES).index('by_conversation');
          const msgs = await reqAsPromise<Message[]>(
            msgIndex.getAll(IDBKeyRange.only(conv.id)) as IDBRequest<Message[]>,
          );
          for (const m of msgs) s(STORE_MESSAGES).delete(m.id);
        }
      },
    );
  },

  async listConversations(characterId: string): Promise<Conversation[]> {
    return tx<Conversation[]>(
      [STORE_CONVERSATIONS],
      'readonly',
      (_t, s) =>
        new Promise<Conversation[]>((resolve, reject) => {
          const index = s(STORE_CONVERSATIONS).index('by_character');
          const req = index.getAll(IDBKeyRange.only(characterId));
          req.onsuccess = () => {
            const rows = req.result as Conversation[];
            rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
            resolve(rows);
          };
          req.onerror = () => reject(req.error);
        }),
    );
  },

  async getConversation(id: string): Promise<Conversation> {
    const { conversation, messages, character } = await tx<{
      conversation: Conversation | undefined;
      messages: Message[];
      character: Character | undefined;
    }>(
      [STORE_CONVERSATIONS, STORE_MESSAGES, STORE_CHARACTERS],
      'readonly',
      async (_t, s) => {
        const conv = await reqAsPromise<Conversation | undefined>(
          s(STORE_CONVERSATIONS).get(id) as IDBRequest<Conversation | undefined>,
        );
        if (!conv) return { conversation: undefined, messages: [], character: undefined };
        const msgs = await reqAsPromise<Message[]>(
          s(STORE_MESSAGES)
            .index('by_conversation')
            .getAll(IDBKeyRange.only(id)) as IDBRequest<Message[]>,
        );
        const char = await reqAsPromise<Character | undefined>(
          s(STORE_CHARACTERS).get(conv.character_id) as IDBRequest<Character | undefined>,
        );
        return { conversation: conv, messages: msgs, character: char };
      },
    );
    if (!conversation) throw new Error('Conversation not found');
    messages.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return { ...conversation, messages, character };
  },

  async deleteConversation(id: string): Promise<void> {
    await tx<void>(
      [STORE_CONVERSATIONS, STORE_MESSAGES],
      'readwrite',
      async (_t, s) => {
        s(STORE_CONVERSATIONS).delete(id);
        const msgs = await reqAsPromise<Message[]>(
          s(STORE_MESSAGES)
            .index('by_conversation')
            .getAll(IDBKeyRange.only(id)) as IDBRequest<Message[]>,
        );
        for (const m of msgs) s(STORE_MESSAGES).delete(m.id);
      },
    );
  },

  async createConversation(characterId: string, title: string): Promise<Conversation> {
    const conversation: Conversation = {
      id: genId(),
      character_id: characterId,
      title: title.slice(0, 50),
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    await tx<void>([STORE_CONVERSATIONS], 'readwrite', (_t, s) => {
      s(STORE_CONVERSATIONS).put(conversation);
    });
    return conversation;
  },

  async touchConversation(id: string): Promise<void> {
    await tx<void>([STORE_CONVERSATIONS], 'readwrite', async (_t, s) => {
      const conv = await reqAsPromise<Conversation | undefined>(
        s(STORE_CONVERSATIONS).get(id) as IDBRequest<Conversation | undefined>,
      );
      if (!conv) return;
      conv.updated_at = nowIso();
      s(STORE_CONVERSATIONS).put(conv);
    });
  },

  async appendMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
  ): Promise<Message> {
    const message: Message = {
      id: genId(),
      role,
      content,
      created_at: nowIso(),
    };
    await tx<void>([STORE_MESSAGES], 'readwrite', (_t, s) => {
      s(STORE_MESSAGES).put({ ...message, conversation_id: conversationId });
    });
    await this.touchConversation(conversationId);
    return message;
  },

  async listMessages(conversationId: string): Promise<Message[]> {
    const msgs = await tx<Message[]>(
      [STORE_MESSAGES],
      'readonly',
      (_t, s) =>
        reqAsPromise(
          s(STORE_MESSAGES)
            .index('by_conversation')
            .getAll(IDBKeyRange.only(conversationId)) as IDBRequest<Message[]>,
        ),
    );
    msgs.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return msgs;
  },
};

/**
 * Convert a File (image or video) to a data URI so it can be persisted in
 * IndexedDB and referenced directly as `<img src>` / `<video src>` /
 * `background-image: url(...)` without an active object URL.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function inferMediaType(file: File): 'image' | 'video' {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  if (['mp4', 'webm', 'mov', 'ogv', 'm4v'].includes(ext)) return 'video';
  return 'image';
}

export type { BackgroundMediaItem };
