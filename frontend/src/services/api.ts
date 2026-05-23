import type {
  BackgroundMediaType,
  Character,
  ChatResponse,
  Conversation,
  Message,
} from '../types';
import { fileToDataUrl, inferMediaType, localStore } from './localStore';
import { generateReply } from './openrouter';

export interface UploadResult {
  url: string;
  type: BackgroundMediaType;
}

/**
 * Local-only API surface. Mirrors the original HTTP-backed `api` shape so the
 * UI doesn't care that everything now lives on-device.
 */
export const api = {
  getCharacters: (category?: string): Promise<Character[]> =>
    localStore.listCharacters(category),

  getCharacter: (id: string): Promise<Character> => localStore.getCharacter(id),

  createCharacter: (data: Partial<Character>): Promise<Character> =>
    localStore.createCharacter(data),

  updateCharacter: (id: string, data: Partial<Character>): Promise<Character> =>
    localStore.updateCharacter(id, data),

  deleteCharacter: (id: string): Promise<void> => localStore.deleteCharacter(id),

  getConversations: (characterId: string): Promise<Conversation[]> =>
    localStore.listConversations(characterId),

  getConversation: (id: string): Promise<Conversation> =>
    localStore.getConversation(id),

  deleteConversation: (id: string): Promise<void> =>
    localStore.deleteConversation(id),

  async sendMessage(
    characterId: string,
    message: string,
    conversationId?: string,
  ): Promise<ChatResponse> {
    const character = await localStore.getCharacter(characterId);

    let conversation: Conversation;
    let history: Message[] = [];

    if (conversationId) {
      conversation = await localStore.getConversation(conversationId);
      history = conversation.messages ?? [];
    } else {
      conversation = await localStore.createConversation(
        characterId,
        message,
      );
      if (character.greeting) {
        await localStore.appendMessage(
          conversation.id,
          'assistant',
          character.greeting,
        );
        history = await localStore.listMessages(conversation.id);
      }
    }

    await localStore.appendMessage(conversation.id, 'user', message);

    const reply = await generateReply({
      characterName: character.name,
      personality: character.personality,
      scenario: character.scenario,
      description: character.description,
      history: history.map((m) => ({ role: m.role, content: m.content })),
      userMessage: message,
    });

    const aiMsg = await localStore.appendMessage(
      conversation.id,
      'assistant',
      reply,
    );

    return { message: aiMsg, conversation_id: conversation.id };
  },

  uploadMedia: async (file: File): Promise<UploadResult> => {
    const url = await fileToDataUrl(file);
    return { url, type: inferMediaType(file) };
  },

  // Legacy image-only helper kept for backward compatibility.
  uploadImage: async (file: File): Promise<string> => {
    const url = await fileToDataUrl(file);
    return url;
  },
};
