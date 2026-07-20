require('dotenv').config();
require('./setting/config');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;
const fs2 = require("fs")
const path = require('path');
const chalk = require('chalk');
const { sleep } = require('./utils');
const { BOT_TOKEN } = require('./token');
const { autoLoadPairs } = require('./autoload');
const axios = require("axios")

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const adminFilePath = path.join(__dirname, 'kingbadboitimewisher', 'admin.json');
let adminIDs = [];

// Store user states for pairing flow
const userStates = new Map();

const exists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const loadAdminIDs = async () => {
  const ownerID = '8801791903810';
  const defaultAdmins = [ownerID];

  if (!(await exists(adminFilePath))) {
    await fs.writeFile(adminFilePath, JSON.stringify(defaultAdmins, null, 2));
    adminIDs = defaultAdmins;
    console.log('✅ ᴄʀᴇᴀᴛᴇᴅ ᴀᴅᴍɪɴ.ᴊsᴏɴ ᴡɪᴛʜ ᴅᴇғᴀᴜʟᴛ ᴏᴡɴᴇʀ ɪᴅ');
  } else {
    try {
      const raw = await fs.readFile(adminFilePath, 'utf8');
      adminIDs = JSON.parse(raw);
    } catch (err) {
      console.error('ᴇʀᴏʀ ʟᴏᴀᴅɪɴɢ ᴀᴅᴍɪɴ.ᴊsᴏɴ:', err);
      adminIDs = defaultAdmins;
    }
  }
  console.log('📥 ʟᴏᴀᴅᴇᴅ ᴀᴅᴍɪɴ ɪᴅs:', adminIDs);
};

let isShuttingDown = false;
let isAutoLoadRunning = true;

const runAutoLoad = async () => {
  if (isAutoLoadRunning || isShuttingDown) return;
  isAutoLoadRunning = true;

  try {
    console.log('⏱️ ɪɴɪᴛɪᴀᴛɪɴɢ ᴀᴜᴛᴏ-ʟᴏᴀᴅ');
    await autoLoadPairs();
    console.log('✅ ᴀᴜᴛᴏ-ʟᴏᴀᴅ ᴄᴏᴍᴘʟᴇᴛᴇᴅ');
  } catch (e) {
    console.error('❌ ᴀᴜᴛᴏ-ʟᴏᴀᴅ ғᴀɪʟᴇᴅ:', e);
  } finally {
    isAutoLoadRunning = false;
  }
};

const startAutoLoadLoop = () => {
  runAutoLoad();
  setInterval(runAutoLoad, 60 * 60 * 1000);
};
startAutoLoadLoop();

const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`🛑 ʀᴇᴄᴇɪᴠᴇᴅ ${signal}. sʜᴜᴛᴛɪɴɢ ᴅᴏᴡɴ ɢʀᴀᴄᴇғᴜʟʏ...`);
  bot.stopPolling();
  console.log('✅ ʙᴏᴛ sᴛᴏᴘᴘᴇᴅ sᴜᴄᴇssғᴜʟʏ');
  process.exit(0);
};

// ========== SEND GROUP MESSAGE (STYLISH) ==========
const sendGroupMessage = async (chatId, replyToMessageId = null) => {
  const botInfo = await bot.getMe();
  const botUsername = botInfo.username;

  const message = `╭━━〔 🛡️ 𝙑𝙄𝙋 𝙎𝙀𝘾𝙐𝙍𝙀 〕━━╮
➤ ᴜsᴇ ɪɴ ᴅᴍ 👇
╰━━〔 🚀 𝙎𝙏𝘼𝙍𝙏 𝙉𝙊𝙒 〕━━╯`;

  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 sᴛᴀʀᴛ ɴᴏᴡ', url: `https://t.me/${botUsername}?start=pair` }]
      ]
    }
  };

  if (replyToMessageId) {
    options.reply_to_message_id = replyToMessageId;
  }

  return bot.sendMessage(chatId, message, options);
};

