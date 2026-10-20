require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const fs = require('fs');

// ⚠️ AQUI ESTÁ A PROTEÇÃO E A LEITURA DO TOKEN
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
if (!TELEGRAM_TOKEN) {
  console.error("❌ ERRO FATAL: A variável TELEGRAM_TOKEN não foi encontrada no Railway!");
  process.exit(1);
}

const FIREBASE_PROJECT_ID = "quicklinks-hub";
const USER_ID = "J0WgudZ9vLQczDScYEdtTNU3B4N2"; 

// --- A MÁGICA ACONTECE AQUI ---
// Verifica se a variável de ambiente existe no Railway
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  // Se existir, ele cria o arquivo serviceAccountKey.json na memória do Railway
  fs.writeFileSync('./serviceAccountKey.json', process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: FIREBASE_PROJECT_ID
});
const db = admin.firestore();

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
console.log("🤖 Bot do Telegram rodando...");

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
// ===== SERVIDOR WEB PARA O RENDER (ADICIONE NO FINAL) =====
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running');
}).listen(PORT, () => {
  console.log(`Servidor web rodando na porta ${PORT}`);
});