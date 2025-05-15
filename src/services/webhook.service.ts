import { UserService } from './user/user.service';
import { EmailService } from './email/email.service';
import { randomBytes } from 'crypto';
import prisma from '../prisma/client';

export class WebhookService {
    private userService: UserService;
    private emailService: EmailService;

    constructor() {
        this.userService = new UserService();
        this.emailService = new EmailService();
    }

    private generateTemporaryPassword(): string {
        // Gera uma senha aleatória de 8 caracteres
        return randomBytes(4).toString('hex');
    }

    async handleTransaction(payload: any): Promise<void> {
        console.log("Nova transação aprovada:", payload.status, payload.payment?.method);

        const cliente = payload.contact;
        const produto = payload.product;
        const valor = payload.payment?.total;

        // Validar se o nome do produto é SUMYIA"
        if (produto?.name !== "SUMYIA") {
            console.log("Produto não é SUMYIA");
            return;
        }

        // const hasSubscription = payload.subscription && payload.subscription.length > 0;

        try {
            // Verificar se o usuário já existe
            const existingUser = await prisma.user.findFirst(
                {
                    where: {
                        email: cliente.email
                    }
                }
            )

            if (existingUser) {
                console.log("Usuário já existe");
                return;
            }

            if (cliente?.email && cliente?.name) {
                const temporaryPassword = this.generateTemporaryPassword();
                // Criar um novo usuário com a senha temporária
                const user = await this.userService.createUser(
                    cliente.name,
                    cliente.email,
                    temporaryPassword,
                    'ALUNO' // Role padrão
                );
                console.log(`Novo usuário criado com sucesso: ${user.email}`);

            }

            console.log(`Cliente: ${cliente?.name}, Produto: ${produto?.name}, Valor: R$${valor}, Email: ${cliente?.email}`);
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            throw error;
        }
    }

    async handleSubscription(payload: any): Promise<void> {
        console.log("Assinatura recebida/atualizada:", payload.subscription);
        // Implementar lógica de negócio para assinaturas
        const produto = payload.product;
        // Validar se o nome do produto é SUMYIA"
        if (produto?.name !== "SUMYIA") {
            console.log("Produto não é SUMYIA");
            return;
        }
    }

    async handleCancellation(payload: any): Promise<void> {
        console.log("Assinatura cancelada:", payload.subscription);
        // Implementar lógica de negócio para cancelamentos
        const produto = payload.product;
        // Validar se o nome do produto é SUMYIA"
        if (produto?.name !== "SUMYIA") {
            console.log("Produto não é SUMYIA");
            return;
        }
    }
} 