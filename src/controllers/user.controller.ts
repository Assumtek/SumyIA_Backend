import { Request, Response } from 'express';
import { UserService } from '../services/user/user.service';

// Tipo local para UserRole
type UserRole = 'ADMIN' | 'FREE' | 'PRO' | 'ALUNO';

// Instância do serviço de usuário
const userService = new UserService();

export class UserController {
  // Criar um novo usuário (registro)
  async register(req: Request, res: Response) {
    const { nome, email, senha, role } = req.body;
    
    try {
      const usuario = await userService.createUser(nome, email, senha, role as UserRole);
      res.status(201).json(usuario);
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      res.status(error.message === 'Este email já está em uso.' ? 400 : 500).send(error.message);
    }
  }

  // Obter informações de um usuário pelo ID
  async getById(req: Request, res: Response) {
    const id = req.user_id;
    
    try {
      const usuario = await userService.getUserById(id);
      res.json(usuario);
    } catch (error: any) {
      console.error('Erro ao buscar usuário:', error);
      res.status(error.message === 'Usuário não encontrado.' ? 404 : 500).send(error.message);
    }
  }

  // Atualizar um usuário
  async update(req: Request, res: Response) {
    const id = req.user_id;
    const { nome, email } = req.body;
    
    // Obter o ID do usuário a partir do token JWT
    const updatedBy = req.user_id;
    
    try {
      const usuarioAtualizado = await userService.updateUser(id, nome, email, updatedBy);
      res.json(usuarioAtualizado);
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).send(error.message);
    }
  }

  // Atualizar senha do usuário
  async updatePassword(req: Request, res: Response) {
    const id = req.user_id;
    const { senhaAtual, novaSenha } = req.body;
    
    // Obter o ID do usuário a partir do token JWT
    const updatedBy = req.user_id;
    
    try {
      const resultado = await userService.updatePassword(id, senhaAtual, novaSenha, updatedBy);
      res.json(resultado);
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      
      if (error.message === 'Senha atual incorreta.') {
        return res.status(401).send(error.message);
      } else if (error.message === 'Usuário não encontrado.') {
        return res.status(404).send(error.message);
      }
      
      res.status(500).send(error.message);
    }
  }

  // Solicitar recuperação de senha
  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    
    try {
      const resultado = await userService.forgotPassword(email);
      res.json(resultado);
    } catch (error: any) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      res.status(500).send(error.message);
    }
  }

  // Redefinir senha com token
  async resetPassword(req: Request, res: Response) {
    const { token, novaSenha } = req.body;
    
    try {
      const resultado = await userService.resetPassword(token, novaSenha);
      res.json(resultado);
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      
      if (error.message === 'Token inválido ou expirado') {
        return res.status(400).send(error.message);
      }
      
      res.status(500).send(error.message);
    }
  }
} 