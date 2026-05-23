export default function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div
        className="bg-bubble-ai border border-white/[0.06] px-5 py-3.5 rounded-2xl rounded-bl-md"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
      >
        <div className="flex gap-1.5 items-center h-5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}
