const axios = require('axios');
require('dotenv').config();

const CONDOMOB_TOKEN = process.env.CONDOMOB_TOKEN;
const CONDOMOB_BASE_URL = process.env.CONDOMOB_BASE_URL;
const ADMINISTRADORA_ID = process.env.CONDOMOB_ADMINISTRADORA_ID;

const getHeaders = () => ({
  'administradora': ADMINISTRADORA_ID,
  'Authorization': CONDOMOB_TOKEN,
  'Content-Type': 'application/json'
});

async function testarTelefone() {
  console.log('🔍 Testando endpoint com TELEFONE...\n');
  
  // Seu telefone de teste
  const telefone = '8198758740'; // SEM 55, SEM formatação
  
  console.log(`📱 Buscando unidades pelo telefone: ${telefone}...\n`);
  
  try {
    const response = await axios.get(`${CONDOMOB_BASE_URL}/unidade/list/telefone`, {
      headers: getHeaders(),
      params: {
        telefone: telefone
      }
    });
    
    console.log('✅ RESULTADO COMPLETO:\n');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n' + '═'.repeat(50) + '\n');
    
    if (response.data && response.data.length > 0) {
      console.log('🔑 TODAS AS CHAVES DISPONÍVEIS:\n');
      
      const chaves = Object.keys(response.data[0]);
      chaves.forEach(chave => {
        console.log(`  ${chave}: ${response.data[0][chave]}`);
      });
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.response?.data || error.message);
  }
}

testarTelefone().catch(console.error);