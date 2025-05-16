import prisma from '../../prisma/client';
import { hash, compare } from 'bcryptjs';
import { createUserSchema, updateUserSchema, idSchema, updatePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from './user.schema';

import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import { config } from '../../config/env';

// Definição de tipos locais em vez de importar do Prisma Client
type UserRole = 'ADMIN' | 'FREE' | 'PRO' | 'ALUNO';

export class UserService {

  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // Criar um novo usuário
  async createUser(nome: string, email: string, senha: string, role: UserRole = 'ALUNO') {
    try {
      // Validar dados de entrada
      await createUserSchema.validate({ nome, email, senha, role });

      // Verifica se o usuário já existe
      const usuarioExistente = await prisma.user.findUnique({
        where: { email }
      });

      if (usuarioExistente) {
        throw new Error('Este email já está em uso.');
      }

      // Cria a criptografia da senha
      const hashedPassword = await hash(senha, 8);

      // Cria o novo usuário
      const novoUsuario = await prisma.user.create({
        data: {
          nome,
          email,
          senha: hashedPassword,
          role: role as UserRole
        }
      });

      const user = await prisma.user.update({
        where: { id: novoUsuario.id },
        data: {
          updatedBy: novoUsuario.email
        }
      });

      if (role === 'ALUNO') {
        this.emailService.enviarEmailBoasVindas(nome, email)
          .then(result => {
            if (!result.success) {
              console.warn(`Falha ao enviar email de boas-vindas para ${email}: ${result.message}`);
            }
          })
          .catch(error => {
            console.error(`Erro ao tentar enviar email de boas-vindas para ${email}:`, error);
          });
      } else {
        // Enviar email de boas-vindas (não aguarda o resultado para não bloquear)
        this.emailService.enviarEmailCredenciaisTemporarias(nome, email, senha)
          .then(result => {
            if (!result.success) {
              console.warn(`Falha ao enviar email de boas-vindas para ${email}: ${result.message}`);
            }
          })
          .catch(error => {
            console.error(`Erro ao tentar enviar email de boas-vindas para ${email}:`, error);
          });
      }

      // Remove a senha antes de retornar
      const { senha: _, ...usuarioSemSenha } = user;
      return usuarioSemSenha;

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao criar usuário');
    }
  }

  // Buscar um usuário pelo ID
  async getUserById(id: string) {
    try {
      // Validar ID
      await idSchema.validate({ id });

      const usuario = await prisma.user.findUnique({
        where: { id: id as any }, // Convertemos para any para evitar erros de tipo
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          updatedBy: true,
          createdAt: true,
          updatedAt: true
        } as any // Convertemos para any para evitar erros de tipo
      });

      if (!usuario) {
        throw new Error('Usuário não encontrado.');
      }

      return usuario;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao buscar usuário');
    }
  }

  // Atualizar um usuário
  async updateUser(id: string, nome: string, email: string, updatedBy: string) {
    try {
      // Validar dados
      await idSchema.validate({ id });
      await updateUserSchema.validate({ nome, email });

      const updateData: any = {
        nome,
        email,
        updatedBy
      };

      const usuarioAtualizado = await prisma.user.update({
        where: { id: id as any }, // Convertemos para any para evitar erros de tipo
        data: updateData,
        select: {
          id: true,
          nome: true,
          email: true,
          updatedBy: true,
          updatedAt: true
        } as any // Convertemos para any para evitar erros de tipo
      });

      return usuarioAtualizado;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao atualizar usuário');
    }
  }

  // Atualizar a senha de um usuário
  async updatePassword(id: string, senhaAtual: string, novaSenha: string, updatedBy: string) {
    try {
      // Validar dados
      await idSchema.validate({ id });
      await updatePasswordSchema.validate({ senhaAtual, novaSenha });

      // Buscar o usuário para verificar a senha atual
      const usuario = await prisma.user.findUnique({
        where: { id: id as any }
      });

      if (!usuario) {
        throw new Error('Usuário não encontrado.');
      }

      // Verificar se a senha atual está correta
      const senhaCorreta = await compare(senhaAtual, usuario.senha);

      if (!senhaCorreta) {
        throw new Error('Senha atual incorreta.');
      }

      // Criptografar a nova senha
      const novaSenhaCriptografada = await hash(novaSenha, 8);

      // Atualizar a senha do usuário
      await prisma.user.update({
        where: { id: id as any },
        data: {
          senha: novaSenhaCriptografada,
          updatedBy
        }
      });

      return { message: 'Senha atualizada com sucesso.' };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao atualizar senha');
    }
  }

  // Solicitar recuperação de senha
  async forgotPassword(email: string) {
    try {
      await forgotPasswordSchema.validate({ email });

      const usuario = await prisma.user.findUnique({ where: { email } });

      if (!usuario) {
        // Não revele se o email existe ou não por segurança
        return { message: 'Se esse email estiver cadastrado, você receberá instruções.' };
      }

      // Gerar token aleatório
      const token = crypto.randomBytes(32).toString('hex');

      // Salvar o token com expiração de 1 hora
      const expiresAt = new Date(Date.now() + 3600000); // 1 hora


      await prisma.passwordReset.create({
        data: {
          id: crypto.randomUUID(),
          userId: usuario.id,
          token: token,
          expiresAt: expiresAt,
          used: false,
          createdAt: new Date()
        }
      });

      // Configurar o link de recuperação
      const resetLink = `${config.app.frontendUrl}/reset-password?token=${token}`;

      // Enviar email
      const emailResult = await this.emailService.enviarEmailRecuperacaoSenha(usuario.nome, email, resetLink);
      if (!emailResult.success) {
        console.warn(`Falha ao enviar email de recuperação para ${email}: ${emailResult.message}`);
      }

      return { message: 'Instruções de recuperação enviadas para seu email.' };
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Erro ao processar solicitação de recuperação');
    }
  }

  // Redefinir senha com token
  async resetPassword(token: string, novaSenha: string) {
    try {
      await resetPasswordSchema.validate({ token, novaSenha });

      // Usar SQL raw enquanto o Prisma Client não estiver atualizado
      const resetRecords = await prisma.$queryRaw`
        SELECT * FROM "PasswordReset"
        WHERE "token" = ${token}
        AND "used" = false
        AND "expiresAt" > ${new Date()}::timestamp
        LIMIT 1
      `;

      /* 
      // Após executar 'npx prisma generate', você pode usar essa versão:
      const passwordReset = await prisma.passwordReset.findFirst({
        where: {
          token: token,
          used: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });
      
      if (!passwordReset) {
        throw new Error('Token inválido ou expirado');
      }
      */

      if (!resetRecords || (resetRecords as any[]).length === 0) {
        throw new Error('Token inválido ou expirado');
      }

      const passwordReset = (resetRecords as any[])[0];

      // Criptografar nova senha
      const hashedPassword = await hash(novaSenha, 8);

      // Atualizar senha do usuário
      await prisma.user.update({
        where: { id: passwordReset.userId },
        data: {
          senha: hashedPassword,
          updatedBy: passwordReset.userId
        }
      });

      // Marcar token como usado (SQL raw)
      await prisma.$executeRaw`
        UPDATE "PasswordReset"
        SET "used" = true
        WHERE "id" = ${passwordReset.id}
      `;

      /* 
      // Após executar 'npx prisma generate', você pode usar essa versão:
      await prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true }
      });
      */

      return { message: 'Senha atualizada com sucesso' };
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Erro ao redefinir senha');
    }
  }
} 