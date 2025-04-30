import { Router } from 'express';
import { PerguntasService } from '../services/perguntas/perguntas.service';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const perguntasService = new PerguntasService();

// Listar todos os assistentes
router.get('/assistentes', authMiddleware, async (req, res) => {
  try {
    const assistentes = await perguntasService.listarAssistentes();
    res.json(assistentes);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// Iniciar uma nova conversa
router.post('/conversa', authMiddleware, async (req, res) => {
  try {
    const { secao } = req.body;
    const userId = req.user.id;
    
    const resultado = await perguntasService.iniciarConversa(userId, secao);
    res.json(resultado);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// Responder uma pergunta
router.post('/responder', authMiddleware, async (req, res) => {
  try {
    const { conversaId, resposta } = req.body;
    const userId = req.user.id;
    
    const resultado = await perguntasService.responderPergunta(userId, conversaId, resposta);
    res.json(resultado);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// Listar conversas do usuário
router.get('/conversas', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversas = await perguntasService.listarConversas(userId);
    res.json(conversas);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// Listar mensagens de uma conversa
router.get('/conversa/:conversaId/mensagens', authMiddleware, async (req, res) => {
  try {
    const { conversaId } = req.params;
    const userId = req.user.id;
    
    const mensagens = await perguntasService.listarMensagensConversa(userId, conversaId);
    res.json(mensagens);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// Editar nome/seção de uma conversa
router.put('/conversa/:conversaId', authMiddleware, async (req, res) => {
  try {
    const { conversaId } = req.params;
    const { secao } = req.body;
    const userId = req.user.id;
    
    const resultado = await perguntasService.editarConversa(userId, conversaId, secao);
    res.json(resultado);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// Deletar uma conversa
router.delete('/conversa/:conversaId', authMiddleware, async (req, res) => {
  try {
    const { conversaId } = req.params;
    const userId = req.user.id;
    
    const resultado = await perguntasService.deletarConversa(userId, conversaId);
    res.json(resultado);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

export default router; 