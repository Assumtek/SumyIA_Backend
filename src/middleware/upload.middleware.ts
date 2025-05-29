import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// Configuração do armazenamento em memória
const storage = multer.memoryStorage();

// Filtro para aceitar apenas imagens
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas.'));
  }
};

// Configuração do multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  }
}); 