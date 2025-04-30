import { PrismaClient } from '@prisma/client';

// Cria um cliente Prisma global para ser usado em toda a aplicação
const prisma = new PrismaClient();

export default prisma; 