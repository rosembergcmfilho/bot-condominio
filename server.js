const express = require('express');
const { listarCondominios, listarUnidades, buscarUltimaCobranca, listarCobrancas } = require('./condomob');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Rota principal
app.get('/', (req, res) => {
  res.send('🏢 Bot do Condomínio - API Online!');
});

// Rota para testar conexão
app.get('/teste-condomob', async (req, res) => {
  res.json({
    mensagem: 'Configuração do Condomob',
    token_configurado: process.env.CONDOMOB_TOKEN ? 'Sim ✅' : 'Não ❌',
    administradora_id: process.env.CONDOMOB_ADMINISTRADORA_ID,
    url_base: process.env.CONDOMOB_BASE_URL
  });
});

// Rota para listar condomínios
app.get('/condominios', async (req, res) => {
  console.log('🏢 Buscando lista de condomínios...');
  
  const condominios = await listarCondominios();
  
  if (condominios) {
    res.json({
      sucesso: true,
      dados: condominios
    });
  } else {
    res.status(404).json({
      sucesso: false,
      mensagem: 'Não foi possível buscar os condomínios'
    });
  }
});

// Rota para listar unidades de um CPF
app.get('/unidades/:cpf', async (req, res) => {
  const cpf = req.params.cpf;
  
  console.log(`🏠 Buscando unidades para CPF: ${cpf}`);
  
  const unidades = await listarUnidades(cpf);
  
  if (unidades) {
    res.json({
      sucesso: true,
      cpf: cpf,
      unidades: unidades
    });
  } else {
    res.status(404).json({
      sucesso: false,
      mensagem: 'Não foi possível buscar as unidades'
    });
  }
});

// Rota para buscar última cobrança de um CPF + unidade
app.get('/cobranca/ultima/:cpf', async (req, res) => {
  const cpf = req.params.cpf;
  const condominioId = req.query.condominio;
  const unidade = req.query.unidade;
  
  if (!condominioId || !unidade) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Parâmetros obrigatórios: ?condominio=ID&unidade=NUMERO'
    });
  }
  
  console.log(`💰 Buscando última cobrança - CPF: ${cpf}, Condomínio: ${condominioId}, Unidade: ${unidade}`);
  
  const cobranca = await buscarUltimaCobranca(cpf, condominioId, unidade);
  
  if (cobranca) {
    res.json({
      sucesso: true,
      cpf: cpf,
      condominio: condominioId,
      unidade: unidade,
      cobranca: cobranca
    });
  } else {
    res.status(404).json({
      sucesso: false,
      mensagem: 'Não foi possível buscar a cobrança'
    });
  }
});

// Rota para listar todas as cobranças de um CPF + unidade
app.get('/cobrancas/:cpf', async (req, res) => {
  const cpf = req.params.cpf;
  const condominioId = req.query.condominio;
  const unidade = req.query.unidade;
  
  if (!condominioId || !unidade) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Parâmetros obrigatórios: ?condominio=ID&unidade=NUMERO'
    });
  }
  
  console.log(`📋 Buscando todas as cobranças - CPF: ${cpf}, Condomínio: ${condominioId}, Unidade: ${unidade}`);
  
  const cobrancas = await listarCobrancas(cpf, condominioId, unidade);
  
  if (cobrancas) {
    res.json({
      sucesso: true,
      cpf: cpf,
      condominio: condominioId,
      unidade: unidade,
      cobrancas: cobrancas
    });
  } else {
    res.status(404).json({
      sucesso: false,
      mensagem: 'Não foi possível buscar as cobranças'
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`🏢 Integração com Condomob configurada`);
  console.log(`📍 Administradora ID: ${process.env.CONDOMOB_ADMINISTRADORA_ID}`);
  console.log(`\n📍 Rotas disponíveis:`);
  console.log(`   GET /condominios`);
  console.log(`   GET /unidades/:cpf`);
  console.log(`   GET /cobranca/ultima/:cpf?condominio=ID&unidade=NUM`);
  console.log(`   GET /cobrancas/:cpf?condominio=ID&unidade=NUM`);
});