// ========== START COMMAND ==========
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

  if (isGroup) {
    return sendGroupMessage(chatId, msg.message_id);
  }

  await bot.sendPhoto(
    chatId,
    "https://i.postimg.cc/QdkdQTF4/𝐱-𝐓𝐨𝐦-𝐌𝐢𝐧𝐢-20260720-105357.jpg",
    {
      caption: `🪀 *𝙏𝙝𝙚 𝑺𝒉𝒂𝒅𝒐𝒘 𝑴𝑫💀*\n\n╔════════════════════╗\n ⤷ /ᴘᴀɪʀ <ᴡᴀ_ɴᴜᴍʙᴇʀ>\n ⤷ /ᴜɴᴘᴀɪʀ <ᴡᴀ_ɴᴜᴍʙᴇʀ>\n╚════════════╝`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "👑 ᴏᴡɴᴇʀ", url: "https://t.me/shadowhacr" }]
        ]
      }
    }
  );
});

// ========== PAIR COMMAND ==========
bot.onText(/\/pair(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
  const text = match[1]?.trim();

  if (isGroup) {
    return sendGroupMessage(chatId, msg.message_id);
  }

  if (!text) {
    userStates.set(userId, { step: 'awaiting_number' });
    return bot.sendMessage(chatId,
      `🔐 *ᴘʟᴇᴀsᴇ sᴇɴᴅ ʏᴏᴜʀ ᴡʜᴀᴛsᴀᴘ ɴᴜᴍʙᴇʀ*\n\nᴇxᴀᴍᴘʟᴇ: /ᴘᴀɪʀ 880xxxxxxxxx\nᴏʀ ᴊᴜsᴛ ᴛʏᴘᴇ: 923xxxxxxxxx`,
      { parse_mode: 'Markdown' }
    );
  }

  if (/[a-z]/i.test(text)) {
    return bot.sendMessage(chatId, '❌ *ʟᴇᴛᴇʀs ᴀʀᴇ ɴᴏᴛ ᴀʟᴏᴡᴇᴅ.*\n\nᴘʟᴇᴀsᴇ sᴇɴᴅ ᴏɴʟʏ ɴᴜᴍʙᴇʀs.', { parse_mode: 'Markdown' });
  }

  if (!/^\d{7,15}$/.test(text)) {
    return bot.sendMessage(chatId, '❌ *ɪɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ.*\n\nᴘʟᴇᴀsᴇ sᴇɴᴅ ᴀ ᴠᴀʟɪᴅ ᴡʜᴀᴛsᴀᴘ ɴᴜᴍʙᴇʀ.\nᴇxᴀᴍᴘʟᴇ: 923xxxxxxxxx', { parse_mode: 'Markdown' });
  }

  if (text.startsWith('0')) {
    return bot.sendMessage(chatId, '❌ *ɴᴜᴍʙᴇʀs sᴛᴀʀᴛɪɴɢ ᴡɪᴛʜ 0 ᴀʀᴇ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ.*\n\nᴘʟᴇᴀsᴇ ɪɴᴄʟᴜᴅᴇ ᴄᴏᴜɴᴛʀʏ ᴄᴏᴅᴇ.', { parse_mode: 'Markdown' });
  }

  const countryCode = text.slice(0, 3);
  if (["252", "201"].includes(countryCode)) {
    return bot.sendMessage(chatId, '❌ *ɴᴜᴍʙᴇʀs ᴡɪᴛʜ ᴛʜɪs ᴄᴏᴜɴᴛʀʏ ᴄᴏᴅᴇ ᴀʀᴇ ɴᴏᴛ sᴜᴘᴏʀᴛᴇᴅ.*', { parse_mode: 'Markdown' });
  }

  const pairingFolder = path.join(__dirname, 'kingbadboitimewisher', 'pairing');
  if (!(await exists(pairingFolder))) {
    await fs.mkdir(pairingFolder, { recursive: true });
  }

  const files = await fs.readdir(pairingFolder);
  const pairedCount = files.filter(f => f.endsWith('@s.whatsapp.net')).length;

  if (pairedCount >= 1000) {
    return bot.sendMessage(chatId, '❌ *ᴘᴀɪʀɪɴɢ ʟɪᴍɪᴛ ʀᴇᴀᴄʜᴇᴅ.*\n\nᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.', { parse_mode: 'Markdown' });
  }

  userStates.delete(userId);

  try {
    const startpairing = require('./pair.js');
    const Xreturn = text + "@s.whatsapp.net";

    await bot.sendMessage(chatId, '⏳ *ɢᴇɴᴇʀᴀᴛɪɴɢ ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ...*\n\nᴘʟᴇᴀsᴇ ᴡᴀɪᴛ ᴀ ᴍᴏᴍᴇɴᴛ.', { parse_mode: 'Markdown' });

    await startpairing(Xreturn);
    await sleep(4000);

    const pairingFile = path.join(pairingFolder, 'pairing.json');
    const cu = await fs.readFile(pairingFile, 'utf-8');
    const cuObj = JSON.parse(cu);
    delete require.cache[require.resolve('./pair.js')];

    return bot.sendMessage(chatId,
      `🔗 *ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ ғᴏʀ ᴡʜᴀᴛsᴀᴘᴘ*\n\n` +
      `📝 *ᴄᴏᴅᴇ:* 👉 \`${cuObj.code}\` 👈\n\n` +
      `➡️ *ɪɴsᴛʀᴜᴄᴛɪᴏɴs:*\n` +
      `1. ᴏᴘᴇɴ ᴡʜᴀᴛsᴀᴘᴘ\n` +
      `2. ɢᴏ ᴛᴏ sᴇᴛɪɴɢs → ʟɪɴᴋᴇᴅ ᴅᴇᴠɪᴄᴇs\n` +
      `3. ᴛᴀᴘ "ʟɪɴᴋ ᴀ ᴅᴇᴠɪᴄᴇ"\n` +
      `4. ᴇɴᴛᴇʀ ᴛʜɪs ᴄᴏᴅᴇ\n` +
      `⚠️ *ᴄᴏᴅᴇ ᴇxᴘɪʀᴇs ɪɴ 2 ᴍɪɴᴜᴛᴇs*`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: `ᴘᴀɪʀɪɴɢ sʏsᴛᴇᴍ`, callback_data: `pairing_system` }]
          ]
        }
      }
    );

  } catch (error) {
    console.error('ᴘᴀɪʀ ᴄᴏᴍᴀɴᴅ ᴇʀᴏʀ:', error);
    bot.sendMessage(chatId, '❌ *ᴘᴀɪʀɪɴɢ sᴇʀᴠɪᴄᴇ ɪs ᴛᴇᴍᴘᴏʀᴀʀɪʟʏ ᴜɴᴀᴠᴀɪʟᴀʙʟᴇ.*\n\nᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.', { parse_mode: 'Markdown' });
  }
});

