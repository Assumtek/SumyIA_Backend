import app from './app';

const port = process.env.PORT || 3333;

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
}); 