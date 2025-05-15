import express from 'express';
import conversaRoutes from './conversa.routes';
import userRoutes from './user.routes';
import authRoutes from './auth.routes';
import webhookRoutes from './webhook.routes';

const router = express.Router();

// Registrar as rotas individuais
router.use('/conversa', conversaRoutes);
router.use('/usuarios', userRoutes);
router.use('/auth', authRoutes);
router.use("/webhook", webhookRoutes);

export default router; 