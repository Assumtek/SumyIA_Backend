import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config({ path: resolve(__dirname, '../../.env') });

export const config = {
  database: {
    url: process.env.DATABASE_URL
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'JWT_SECRET',
    expiresIn: '1d'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  email: {
    host: process.env.EMAIL_HOST || '',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    sender: process.env.EMAIL_SENDER || ''
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || ''
  },
  app: {
    port: process.env.PORT || 3000,
    frontendUrl: process.env.FRONTEND_URL || ''
  }
}; 