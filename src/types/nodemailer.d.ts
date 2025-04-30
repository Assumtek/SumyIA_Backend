declare module 'nodemailer' {
  export interface SendMailOptions {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }

  export interface TransportOptions {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  }

  export interface SentMessageInfo {
    messageId: string;
    envelope: any;
    accepted: string[];
    rejected: string[];
    pending: string[];
    response: string;
  }

  export interface Transporter {
    sendMail(mailOptions: SendMailOptions): Promise<SentMessageInfo>;
  }

  export function createTransport(options: TransportOptions): Transporter;
} 