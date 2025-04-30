import axios from 'axios';
import prisma from '../../prisma/client';
import { 
  iniciarConversaSchema,
  responderPerguntaSchema,
  listarConversasSchema,
  listarMensagensSchema,
  editarConversaSchema,
  deletarConversaSchema
} from './perguntas.schema';

export class PerguntasService {
  private async criarThread() {
    const threadResponse = await axios.post(
      'https://api.openai.com/v1/threads',
      {},
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );
    return threadResponse.data.id;
  }

  private async adicionarMensagemThread(threadId: string, content: string) {
    await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        role: 'user',
        content: content
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );
  }

  private async executarAssistente(threadId: string) {
    const runResponse = await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      {
        assistant_id: 'asst_mdjzaaiGzGOc1i1PxU1SbZvR'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );

    let runStatus = runResponse.data.status;
    while (runStatus === 'queued' || runStatus === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const statusResponse = await axios.get(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runResponse.data.id}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        }
      );
      runStatus = statusResponse.data.status;
    }

    const messagesResponse = await axios.get(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );

    const assistantMessages = messagesResponse.data.data.filter(
      (msg: any) => msg.role === 'assistant'
    );
    
    return assistantMessages[0].content[0].text.value.trim();
  }

  // Chamar a API da OpenAI e obter a resposta com base no histórico
  async obterRespostaOpenAI(mensagens: Array<{role: string, content: string}>, threadId?: string) {
    try {
      let currentThreadId = threadId;
      
      if (!currentThreadId) {
        currentThreadId = await this.criarThread();
      }

      if (!currentThreadId) {
        throw new Error('Não foi possível criar ou obter o ID da thread');
      }

      await this.adicionarMensagemThread(currentThreadId, mensagens[mensagens.length - 1].content);
      const resposta = await this.executarAssistente(currentThreadId);
      
      return { resposta, threadId: currentThreadId };
    } catch (error) {
      console.error('Erro ao chamar a API da OpenAI:', error);
      throw new Error('Erro ao processar sua mensagem com a API OpenAI.');
    }
  }

  // Obter o histórico de mensagens de uma conversa
  async obterHistoricoMensagens(conversaId: string) {
    try {
      const mensagens = await prisma.mensagem.findMany({
        where: {
          conversaId: conversaId
        },
        orderBy: {
          createdAt: 'asc'
        },
        select: {
          role: true,
          content: true
        }
      });
      
      return mensagens;
    } catch (error) {
      throw error;
    }
  }

  // Iniciar uma nova conversa
  async iniciarConversa(userId: string, secao: string) {
    try {
      await iniciarConversaSchema.validate({ userId, secao });
      
      const usuario = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!usuario) {
        throw new Error('Usuário não encontrado.');
      }
      
      const conversa = await prisma.conversa.create({
        data: {
          userId,
          secao,
          threadId: null // Inicialmente null, será atualizado após a primeira interação
        }
      });
      
      await prisma.mensagem.create({
        data: {
          role: 'system',
          content: `Você deve ser simpatica`,
          conversaId: conversa.id
        }
      });
      

      
      const historico = await this.obterHistoricoMensagens(conversa.id);
      const { resposta: respostaIA, threadId } = await this.obterRespostaOpenAI(historico);
      
      // Atualiza a conversa com o threadId
      await prisma.conversa.update({
        where: { id: conversa.id },
        data: { threadId }
      });
      
      await prisma.mensagem.create({
        data: {
          role: 'assistant',
          content: respostaIA,
          conversaId: conversa.id
        }
      });
      
      return { 
        pergunta: respostaIA,
        conversaId: conversa.id
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao iniciar conversa');
    }
  }

  // Continuar uma conversa existente
  async responderPergunta(userId: string, conversaId: string, resposta: string) {
    try {
      await responderPerguntaSchema.validate({ userId, conversaId, resposta });
      
      const conversa = await prisma.conversa.findUnique({
        where: { id: conversaId }
      });
      
      if (!conversa) {
        throw new Error('Conversa não encontrada. Inicie uma nova conversa.');
      }
      
      if (conversa.userId !== userId) {
        throw new Error('Você não tem permissão para acessar esta conversa.');
      }
      
      await prisma.mensagem.create({
        data: {
          role: 'user',
          content: resposta,
          conversaId: conversaId
        }
      });
      
      const historico = await this.obterHistoricoMensagens(conversaId);
      const { resposta: respostaIA } = await this.obterRespostaOpenAI(historico, conversa.threadId || undefined);
      
      await prisma.mensagem.create({
        data: {
          role: 'assistant',
          content: respostaIA,
          conversaId: conversaId
        }
      });
      
      return { 
        pergunta: respostaIA,
        conversaId
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao responder pergunta');
    }
  }

  // Listar conversas de um usuário
  async listarConversas(userId: string) {
    try {
      console.log('Chamou o service para listar as conversa do userId:', userId);
      // Validar dados
      await listarConversasSchema.validate({ userId });
      
      const conversas = await prisma.conversa.findMany({
        where: {
          userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          secao: true,
          createdAt: true
        }
      });
      
      return conversas;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao listar conversas');
    }
  }

  // Listar todas as mensagens de uma conversa
  async listarMensagensConversa(userId: string, conversaId: string) {
    try {

      // Validar dados
      await listarMensagensSchema.validate({ userId, conversaId });
      
      // Busca a conversa para verificar a propriedade
      const conversa = await prisma.conversa.findUnique({
        where: { id: conversaId }
      });
      
      if (!conversa) {
        throw new Error('Conversa não encontrada.');
      }
      
      // Verifica se a conversa pertence ao usuário
      if (conversa.userId !== userId) {
        throw new Error('Você não tem permissão para acessar as mensagens desta conversa.');
      }
      
      // Busca todas as mensagens da conversa
      const mensagens = await prisma.mensagem.findMany({
        where: {
          conversaId: conversaId
        },
        orderBy: {
          createdAt: 'asc'
        },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true
        }
      });
      
      return {
        conversa: {
          id: conversa.id,
          secao: conversa.secao,
          createdAt: conversa.createdAt
        },
        mensagens: mensagens
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao listar mensagens da conversa');
    }
  }

  // Editar o nome/seção de uma conversa
  async editarConversa(userId: string, conversaId: string, secao: string) {
    try {
      // Validar dados
      await editarConversaSchema.validate({ userId, conversaId, secao });
      
      // Busca a conversa
      const conversa = await prisma.conversa.findUnique({
        where: { id: conversaId }
      });
      
      if (!conversa) {
        throw new Error('Conversa não encontrada.');
      }
      
      // Verifica se a conversa pertence ao usuário
      if (conversa.userId !== userId) {
        throw new Error('Você não tem permissão para editar esta conversa.');
      }
      
      // Atualiza o nome da conversa
      const conversaAtualizada = await prisma.conversa.update({
        where: {
          id: conversaId
        },
        data: {
          secao
        }
      });
      
      return {
        id: conversaAtualizada.id,
        secao: conversaAtualizada.secao,
        message: 'Nome da conversa atualizado com sucesso.'
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao editar nome da conversa');
    }
  }

  // Deletar uma conversa e todas as suas mensagens
  async deletarConversa(userId: string, conversaId: string) {
    try {
      // Validar dados
      await deletarConversaSchema.validate({ userId, conversaId });
      
      // Busca a conversa
      const conversa = await prisma.conversa.findUnique({
        where: { id: conversaId }
      });
      
      if (!conversa) {
        throw new Error('Conversa não encontrada.');
      }
      
      // Verifica se a conversa pertence ao usuário
      if (conversa.userId !== userId) {
        throw new Error('Você não tem permissão para deletar esta conversa.');
      }
      
      // Utilizar uma transação para garantir que todas as operações aconteçam 
      // ou nenhuma aconteça em caso de falha
      await prisma.$transaction(async (tx) => {
        // Primeiro deleta todas as mensagens relacionadas à conversa
        await tx.mensagem.deleteMany({
          where: {
            conversaId: conversaId
          }
        });
        
        // Depois deleta a conversa
        await tx.conversa.delete({
          where: {
            id: conversaId
          }
        });
      });
      
      return {
        success: true,
        message: 'Conversa e mensagens deletadas com sucesso.'
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao deletar conversa');
    }
  }

  // Listar todos os assistentes
  async listarAssistentes() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('Chave da API OpenAI não configurada');
      }

      const response = await axios.get(
        'https://api.openai.com/v1/assistants',
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          }
        }
      );

      if (!response.data || !response.data.data) {
        throw new Error('Resposta inválida da API OpenAI');
      }

      return response.data.data.map((assistant: any) => ({
        id: assistant.id,
        name: assistant.name,
        description: assistant.description,
        model: assistant.model,
        createdAt: assistant.created_at
      }));
    } catch (error: any) {
      console.error('Erro detalhado ao listar assistentes:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        throw new Error('Chave da API OpenAI inválida ou expirada');
      } else if (error.response?.status === 403) {
        throw new Error('Sem permissão para acessar a API de assistentes');
      } else if (error.response?.status === 400) {
        throw new Error(`Erro na requisição: ${error.response.data.error?.message || 'Erro desconhecido'}`);
      }
      
      throw new Error('Erro ao listar assistentes da OpenAI');
    }
  }
} 