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
    <div className={`flex ${isUser ? 'justify-end pl-16' : 'justify-start pr-16'} animate-fade-in`}>
      <div className="max-w-[75%] sm:max-w-[65%]">
        {!isUser && characterName && (
          <span
            className="text-xs font-semibold mb-1.5 block ml-2"
            style={{ color: characterColor }}
          >
            {characterName}
          </span>
        )}
        <div
          className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
            isUser
              ? 'bg-primary text-white rounded-br-md'
              : 'bg-surface-light text-text rounded-bl-md'
          }`}
        >
          {formatContent(message.content)}
        </div>
      </div>
    </div>
  );
}
