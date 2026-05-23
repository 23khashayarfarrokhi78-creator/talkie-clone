import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  Send,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { BackgroundMediaItem, Character, Message } from '../types';
import { api } from '../services/api';
import Avatar from '../components/Avatar';
import ChatBubble from '../components/ChatBubble';
import TypingIndicator from '../components/TypingIndicator';

function resolveBackgroundMedia(
  character: Character | null,
): BackgroundMediaItem[] {
  if (!character) return [];
  if (character.background_media && character.background_media.length > 0) {
    return character.background_media;
  }
  if (character.background_url) {
    // Legacy fallback: treat single background_url as an image.
    return [{ type: 'image', url: character.background_url }];
  }
  return [];
}

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
  const [activeBgIndex, setActiveBgIndex] = useState(0);
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

  const speak = useCallback(
    (text: string) => {
      if (!ttsEnabled || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const clean = text.replace(/\*[^*]+\*/g, '').trim();
      if (!clean) return;
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    },
    [ttsEnabled],
  );

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
      const res = await api.sendMessage(
        characterId,
        text,
        conversationId || undefined,
      );
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
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
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
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  };

  const bgItems = useMemo(() => resolveBackgroundMedia(character), [character]);
  const hasBackground = bgItems.length > 0;
  const safeIndex =
    bgItems.length === 0 ? 0 : ((activeBgIndex % bgItems.length) + bgItems.length) % bgItems.length;
  const activeBg = hasBackground ? bgItems[safeIndex] : null;
  const showSwitcher = bgItems.length > 1;

  const goPrev = () =>
    setActiveBgIndex((i) => (i - 1 + bgItems.length) % bgItems.length);
  const goNext = () => setActiveBgIndex((i) => (i + 1) % bgItems.length);

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg relative overflow-hidden">
      {/* Background layer (z-0) */}
      {activeBg && activeBg.type === 'image' && (
        <div
          aria-hidden
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${activeBg.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        />
      )}
      {activeBg && activeBg.type === 'video' && (
        <video
          key={activeBg.url}
          aria-hidden
          className="absolute inset-0 z-0 w-full h-full object-cover pointer-events-none"
          src={activeBg.url}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
      )}
      {/* Readability overlay (z-10) */}
      {hasBackground && (
        <div
          aria-hidden
          className="absolute inset-0 z-10 bg-bg/65 backdrop-blur-[2px] pointer-events-none"
        />
      )}

      {/* Header (z-40) */}
      <header className="sticky top-0 bg-surface/90 backdrop-blur-xl z-40 border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 hover:bg-surface-light rounded-lg transition-colors"
          >
            <ArrowLeft size={22} className="text-text" />
          </button>
          <Avatar
            name={character.name}
            color={character.avatar_color}
            avatarUrl={character.avatar_url}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm text-text truncate">
              {character.name}
            </h2>
            <p className="text-[10px] text-text-muted truncate">
              {character.tagline}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                ttsEnabled
                  ? 'text-primary bg-primary/10'
                  : 'text-text-muted hover:text-text'
              }`}
              title={ttsEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            {conversationId && (
              <button
                onClick={clearChat}
                className="p-2 rounded-lg text-text-muted hover:text-accent transition-colors"
                title="Clear chat"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages (z-20) */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-28 max-w-lg mx-auto w-full relative z-20">
        <div className="flex flex-col gap-3">
          {messages.length === 0 && !isTyping && (
            <div className="text-center py-10 sm:py-14">
              <Avatar
                name={character.name}
                color={character.avatar_color}
                avatarUrl={character.avatar_url}
                size="xl"
              />
              <h3 className="font-bold text-lg text-text mt-4">
                {character.name}
              </h3>
              <p className="text-sm text-text-muted mt-1 max-w-[260px] mx-auto">
                {character.tagline}
              </p>
              <p className="text-xs text-text-muted mt-4 bg-surface/80 backdrop-blur rounded-xl px-4 py-3 max-w-[300px] mx-auto">
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

      {/* Background switcher (z-30) — only when >1 items */}
      {showSwitcher && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 sm:bottom-28 z-30 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-2 bg-surface/85 backdrop-blur-xl border border-white/10 rounded-full px-2 py-1.5 shadow-lg">
            <button
              onClick={goPrev}
              aria-label="Previous background"
              className="p-1.5 rounded-full hover:bg-white/10 text-text"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5 px-1">
              {bgItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveBgIndex(idx)}
                  aria-label={`Background ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === safeIndex
                      ? 'bg-primary w-5'
                      : 'bg-text-muted/50 w-1.5 hover:bg-text-muted'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={goNext}
              aria-label="Next background"
              className="p-1.5 rounded-full hover:bg-white/10 text-text"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Input footer (z-40) */}
      <footer className="sticky bottom-0 bg-surface/90 backdrop-blur-xl border-t border-white/5 safe-area-bottom z-40">
        <div className="flex items-end gap-2 px-3 sm:px-4 py-3 max-w-lg mx-auto">
          <button
            onClick={toggleListening}
            className={`p-2.5 rounded-xl transition-colors shrink-0 ${
              isListening
                ? 'bg-accent text-white animate-pulse'
                : 'text-text-muted hover:text-text hover:bg-surface-light'
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
            className="flex-1 bg-surface-light text-text text-sm rounded-xl px-4 py-3 resize-none border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted max-h-[140px] min-h-[44px]"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="p-2.5 rounded-xl bg-primary text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors shrink-0"
          >
            <Send size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}
