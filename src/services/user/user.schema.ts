import * as yup from 'yup';

// Schema para validação de criação de usuário
export const createUserSchema = yup.object().shape({
  nome: yup.string().required('Nome é obrigatório'),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  senha: yup.string().required('Senha é obrigatória').min(6, 'A senha deve ter pelo menos 6 caracteres'),
  role: yup.string().oneOf(['ADMIN', 'FREE', 'PRO', 'ALUNO'], 'Role inválida')
});

// Schema para validação de atualização de usuário
export const updateUserSchema = yup.object().shape({
  nome: yup.string(),
  email: yup.string().email('Email inválido'),
  role: yup.string().oneOf(['ADMIN', 'FREE', 'PRO', 'ALUNO'], 'Role inválida')
});

// Schema para validação de atualização de senha
export const updatePasswordSchema = yup.object().shape({
  senhaAtual: yup.string().required('Senha atual é obrigatória'),
  novaSenha: yup.string().required('Nova senha é obrigatória')
    .min(6, 'A nova senha deve ter pelo menos 6 caracteres')
    .notOneOf([yup.ref('senhaAtual')], 'A nova senha deve ser diferente da senha atual')
});

// Schema para solicitação de recuperação de senha
export const forgotPasswordSchema = yup.object().shape({
  email: yup.string().email('Email inválido').required('Email é obrigatório')
});

// Schema para redefinição de senha com token
export const resetPasswordSchema = yup.object().shape({
  token: yup.string().required('Token é obrigatório'),
  novaSenha: yup.string().required('Nova senha é obrigatória')
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
});

// Schema para validação de ID
export const idSchema = yup.object().shape({
  id: yup.string().required('ID é obrigatório')
}); 