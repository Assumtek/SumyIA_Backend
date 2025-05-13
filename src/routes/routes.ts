import express from 'express';
import conversaRoutes from './conversa.routes';
import userRoutes from './user.routes';
import authRoutes from './auth.routes';

const router = express.Router();

// Registrar as rotas individuais
router.use('/conversa', conversaRoutes);
router.use('/usuarios', userRoutes);
router.use('/auth', authRoutes);

export default router; 