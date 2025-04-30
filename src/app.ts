import express from 'express';
import routes from './routes/routes';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();

// Middleware para interpretar JSON no corpo das requisições
app.use(express.json());

// Registrar as rotas
app.use('/api', routes);

export default app; 