const axios = require('axios');
require('dotenv').config();

const CONDOMOB_TOKEN = process.env.CONDOMOB_TOKEN;
const CONDOMOB_BASE_URL = process.env.CONDOMOB_BASE_URL;
const ADMINISTRADORA_ID = process.env.CONDOMOB_ADMINISTRADORA_ID;

// Configuração dos headers padrão
const getHeaders = () => ({
  'administradora': ADMINISTRADORA_ID,
  'Authorization': CONDOMOB_TOKEN,
  'Content-Type': 'application/json'
});

// Função para listar condomínios
async function listarCondominios() {
  try {
    const response = await axios.get(`${CONDOMOB_BASE_URL}/condominio/list`, {
      headers: getHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao listar condomínios:', error.response?.data || error.message);
    return null;
  }
}

// Função para listar unidades de um CPF
async function listarUnidades(cpfCnpj) {
  try {
    const response = await axios.get(`${CONDOMOB_BASE_URL}/unidade/list/cpfCnpj`, {
      headers: getHeaders(),
      params: {
        cpfCnpj: cpfCnpj
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao listar unidades:', error.response?.data || error.message);
    return null;
  }
}

// Função para buscar última cobrança de um CPF
async function buscarUltimaCobranca(cpfCnpj, condominioId, unidade) {
  try {
    const response = await axios.get(`${CONDOMOB_BASE_URL}/cobranca/latest/cpfCnpj`, {
      headers: getHeaders(),
      params: {
        condominio: condominioId,
        cpfCnpj: cpfCnpj,
        unidade: unidade
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar última cobrança:', error.response?.data || error.message);
    return null;
  }
}

// Função para listar todas as cobranças de um CPF
async function listarCobrancas(cpfCnpj, condominioId, unidade) {
  try {
    const response = await axios.get(`${CONDOMOB_BASE_URL}/cobranca/list/cpfCnpj`, {
      headers: getHeaders(),
      params: {
        condominio: condominioId,
        cpfCnpj: cpfCnpj,
        unidade: unidade
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao listar cobranças:', error.response?.data || error.message);
    return null;
  }
}

module.exports = {
  listarCondominios,
  listarUnidades,
  buscarUltimaCobranca,
  listarCobrancas
};