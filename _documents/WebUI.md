# AI Assistant - Next.js Direct to n8n

## Project Overview
Ultra-simple chat interface that talks directly to n8n webhooks. No backend needed - n8n handles everything including Google OAuth and calendar integration.

## Architecture
```
User → Next.js Chat → n8n Webhook → Ollama + Google APIs → Response
```

**That's it!** No Flask, no JWT, no complex auth.

## Google OAuth Login via n8n

### Login Flow
1. **User clicks "Login with Google"** in Next.js
2. **Redirect to n8n OAuth endpoint** (n8n handles Google OAuth)
3. **n8n processes Google login** and stores user info in PostgreSQL
4. **n8n redirects back** to Next.js with user token/session
5. **Next.js stores user session** and shows chat interface

### User Session Management
```typescript
// After successful OAuth, n8n returns user info
interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  google_tokens: string; // Stored securely in n8n/PostgreSQL
}

// Store in localStorage after OAuth success
localStorage.setItem('userSession', JSON.stringify(user));
```

### User Context to n8n
```typescript
// Every message includes authenticated user
const user = JSON.parse(localStorage.getItem('userSession') || '{}');

const payload = {
  user_id: user.id,
  user_email: user.email,
  message: userMessage,
  timestamp: new Date().toISOString()
};

fetch('http://localhost:5678/webhook/assistant', {
  method: 'POST',
  body: JSON.stringify(payload)
});
```

## Next.js Components

### Main App with Authentication
```typescript
// src/app/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/Chat/ChatInterface';
import { LoginPage } from '@/components/Auth/LoginPage';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('userSession');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return <ChatInterface user={user} onLogout={() => setUser(null)} />;
}
```

### Google Login Component
```typescript
// src/components/Auth/LoginPage.tsx
'use client';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const handleGoogleLogin = () => {
    // Redirect to n8n Google OAuth endpoint
    const n8nOAuthUrl = `${process.env.NEXT_PUBLIC_N8N_URL}/webhook/google-oauth`;
    const redirectUri = `${window.location.origin}/auth/callback`;
    
    window.location.href = `${n8nOAuthUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">AI Assistant</h2>
          <p className="mt-2 text-gray-600">Sign in with your Google account</p>
        </div>
        
        <button
          onClick={handleGoogleLogin}
          className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            {/* Google Icon SVG */}
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
```

### OAuth Callback Handler
```typescript
// src/app/auth/callback/page.tsx
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
        // Parse user info from n8n
        const user = JSON.parse(decodeURIComponent(userInfo));
        
        // Store user session
        localStorage.setItem('userSession', JSON.stringify(user));
        
        // Redirect to main app
        router.push('/');
      } else {
        // Handle error
        console.error('OAuth callback failed');
        router.push('/');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Completing login...</p>
      </div>
    </div>
  );
}
```

### Updated Chat Interface (with authenticated user)
```typescript
// src/components/Chat/ChatInterface.tsx
'use client';
import { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatInterfaceProps {
  user: any;
  onLogout: () => void;
}

export function ChatInterface({ user, onLogout }: ChatInterfaceProps) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    setLoading(true);
    
    // Add user message immediately
    const userMessage = { text, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Send to n8n with authenticated user context
      const response = await fetch('http://localhost:5678/webhook/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          message: text,
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();
      
      // Add AI response
      const aiMessage = { 
        text: data.response || data.message, 
        isUser: false, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with user info */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
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
            className="text-sm bg-blue-700 px-3 py-1 rounded hover:bg-blue-800"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>

      {/* Input */}
      <MessageInput onSend={sendMessage} loading={loading} />
    </div>
  );
}
```

### Message Input Component
```typescript
// src/components/Chat/MessageInput.tsx
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
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </form>
  );
}
```

## TypeScript Types
```typescript
// src/lib/types.ts
export interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  intent?: string;
}

export interface N8nRequest {
  user: string;
  message: string;
  timestamp: string;
}

export interface N8nResponse {
  response: string;
  success: boolean;
  intent?: string;
  data?: any;
}
```

## n8n Webhook Configuration

### Expected Input Format (from Next.js)
```json
{
  "user_id": "123",
  "user_email": "john@gmail.com",
  "message": "Schedule dentist appointment Friday at 2 PM",  
  "timestamp": "2025-08-05T10:30:00.000Z"
}
```

### Expected Output Format
```json
{
  "response": "I've scheduled your dentist appointment for Friday at 2 PM. A calendar event has been created.",
  "success": true,
  "intent": "calendar",
  "event_id": "abc123"
}
```

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/assistant
```

## Docker Configuration with PostgreSQL
```yaml
# docker-compose.yml
services:
  # PostgreSQL for n8n user management
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: n8n_assistant
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: n8n_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ai-assistant-network

  # n8n with PostgreSQL support
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n_assistant
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=n8n_password
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=admin
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - postgres
    networks:
      - ai-assistant-network

  # ... existing ollama service ...
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_N8N_URL=http://localhost:5678
    depends_on:
      - n8n
    networks:
      - ai-assistant-network

volumes:
  postgres_data:
  n8n_data:
  # ... existing ollama volume ...

networks:
  ai-assistant-network:
    driver: bridge
```

## n8n Workflows with PostgreSQL

### 1. Google OAuth Workflow
**Webhook URL**: `/webhook/google-oauth`

**Flow**:
1. **Webhook Trigger** - Receives OAuth initiation request
2. **Google OAuth2 Node** - Handles Google login flow  
3. **PostgreSQL Node** - Store/update user in database
4. **Code Node** - Generate session token
5. **HTTP Response** - Redirect back to frontend with user data

**PostgreSQL User Table**:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  picture TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Main Assistant Workflow  
**Webhook URL**: `/webhook/assistant`

**Flow**:
1. **Webhook Trigger** - Receives chat messages
2. **PostgreSQL Node** - Lookup user by ID/email
3. **Ollama Node** - Process message for intent
4. **Switch Node** - Route by intent:
   - Calendar → Google Calendar Node (uses stored tokens)
   - General → Simple response
5. **PostgreSQL Node** - Log conversation
6. **Response Node** - Send result back

**PostgreSQL Conversations Table**:
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  response TEXT,
  intent VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Development Steps
1. **Create Next.js app** with chat interface
2. **Add simple user selection**
3. **Connect to n8n webhook**
4. **Build n8n workflow**
5. **Set up Google OAuth in n8n**
6. **Test calendar integration**
7. **Deploy with Docker**

## Benefits of This Approach
- ✅ **Ultra simple** - No backend server needed
- ✅ **Fast development** - Just frontend + n8n workflows  
- ✅ **Easy deployment** - One Docker container
- ✅ **Visual workflows** - n8n's GUI instead of backend code
- ✅ **Google integration** - Built into n8n
- ✅ **Flexible** - Can add Flask later if needed

## Local Network Access
Since it's for local network use:
- No complex authentication needed
- Simple user selection works fine
- Direct HTTP to n8n (no HTTPS required)
- Easy for family members to use

## Future Extensions
You can easily add Flask later for:
- Real user authentication
- Complex business logic
- API rate limiting
- Advanced user management

But for now, this gives you a working chat assistant with **minimal complexity**!