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

  // Envia email de boas-vindas para novos usuários mas envia o email e a senha temporária

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

  async enviarEmailCredenciaisTemporarias(nome: string, email: string, senhaTemporaria: string): Promise<{ success: boolean; message: string }> {
    try {
      const template = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; margin-bottom: 20px;">Bem-vindo(a) à SumyIA! 🎉</h2>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              Olá ${nome},
            </p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              Sua conta foi criada com sucesso! Para acessar nossa plataforma, utilize as seguintes credenciais:
            </p>
            
            <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Senha Temporária:</strong> ${senhaTemporaria}</p>
            </div>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              Por questões de segurança, recomendamos que você altere sua senha no primeiro acesso.
            </p>
            
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Acessar Minha Conta
              </a>
            </div>
            
            <p style="color: #777; font-size: 14px; margin-top: 30px;">
              Se você não solicitou esta conta, por favor ignore este email.
            </p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: `"SumyIA" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Suas Credenciais de Acesso - SumyIA",
        html: template
      });

      return { success: true, message: 'Email de credenciais enviado com sucesso' };
    } catch (error) {
      console.error('Erro ao enviar email de credenciais:', error);
      return { success: false, message: 'Erro ao enviar email de credenciais' };
    }
  }
} 