import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { DocumentoService } from '../services/documento/documento.service';

// Instância do serviço de documentos
const documentoService = new DocumentoService();

export class DocumentoController {
  // Gerar e baixar um documento Word com o resumo da conversa
  async gerarDocumentoWord(req: Request, res: Response) {
    const userId = req.user_id;
    const { conversaId } = req.params;
    
    try {
      const resultado = await documentoService.gerarDocumentoWord(conversaId, userId);
      
      // Configurar cabeçalhos para download do arquivo
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename=${resultado.fileName}`);
      
      // Enviar o arquivo como resposta
      const fileStream = fs.createReadStream(resultado.filePath);
      fileStream.pipe(res);
      
      // Remover o arquivo após o envio (opcional)
      fileStream.on('end', () => {
        fs.unlinkSync(resultado.filePath);
      });
      
    } catch (error: any) {
      console.error('Erro ao gerar documento Word:', error);
      
      if (error.message.includes('Conversa não encontrada')) {
        return res.status(404).send(error.message);
      } else if (error.message.includes('não tem permissão')) {
        return res.status(403).send(error.message);
      }
      
      res.status(500).send(error.message);
    }
  }
} 