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

import OpenAI from 'openai';
import { config } from '../../config/env';
import { DocumentoService } from '../documento/documento.service';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export class PerguntasService {
  private documentoService: DocumentoService;

  constructor() {
    this.documentoService = new DocumentoService();
  }

  private async criarAssistente() {
    try {
      const assistant = await openai.beta.assistants.create({
        name: "SUMY",
        instructions: `Você é SUMY, um assistente SAP especialista em criar especificações funcionais de alta qualidade e fácil usabilidade.

Sua missão é:

1. Na primeira mensagem se apresentar e perguntar: "Me conta, para o que você gostaria de fazer uma especificação funcional?", de acordo com a resposta do user va para a 2 etapa
2. Gerar imediatamente uma primeira versão da especificação funcional com base no que foi entendido.

Importante: As especificações devem seguir este formato:
---
**Objetivo:** Descreva claramente a finalidade da funcionalidade.
**Escopo:** Defina onde e para quem o processo se aplica.
**Requisitos Funcionais:** Liste os comportamentos esperados do sistema.
**Regras de Negócio:** Inclua regras que impactam o funcionamento da lógica.
**Fluxo do Processo:** Descreva os passos ou eventos envolvidos.
**Validações e Restrições:** Liste checagens de consistência e limitações.
**Critérios de Aceitação:** Condições para que a entrega seja considerada completa.
**Observações Técnicas:** Campos técnicos, tabelas SAP, transações, BAPIs, exits, etc. se necessário.
---

Ao iniciar a conversa, SUMY deve dizer:
"Me conta, para o que você gostaria de fazer uma especificação funcional?"

Assim que o usuário responde, gere uma primeira versão da especificação funcional com base na interpretação e diga:
"Certo, aqui está uma sugestão de especificação funcional para esse processo:"
[especificação gerada]

Você gostaria de exportar essa especificação funcional assim, ou quer fazer mais alterações?

Se o a pessoa falar que quer exportar a especificação funciona você deve chamar a function export_functional_specification`,
        model: "gpt-4-turbo-preview",
        tools: [{
          type: "function",
          function: {
            name: "export_functional_specification",
            description: "Gera uma função que identifica e exporta especificações funcionais quando solicitado pelo usuário.",
            parameters: {
              type: "object",
              required: ["project_name", "specifications", "format"],
              properties: {
                project_name: {
                  type: "string",
                  description: "O nome do projeto para o qual as especificações funcionais estão sendo exportadas."
                },
                specifications: {
                  type: "string",
                  description: "As especificações funcionais a serem exportadas."
                },
                format: {
                  type: "string",
                  enum: ["pdf", "docx", "txt"],
                  description: "O formato de exportação desejado."
                }
              },
              additionalProperties: false
            }
          }
        }]
      });

      return assistant.id;
    } catch (error) {
      console.error('Erro ao criar assistente:', error);
      throw new Error('Erro ao criar assistente');
    }
  }

  private async criarThread() {
    const thread = await openai.beta.threads.create();
    return thread.id;
  }

  private async adicionarMensagemThread(threadId: string, content: string) {
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: content
    });
  }

  private async chamarFuncaoExportarEspecificacao(params: any, userId: string) {

    const { project_name, specifications, format } = params;

    try {
      // Gerar o documento usando o DocumentoService
      const resultado = await this.documentoService.gerarDocumentoEspecificacao(project_name, specifications, userId);

      return {
        status: 'success',
        message: 'Especificação gerada com sucesso',
        data: {
          project_name,
          specifications,
          format,
          file_name: resultado.fileName,
          file_path: resultado.filePath
        }
      };
    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro ao gerar documento',
        data: null
      };
    }
  }

  private async executarAssistente(threadId: string, userId: string) {

    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: await this.criarAssistente()
    });

    // Aguarda status
    let runStatus;
    do {
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      await new Promise(res => setTimeout(res, 1000));
    } while (runStatus.status !== 'requires_action' && runStatus.status !== 'completed');

    // Se o modelo solicitar uma função
    if (runStatus.status === 'requires_action' && runStatus.required_action) {
      const functionCall = runStatus.required_action.submit_tool_outputs.tool_calls[0];
      const args = JSON.parse(functionCall.function.arguments);

      // Executa a função apropriada
      let result;
      if (functionCall.function.name === 'export_functional_specification') {
        result = await this.chamarFuncaoExportarEspecificacao(args, userId);
      }

      // Envia o resultado da função
      await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
        tool_outputs: [
          {
            tool_call_id: functionCall.id,
            output: JSON.stringify(result),
          },
        ],
      });

      // Aguarda finalização
      let completedRun;
      do {
        completedRun = await openai.beta.threads.runs.retrieve(threadId, run.id);
        await new Promise(res => setTimeout(res, 1000));
      } while (completedRun.status !== 'completed');
    }

    // Pega a última resposta
    const messages = await openai.beta.threads.messages.list(threadId);
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');

    if (!assistantMessages.length || !assistantMessages[0].content.length) {
      throw new Error('No assistant response received');
    }

    const firstMessage = assistantMessages[0].content[0];
    if (firstMessage.type !== 'text') {
      throw new Error('Unexpected message content type');
    }

    return firstMessage.text.value.trim();
  }

  // Chamar a API da OpenAI e obter a resposta com base no histórico
  async obterRespostaOpenAI(mensagens: Array<{ role: string, content: string }>, userId: string, threadId?: string) {
    try {
      let currentThreadId = threadId;
      let historicoCompleto = mensagens;

      if (!currentThreadId) {
        currentThreadId = await this.criarThread();
      } else {
        try {
          // Tenta verificar se a thread existe
          await openai.beta.threads.retrieve(currentThreadId);
        } catch (error) {
          // Se a thread não existir, cria uma nova e recria o histórico
          console.log('Thread não encontrada, criando uma nova e recriando histórico...');
          currentThreadId = await this.criarThread();
          
          // Busca o histórico completo da conversa no banco de dados
          const conversa = await prisma.conversa.findFirst({
            where: { threadId },
            include: {
              mensagens: {
                orderBy: {
                  createdAt: 'asc'
                }
              }
            }
          });

          if (conversa) {
            historicoCompleto = conversa.mensagens.map(msg => ({
              role: msg.role,
              content: msg.content
            }));
          }
        }
      }

      if (!currentThreadId) {
        throw new Error('Não foi possível criar ou obter o ID da thread');
      }

      // Se for uma nova thread, recria todo o histórico
      if (historicoCompleto.length > 1) {
        for (const msg of historicoCompleto) {
          await this.adicionarMensagemThread(currentThreadId, msg.content);
        }
      } else {
        // Se não for uma nova thread, apenas adiciona a última mensagem
        await this.adicionarMensagemThread(currentThreadId, mensagens[mensagens.length - 1].content);
      }

      const resposta = await this.executarAssistente(currentThreadId, userId);

      return { resposta, threadId: currentThreadId };
    } catch (error) {
      console.error('Erro ao chamar a API da OpenAI:', error);
      throw new Error('Erro ao processar sua mensagem com a API OpenAI.');
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
          threadId: null 
        }
      });

      await prisma.mensagem.create({
        data: {
          role: 'user',
          content: `O meu nome é ${usuario.nome}`,
          conversaId: conversa.id
        }
      });

      const historico = [
        {
          role: "user",
          content: `O meu nome é ${usuario.nome}`
        }
      ]
      const { resposta: respostaIA, threadId } = await this.obterRespostaOpenAI(historico, userId);

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

      const historico = [{
        role: "user",
        content: resposta,
        conversaId: conversaId
      }]
      const { resposta: respostaIA, threadId: novaThreadId } = await this.obterRespostaOpenAI(historico, userId, conversa.threadId || undefined);

      // Atualiza o threadId se uma nova thread foi criada
      if (novaThreadId !== conversa.threadId) {
        await prisma.conversa.update({
          where: { id: conversaId },
          data: { threadId: novaThreadId }
        });
      }

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
} 