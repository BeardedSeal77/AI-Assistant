'use client';
import { useState } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  loading: boolean;
}

export function MessageInput({ onSend, loading }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !loading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-surface border-t border-muted">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-3 bg-overlay border border-muted rounded-lg text-text placeholder-subtle focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="px-6 py-3 bg-blue text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </form>
  );
}