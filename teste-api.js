const { listarUnidades } = require('./condomob');

async function testarAPI() {
  console.log('🔍 Testando API do Condomob...\n');
  
  // Teste com seu CPF de exemplo
  const cpfTeste = '12057191486';
  
  console.log(`📋 Buscando unidades do CPF: ${cpfTeste}...\n`);
  const unidades = await listarUnidades(cpfTeste);
  
  console.log('✅ RESULTADO COMPLETO:\n');
  console.log(JSON.stringify(unidades, null, 2));
  
  console.log('\n' + '═'.repeat(50) + '\n');
  
  // Ver se tem telefone
  if (unidades && unidades.length > 0) {
    console.log('📱 VERIFICANDO TELEFONES:\n');
    
    unidades.forEach((u, i) => {
      console.log(`Unidade ${i + 1}:`);
      console.log(`  Nome: ${u.nomePagador || 'N/A'}`);
      console.log(`  telefone: ${u.telefone || '❌ NÃO TEM'}`);
      console.log(`  celular: ${u.celular || '❌ NÃO TEM'}`);
      console.log('');
    });
    
    console.log('═'.repeat(50) + '\n');
    console.log('🔑 TODAS AS CHAVES DISPONÍVEIS:\n');
    
    const chaves = Object.keys(unidades[0]);
    chaves.forEach(chave => {
      console.log(`  ${chave}: ${unidades[0][chave]}`);
    });
    
  } else {
    console.log('❌ Nenhuma unidade encontrada!');
  }
}

testarAPI().catch(console.error);