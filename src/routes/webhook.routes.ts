import express from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = express.Router();
const webhookController = new WebhookController();

router.post('/guru', webhookController.handleGuruWebhook);
router.post('/pagarme', webhookController.handleGuruWebhook);

export default router; 