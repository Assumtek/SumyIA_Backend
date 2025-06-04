import { Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service';

export class WebhookController {
    private webhookService: WebhookService;

    constructor() {
        this.webhookService = new WebhookService();
    }

    handleGuruWebhook = async (req: Request, res: Response): Promise<void> => {
        try {
            const webhook = req.body;
            const type = webhook?.payload?.webhook_type;

            switch (type) {
                case "transaction":
                    await this.webhookService.handleTransaction(webhook.payload);
                    break;
                case "subscription":
                    await this.webhookService.handleSubscription(webhook.payload);
                    
                    break;
                case "cancellation":
                    await this.webhookService.handleCancellation(webhook.payload);
                    
                    break;
                default:
                    console.warn("Webhook desconhecido:", type);
            }

            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Erro ao processar webhook:', error);
            res.status(500).json({ success: false, error: 'Erro interno do servidor' });
        }
    };
} 