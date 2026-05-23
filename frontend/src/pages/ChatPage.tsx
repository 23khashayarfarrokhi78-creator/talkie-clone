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
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasBg = !!character.background_url;

  return (
    <div className="h-dvh flex flex-col w-full max-w-full overflow-hidden bg-bg relative">
      {/* Immersive background */}
      {hasBg && (
        <>
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${character.background_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 z-0 gradient-overlay-full" />
        </>
      )}

      {/* Floating Header */}
      <header className="relative z-30 safe-area-top">
        <div className="glass border-b border-white/[0.05]">
          <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-white/[0.08] transition-colors shrink-0"
            >
              <ArrowLeft size={20} className="text-text" />
            </button>

            <Avatar
              name={character.name}
              color={character.avatar_color}
              avatarUrl={character.avatar_url}
              size="sm"
            />

            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm text-text truncate">{character.name}</h2>
              <p className="text-[11px] text-text-muted truncate">{character.tagline}</p>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`p-2 rounded-xl transition-colors ${
                  ttsEnabled
                    ? 'text-primary bg-primary/15'
                    : 'text-text-muted hover:text-text hover:bg-white/[0.06]'
                }`}
                title={ttsEnabled ? 'Disable voice' : 'Enable voice'}
              >
                {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              {conversationId && (
                <button
                  onClick={clearChat}
                  className="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-white/[0.06] transition-colors"
                  title="Clear chat"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto relative z-10 min-h-0">
        <div className="px-4 py-4 max-w-lg mx-auto w-full">
          <div className="flex flex-col gap-3">
            {/* Empty state */}
            {messages.length === 0 && !isTyping && (
              <div className="text-center py-16 animate-fade-in">
                <div className="flex justify-center">
                  <Avatar
                    name={character.name}
                    color={character.avatar_color}
                    avatarUrl={character.avatar_url}
                    size="xl"
                  />
                </div>
                <h3 className="font-bold text-lg text-text mt-5">{character.name}</h3>
                <p className="text-sm text-text-muted mt-1 max-w-[240px] mx-auto leading-relaxed">
                  {character.tagline}
                </p>
                <div
                  className="mt-5 bg-bubble-ai border border-white/[0.06] rounded-2xl px-5 py-4 max-w-[280px] mx-auto"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                >
                  <p className="text-[13px] text-text/80 leading-relaxed">
                    {character.scenario || `Say hello to ${character.name}!`}
                  </p>
                </div>
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
            <div ref={messagesEndRef} className="h-2" />
          </div>
        </div>
      </main>

      {/* Floating input bar */}
      <footer className="relative z-30 safe-area-bottom">
        <div className="glass border-t border-white/[0.05]">
          <div className="flex items-end gap-2 px-3 py-3 max-w-lg mx-auto">
            <button
              onClick={toggleListening}
              className={`p-2.5 rounded-xl transition-all duration-200 shrink-0 ${
                isListening
                  ? 'bg-accent text-white animate-pulse shadow-lg'
                  : 'text-text-muted hover:text-text hover:bg-white/[0.06]'
              }`}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${character.name}...`}
              rows={1}
              className="flex-1 min-w-0 bg-surface-light/80 text-text text-sm rounded-2xl px-4 py-2.5 resize-none border border-white/[0.06] focus:border-primary/40 focus:outline-none placeholder:text-text-muted max-h-[120px]"
            />

            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="p-2.5 rounded-xl bg-primary text-white disabled:opacity-25 disabled:cursor-not-allowed hover:bg-primary-dark transition-all duration-200 shrink-0"
              style={{ boxShadow: input.trim() && !isTyping ? '0 2px 12px rgba(168,127,255,0.35)' : 'none' }}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
