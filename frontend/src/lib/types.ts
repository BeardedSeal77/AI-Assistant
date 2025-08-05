export interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  intent?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  google_tokens: string;
}

export interface N8nRequest {
  user_id: string;
  user_email: string;
  message: string;
  timestamp: string;
}

export interface N8nResponse {
  response: string;
  success: boolean;
  intent?: string;
  data?: any;
}