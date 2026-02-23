const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { listarUnidades, listarCobrancas } = require('./condomob');

// ⚙️ CONFIGURAÇÃO DO TESTE
const TESTE = {
  cpf: '12057191486', // ← COLOQUE O CPF DO CLIENTE TESTE AQUI
  telefone: '558198758740' // ← SEU NÚMERO PRA TESTE (com 55 + DDD)
};

async function testarEnvio() {
  console.log('🧪 INICIANDO TESTE DE ENVIO...\n');
  	
  // 1. Conectar ao WhatsApp
  console.log('📱 Conectando ao WhatsApp...');
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false // Já está conectado
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  // Aguardar conexão
  await new Promise((resolve) => {
    sock.ev.on('connection.update', (update) => {
      if (update.connection === 'open') {
        console.log('✅ Conectado!\n');
        resolve();
      }
    });
  });
  
  // 2. Buscar dados do cliente
  console.log(`🔍 Buscando dados do CPF: ${TESTE.cpf}...`);
  const unidades = await listarUnidades(TESTE.cpf);
  
  if (!unidades || unidades.length === 0) {
    console.log('❌ Nenhuma unidade encontrada!');
    process.exit(1);
  }
  
  console.log(`✅ Encontradas ${unidades.length} unidade(s)\n`);
  
  // 3. Buscar boletos de TODAS as unidades
  let todasCobrancas = [];
  
  for (const unidade of unidades) {
    console.log(`   📋 Verificando unidade ${unidade.unidade}...`);
    
    const resultado = await listarCobrancas(
      TESTE.cpf,
      unidade.condominio,
      unidade.unidade
    );
    
    if (resultado?.list?.length > 0) {
      console.log(`   ✅ ${resultado.list.length} boleto(s) encontrado(s)`);
      
      resultado.list.forEach(boleto => {
        todasCobrancas.push({
          ...boleto,
          unidade: unidade.unidade,
          condominio: unidade.nome,
          nomePagador: unidade.nomePagador
        });
      });
    } else {
      console.log(`   ⚠️ Sem boletos em aberto`);
    }
  }
  
  console.log(`\n📊 Total de boletos: ${todasCobrancas.length}\n`);
  
  if (todasCobrancas.length === 0) {
    console.log('⚠️ Nenhum boleto para enviar!');
    process.exit(0);
  }
  
  // 4. Montar mensagem
  const mensagem = montarMensagem(unidades[0], todasCobrancas);
  
  console.log('📝 MENSAGEM QUE SERÁ ENVIADA:');
  console.log('─────────────────────────────');
  console.log(mensagem);
  console.log('─────────────────────────────\n');
  
  // 5. Confirmar envio
  console.log(`📤 Enviar para: ${TESTE.telefone}`);
  console.log('⏳ Aguardando 3 segundos...\n');
  
  await aguardar(3000);
  
  // 6. ENVIAR!
  try {
    await sock.sendMessage(`${TESTE.telefone}@s.whatsapp.net`, {
      text: mensagem
    });
    
    console.log('✅ MENSAGEM ENVIADA COM SUCESSO!\n');
    console.log('📱 Verifique seu WhatsApp!');
    
  } catch (error) {
    console.error('❌ ERRO AO ENVIAR:', error.message);
  }
  
  // 7. Desconectar
  await aguardar(2000);
  process.exit(0);
}

function montarMensagem(unidade, boletos) {
  const primeiroNome = unidade.nomePagador?.split(' ')[0] || 'Cliente';
  
  let msg = `👋 Olá, *${primeiroNome}*!\n\n`;
  msg += `📄 *BOLETOS DISPONÍVEIS*\n\n`;
  
  // Agrupar por unidade se tiver mais de uma
  const unidadesUnicas = [...new Set(boletos.map(b => b.unidade))];
  
  unidadesUnicas.forEach(unidadeNum => {
    const boletosUnidade = boletos.filter(b => b.unidade === unidadeNum);
    const condominio = boletosUnidade[0].condominio;
    
    msg += `🏢 *${condominio}*\n`;
    msg += `🏠 Unidade *${unidadeNum}*\n\n`;
    
    boletosUnidade.forEach((boleto, index) => {
      const [ano, mes, dia] = boleto.vencimento.split('-');
      const valor = boleto.valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      
      msg += `💰 *Boleto ${index + 1}*\n`;
      msg += `   Valor: ${valor}\n`;
      msg += `   Vencimento: ${dia}/${mes}/${ano}\n`;
      msg += `   🔗 ${boleto.link}\n\n`;
    });
    
    msg += `───────────────────\n\n`;
  });
  
  msg += `💡 Para consultar mais detalhes, digite *MENU*\n\n`;
  msg += `_Mensagem automática - Módulo Administradora_`;
  
  return msg;
}

function aguardar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// EXECUTAR TESTE
testarEnvio().catch(console.error);