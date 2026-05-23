export interface BackgroundMediaItem {
  type: 'image' | 'video';
  url: string;
  label?: string;
}

export interface Character {
  id: string;
  name: string;
  tagline: string;
  description: string;
  personality: string;
  scenario: string;
  greeting: string;
  avatar_url: string;
  avatar_color: string;
  background_url: string;
  background_media: BackgroundMediaItem[];
  category: string;
  is_default: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  character_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
  character?: Character;
}

export interface ChatResponse {
  message: Message;
  conversation_id: string;
}
