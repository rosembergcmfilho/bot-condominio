# 🤖 Bot de Boletos - Módulo Administradora

Bot automatizado para WhatsApp que permite aos condôminos consultarem suas segundas vias de boletos de forma rápida e prática.

---

## 🎯 Funcionalidades

- ✅ Consulta de boletos por CPF/CNPJ
- ✅ Validação automática de CPF/CNPJ
- ✅ Aceita formatação (pontos, traços, espaços)
- ✅ Saudação personalizada com nome do condômino
- ✅ Lista todas as unidades do cliente
- ✅ Mostra todos os boletos em aberto
- ✅ Identifica boletos vencidos e a vencer
- ✅ Envia link do boleto, PIX e linha digitável
- ✅ Comandos MENU e AJUDA
- ✅ Detecção automática de unidade única

---

## 📋 Pré-requisitos

- Node.js 18+ instalado
- WhatsApp Business ou pessoal
- Token de acesso à API do Condomob
- Credenciais da administradora

---

## 🚀 Como usar

### Instalação (primeira vez):

1. Clone o repositório e acesse a pasta do projeto:
```bash
git clone https://github.com/rosembergcmfilho/bot-condominio.git
cd bot-condominio
```

2. Instale as dependências:
```bash
npm install
```

### Rodar o bot:
```bash
node whatsapp-bot.js
```

1. Escaneie o QR Code com WhatsApp
2. Aguarde: "✅ Bot conectado ao WhatsApp!"
3. Pronto! O bot está ativo

### Rodar a API (opcional - para testes):

Em **outro terminal**:
```bash
node server.js
```

Acesse no navegador: `http://localhost:3000`

---

## 💬 Comandos do Bot

| Comando | Descrição |
|---------|-----------|
| `MENU` | Volta ao início |
| `AJUDA` | Mostra comandos disponíveis |
| CPF/CNPJ | Inicia consulta de boletos |

---

## 📱 Fluxo de Atendimento
```
1️⃣ Usuário envia CPF/CNPJ
       ↓
2️⃣ Bot valida e busca unidades
       ↓
3️⃣ Mostra lista de unidades
       ↓
4️⃣ Usuário escolhe unidade
       ↓
5️⃣ Bot mostra todos os boletos (resumo)
       ↓
6️⃣ Usuário escolhe qual ver em detalhes
       ↓
7️⃣ Bot envia link, PIX e linha digitável
```

---

## ⚙️ Configuração

### Arquivo `.env`:
```env
CONDOMOB_TOKEN=seu_token_aqui
CONDOMOB_BASE_URL=https://financeiro.condomob.net/ws/chatbot
CONDOMOB_ADMINISTRADORA_ID=seu_id_aqui
```

### Arquivos principais:

- `whatsapp-bot.js` - Bot do WhatsApp
- `server.js` - API REST
- `condomob.js` - Integração com Condomob
- `.env` - Configurações secretas

---

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Baileys** - Biblioteca WhatsApp Web
- **Express** - Framework web
- **Axios** - Cliente HTTP
- **dotenv** - Variáveis de ambiente

---

## 📊 Estrutura do Projeto
```
bot-condominio/
├── whatsapp-bot.js          # Bot WhatsApp
├── server.js                # API REST
├── condomob.js              # Integração Condomob
├── .env                     # Configurações
├── package.json             # Dependências
├── package-lock.json        # Lock de versões
├── auth_info_baileys/       # Sessão WhatsApp
└── node_modules/            # Bibliotecas
```

---

## ⚡ Melhorias Implementadas

### Versão 1.0:
- ✅ Integração com API Condomob
- ✅ Bot WhatsApp funcional
- ✅ Validação de CPF/CNPJ
- ✅ Formatação automática
- ✅ Nome personalizado
- ✅ Unidade única automática
- ✅ Resumo detalhado de boletos
- ✅ Comandos MENU e AJUDA

---

## 🔮 Próximas Melhorias

### Planejadas:
- [ ] Log de atendimentos
- [ ] Horário de atendimento
- [ ] Envio de boleto por email
- [ ] Notificações de vencimento
- [ ] Painel administrativo web
- [ ] Hospedar em servidor 24/7

---

## 🐛 Troubleshooting

### Bot não conecta:
- Verifique internet
- Escaneie QR Code novamente
- Delete pasta `auth_info_baileys` e reconecte

### Erro "API não responde":
- Verifique se Condomob está online
- Confirme credenciais no `.env`
- Teste API diretamente no navegador

### CPF/CNPJ não encontrado:
- Verifique se está cadastrado no Condomob
- Confirme ID da administradora no `.env`

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
- Verifique este README
- Digite `AJUDA` no bot
- Abra uma issue no repositório

---

## 📄 Licença

Este projeto é de uso interno da Módulo Administradora.

---

## 🎉 Desenvolvido em

**05 de Fevereiro de 2026**

Com dedicação, persistência e muito aprendizado! 💪

---

## 📝 Notas da Versão

### v1.0.0 (05/02/2026)
- 🎉 Versão inicial funcional
- ✅ Todas as funcionalidades essenciais implementadas
- ✅ Bot testado e aprovado
- ✅ Documentação completa

---

**🚀 Bot criado com Node.js + Baileys + Condomob API**
