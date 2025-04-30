import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config({ path: resolve(__dirname, '../../.env') });

export const config = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://usuario:senha@localhost:5432/sanny_ia'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'seu_segredo_super_secreto',
    expiresIn: '10d'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || 'sk-proj-1234567890'
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || 'seu_usuario@example.com',
    password: process.env.EMAIL_PASSWORD || 'sua_senha',
    sender: process.env.EMAIL_SENDER || 'noreply@seudominio.com'
  },
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  }
}; 