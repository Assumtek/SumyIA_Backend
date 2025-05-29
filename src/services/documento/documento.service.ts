import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../config/env';
import prisma from '../../prisma/client';

export class DocumentoService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.anonKey
    );
  }

  // Gerar documento Word a partir de especificações
  async gerarDocumentoEspecificacao(projectName: string, specifications: string, userId: string) {
    try {

      // Dividir as especificações em seções
      // Usar regex para separar título e conteúdo, removendo os **
      const sectionRegex = /\*\*(.+?):\*\*\s*([\s\S]*?)(?=(\*\*.+?:\*\*|$))/g;
      const matches = [...specifications.matchAll(sectionRegex)];

      // Criar o documento Word
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Título do documento
            new Paragraph({
              text: `Especificação Funcional - ${projectName}`,
              heading: HeadingLevel.HEADING_1,
              spacing: {
                after: 400
              }
            }),
            
            // Data de geração
            new Paragraph({
              text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
              spacing: {
                after: 400
              }
            }),
            
            // Especificações
            new Paragraph({
              text: 'Especificação Funcional',
              heading: HeadingLevel.HEADING_2,
              spacing: {
                after: 200
              }
            }),
            
            // Adicionar cada seção formatada
            ...matches.map(match => [
              new Paragraph({
                text: match[1].trim(), // Título sem **
                heading: HeadingLevel.HEADING_3,
                spacing: {
                  before: 200,
                  after: 100
                }
              }),
              new Paragraph({
                text: match[2].trim(), // Conteúdo
                spacing: {
                  before: 100,
                  after: 200
                }
              })
            ]).flat()
          ]
        }]
      });
      
      // Criar diretório para armazenar os documentos temporários
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Gerar nome de arquivo único baseado no nome do projeto e timestamp
      const fileName = `especificacao_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.docx`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Gerar o documento e salvá-lo no sistema de arquivos
      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(filePath, buffer);

      // Upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('documentos')
        .upload(fileName, buffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Erro ao fazer upload para o Supabase: ${uploadError.message}`);
      }

      // Obter URL pública do arquivo
      const { data: { publicUrl } } = this.supabase.storage
        .from('documentos')
        .getPublicUrl(fileName);

      // Remover arquivo temporário
      fs.unlinkSync(filePath);
      // Salvar o documento gerado no banco de dados usando prisma

      await prisma.documento.create({
        data: {
          nome: fileName,
          url: publicUrl,
          projectName,
          userId
        }
      });

      return {
        fileName,
        filePath: publicUrl,
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