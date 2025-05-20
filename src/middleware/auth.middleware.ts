import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interface para o payload do token JWT
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}


export class AuthMiddleware {
  // Função para verificar o token JWT
  private static verifyToken(token: string): JwtPayload {
    try {
      // Verifica o token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_segredo_super_secreto');
      
      // Garante que temos um objeto válido
      if (!decoded || typeof decoded !== 'object') {
        throw new Error('Token inválido ou mal formado.');
      }
      
      // Garante que o payload contém as propriedades esperadas
      const payload = decoded as JwtPayload;
      if (!payload.userId || !payload.email) {
        throw new Error('Token não contém as informações necessárias.');
      }
      
      return payload;
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      throw new Error('Token inválido.');
    }
  }

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
      const decoded = this.verifyToken(token);
      
      // Adiciona as informações do usuário à requisição
      req.user_id = decoded.userId;
      
      next();
    } catch (error: any) {
      return res.status(401).send(error.message);
    }
  }
} 