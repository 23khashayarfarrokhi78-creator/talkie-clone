import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Mic, MicOff, Volume2, VolumeX, Trash2 } from 'lucide-react';
import type { Character, Message } from '../types';
import { api } from '../services/api';
import Avatar from '../components/Avatar';
import ChatBubble from '../components/ChatBubble';
import TypingIndicator from '../components/TypingIndicator';

export default function ChatPage() {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!characterId) return;
    api.getCharacter(characterId).then(setCharacter);
    api.getConversations(characterId).then((convos) => {
      if (convos.length > 0) {
        setConversationId(convos[0].id);
        api.getConversation(convos[0].id).then((c) => {
          setMessages(c.messages || []);
        });
      }
    });
  }, [characterId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*[^*]+\*/g, '').trim();
    if (!clean) return;
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !characterId || isTyping) return;

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const res = await api.sendMessage(characterId, text, conversationId || undefined);
      if (!conversationId) setConversationId(res.conversation_id);
      setMessages((prev) => [...prev, res.message]);
      speak(res.message.content);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '*connection lost* Sorry, I had trouble responding. Try again?',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const clearChat = async () => {
    if (!conversationId) return;
    await api.deleteConversation(conversationId);
    setMessages([]);
    setConversationId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const bgStyle = character.background_url
    ? {
        backgroundImage: `url(${character.background_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed' as const,
      }
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-bg relative" style={bgStyle}>
      {character.background_url && (
        <div className="absolute inset-0 bg-bg/70 backdrop-blur-[2px]" />
      )}
      {/* Header */}
      <header className="sticky top-0 bg-surface/90 backdrop-blur-xl z-40 border-b border-white/5 relative">
        <div className="flex items-center gap-3 px-4 py-3.5 max-w-lg mx-auto">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-surface-light rounded-xl transition-colors active:scale-95">
            <ArrowLeft size={24} className="text-text" />
          </button>
          <Avatar name={character.name} color={character.avatar_color} avatarUrl={character.avatar_url} size="sm" />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-[15px] text-text truncate">{character.name}</h2>
            <p className="text-xs text-text-muted truncate">{character.tagline}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`p-2.5 rounded-xl transition-colors active:scale-95 ${ttsEnabled ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text hover:bg-surface-light'}`}
              title={ttsEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {ttsEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </button>
            {conversationId && (
              <button
                onClick={clearChat}
                className="p-2.5 rounded-xl text-text-muted hover:text-accent hover:bg-surface-light transition-colors active:scale-95"
                title="Clear chat"
              >
                <Trash2 size={22} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-6 py-5 max-w-lg mx-auto w-full relative z-10">
        <div className="flex flex-col gap-4">
          {messages.length === 0 && !isTyping && (
            <div className="text-center py-12">
              <Avatar name={character.name} color={character.avatar_color} avatarUrl={character.avatar_url} size="xl" />
              <h3 className="font-bold text-lg text-text mt-4">{character.name}</h3>
              <p className="text-sm text-text-muted mt-1 max-w-[250px] mx-auto">{character.tagline}</p>
              <p className="text-xs text-text-muted mt-4 bg-surface rounded-xl px-4 py-3 max-w-[300px] mx-auto">
                {character.scenario || `Say hello to ${character.name}!`}
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              characterName={msg.role === 'assistant' ? character.name : undefined}
              characterColor={character.avatar_color}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 bg-surface/90 backdrop-blur-xl border-t border-white/5 safe-area-bottom relative z-10">
        <div className="flex items-end gap-2.5 px-4 py-3.5 max-w-lg mx-auto">
          <button
            onClick={toggleListening}
            className={`p-3 rounded-xl transition-colors shrink-0 active:scale-95 ${
              isListening
                ? 'bg-accent text-white animate-pulse'
                : 'text-text-muted hover:text-text hover:bg-surface-light'
            }`}
          >
            {isListening ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${character.name}...`}
            rows={1}
            className="flex-1 bg-surface-light text-text text-[15px] rounded-2xl px-4 py-3 resize-none border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted max-h-[120px]"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="p-3 rounded-xl bg-primary text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors shrink-0 active:scale-95"
          >
            <Send size={22} />
          </button>
        </div>
      </footer>
    </div>
  );
}
