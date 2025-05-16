import express from 'express';
import { UserController } from '../controllers/user.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
// Instância do controlador de usuário
const userController = new UserController();

// Rota para criar um novo usuário (registro) - pública
router.post('/registro', userController.register);

// Rotas para recuperação de senha - públicas
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Rotas autenticadas (precisam de token JWT)
// Rota para obter informações de um usuário pelo ID - autenticada
router.get('/', AuthMiddleware.verificarToken, userController.getById);

// Rota para atualizar um usuário - autenticada
router.put('/', AuthMiddleware.verificarToken, userController.update);

// Rota para atualizar a senha do usuário - autenticada
router.put('/senha', AuthMiddleware.verificarToken, userController.updatePassword);

export default router; 