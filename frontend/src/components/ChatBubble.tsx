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
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
      style={{ paddingLeft: isUser ? 80 : 0, paddingRight: isUser ? 0 : 80 }}
    >
      <div style={{ maxWidth: '70%' }}>
        {!isUser && characterName && (
          <span
            className="text-xs font-semibold mb-1.5 block"
            style={{ color: characterColor, marginLeft: 12 }}
          >
            {characterName}
          </span>
        )}
        <div
          className={`rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
            isUser
              ? 'bg-primary text-white rounded-br-md'
              : 'bg-surface-light text-text rounded-bl-md'
          }`}
          style={{ padding: '16px 24px' }}
        >
          {formatContent(message.content)}
        </div>
      </div>
    </div>
  );
}
