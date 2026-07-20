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

  console.log(`🛑 ʀᴇᴄᴇɪᴠᴇᴅ ${signal}. sʜᴜᴛɪɴɢ ᴅᴏᴡɴ ɢʀᴀᴄᴇғᴜʟʏ...`);
  bot.stopPolling();
  console.log('✅ ʙᴏᴛ sᴛᴏᴘᴇᴅ sᴜᴄᴇssғᴜʟʏ');
  process.exit(0);
};

const getCountryFlag = (code) => {
  const flags = {
    '880': '🇧🇩', '91': '🇮🇳', '92': '🇵🇰', '1': '🇺🇸', '44': '🇬🇧', '62': '🇮🇩'
  };
  return flags[code] || '🌍';
};

const getCountryName = (code) => {
  const countries = {
    '880': 'ʙᴅ', '91': 'ɪɴ', '92': 'ᴘᴋ', '1': 'ᴜs', '44': 'ɢʙ', '62': 'ɪᴅ'
  };
  return countries[code] || 'ᴜɴᴋɴᴏᴡɴ';
};

const sendGroupOnlyMessage = async (chatId) => {
  return bot.sendMessage(chatId,
    `🌸 𝖦𝗋𝗈𝗎𝗉 𝖮𝗇𝗅𝗒 𝖥𝖾𝖺𝗍𝗎𝗋𝖾

👉 𝖳𝗁𝗂𝗌 𝖼𝗈𝗆𝖺𝗇𝖽 𝗐𝗈𝗋𝗄𝗌 𝗈𝗇𝗅𝗒 𝗂𝗇 𝗍𝗁𝖾 𝗈𝖿𝗂𝖼𝗂𝖺𝗅 𝗀𝗋𝗈𝗎𝗉.
𝖢𝗅𝗂𝖼𝗄 𝖻𝖾𝗅𝗈𝗐 𝗍𝗈 𝗃𝗈𝗂𝗇 𝖺𝗇𝖽 𝗎𝗌𝖾 /pair 𝗍𝗁𝖾𝗋𝖾.
https://t.me/tomxbugvip`,
    { parse_mode: 'Markdown' }
  );
};

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

  if (!isGroup) {
    return sendGroupOnlyMessage(chatId);
  }

  await bot.sendPhoto(
    chatId,
    "https://i.postimg.cc/QdkdQTF4/𝐱-𝐓𝐨𝐦-𝐌𝐢𝐧𝐢-20260720-105357.jpg",
    {
      caption: `🪀 *𝐱-𝐓𝐨𝐦♡ 💗𝐌𝐢𝐧𝐢*\n\n╔════════════╗\n ⤷ /ᴘᴀɪʀ <ᴡᴀ_ɴᴜᴍʙᴇʀ>\n ⤷ /ᴜɴᴘᴀɪʀ <ᴡᴀ_ɴᴜᴍʙᴇʀ>\n╚════════════╝`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "👑 ᴏᴡɴᴇʀ", url: "https://t.me/majidulislamzihad" }]
        ]
      }
    }
  );
});

// ========== PAIR COMMAND - BOT CONNECTED BAD ==========
bot.onText(/\/pair(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
  const text = match[1]?.trim();

  if (!isGroup) {
    return sendGroupOnlyMessage(chatId);
  }

  if (!text) {
    userStates.set(userId, { step: 'awaiting_number' });
    return bot.sendMessage(chatId,
      `ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴘʜᴏɴᴇ ɴᴜᴍʙᴇʀ.
ᴇxᴀᴍᴘʟᴇ: /ᴘᴀɪʀ +8801791903810
"ɪɴᴄʟᴜᴅᴇ ʏᴏᴜʀ ᴄᴏᴜɴᴛʀʏ ᴄᴏᴅᴇ"`,
      { parse_mode: 'Markdown' }
    );
  }

  let cleanNumber = text.replace(/\D/g, '');

  if (!/^\d{7,15}$/.test(cleanNumber)) {
    return bot.sendMessage(chatId, '❌ *ɪɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ.*\n\nᴇxᴀᴍᴘʟᴇ: /ᴘᴀɪʀ +8801714426665', { parse_mode: 'Markdown' });
  }

  if (cleanNumber.startsWith('0')) {
    return bot.sendMessage(chatId, '❌ *ᴅᴏ ɴᴏᴛ sᴛᴀʀᴛ ᴡɪᴛʜ 0.*\n\nɪɴᴄʟᴜᴅᴇ ᴄᴏᴜɴᴛʀʏ ᴄᴏᴅᴇ ᴇ.ɢ: 8801xxxxxxxx', { parse_mode: 'Markdown' });
  }

  const countryCode = cleanNumber.slice(0, 3);
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
    const Xreturn = cleanNumber + "@s.whatsapp.net";

    await bot.sendMessage(chatId, '⏳ *ɢᴇɴᴇʀᴀᴛɪɴɢ ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ...*\n\nᴘʟᴇᴀsᴇ ᴡᴀɪᴛ ᴀ ᴍᴏᴍᴇɴᴛ.', { parse_mode: 'Markdown' });

    await startpairing(Xreturn);
    await sleep(4000);

    const pairingFile = path.join(pairingFolder, 'pairing.json');
    const cu = await fs.readFile(pairingFile, 'utf-8');
    const cuObj = JSON.parse(cu);
    delete require.cache[require.resolve('./pair.js')];

    const flag = getCountryFlag(countryCode);
    const country = getCountryName(countryCode);

    // SUDHU PAIR CODE READY - BOT CONNECTED BAD DISE
    return bot.sendMessage(chatId,
      `🔐 ᴘᴀɪʀ ᴄᴏᴅᴇ ʀᴇᴀᴅʏ
📱 ɴᴜᴍʙᴇʀ: ${cleanNumber}
🌐 ᴄᴏᴜɴᴛʀʏ: ${flag} ${country.toUpperCase()} (+${countryCode})

ᴛᴏᴍx-ᴍɪɴɪ

╭───〔🛡️ ᴄᴏᴅᴇ 〕───◆
│ \`${cuObj.code}\`
╰───◆

📌 ʜᴏᴡ ᴛᴏ ᴜsᴇ:
1. ᴡʜᴀᴛsᴀᴘ → sᴇᴛɪɴɢs → ʟɪɴᴋᴇᴅ ᴅᴇᴠɪᴄᴇs
2. ᴄʟɪᴄᴋ ʟɪɴᴋ ᴀ ᴅᴇᴠɪᴄᴇ → ᴇɴᴛᴇʀ ᴄᴏᴅᴇ
⏰ ᴄᴏᴅᴇ ᴇxᴘɪʀᴇs ɪɴ ~60 sᴇᴄᴏɴᴅs`,
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
    console.error('ᴘᴀɪʀ ᴄᴏᴍᴀɴᴅ ᴇʀᴏʀ:', error);
    bot.sendMessage(chatId, '❌ *ᴘᴀɪʀɪɴɢ sᴇʀᴠɪᴄᴇ ɪs ᴛᴇᴍᴘᴏʀᴀʀɪʟʏ ᴜɴᴀᴠᴀɪʟᴀʙʟᴇ.*\n\nᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.', { parse_mode: 'Markdown' });
  }
});

bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;
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

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (msg.chat.type === 'private') return;
  if (!text) return;
  if (text.startsWith('/')) return;

  const userState = userStates.get(userId);
  if (!userState || userState.step!== 'awaiting_number') return;

  const phoneRegex = /^\d{7,15}$/;
  const cleanNumber = text.replace(/\D/g, '');
  if (!phoneRegex.test(cleanNumber)) return;

  userStates.delete(userId);
  bot.sendMessage(chatId, 'ᴘʟᴇᴀsᴇ ᴜsᴇ /ᴘᴀɪʀ <ɴᴜᴍʙᴇʀ> ᴄᴏᴍᴀɴᴅ ɪɴsᴛᴇᴀᴅ');
});

bot.onText(/\/unpair(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1]?.trim();
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

  if (!isGroup) {
    return sendGroupOnlyMessage(chatId);
  }

  try {
    if (!input) {
      return bot.sendMessage(chatId, 'ᴇxᴀᴍᴘʟᴇ: /ᴜɴᴘᴀɪʀ 8801xxxxxxxxx', { parse_mode: 'Markdown' });
    }
    const cleanInput = input.replace(/\D/g, '');

    if (!/^\d{7,15}$/.test(cleanInput)) {
      return bot.sendMessage(chatId, 'ɪɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ. ᴜsᴇ: /ᴜɴᴘᴀɪʀ 8801xxxxxxxxx', { parse_mode: 'Markdown' });
    }

    const jidSuffix = `${cleanInput}`;
    const pairingPath = path.join(__dirname, 'kingbadboitimewisher', 'pairing');

    if (!(await exists(pairingPath))) {
      return bot.sendMessage(chatId, 'ɴᴏ ᴘᴀɪʀᴇᴅ ᴅᴇᴠɪᴄᴇs ғᴏᴜɴᴅ.');
    }

    const entries = await fs.readdir(pairingPath, { withFileTypes: true });
    const matched = entries.find(entry => entry.isDirectory() && entry.name.endsWith(jidSuffix));

    if (!matched) {
      return bot.sendMessage(chatId, `ɴᴏ ᴘᴀɪʀᴇᴅ ᴅᴇᴠɪᴄᴇ ғᴏᴜɴᴅ ғᴏʀ *${cleanInput}*`, { parse_mode: 'Markdown' });
    }

    const targetPath = path.join(pairingPath, matched.name);
    await fs.rm(targetPath, { recursive: true, force: true });

    return bot.sendMessage(chatId, `✅ ᴘᴀɪʀᴇᴅ ᴜsᴇʀ *${cleanInput}* ʜᴀs ʙᴇɴ ᴅᴇʟᴇᴛᴇᴅ sᴜᴄᴇssғᴜʟʏ`, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error('ᴜɴᴘᴀɪʀ ᴇʀᴏʀ:', err);
    bot.sendMessage(chatId, 'ғᴀɪʟᴇᴅ ᴛᴏ ᴅᴇʟᴇᴛᴇ ᴘᴀɪʀᴇᴅ ᴜsᴇʀ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ.');
  }
});

bot.on('polling_error', (error) => {
  console.error('ᴘᴏʟɪɴɢ ᴇʀᴏʀ:', error);
});

(async () => {
  await loadAdminIDs();

  const restartCount = parseInt(process.env.RESTART_COUNT || 0);
  console.log(`ʀᴇsᴛᴀʀᴛ #${restartCount + 1}`);
  process.env.RESTART_COUNT = String(restartCount + 1);

  console.log('🤖 ᴛᴇʟᴇɢʀᴀᴍ ʙᴏᴛ ɪs ʀᴜɴɪɴɢ...');
  console.log('✅ ʙᴏᴛ ᴜsᴇʀɴᴀᴍᴇ: @ʙᴏᴛ_ʜᴏsᴛɪɴɢ_ᴠ1_ʙᴏᴛ');
  console.log('✅ ғᴇᴀᴛᴜʀᴇs: /ᴘᴀɪʀ, /ᴜɴᴘᴀɪʀ, /sᴛᴀʀᴛ - ɢʀᴏᴜᴘ ᴏɴʟʏ');
})();

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
