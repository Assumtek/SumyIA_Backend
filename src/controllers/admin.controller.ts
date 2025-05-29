import { Request, Response } from 'express';
import { AdminService } from '../services/admin/admin.service';

// Instância do serviço administrativo
const adminService = new AdminService();

export class AdminController {
  // Listar todos os usuários
  async listarUsuarios(req: Request, res: Response) {
    try {
      const usuarios = await adminService.listarUsuarios();
      res.json(usuarios);
    } catch (error: any) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).send(error.message);
    }
  }

  // Listar KPIs do sistema
  async listarKPI(req: Request, res: Response) {
    try {
      const kpis = await adminService.buscarKPIs();
      res.json(kpis);
    } catch (error: any) {
      console.error('Erro ao buscar KPIs:', error);
      res.status(500).send(error.message);
    }
  }
} 