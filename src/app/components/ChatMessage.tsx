interface ChatMessageProps {
  sender: string;
  message: string;
  time: string;
  isMe: boolean;
  avatar?: string | undefined;
}

export function ChatMessage({ sender, message, time, isMe, avatar }: ChatMessageProps) {
  return (
    <div className={`flex gap-2 mb-3 ${isMe ? 'flex-row-reverse' : ''}`}>
      {!isMe && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center flex-shrink-0 text-lg">
          {avatar || '👤'}
        </div>
      )}

      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isMe && (
          <span className="text-xs text-muted-foreground mb-1 px-1">{sender}</span>
        )}
        <div className={`rounded-2xl px-4 py-2.5 ${
          isMe
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card border border-border rounded-tl-sm'
        }`}>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        <span className="text-xs text-muted-foreground mt-1 px-1">{time}</span>
      </div>
    </div>
  );
}
