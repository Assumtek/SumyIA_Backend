import { Router } from 'express';
import { FeedbackController } from '../controllers/feedback.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { PermissionMiddleware } from '../middleware/permission.middleware';

const router = Router();
const feedbackController = new FeedbackController();

// Middleware para verificar autenticação em todas as rotas
router.use(AuthMiddleware.verificarToken);
router.post('/', feedbackController.create);

// Middleware para verificar permissão de admin em todas as rotas
router.use(PermissionMiddleware.verificarAdmin);
router.get('/', feedbackController.list);
router.get('/kpi', feedbackController.listKPI);

export default router; 