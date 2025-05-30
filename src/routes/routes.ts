import express from 'express';
import conversaRoutes from './conversa.routes';
import userRoutes from './user.routes';
import authRoutes from './auth.routes';
import webhookRoutes from './webhook.routes';
import adminRoutes from './admin.routes';
import feedbackRoutes from './feedback.routes';

const router = express.Router();

// Registrar as rotas individuais
router.use('/conversa', conversaRoutes);
router.use('/usuarios', userRoutes);
router.use('/auth', authRoutes);
router.use('/webhook', webhookRoutes);
router.use('/admin', adminRoutes);
router.use('/feedback', feedbackRoutes);

export default router; 