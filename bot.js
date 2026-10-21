require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const fs = require('fs');
const http = require('http');

// ⚠️ LEITURA DO TOKEN DO TELEGRAM
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
if (!TELEGRAM_TOKEN) {
  console.error("❌ ERRO FATAL: A variável TELEGRAM_TOKEN não foi encontrada!");
  process.exit(1);
}

const FIREBASE_PROJECT_ID = "quicklinks-hub";
const USER_ID = "J0WgudZ9vLQczDScYEdtTNU3B4N2"; 

// ============================================================
// INICIALIZAÇÃO DO FIREBASE (AQUI ESTÁ A CORREÇÃO)
// ============================================================
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // A MÁGICA: transforma o texto "\n" em quebra de linha real
    privateKey: process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
      : undefined
  }),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();
console.log("✅ Firebase inicializado com sucesso!");
console.log("🤖 Bot do Telegram rodando...");

// ============================================================
// O RESTO DO CÓDIGO CONTINUA IGUAL
// ============================================================
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const texto = msg.text;

  if (texto === '/start') {
    return bot.sendMessage(chatId, "👋 Olá! Envie seu link junto com a categoria.\nExemplo:\nhttps://notion.so Trabalho");
  }

  const partes = texto.split(' ');
  const url = partes[0];
  const categoria = partes.slice(1).join(' ') || 'Telegram';

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return bot.sendMessage(chatId, "❌ Formato inválido. Envie assim:\nhttps://exemplo.com Categoria");
  }

  try {
    const novoLink = {
      title: url.replace('https://', '').replace('http://', '').split('/')[0],
      url: url,
      category: categoria,
      tags: 'telegram',
      description: 'Adicionado via Telegram',
      favorito: false,
      previewImage: `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`,
      userId: USER_ID,
      cliques: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('links').add(novoLink);
    bot.sendMessage(chatId, `✅ Link salvo!\n📂 Categoria: ${categoria}\n🔗 ${url}`);

  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Erro ao salvar no banco de dados.");
  }
});

// ===== SERVIDOR WEB PARA O RENDER =====
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor web rodando na porta ${PORT}`);
});