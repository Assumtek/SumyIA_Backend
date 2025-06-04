import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';

export class PermissionMiddleware {
  // Verifica se o usuário é um administrador
  static async verificarAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user_id;

      const usuario = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!usuario || usuario.role !== 'ADMIN') {
        return res.status(403).json({ 
          message: 'Acesso negado. Apenas administradores podem acessar este recurso.' 
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      res.status(500).json({ message: 'Erro ao verificar permissões' });
    }
  }

  // Verifica se o usuário tem uma role específica
  static async verificarRole(role: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user_id;

        const usuario = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });

        if (!usuario || usuario.role !== role) {
          return res.status(403).json({ 
            message: `Acesso negado. Apenas usuários com role ${role} podem acessar este recurso.` 
          });
        }

        next();
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        res.status(500).json({ message: 'Erro ao verificar permissões' });
      }
    };
  }
} 