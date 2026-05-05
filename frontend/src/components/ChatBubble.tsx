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
        <em key={i} className="text-text-muted italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatBubble({ message, characterName, characterColor }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`max-w-[85%] sm:max-w-[75%]`}>
        {!isUser && characterName && (
          <span
            className="text-xs font-semibold mb-1 block ml-1"
            style={{ color: characterColor }}
          >
            {characterName}
          </span>
        )}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-primary text-white rounded-br-sm'
              : 'bg-surface-light text-text rounded-bl-sm'
          }`}
        >
          {formatContent(message.content)}
        </div>
      </div>
    </div>
  );
}
