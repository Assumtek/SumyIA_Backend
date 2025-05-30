import * as yup from 'yup';

export const createFeedbackSchema = yup.object().shape({
  utilidade: yup.number().required('Utilidade é obrigatória').min(1).max(5),
  facilidade: yup.number().required('Facilidade é obrigatória').min(1).max(5),
  design: yup.number().required('Design é obrigatório').min(1).max(5),
  confiabilidade: yup.number().required('Confiabilidade é obrigatória').min(1).max(5),
  recomendacao: yup.number().required('Recomendação é obrigatória').min(1).max(5),
  valorJusto: yup.number().required('Valor justo é obrigatório').min(1).max(5),
  recursoFaltando: yup.string().required('Recurso faltando é obrigatório')
}); 