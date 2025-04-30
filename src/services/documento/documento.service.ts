import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import prisma from '../../prisma/client';

export class DocumentoService {
  // Gerar documento Word a partir de uma conversa
  async gerarDocumentoWord(conversaId: string, userId: string) {
    try {
      // Verificar se a conversa existe e pertence ao usuário
      const conversa = await prisma.conversa.findUnique({
        where: { id: conversaId }
      });
      
      if (!conversa) {
        throw new Error('Conversa não encontrada.');
      }
      
      if (conversa.userId !== userId) {
        throw new Error('Você não tem permissão para acessar esta conversa.');
      }
      
      // Buscar todas as mensagens da conversa, ignorando as duas primeiras (system e primeira pergunta)
      const mensagens = await prisma.mensagem.findMany({
        where: { conversaId },
        orderBy: { createdAt: 'asc' },
        skip: 2 // Pular mensagens do sistema
      });
      
      if (mensagens.length === 0) {
        throw new Error('Não há mensagens para gerar o documento.');
      }
      
      // Extrair perguntas e respostas
      const perguntasRespostas = [];
      let perguntaAtual = null;
      let respostaAtual = null;
      
      for (let i = 0; i < mensagens.length; i++) {
        const mensagem = mensagens[i];
        
        if (mensagem.role === 'assistant') {
          perguntaAtual = mensagem.content;
        } else if (mensagem.role === 'user' && perguntaAtual) {
          respostaAtual = mensagem.content;
          
          perguntasRespostas.push({
            pergunta: perguntaAtual,
            resposta: respostaAtual
          });
          
          perguntaAtual = null;
          respostaAtual = null;
        }
      }
      
      // Buscar a última mensagem da IA que deve ser o resumo, se existir
      let resumo = '';
      if (mensagens.length > 0 && mensagens[mensagens.length - 1].role === 'assistant') {
        resumo = mensagens[mensagens.length - 1].content;
      }
      
      // Criar o documento Word
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Título
            new Paragraph({
              text: `Especificação Funcional - ${conversa.secao}`,
              heading: HeadingLevel.HEADING_1,
              spacing: {
                after: 200
              }
            }),
            
            // Data de geração
            new Paragraph({
              text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
              spacing: {
                after: 400
              }
            }),
            
            // Perguntas e Respostas
            new Paragraph({
              text: 'Informações Coletadas',
              heading: HeadingLevel.HEADING_2,
              spacing: {
                after: 200
              }
            }),
            
            ...perguntasRespostas.flatMap(({ pergunta, resposta }) => [
              new Paragraph({
                text: pergunta.replace(/["]/g, ''),
                spacing: {
                  before: 200,
                  after: 100
                },
                bullet: {
                  level: 0
                }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: resposta,
                    bold: false,
                    italics: false
                  })
                ],
                spacing: {
                  before: 100,
                  after: 200
                },
                indent: {
                  left: 600
                }
              })
            ]),
            
            // Resumo / Conclusão
            ...(resumo ? [
              new Paragraph({
                text: 'Resumo / Conclusão',
                heading: HeadingLevel.HEADING_2,
                spacing: {
                  before: 400,
                  after: 200
                }
              }),
              new Paragraph({
                text: resumo,
                spacing: {
                  before: 100,
                  after: 200
                }
              })
            ] : [])
          ]
        }]
      });
      
      // Criar diretório para armazenar os documentos temporários
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Gerar nome de arquivo único baseado no ID da conversa e timestamp
      const fileName = `especificacao_${conversa.secao.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.docx`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Gerar o documento e salvá-lo no sistema de arquivos
      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(filePath, buffer);
      
      return {
        fileName,
        filePath,
        success: true
      };
      
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao gerar documento Word.');
    }
  }
} 