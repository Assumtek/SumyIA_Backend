import * as yup from 'yup';

// Schema para validação de início de conversa
export const iniciarConversaSchema = yup.object().shape({
  userId: yup.string().required('ID do usuário é obrigatório'),
  secao: yup.string().required('Seção é obrigatória')
});

// Schema para validação de resposta a pergunta
export const responderPerguntaSchema = yup.object().shape({
  userId: yup.string().required('ID do usuário é obrigatório'),
  conversaId: yup.string().required('ID da conversa é obrigatório'),
  resposta: yup.string().required('Resposta é obrigatória')
});

// Schema para validação de listagem de conversas
export const listarConversasSchema = yup.object().shape({
  userId: yup.string().required('ID do usuário é obrigatório')
});

// Schema para validação de listagem de mensagens
export const listarMensagensSchema = yup.object().shape({
  userId: yup.string().required('ID do usuário é obrigatório'),
  conversaId: yup.string().required('ID da conversa é obrigatório')
});

// Schema para validação de edição do nome da conversa
export const editarConversaSchema = yup.object().shape({
  userId: yup.string().required('ID do usuário é obrigatório'),
  conversaId: yup.string().required('ID da conversa é obrigatório'),
  secao: yup.string().required('Nome da conversa é obrigatório')
});

// Schema para validação de deleção de conversa
export const deletarConversaSchema = yup.object().shape({
  userId: yup.string().required('ID do usuário é obrigatório'),
  conversaId: yup.string().required('ID da conversa é obrigatório')
}); 