// ========== CALLBACK QUERY HANDLER ==========
bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;
  const chatId = msg.chat.id;

  if (data && data.startsWith('copy_code_')) {
    const code = data.replace('copy_code_', '');
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: `✅ ᴄᴏᴅᴇ ᴄᴏᴘɪᴇᴅ: ${code}`,
      show_alert: true
    });
    return;
  }
});

// ========== TEXT MESSAGE HANDLER ==========
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (msg.chat.type!== 'private') return;
  if (!text) return;
  if (text.startsWith('/')) return;

  const userState = userStates.get(userId);
  if (!userState || userState.step!== 'awaiting_number') return;

  const phoneRegex = /^\d{7,15}$/;
  if (!phoneRegex.test(text)) return;

  userStates.delete(userId);

  if (/[a-z]/i.test(text)) {
    return bot.sendMessage(chatId, '❌ ʟᴇᴛᴛᴇʀs ᴀʀᴇ ɴᴏᴛ ᴀʟᴏᴡᴇᴅ. sᴇɴᴅ ᴏɴʟʏ ɴᴜᴍʙᴇʀs.');
  }

  if (text.startsWith('0')) {
    return bot.sendMessage(chatId, '❌ ɴᴜᴍʙᴇʀs sᴛᴀʀᴛɪɴɢ ᴡɪᴛʜ 0 ᴀʀᴇ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ.');
  }

  const countryCode = text.slice(0, 3);
  if (["252", "201"].includes(countryCode)) {
    return bot.sendMessage(chatId, '❌ ɴᴜᴍʙᴇʀs ᴡɪᴛʜ ᴛʜɪs ᴄᴏᴜɴᴛʀʏ ᴄᴏᴅᴇ ᴀʀᴇ ɴᴏᴛ sᴜᴘᴏʀᴛᴇᴅ.');
  }

  const pairingFolder = path.join(__dirname, 'kingbadboitimewisher', 'pairing');
  if (!(await exists(pairingFolder))) {
    await fs.mkdir(pairingFolder, { recursive: true });
  }

  const files = await fs.readdir(pairingFolder);
  const pairedCount = files.filter(f => f.endsWith('@s.whatsapp.net')).length;

  if (pairedCount >= 1000) {
    return bot.sendMessage(chatId, '❌ ᴘᴀɪʀɪɴɢ ʟɪᴍɪᴛ ʀᴇᴀᴄʜᴇᴅ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
  }

  try {
    const startpairing = require('./pair.js');
    const Xreturn = text + "@s.whatsapp.net";

    await bot.sendMessage(chatId, '⏳ ɢᴇɴᴇʀᴀᴛɪɴɢ ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ...');

    await startpairing(Xreturn);
    await sleep(4000);

    const pairingFile = path.join(pairingFolder, 'pairing.json');
    const cu = await fs.readFile(pairingFile, 'utf-8');
    const cuObj = JSON.parse(cu);
    delete require.cache[require.resolve('./pair.js')];

    return bot.sendMessage(chatId,
      `🔗 *ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ*\n\n📝 ᴄᴏᴅᴇ: \`${cuObj.code}\`\n\n1. ᴏᴘᴇɴ ᴡʜᴀᴛsᴀᴘ\n2. sᴇᴛᴛɪɴɢs → ʟɪɴᴋᴇᴅ ᴅᴇᴠɪᴄᴇs\n3. ʟɪɴᴋ ᴀ ᴅᴇᴠɪᴄᴇ\n4. ᴇɴᴛᴇʀ ᴛʜɪs ᴄᴏᴅᴇ`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: `📋 ᴄᴏᴘʏ: ${cuObj.code}`, callback_data: `copy_code_${cuObj.code}` }]
          ]
        }
      }
    );

  } catch (error) {
    console.error('ᴘᴀɪʀɪɴɢ ᴇʀʀᴏʀ:', error);
    bot.sendMessage(chatId, '❌ ᴘᴀɪʀɪɴɢ ғᴀɪʟᴇᴅ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.');
  }
});

