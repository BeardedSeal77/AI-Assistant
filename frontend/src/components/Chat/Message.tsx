import { Message as MessageType } from '@/lib/types';

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  return (
    <div className={`flex mb-4 ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          message.isUser
            ? 'bg-blue text-white'
            : 'bg-surface text-text border border-muted'
        }`}
      >
        <p className="text-sm">{message.text}</p>
        <p className={`text-xs mt-1 opacity-70`}>
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}