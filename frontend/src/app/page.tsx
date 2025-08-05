'use client';
import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/Chat/ChatInterface';
import { LoginPage } from '@/components/Auth/LoginPage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { User } from '@/lib/types';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('userSession');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('userSession');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-subtle">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return <ChatInterface user={user} onLogout={() => setUser(null)} />;
}