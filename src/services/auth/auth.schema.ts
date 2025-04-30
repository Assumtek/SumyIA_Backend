import * as yup from 'yup';

// Schema para validação de login
export const loginSchema = yup.object().shape({
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  senha: yup.string().required('Senha é obrigatória')
});

// Schema para validação de token
export const tokenSchema = yup.object().shape({
  token: yup.string().required('Token é obrigatório')
}); 