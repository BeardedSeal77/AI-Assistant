'use client';
import { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Message, User } from '@/lib/types';
import { sendMessageToN8n } from '@/lib/api';

interface ChatInterfaceProps {
  user: User;
  onLogout: () => void;
}

export function ChatInterface({ user, onLogout }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    setLoading(true);
    
    const userMessage: Message = { 
      text, 
      isUser: true, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await sendMessageToN8n({
        user_id: user.id,
        user_email: user.email,
        message: text,
        timestamp: new Date().toISOString()
      });
      
      const aiMessage: Message = { 
        text: response.response || response.message || 'No response received', 
        isUser: false, 
        timestamp: new Date(),
        intent: response.intent
      };
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = { 
        text: 'Sorry, something went wrong. Please try again.', 
        isUser: false, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    onLogout();
  };

  return (
    <div className="flex flex-col h-screen bg-base">
      <div className="bg-surface text-text p-4 flex justify-between items-center border-b border-muted">
        <h1 className="text-xl font-bold">AI Assistant</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img 
              src={user.picture} 
              alt={user.name} 
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm">{user.name}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-sm bg-overlay px-3 py-1 rounded hover:bg-highlight-low"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>

      <MessageInput onSend={sendMessage} loading={loading} />
    </div>
  );
}