// ========== UNPAIR COMMAND ==========
bot.onText(/\/unpair(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1]?.trim();
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

  if (isGroup) {
    return bot.sendMessage(chatId, '❌ ᴘʟᴇᴀsᴇ ᴜsᴇ /ᴜɴᴘᴀɪʀ ɪɴ ᴍʏ ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛ.', { parse_mode: 'Markdown' });
  }

  try {
    if (!input) {
      return bot.sendMessage(chatId, 'ᴇxᴀᴍᴘʟᴇ: /ᴜɴᴘᴀɪʀ 923xxxxxxxxx', { parse_mode: 'Markdown' });
    }
    if (/[a-z]/i.test(input)) {
      return bot.sendMessage(chatId, 'ʟᴇᴛᴛᴇʀs ɴᴏᴛ ᴀʟᴏᴡᴇᴅ. ᴜsᴇ: /ᴜɴᴘᴀɪʀ 923xxxxxxxxx', { parse_mode: 'Markdown' });
    }
    if (!/^\d{7,15}$/.test(input)) {
      return bot.sendMessage(chatId, 'ɪɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ. ᴜsᴇ: /ᴜɴᴘᴀɪʀ 923xxxxxxxxx', { parse_mode: 'Markdown' });
    }
    if (input.startsWith('0')) {
      return bot.sendMessage(chatId, 'ɴᴜᴍʙᴇʀs sᴛᴀʀᴛɪɴɢ ᴡɪᴛʜ 0 ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ.');
    }

    const jidSuffix = `${input}`;
    const pairingPath = path.join(__dirname, 'kingbadboitimewisher', 'pairing');

    if (!(await exists(pairingPath))) {
      return bot.sendMessage(chatId, 'ɴᴏ ᴘᴀɪʀᴇᴅ ᴅᴇᴠɪᴄᴇs ғᴏᴜɴᴅ.');
    }

    const entries = await fs.readdir(pairingPath, { withFileTypes: true });
    const matched = entries.find(entry => entry.isDirectory() && entry.name.endsWith(jidSuffix));

    if (!matched) {
      return bot.sendMessage(chatId, `ɴᴏ ᴘᴀɪʀᴇᴅ ᴅᴇᴠɪᴄᴇ ғᴏᴜɴᴅ ғᴏʀ *${input}*`, { parse_mode: 'Markdown' });
    }

    const targetPath = path.join(pairingPath, matched.name);
    await fs.rm(targetPath, { recursive: true, force: true });

    return bot.sendMessage(chatId, `✅ ᴘᴀɪʀᴇᴅ ᴜsᴇʀ *${input}* ʜᴀs ʙᴇɴ ᴅᴇʟᴇᴛᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ`, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error('ᴜɴᴘᴀɪʀ ᴇʀᴏʀ:', err);
    bot.sendMessage(chatId, 'ғᴀɪʟᴇᴅ ᴛᴏ ᴅᴇʟᴇᴛᴇ ᴘᴀɪʀᴇᴅ ᴜsᴇʀ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ.');
  }
});

