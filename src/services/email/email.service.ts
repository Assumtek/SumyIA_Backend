import * as nodemailer from 'nodemailer';
import { config } from '../../config/env';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private sender: string;

  constructor() {
    this.sender = config.email.sender;
    
    // Criar o transportador do Nodemailer
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });
  }

  // Envia email de boas-vindas para novos usuários
  async enviarEmailBoasVindas(nome: string, email: string) {
    try {
      const data = {
        from: `Sumy IA <${this.sender}>`,
        to: email,
        subject: 'Bem-vindo à Sumy IA!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Bem-vindo à Sumy IA!</h1>
            <p>Olá ${nome},</p>
            <p>Seja bem-vindo à nossa plataforma! Estamos felizes em tê-lo como parte da nossa comunidade.</p>
            <p>Com a Sumy IA, você pode:</p>
            <ul>
              <li>Criar conversas inteligentes</li>
              <li>Obter respostas às suas perguntas</li>
              <li>Explorar o poder da inteligência artificial</li>
            </ul>
            <p>Se tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.</p>
            <p>Atenciosamente,<br>Equipe Sumy IA</p>
          </div>
        `
      };

      // Enviar o email usando Nodemailer
      const info = await this.transporter.sendMail(data);
      console.log(`Email de boas-vindas enviado para ${email}, ID: ${info.messageId}`);
      
      return { success: true, message: 'Email de boas-vindas enviado com sucesso' };
    } catch (error) {
      console.error('Erro ao enviar email de boas-vindas:', error);
      // Não falha o fluxo principal se o email falhar
      return { success: false, message: 'Não foi possível enviar o email de boas-vindas' };
    }
  }

  // Enviar email de recuperação de senha
  async enviarEmailRecuperacaoSenha(nome: string, email: string, resetLink: string) {
    try {
      const data = {
        from: `Sumy IA <${this.sender}>`,
        to: email,
        subject: 'Recuperação de Senha - Sumy IA',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Recuperação de Senha</h1>
            <p>Olá ${nome},</p>
            <p>Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo para criar uma nova senha:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
            </p>
            <p>Se você não solicitou esta alteração, ignore este email.</p>
            <p>O link é válido por 1 hora.</p>
            <p>Atenciosamente,<br>Equipe Sumy IA</p>
          </div>
        `
      };

      const info = await this.transporter.sendMail(data);
      console.log(`Email de recuperação enviado para ${email}, ID: ${info.messageId}`);
      
      return { success: true, message: 'Email de recuperação enviado com sucesso' };
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      // Não falha o fluxo principal se o email falhar
      return { success: false, message: 'Não foi possível enviar o email de recuperação' };
    }
  }
} 