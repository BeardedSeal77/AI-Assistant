'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const userInfo = searchParams.get('user');
      
      if (token && userInfo) {
        const user = JSON.parse(decodeURIComponent(userInfo));
        
        localStorage.setItem('userSession', JSON.stringify(user));
        
        router.push('/');
      } else {
        console.error('OAuth callback failed');
        router.push('/');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center h-screen bg-base">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue mx-auto"></div>
        <p className="mt-2 text-subtle">Completing login...</p>
      </div>
    </div>
  );
}