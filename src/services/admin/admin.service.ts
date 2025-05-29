import prisma from '../../prisma/client';

export class AdminService {
  // Listar todos os usuários
  async listarUsuarios() {
    try {
      const usuarios = await prisma.user.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          updatedBy: true,
          createdAt: true,
          updatedAt: true,
          ativo: true,
          _count: {
            select: {
              documentos: true,
              conversas: true,
            }
          }
        }
      });

      return usuarios;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao listar usuários');
    }
  }

  // Buscar KPIs do sistema
  async buscarKPIs() {
    try {
      // Total de usuários
      const totalUsuarios = await prisma.user.count();

      // Total de usuários por role
      const usuariosPorRole = await prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true
        }
      });

      // Total de conversas
      const totalConversas = await prisma.conversa.count();

      // Total de mensagens
      const totalMensagens = await prisma.mensagem.count();

      // Total de documentos
      const totalDocumentos = await prisma.documento.count();

      // Usuários ativos nos últimos 30 dias
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
      
      const usuariosAtivos = await prisma.user.count({
        where: {
          OR: [
            { createdAt: { gte: trintaDiasAtras } },
            { updatedAt: { gte: trintaDiasAtras } }
          ]
        }
      });

      // Conversas criadas nos últimos 30 dias
      const conversasRecentes = await prisma.conversa.count({
        where: {
          createdAt: { gte: trintaDiasAtras }
        }
      });

      return {
        totalUsuarios,
        usuariosPorRole: usuariosPorRole.reduce((acc, curr) => {
          acc[curr.role] = curr._count.role;
          return acc;
        }, {} as Record<string, number>),
        totalConversas,
        totalMensagens,
        totalDocumentos,
        usuariosAtivos,
        conversasRecentes
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao buscar KPIs do sistema');
    }
  }
} 