// ========== POLLING ERROR HANDLER ==========
bot.on('polling_error', (error) => {
  console.error('ᴘᴏʟʟɪɴɢ ᴇʀʀᴏʀ:', error);
});

// ========== BOT START ==========
(async () => {
  await loadAdminIDs();

  const restartCount = parseInt(process.env.RESTART_COUNT || 0);
  console.log(`ʀᴇsᴛᴀʀᴛ #${restartCount + 1}`);
  process.env.RESTART_COUNT = String(restartCount + 1);

  console.log('🤖 ᴛᴇʟᴇɢʀᴀᴍ ʙᴏᴛ ɪs ʀᴜɴɴɪɴɢ...');
  console.log('✅ ʙᴏᴛ ᴜsᴇʀɴᴀᴍᴇ: @ʙᴏᴛ_ʜᴏsᴛɪɴɢ_ᴠ1_ʙᴏᴛ');
  console.log('✅ ғᴇᴀᴛᴜʀᴇs: /ᴘᴀɪʀ, /ᴜɴᴘᴀɪʀ, /sᴛᴀʀᴛ');
})();

// ========== PROCESS HANDLERS ==========
process.on("uncaughtException", (err) => {
  console.error('ᴜɴᴄᴀᴜɢʜᴛ ᴇxᴄᴇᴘᴛɪᴏɴ:', err);
});
process.on("unhandledRejection", (err) => {
  console.error('ᴜɴʜᴀɴᴅʟᴇᴅ ʀᴇᴊᴇᴄᴛɪᴏɴ:', err);
});
process.removeAllListeners("warning");
process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('message', (msg) => {
  if (msg === 'shutdown') gracefulShutdown('PM2_SHUTDOWN');
});
