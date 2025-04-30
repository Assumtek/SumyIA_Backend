import jwt from 'jsonwebtoken';
import { compare } from "bcryptjs";
import prisma from '../../prisma/client';
import { loginSchema, tokenSchema } from './auth.schema';

// Interface para o payload do token JWT
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  // Realizar login
  async login(email: string, senha: string) {
    try {
      console.log("login", email, senha)
      // Validar dados de entrada
      await loginSchema.validate({ email, senha });
      
      // Busca o usuário pelo email
      const usuario = await prisma.user.findUnique({
        where: { email }
      });

      if (!usuario) {
        throw new Error("Email ou senha incorretos");
      }
      
      // Ele faz a verificação se a senha criptografada é a mesma enviada pelo user 
      const passwordMatch = await compare(senha, usuario.senha);

      if (!passwordMatch) {
        throw new Error("Email ou senha incorretos");
      }

      // Cria o token JWT
      const token = jwt.sign(
        { 
          userId: usuario.id,
          email: usuario.email,
          role: usuario.role
        },
        process.env.JWT_SECRET || 'seu_segredo_super_secreto',
        { expiresIn: '10d' }
      );
      
      // Retorna o token e informações básicas do usuário
      return {
        token,
        user: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro no processo de login');
    }
  }

  // Verificar token JWT
  verifyToken(token: string): JwtPayload {
    try {
      // Validar token
      tokenSchema.validateSync({ token });
      
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
} 