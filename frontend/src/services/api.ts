const API_BASE = import.meta.env.PROD
  ? 'https://talkie-backend-szujqamg.fly.dev/api'
  : '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

import type {
  BackgroundMediaType,
  Character,
  ChatResponse,
  Conversation,
} from '../types';

export interface UploadResult {
  url: string;
  type: BackgroundMediaType;
}

function absoluteUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (import.meta.env.PROD) {
    return `https://talkie-backend-szujqamg.fly.dev${url}`;
  }
  return url;
}

function inferTypeFromFile(file: File): BackgroundMediaType {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  if (['mp4', 'webm', 'mov', 'ogv', 'm4v'].includes(ext)) return 'video';
  return 'image';
}

export const api = {
  getCharacters: (category?: string) =>
    request<Character[]>(`/characters${category ? `?category=${category}` : ''}`),

  getCharacter: (id: string) =>
    request<Character>(`/characters/${id}`),

  createCharacter: (data: Partial<Character>) =>
    request<Character>('/characters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCharacter: (id: string, data: Partial<Character>) =>
    request<Character>(`/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCharacter: (id: string) =>
    request<void>(`/characters/${id}`, { method: 'DELETE' }),

  getConversations: (characterId: string) =>
    request<Conversation[]>(`/characters/${characterId}/conversations`),

  getConversation: (id: string) =>
    request<Conversation>(`/conversations/${id}`),

  deleteConversation: (id: string) =>
    request<void>(`/conversations/${id}`, { method: 'DELETE' }),

  sendMessage: (characterId: string, message: string, conversationId?: string) =>
    request<ChatResponse>(`/characters/${characterId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id: conversationId }),
    }),

  // Generic media uploader supporting images AND videos.
  uploadMedia: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/uploads`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    const data = (await res.json()) as { url: string; type?: BackgroundMediaType };
    return {
      url: absoluteUrl(data.url),
      type: data.type ?? inferTypeFromFile(file),
    };
  },

  // Legacy image-only helper kept for backward compatibility.
  uploadImage: async (file: File): Promise<string> => {
    const { url } = await api.uploadMedia(file);
    return url;
  },
};
