import { config } from 'dotenv';
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

  // Middleware para verificar o token de autenticação
  static verificarToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Obter o token do cabeçalho de autorização
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).send('Token não fornecido.');
      }
    
      const token = authHeader.split(' ')[1];
      console.log(token)
      
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_segredo_super_secreto') as JwtPayload;
      

      // Adiciona as informações do usuário à requisição
      req.user_id = decoded.userId;
      
      next();
    } catch (error: any) {
      return res.status(401).send(error.message);
    }
  }
} 