import { Request, Response } from 'express';
import { FeedbackService } from '../services/feedback/feedback.service';

const feedbackService = new FeedbackService();

export class FeedbackController {
  async create(req: Request, res: Response) {
    try {
      const {
        utilidade,
        facilidade,
        design,
        confiabilidade,
        recomendacao,
        valorJusto,
        recursoFaltando
      } = req.body;

      const userId = req.user_id;

      const feedback = await feedbackService.createFeedback({
        userId,
        utilidade,
        facilidade,
        design,
        confiabilidade,
        recomendacao,
        valorJusto,
        recursoFaltando
      });

      return res.status(201).json(feedback);
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const feedbacks = await feedbackService.listFeedbacks();
      return res.json(feedbacks);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async listKPI(req: Request, res: Response) {
    try {
      const kpi = await feedbackService.listKPI();
      return res.json(kpi);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
} 