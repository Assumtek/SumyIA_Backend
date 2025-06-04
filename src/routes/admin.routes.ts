import express from 'express';
import { AdminController } from '../controllers/admin.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { PermissionMiddleware } from '../middleware/permission.middleware';

const router = express.Router();
const adminController = new AdminController();

// Middleware para verificar autenticação e permissões de admin
router.use(AuthMiddleware.verificarToken);
router.use(PermissionMiddleware.verificarAdmin);

// Rota para listar todos os usuários
router.get('/usuarios', adminController.listarUsuarios);
// criar uma rota que rtorna os KPI do sistema
router.get('/kpi', adminController.listarKPI);

export default router; 