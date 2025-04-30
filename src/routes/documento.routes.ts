import express from 'express';
import { DocumentoController } from '../controllers/documento.controller';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

const router = express.Router();
const documentoController = new DocumentoController();

// Middleware para verificar autenticação via query param para downloads
router.get('/:conversaId/word', (req, res, next) => {
  const token = req.query.token as string;
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    req.user_id = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}, documentoController.gerarDocumentoWord);

export default router; 