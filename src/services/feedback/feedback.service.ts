import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ICreateFeedback {
  userId: string;
  utilidade: number;
  facilidade: number;
  design: number;
  confiabilidade: number;
  recomendacao: number;
  valorJusto: number;
  recursoFaltando: string;
}

export class FeedbackService {
  async createFeedback(data: ICreateFeedback) {
    try {
      const feedback = await prisma.feedback.create({
        data: {
          userId: data.userId,
          utilidade: data.utilidade,
          facilidade: data.facilidade,
          design: data.design,
          confiabilidade: data.confiabilidade,
          recomendacao: data.recomendacao,
          valorJusto: data.valorJusto,
          recursoFaltando: data.recursoFaltando
        }
      });

      return feedback;
    } catch (error) {
      throw new Error('Erro ao criar feedback');
    }
  }

  async listFeedbacks() {
    try {
      const feedbacks = await prisma.feedback.findMany({
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        }
      });

      return feedbacks;
    } catch (error) {
      throw new Error('Erro ao listar feedbacks');
    }
  }

  async listKPI() {
    try {
      const feedbacks = await prisma.feedback.findMany();

      const kpi = {
        totalFeedbacks: feedbacks.length,
        mediaUtilidade: this.calcularMedia(feedbacks.map(f => f.utilidade)),
        mediaFacilidade: this.calcularMedia(feedbacks.map(f => f.facilidade)),
        mediaDesign: this.calcularMedia(feedbacks.map(f => f.design)),
        mediaConfiabilidade: this.calcularMedia(feedbacks.map(f => f.confiabilidade)),
        mediaRecomendacao: this.calcularMedia(feedbacks.map(f => f.recomendacao)),
        mediaValorJusto: this.calcularMedia(feedbacks.map(f => f.valorJusto)),
        recursosFaltando:  null
      };

      return kpi;
    } catch (error) {
      throw new Error('Erro ao listar KPIs');
    }
  }

  private calcularMedia(valores: number[]): number {
    if (valores.length === 0) return 0;
    const soma = valores.reduce((acc, curr) => acc + curr, 0);
    return Number((soma / valores.length).toFixed(2));
  }

} 