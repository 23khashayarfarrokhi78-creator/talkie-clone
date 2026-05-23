import type { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
  characterName?: string;
  characterColor?: string;
}

function formatContent(content: string) {
  const parts = content.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="text-primary-light/70 italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatBubble({ message, characterName }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className="max-w-[82%] min-w-0">
        {!isUser && characterName && (
          <span className="text-[11px] font-semibold mb-1 block ml-3 text-primary-light">
            {characterName}
          </span>
        )}
        <div
          className={`px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap break-words min-w-0 ${
            isUser
              ? 'bg-primary text-white rounded-2xl rounded-br-md'
              : 'bg-bubble-ai border border-white/[0.06] text-text rounded-2xl rounded-bl-md'
          }`}
          style={
            isUser
              ? { boxShadow: '0 2px 12px rgba(168,127,255,0.25)' }
              : { boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }
          }
        >
          {formatContent(message.content)}
        </div>
      </div>
    </div>
  );
}
