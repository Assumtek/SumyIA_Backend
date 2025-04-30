import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth/auth.service';

export class AuthMiddleware {
  // Middleware para verificar o token de autenticação
  static verificarToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Obter o token do cabeçalho de autorização
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).send('Token não fornecido.');
      }
      
      // O formato do cabeçalho é: Bearer TOKEN
      const token = authHeader.split(' ')[1];
      
      // Verifica o token
      const authService = new AuthService();
      const decoded = authService.verifyToken(token);
      
      // Adiciona as informações do usuário à requisição
      req.user_id = decoded.userId;
      
      next();
    } catch (error: any) {
      return res.status(401).send(error.message);
    }
  }
} 