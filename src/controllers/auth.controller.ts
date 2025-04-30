import { Request, Response } from 'express';
import { AuthService } from '../services/auth/auth.service';

// Instância do serviço de autenticação
const authService = new AuthService();

export class AuthController {
  // Login
  async login(req: Request, res: Response) {
    const { email, senha } = req.body;
    
    try {
      const resultado = await authService.login(email, senha);
      res.json(resultado);
    } catch (error: any) {
      console.error('Erro ao autenticar usuário:', error);
      res.status(error.message === 'Email ou senha incorretos.' ? 401 : 500).send(error.message);
    }
  }
} 