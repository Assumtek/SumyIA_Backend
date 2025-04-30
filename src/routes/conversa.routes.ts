import express from 'express';
import { ConversaController } from '../controllers/conversa.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const conversaController = new ConversaController();

// Middleware para verificar autenticação em todas as rotas
router.use(AuthMiddleware.verificarToken);

// Rota para listar todos os assistentes
router.get('/assistentes', conversaController.listarAssistentes);

// Rota para iniciar uma nova conversa
router.post('/iniciar', conversaController.iniciarConversa);

// Rota para responder a uma pergunta em uma conversa existente
router.post('/:conversaId/responder', conversaController.responderPergunta);

// Rota para listar conversas do usuário autenticado
router.get('/', conversaController.listarConversas);

// Rota para listar mensagens de uma conversa específica
router.get('/:conversaId/mensagens', conversaController.listarMensagensConversa);

// Rota para editar o nome/secao de uma coversa
router.put('/:conversaId/editar', conversaController.editarConversa);

//Rota para deletar uma conversa
router.delete('/:conversaId/deletar', conversaController.deletarConversa);

export default router; 
