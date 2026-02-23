const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { listarUnidades, buscarUltimaCobranca, listarCobrancas } = require('./condomob');

// NÚMERO DO WHATSAPP DE ATENDIMENTO
const WHATSAPP_ATENDIMENTO = '558187879978@s.whatsapp.net';

// Estado da conversa de cada usuário
const conversas = {};

// Função para validar CPF
function validarCPF(cpf) {
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let soma = 0;
  let resto;
  
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}

// Função para validar CNPJ
function validarCNPJ(cnpj) {
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(0)) return false;
  
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(1)) return false;
  
  return true;
}

// Função para formatar número de telefone
function formatarTelefone(numeroCompleto) {
  let numero = numeroCompleto
    .replace('@s.whatsapp.net', '')
    .replace('@lid', '')
    .replace('@c.us', '')
    .replace(/\D/g, '');
  
  if (numero.startsWith('55') && (numero.length === 12 || numero.length === 13)) {
    const ddd = numero.substring(2, 4);
    
    if (numero.length === 13) {
      const parte1 = numero.substring(4, 9);
      const parte2 = numero.substring(9, 13);
      return `(${ddd}) ${parte1}-${parte2}`;
    } else if (numero.length === 12) {
      const parte1 = numero.substring(4, 8);
      const parte2 = numero.substring(8, 12);
      return `(${ddd}) ${parte1}-${parte2}`;
    }
  }
  
  return numero;
}
// Função para extrair número real do WhatsApp
async function extrairNumeroReal(sock, remetente) {
  try {
    console.log(`🔍 Tentando extrair número de: ${remetente}`);
    
    // Método 1: Extrair direto do JID
    let numero = remetente
      .replace('@s.whatsapp.net', '')
      .replace('@lid', '')
      .replace('@c.us', '')
      .replace(/\D/g, '');
    
    if (numero.startsWith('55') && (numero.length === 12 || numero.length === 13)) {
      console.log('✅ Método 1: Número extraído com sucesso');
      return numero;
    }
    
    // Método 2: Tentar buscar informações do contato
    try {
      const limpo = remetente.replace('@s.whatsapp.net', '').replace('@lid', '').replace('@c.us', '');
      const [contact] = await sock.onWhatsApp(limpo);
      if (contact && contact.jid) {
        numero = contact.jid
          .replace('@s.whatsapp.net', '')
          .replace('@lid', '')
          .replace('@c.us', '')
          .replace(/\D/g, '');
        
        if (numero.startsWith('55') && (numero.length === 12 || numero.length === 13)) {
          console.log('✅ Método 2: Número extraído com sucesso');
          return numero;
        }
      }
    } catch (e) {
      console.log('⚠️ Método 2 falhou, tentando método 3...');
    }
    
    // Método 3: Pegar do split
    const numeroOriginal = remetente.split('@')[0];
    if (numeroOriginal && numeroOriginal.startsWith('55') && (numeroOriginal.length === 12 || numeroOriginal.length === 13)) {
      console.log('✅ Método 3: Número extraído com sucesso');
      return numeroOriginal;
    }
    
    console.log('⚠️ Não consegui extrair número válido');
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao extrair número:', error);
    return null;
  }
}

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('📱 Escaneie o QR Code com seu WhatsApp:');
      qrcode.generate(qr, { small: true });
    }
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Conexão fechada. Reconectando...', shouldReconnect);
      if (shouldReconnect) {
        iniciarBot();
      }
    } else if (connection === 'open') {
      console.log('✅ Bot conectado ao WhatsApp!');
      console.log(`📞 Notificações: ${WHATSAPP_ATENDIMENTO}`);
    }
  });
  
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    
    const remetente = msg.key.remoteJid;
    const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    
    console.log(`📩 Mensagem de ${remetente}: ${texto}`);
    await processarMensagem(sock, remetente, texto);
  });
  
  return sock;
}
async function processarMensagem(sock, remetente, texto) {
  if (!conversas[remetente]) {
    conversas[remetente] = { etapa: 'inicio' };
  }
  
  const conversa = conversas[remetente];
  
  try {
    // Comando AJUDA
    if (texto.toUpperCase() === 'AJUDA') {
      await sock.sendMessage(remetente, {
        text: '📖 *COMANDOS DISPONÍVEIS:*\n\n' +
              '🔹 *MENU* - Volta ao menu principal\n' +
              '🔹 *AJUDA* - Mostra esta mensagem\n\n' +
              '💡 *Como usar:*\n\n' +
              '*Opção 1 - 2ª Via de Boleto:*\n' +
              '1️⃣ Envie seu CPF ou CNPJ\n' +
              '2️⃣ Escolha a unidade\n' +
              '3️⃣ Veja a lista de boletos\n' +
              '4️⃣ Escolha qual boleto quer ver\n\n' +
              '*Opção 2 - Atendimento:*\n' +
              '1️⃣ Solicite atendimento humano\n' +
              '2️⃣ Aguarde nosso contato\n\n' +
              'Digite *MENU* para voltar ao início! 😊'
      });
      return;
    }
    
    // Comando MENU
    if (texto.toUpperCase() === 'MENU') {
      conversa.etapa = 'inicio';
      await processarMensagem(sock, remetente, '');
      return;
    }
    
    // ETAPA 1: Menu Principal
    if (conversa.etapa === 'inicio') {
      await sock.sendMessage(remetente, {
        text: '👋 Olá! Tudo bem?\n\n' +
              'Sou o assistente virtual da *Módulo Administradora*.\n\n' +
              '📋 *Escolha uma opção:*\n\n' +
              '1️⃣ *2ª Via de Boleto*\n' +
              '   Consulte e baixe seus boletos\n\n' +
              '2️⃣ *Falar com Atendente*\n' +
              '   Negociação, documentos, dúvidas\n\n' +
              '💡 Digite o *número* da opção desejada.\n\n' +
              '❓ Digite *AJUDA* para mais informações.'
      });
      conversa.etapa = 'aguardando_opcao';
    }
    
    // ETAPA 2: Recebeu opção do menu
    else if (conversa.etapa === 'aguardando_opcao') {
      const opcao = texto.trim();
      
      if (opcao === '1') {
        await sock.sendMessage(remetente, {
          text: '📄 *2ª VIA DE BOLETO*\n\n' +
      'Para consultar seus boletos, me envie o *CPF* ou *CNPJ* cadastrado na sua unidade.\n\n' +
      '💡 *Dica:* Pode enviar com ou sem pontos e traços!\n\n' +
      'Digite *MENU* para voltar.'
        });
        conversa.etapa = 'aguardando_cpf';
        
      } else if (opcao === '2') {
        await sock.sendPresenceUpdate('composing', remetente);
        
        // Tentar extrair número com métodos inteligentes
        const numeroLimpo = await extrairNumeroReal(sock, remetente);
        
        if (!numeroLimpo) {
          console.log('⚠️ Não consegui extrair - pedindo telefone');
          await sock.sendMessage(remetente, {
            text: '📞 *SOLICITAÇÃO DE ATENDIMENTO*\n\n' +
                  'Para agilizar o atendimento, por favor digite seu *número de telefone com DDD*:\n\n' +
                  '💡 Exemplo: 81999999999 ou (81) 99999-9999\n\n' +
                  'Digite *MENU* para voltar.'
          });
          conversa.etapa = 'aguardando_telefone_atendimento';
          await sock.sendPresenceUpdate('paused', remetente);
          return;
        }
        
        const telefoneFormatado = formatarTelefone(`${numeroLimpo}@s.whatsapp.net`);
        const agora = new Date();
        const horario = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        await sock.sendMessage(remetente, {
          text: '✅ *Solicitação recebida!*\n\n' +
                '👤 Em breve um atendente entrará em contato com você.\n\n' +
                `📱 *Seu telefone:* ${telefoneFormatado}\n\n` +
                '📞 *Ou mande mensagem:* (81) 98787-9978\n\n' +
                '⏰ *Horário de Atendimento:*\n' +
                '   • Segunda a Quinta: 8h às 17h\n' +
                '   • (Intervalo: 12h às 14h)\n' +
                '   • Sexta: 8h às 12h\n\n' +
                'Ou aguarde que responderemos por aqui! 😊\n\n' +
                'Digite *MENU* para voltar ao início.'
        });
        
        try {
          await sock.sendMessage(WHATSAPP_ATENDIMENTO, {
            text: '🔔 *NOVO ATENDIMENTO SOLICITADO*\n\n' +
                  `📱 *Número:* ${telefoneFormatado}\n` +
                  `📱 *Número Completo:* ${numeroLimpo}\n` +
                  `⏰ *Horário:* ${horario}\n` +
                  `💬 *Via:* Bot WhatsApp\n\n` +
                  '───────────────────\n\n' +
                  '👆 Entre em contato com o cliente!\n\n' +
                  `_Número para ligar: ${telefoneFormatado}_`
          });
          
          console.log(`✅ Notificação enviada!`);
          console.log(`   Cliente: ${telefoneFormatado}`);
          console.log(`   Número: ${numeroLimpo}`);
        } catch (error) {
          console.error('❌ Erro ao enviar notificação:', error);
        }
        
        await sock.sendPresenceUpdate('paused', remetente);
        conversa.etapa = 'inicio';
        
      } else {
        await sock.sendMessage(remetente, {
          text: '❌ *Opção inválida*\n\n' +
                'Por favor, digite:\n' +
                '• *1* para 2ª Via de Boleto\n' +
                '• *2* para Falar com Atendente\n\n' +
                'Ou digite *MENU* para voltar.'
        });
      }
    }
    // ETAPA 3: Recebeu CPF/CNPJ
    else if (conversa.etapa === 'aguardando_cpf') {
      await sock.sendPresenceUpdate('composing', remetente);
      
      const cpfCnpj = texto.replace(/\D/g, '');
      
      if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
        await sock.sendMessage(remetente, {
          text: '❌ *CPF/CNPJ inválido*\n\n' +
                'Por favor, envie:\n' +
                '• *CPF:* 11 dígitos\n' +
                '• *CNPJ:* 14 dígitos\n\n' +
                '💡 Pode enviar com ou sem formatação!\n' +
                'Exemplo: 123.456.789-00 ou 12345678900\n\n' +
                'Digite *MENU* para voltar.'
        });
        await sock.sendPresenceUpdate('paused', remetente);
        return;
      }
      
      const isValido = cpfCnpj.length === 11 ? validarCPF(cpfCnpj) : validarCNPJ(cpfCnpj);
      
      if (!isValido) {
        await sock.sendMessage(remetente, {
          text: `❌ *${cpfCnpj.length === 11 ? 'CPF' : 'CNPJ'} inválido*\n\n` +
                'Por favor, verifique os números e tente novamente.\n\n' +
                'Digite *MENU* para voltar ao início.'
        });
        await sock.sendPresenceUpdate('paused', remetente);
        return;
      }
      
      await sock.sendMessage(remetente, {
        text: '⏳ Buscando suas unidades...'
      });
      
      const unidades = await listarUnidades(cpfCnpj);
      
      await sock.sendPresenceUpdate('paused', remetente);
      
      if (!unidades || unidades.length === 0) {
        await sock.sendMessage(remetente, {
          text: '❌ *Nenhuma unidade encontrada*\n\n' +
                'Não encontramos unidades cadastradas para este CPF/CNPJ.\n\n' +
                '💡 Verifique se o número está correto ou entre em contato:\n\n' +
                '📞 (81) 98787-9978\n\n' +
                'Digite *MENU* para voltar.'
        });
        conversa.etapa = 'inicio';
        return;
      }
      
      conversa.cpfCnpj = cpfCnpj;
      conversa.unidades = unidades;
      
      if (unidades.length === 1) {
        const unidadeSelecionada = unidades[0];
        const nomeCompleto = unidadeSelecionada.nomePagador || '';
        const primeiroNome = nomeCompleto.split(' ')[0];
        
        let mensagem = '';
        if (primeiroNome) {
          mensagem = `👋 Olá, *${primeiroNome}*!\n\n`;
        }
        
        mensagem += `✅ Encontrei sua unidade:\n\n`;
        mensagem += `🏢 *${unidadeSelecionada.nome}*\n`;
        mensagem += `🏠 Unidade *${unidadeSelecionada.unidade}*\n`;
        if (unidadeSelecionada.nomePagador) {
          mensagem += `👤 ${unidadeSelecionada.nomePagador}\n`;
        }
        
        await sock.sendMessage(remetente, { text: mensagem });
        
        conversa.unidadeSelecionada = unidadeSelecionada;
        await buscarEMostrarBoletos(sock, remetente, conversa);
        return;
      }
      
      const nomeCompleto = unidades[0].nomePagador || '';
const primeiroNome = nomeCompleto.split(' ')[0];

let mensagem = '';
if (primeiroNome) {
  mensagem = `👋 Olá, *${primeiroNome}*!\n\n`;
}

// Verificar se todas as unidades são do mesmo condomínio
const mesmoCondo = unidades.every(u => u.nome === unidades[0].nome);

if (mesmoCondo && unidades.length <= 5) {
  // Mostrar todas as unidades juntas
  mensagem += `✅ Encontrei ${unidades.length} unidades no *${unidades[0].nome}*!\n\n`;
  mensagem += `⏳ Buscando boletos de todas as unidades...\n`;
  
  await sock.sendMessage(remetente, { text: mensagem });
  
  // Buscar boletos de todas as unidades
  await buscarEMostrarTodasUnidades(sock, remetente, conversa, unidades);
  
} else {
  // Mostrar lista para escolher (quando são condomínios diferentes ou muitas unidades)
  mensagem += `✅ Encontrei ${unidades.length} unidades:\n\n`;
  
  unidades.forEach((unidade, index) => {
    mensagem += `*${index + 1}*. ${unidade.nome}\n`;
    mensagem += `   🏠 Unidade *${unidade.unidade}*\n`;
    if (unidade.nomePagador) {
      mensagem += `   👤 ${unidade.nomePagador}\n`;
    }
    mensagem += '\n';
  });
  
  mensagem += '⚠️ *Consulte UMA unidade por vez.*\n\n';
  mensagem += '📝 Digite o *número* da unidade que deseja consultar:\n\n';
  mensagem += '💡 Depois, digite *MENU* para consultar outra unidade.';
  
  await sock.sendMessage(remetente, { text: mensagem });
  conversa.etapa = 'aguardando_unidade';
}
    }
    // ETAPA 4: Recebeu número da unidade
    else if (conversa.etapa === 'aguardando_unidade') {
      const numero = parseInt(texto);
      
      if (isNaN(numero) || numero < 1 || numero > conversa.unidades.length) {
        await sock.sendMessage(remetente, {
          text: `❌ *Opção inválida*\n\n` +
                `Digite um número de *1* a *${conversa.unidades.length}*\n\n` +
                `Ou digite *MENU* para voltar ao início.`
        });
        return;
      }
      
      const unidadeSelecionada = conversa.unidades[numero - 1];
      conversa.unidadeSelecionada = unidadeSelecionada;
      
      await buscarEMostrarBoletos(sock, remetente, conversa);
    }
    
    // ETAPA 5: Recebeu número do boleto
    else if (conversa.etapa === 'aguardando_boleto') {
      const numero = parseInt(texto);
      
      if (isNaN(numero) || numero < 1 || numero > conversa.cobrancas.length) {
        await sock.sendMessage(remetente, {
          text: `❌ *Opção inválida*\n\n` +
                `Digite um número de *1* a *${conversa.cobrancas.length}*\n\n` +
                `Ou digite *MENU* para voltar ao início.`
        });
        return;
      }
      
      await sock.sendPresenceUpdate('composing', remetente);
      
      const cobranca = conversa.cobrancas[numero - 1];
      const unidade = conversa.unidadeSelecionada;
      
      const valorFormatado = cobranca.valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      
      const [ano, mes, dia] = cobranca.vencimento.split('-');
      const dataFormatada = `${dia}/${mes}/${ano}`;
      
      let mensagemBoleto = `💰 *DETALHES DO BOLETO*\n\n`;
      
      if (unidade.nomePagador) {
        mensagemBoleto += `👤 *Responsável:* ${unidade.nomePagador}\n`;
      }
      
      mensagemBoleto += `🏢 *Condomínio:* ${unidade.nome}\n`;
      mensagemBoleto += `🏠 *Unidade:* ${unidade.unidade}\n`;
      mensagemBoleto += `💵 *Valor:* ${valorFormatado}\n`;
      mensagemBoleto += `📅 *Vencimento:* ${dataFormatada}\n\n`;
      mensagemBoleto += `───────────────────\n\n`;
      mensagemBoleto += `🔗 *Link do Boleto:*\n${cobranca.link}\n\n`;
      mensagemBoleto += `💳 *Linha Digitável:*\n\`\`\`${cobranca.linhaDigitavel}\`\`\`\n\n`;
      
      if (cobranca.pix) {
        mensagemBoleto += `📱 *PIX Copia e Cola:*\n\`\`\`${cobranca.pix}\`\`\`\n\n`;
      }
      
      mensagemBoleto += `───────────────────\n\n`;
      mensagemBoleto += `💡 Digite outro *número* para ver mais boletos\n`;
      mensagemBoleto += `Ou *MENU* para voltar ao início.`;
      
      await sock.sendMessage(remetente, { text: mensagemBoleto });
      await sock.sendPresenceUpdate('paused', remetente);
    }
    
    // ETAPA 6: Recebeu telefone para atendimento (fallback)
    else if (conversa.etapa === 'aguardando_telefone_atendimento') {
      const telefoneDigitado = texto.replace(/\D/g, '');
      
      if (telefoneDigitado.length < 10 || telefoneDigitado.length > 11) {
        await sock.sendMessage(remetente, {
          text: '❌ *Telefone inválido*\n\n' +
                'Por favor, digite um telefone válido com DDD:\n\n' +
                '💡 Exemplo: 81999999999\n' +
                'Ou: (81) 99999-9999\n\n' +
                'Digite *MENU* para voltar.'
        });
        return;
      }
      
      let numeroCompleto = telefoneDigitado;
      if (!numeroCompleto.startsWith('55')) {
        numeroCompleto = '55' + numeroCompleto;
      }
      
      const telefoneFormatado = formatarTelefone(`${numeroCompleto}@s.whatsapp.net`);
      const agora = new Date();
      const horario = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      await sock.sendMessage(remetente, {
        text: '✅ *Solicitação recebida!*\n\n' +
              '👤 Em breve um atendente entrará em contato com você.\n\n' +
              `📱 *Telefone informado:* ${telefoneFormatado}\n\n` +
              '📞 *Ou mande mensagem:* (81) 98787-9978\n\n' +
              '⏰ *Horário de Atendimento:*\n' +
              '   • Segunda a Quinta: 8h às 17h\n' +
              '   • (Intervalo: 12h às 14h)\n' +
              '   • Sexta: 8h às 12h\n\n' +
              'Aguarde nosso contato! 😊\n\n' +
              'Digite *MENU* para voltar ao início.'
      });
      
      try {
        await sock.sendMessage(WHATSAPP_ATENDIMENTO, {
          text: '🔔 *NOVO ATENDIMENTO SOLICITADO*\n\n' +
                `📱 *Número Informado:* ${telefoneFormatado}\n` +
                `📱 *Número Completo:* ${numeroCompleto}\n` +
                `⏰ *Horário:* ${horario}\n` +
                `💬 *Via:* Bot WhatsApp (telefone informado)\n\n` +
                '───────────────────\n\n' +
                '👆 Entre em contato com o cliente!\n\n' +
                `_Número para ligar: ${telefoneFormatado}_`
        });
        
        console.log(`✅ Notificação enviada (telefone informado)!`);
        console.log(`   Número: ${telefoneFormatado}`);
      } catch (error) {
        console.error('❌ Erro ao enviar notificação:', error);
      }
      
      conversa.etapa = 'inicio';
    }
    
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    await sock.sendMessage(remetente, {
      text: '❌ *Ops! Ocorreu um erro*\n\n' +
            'Por favor, tente novamente.\n\n' +
            'Se o problema persistir, entre em contato:\n' +
            '📞 (81) 98787-9978\n\n' +
            'Digite *MENU* para voltar ao início.'
    });
    conversa.etapa = 'inicio';
  }
}
async function buscarEMostrarTodasUnidades(sock, remetente, conversa, unidades) {
  const cpfCnpj = conversa.cpfCnpj;
  
  await sock.sendPresenceUpdate('composing', remetente);
  
  // Buscar boletos de todas as unidades
  let todasCobrancas = [];
  let unidadesComBoletos = [];
  
  for (const unidade of unidades) {
    const resultado = await listarCobrancas(
      cpfCnpj,
      unidade.condominio,
      unidade.unidade
    );
    
    if (resultado && resultado.list && resultado.list.length > 0) {
      resultado.list.forEach(cobranca => {
        todasCobrancas.push({
          ...cobranca,
          unidadeNumero: unidade.unidade,
          unidadeNome: unidade.nome
        });
      });
      unidadesComBoletos.push(unidade);
    }
  }
  
  await sock.sendPresenceUpdate('paused', remetente);
  
  if (todasCobrancas.length === 0) {
    await sock.sendMessage(remetente, {
      text: '✅ *Parabéns!*\n\n' +
            'Não há boletos em aberto em nenhuma das suas unidades! 🎉\n\n' +
            'Digite *MENU* para voltar ao início.'
    });
    conversa.etapa = 'inicio';
    return;
  }
  
  // Salvar no contexto
  conversa.cobrancas = todasCobrancas;
  conversa.unidades = unidades;
  
  // Calcular totais
  const total = todasCobrancas.reduce((sum, c) => sum + c.valor, 0);
  const totalFormatado = total.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  let vencidos = 0;
  let aVencer = 0;
  
  todasCobrancas.forEach(cobranca => {
    const [ano, mes, dia] = cobranca.vencimento.split('-');
    const vencimento = new Date(ano, mes - 1, dia);
    if (vencimento < hoje) {
      vencidos++;
    } else {
      aVencer++;
    }
  });
  
  // Montar mensagem
  let mensagem = `📋 *BOLETOS EM ABERTO*\n\n`;
  mensagem += `👤 *Responsável:* ${unidades[0].nomePagador || ''}\n`;
  mensagem += `🏢 *Condomínio:* ${unidades[0].nome}\n\n`;
  mensagem += `📊 *Resumo Geral:*\n`;
  mensagem += `   • Total de boletos: ${todasCobrancas.length}\n`;
  if (vencidos > 0) mensagem += `   • ⚠️ Vencidos: ${vencidos}\n`;
  if (aVencer > 0) mensagem += `   • 🟢 A vencer: ${aVencer}\n`;
  mensagem += `   • 💰 Valor total: ${totalFormatado}\n\n`;
  mensagem += `───────────────────\n\n`;
  
  // Agrupar por unidade
  unidades.forEach(unidade => {
    const boletosUnidade = todasCobrancas.filter(c => c.unidadeNumero === unidade.unidade);
    
    if (boletosUnidade.length > 0) {
      mensagem += `🏠 *UNIDADE ${unidade.unidade}*\n\n`;
      
      boletosUnidade.forEach((cobranca, idx) => {
        const indexGlobal = todasCobrancas.indexOf(cobranca);
        const valorFormatado = cobranca.valor.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });
        
        const [ano, mes, dia] = cobranca.vencimento.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;
        
        const vencimento = new Date(ano, mes - 1, dia);
        const status = vencimento < hoje ? '⚠️ VENCIDO' : '🟢 A VENCER';
        
        const emojiNumero = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][indexGlobal] || `${indexGlobal + 1}️⃣`;
        
        mensagem += `${emojiNumero} ${status}\n`;
        mensagem += `   💵 ${valorFormatado}\n`;
        mensagem += `   📅 ${dataFormatada}\n\n`;
      });
      
      mensagem += `───────────────────\n\n`;
    }
  });
  
  mensagem += `📝 Digite *1*, *2*, *3*... para ver os *detalhes completos* (link, PIX, linha digitável).\n\n`;
  mensagem += `💡 Ou digite *MENU* para voltar ao início.`;
  
  await sock.sendMessage(remetente, { text: mensagem });
  conversa.etapa = 'aguardando_boleto';
}
async function buscarEMostrarBoletos(sock, remetente, conversa) {
  const unidadeSelecionada = conversa.unidadeSelecionada;
  
  await sock.sendPresenceUpdate('composing', remetente);
  
  await sock.sendMessage(remetente, {
    text: '⏳ Buscando boletos em aberto...'
  });
  
  const resultado = await listarCobrancas(
    conversa.cpfCnpj,
    unidadeSelecionada.condominio,
    unidadeSelecionada.unidade
  );
  
  await sock.sendPresenceUpdate('paused', remetente);
  
  if (!resultado || !resultado.list || resultado.list.length === 0) {
    await sock.sendMessage(remetente, {
      text: '✅ *Parabéns!*\n\n' +
            'Não há boletos em aberto para esta unidade! 🎉\n\n' +
            'Digite *MENU* para voltar ao início.'
    });
    conversa.etapa = 'inicio';
    return;
  }
  
  const cobrancas = resultado.list;
  conversa.cobrancas = cobrancas;
  
  const total = cobrancas.reduce((sum, c) => sum + c.valor, 0);
  const totalFormatado = total.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  
  const hoje = new Date();
hoje.setHours(0, 0, 0, 0); // Zera as horas para comparar só data
let vencidos = 0;
let aVencer = 0;

cobrancas.forEach(cobranca => {
  const [ano, mes, dia] = cobranca.vencimento.split('-');
  const vencimento = new Date(ano, mes - 1, dia);
  if (vencimento < hoje) {
    vencidos++;
  } else {
    aVencer++;
  }
});
  
  let mensagemBoletos = `📋 *BOLETOS EM ABERTO*\n\n`;
  
  if (unidadeSelecionada.nomePagador) {
    mensagemBoletos += `👤 *Responsável:* ${unidadeSelecionada.nomePagador}\n`;
  }
  
  mensagemBoletos += `🏢 *Condomínio:* ${unidadeSelecionada.nome}\n`;
  mensagemBoletos += `🏠 *Unidade:* ${unidadeSelecionada.unidade}\n\n`;
  mensagemBoletos += `📊 *Resumo:*\n`;
  mensagemBoletos += `   • Total de boletos: ${cobrancas.length}\n`;
  if (vencidos > 0) mensagemBoletos += `   • ⚠️ Vencidos: ${vencidos}\n`;
  if (aVencer > 0) mensagemBoletos += `   • 🟢 A vencer: ${aVencer}\n`;
  mensagemBoletos += `   • 💰 Valor total: ${totalFormatado}\n\n`;
  mensagemBoletos += `───────────────────\n\n`;
  
  cobrancas.forEach((cobranca, index) => {
  const valorFormatado = cobranca.valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  
  const [ano, mes, dia] = cobranca.vencimento.split('-');
  const dataFormatada = `${dia}/${mes}/${ano}`;
  
  const vencimento = new Date(ano, mes - 1, dia);
  const status = vencimento < hoje ? '⚠️ VENCIDO' : '🟢 A VENCER';
  
  // Emojis de números
  const emojiNumero = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][index] || `${index + 1}️⃣`;
  
  mensagemBoletos += `${emojiNumero} ${status}\n`;
  mensagemBoletos += `   💵 ${valorFormatado}\n`;
  mensagemBoletos += `   📅 ${dataFormatada}\n\n`;
});
  
  mensagemBoletos += `───────────────────\n\n`;
 mensagemBoletos += `📝 Digite *1*, *2*, *3*... para ver os *detalhes completos* (link, PIX, linha digitável).\n\n`;
  mensagemBoletos += `💡 Ou digite *MENU* para voltar ao início.`;
  
  await sock.sendMessage(remetente, { text: mensagemBoletos });
  conversa.etapa = 'aguardando_boleto';
}

console.log('🤖 Iniciando bot do WhatsApp...');
console.log('📋 Melhorias ativas:');
console.log('   ✅ Menu principal (Boleto + Atendente)');
console.log('   ✅ Notificação automática');
console.log('   ✅ Extração inteligente de números (3 métodos)');
console.log('   ✅ Fallback: Pede telefone se necessário');
console.log('   ✅ Validação de CPF/CNPJ');
console.log('   ✅ Nome personalizado');
console.log(`   📞 WhatsApp Atendimento: ${WHATSAPP_ATENDIMENTO}`);
iniciarBot();
