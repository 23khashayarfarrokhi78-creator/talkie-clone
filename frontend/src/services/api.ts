const API_BASE = import.meta.env.PROD
  ? 'https://talkie-backend-xrkrwmng.fly.dev/api'
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

import type { Character, ChatResponse, Conversation } from '../types';

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

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/uploads`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    if (import.meta.env.PROD) {
      return `https://talkie-backend-xrkrwmng.fly.dev${data.url}`;
    }
    return data.url;
  },
};
