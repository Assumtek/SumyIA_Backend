import { Request, Response } from 'express';
import { PerguntasService } from '../services/perguntas/perguntas.service';

// Instância do serviço de perguntas
const perguntasService = new PerguntasService();

export class ConversaController {
  // Iniciar uma nova conversa
  async iniciarConversa(req: Request, res: Response) {
    const { secao } = req.body;
    const userId = req.user_id;
    
    try {
      const resultado = await perguntasService.iniciarConversa(userId, secao);
      res.json(resultado);
    } catch (error: any) {
      console.error('Erro ao iniciar conversa:', error);
      res.status(error.message === 'Usuário não encontrado.' ? 404 : 500).send(error.message);
    }
  }

  // Responder a uma pergunta
  async responderPergunta(req: Request, res: Response) {
    const { resposta } = req.body;
    const userId = req.user_id;
    const conversaId = req.params.conversaId;
    
    try {
      const resultado = await perguntasService.responderPergunta(userId, conversaId, resposta);
      res.json(resultado);
    } catch (error: any) {
      console.error('Erro ao responder pergunta:', error);
      
      if (error.message.includes('Conversa não encontrada')) {
        return res.status(404).send(error.message);
      } else if (error.message.includes('não tem permissão')) {
        return res.status(403).send(error.message);
      }
      
      res.status(500).send(error.message);
    }
  }

  // Listar conversas do usuário
  async listarConversas(req: Request, res: Response) {
    const userId = req.user_id;
    
    try {
      const conversas = await perguntasService.listarConversas(userId);
      res.json(conversas);
    } catch (error: any) {
      console.error('Erro ao listar conversas:', error);
      res.status(500).send(error.message);
    }
  }

  // Listar mensagens de uma conversa específica
  async listarMensagensConversa(req: Request, res: Response) {
    const userId = req.user_id;
    const { conversaId } = req.params;
    
    try {
      const resultado = await perguntasService.listarMensagensConversa(userId, conversaId);
      res.json(resultado);
    } catch (error: any) {
      console.error('Erro ao listar mensagens da conversa:', error);
      
      if (error.message.includes('Conversa não encontrada')) {
        return res.status(404).send(error.message);
      } else if (error.message.includes('não tem permissão')) {
        return res.status(403).send(error.message);
      }
      
      res.status(500).send(error.message);
    }
  }

  // Editar o nome/seção de uma conversa
  async editarConversa(req: Request, res: Response) {
    const { secao } = req.body;
    const userId = req.user_id;
    const { conversaId } = req.params;
    
    try {
      const resultado = await perguntasService.editarConversa(userId, conversaId, secao);
      res.json(resultado);
    } catch (error: any) {
      console.error('Erro ao editar nome da conversa:', error);
      
      if (error.message.includes('Conversa não encontrada')) {
        return res.status(404).send(error.message);
      } else if (error.message.includes('não tem permissão')) {
        return res.status(403).send(error.message);
      }
      
      res.status(500).send(error.message);
    }
  }

  // Deletar uma conversa e suas mensagens
  async deletarConversa(req: Request, res: Response) {
    const userId = req.user_id;
    const { conversaId } = req.params;
    
    try {
      const resultado = await perguntasService.deletarConversa(userId, conversaId);
      res.json(resultado);
    } catch (error: any) {
      console.error('Erro ao deletar conversa:', error);
      
      if (error.message.includes('Conversa não encontrada')) {
        return res.status(404).send(error.message);
      } else if (error.message.includes('não tem permissão')) {
        return res.status(403).send(error.message);
      }
      
      res.status(500).send(error.message);
    }
  }
} 