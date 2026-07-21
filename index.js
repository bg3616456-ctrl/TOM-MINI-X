/**
   * Create By SHADOW OFFICIAL
   * Contact Me on 923271054080
*/

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');
const figlet = require('figlet');
const axios = require('axios'); // VCARD ER JONNO ADD

const AUTH_FILE = './auth.json';
const PAIRING_DIR = './kingbadboitimewisher/pairing/';
const startpairing = require('./pair');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ========== VCARD SETTINGS ==========
const LOCK_JID = "0@s.whatsapp.net";
const STYLISH_NAME = "—͞To፝֟ᴍ Ᏼꫝ֟፝ʙ𝚈";
const BOT_PIC = "https://i.postimg.cc/qRx0djGf/IMG-20260623-WA0000.jpg";
const VCARD_CACHE = `BEGIN:VCARD\nVERSION:3.0\nFN:${STYLISH_NAME}\nORG:WhatsApp ✔\nTITLE:• Status\nEND:VCARD`;

async function getBuffer(url) {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
    return res.data;
  } catch {
    return null;
  }
}
// ========== END ==========

const autoLoadPairs = async () => {
    console.log(chalk.cyan('🔄 Auto-loading all paired users...'));

    if (!fs.existsSync(PAIRING_DIR)) {
        console.log(chalk.red('❌ Pairing directory not found.'));
        return;
    }

    const pairedUsers = fs.readdirSync(PAIRING_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => name.endsWith('@s.whatsapp.net'));

    if (pairedUsers.length === 0) {
        console.log(chalk.yellow('ℹ️ No paired users found.'));
        return;
    }

    console.log(chalk.green(`✅ Found ${pairedUsers.length} paired users. Starting connections...`));
    console.log(chalk.blue('⏳ Waiting 4 seconds before starting connections...'));
    await delay(4000);

    for (let i = 0; i < pairedUsers.length; i++) {
        const userNumber = pairedUsers[i];

        try {
            console.log(chalk.blue(`🔄 Connecting user ${i + 1}/${pairedUsers.length}: ${userNumber}`));
            await startpairing(userNumber);
            console.log(chalk.green(`✅ Connected successfully: ${userNumber}`));

            if (i < pairedUsers.length - 1) {
                console.log(chalk.blue('⏳ Waiting 4 seconds before next connection...'));
                await delay(4000);
            }
        } catch (error) {
            console.log(chalk.red(`❌ Failed for ${userNumber}: ${error.message}`));

            if (i < pairedUsers.length - 1) {
                console.log(chalk.blue('⏳ Waiting 4 seconds before retry...'));
                await delay(4000);
            }
        }
    }

    console.log(chalk.green('✅ All paired users processed.'));
    console.log(chalk.blue('⏳ Waiting 4 seconds before continuing...'));
    await delay(4000);
};

const initializeBot = async () => {
    console.clear();
    console.log(chalk.cyan(figlet.textSync('SHADOW', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })));

    console.log(chalk.yellow('\n═══════════════'));
    console.log(chalk.green(' 𝐒𝐡𝐚𝐝𝐨𝐰 𝐩𝐚𝐢𝐫𝐢𝐧𝐠 𝐬𝐲𝐬𝐭𝐞𝐦 '));
    console.log(chalk.yellow('═══════════════\n'));

    await autoLoadPairs();
    launchBot();
};

function launchBot() {
    console.clear();
    console.log(chalk.green('🚀 Starting 𝐒ＨＡＤＯＷ system...\n'));

    let telegramLoaded = false;
    let whatsappLoaded = false;

    // Load Telegram bot (bot.js)
    const botPath = path.join(__dirname, 'bot.js');
    if (fs.existsSync(botPath)) {
        try {
            console.log(chalk.blue('📱 Loading Telegram pairing system...'));
            require('./bot');
            telegramLoaded = true;
            console.log(chalk.green('✅𝐒ＨＡＤＯＷ bot loaded successfully!'));
        } catch (error) {
            console.log(chalk.red('❌ Failed to load Telegram bot (bot.js):'));
            console.log(chalk.red(' Error:', error.message));
            console.log(chalk.yellow('⚠️ Continuing without Telegram bot...\n'));
        }
    } else {
        console.log(chalk.yellow('⚠️ bot.js not found, skipping Telegram bot...\n'));
    }

    // Load WhatsApp commands (drenox.js)
    const drenoxPath = path.join(__dirname, 'drenox.js');
    if (fs.existsSync(drenoxPath)) {
        try {
            console.log(chalk.blue('💬 Loading WhatsApp commands system...'));
            require('./drenox');
            whatsappLoaded = true;
            console.log(chalk.green('✅ WhatsApp commands loaded successfully!'));

            // ========== VCARD SYSTEM (UPDATED LIKE 1ST CODE) ==========
            setTimeout(async () => {
                try {
                    const drenoxModule = require('./drenox');
                    // Check if sock exists directly or inside another exported object/function
                    const sockInstance = drenoxModule.sock || global.conn || drenoxModule;

                    if (sockInstance && typeof sockInstance.sendMessage === 'function') {
                        const originalSend = sockInstance.sendMessage.bind(sockInstance);
                        
                          sockInstance.sendMessage = async (jid, content, options = {}) => {
                            try {
                                let isTextMsg = typeof content === 'string' && content.trim();
                                if (isTextMsg) content = { text: content };
                                else if (content?.text?.trim()) isTextMsg = true;

                                // vCard এবং থাম্বনেইল সঠিকভাবে যুক্ত করার নতুন ও নিরাপদ পদ্ধতি
                                if (isTextMsg || content.image || content.video || content.document || content.audio) {
                                    const thumb = await getBuffer(BOT_PIC);
                                    
                                    content.contextInfo = {
                                        ...(content.contextInfo || {}),
                                        externalAdReply: content.contextInfo?.externalAdReply || undefined,
                                        quotedMessage: {
                                            extendedTextMessage: {
                                                text: STYLISH_NAME
                                            },
                                            ...content.contextInfo?.quotedMessage
                                        }
                                    };
                                    
                                    // যদি vCard সরাসরি পিন বা কন্টাক্ট হিসেবে পাঠাতে চান
                                    options.quoted = {
                                        key: {
                                            remoteJid: jid,
                                            fromMe: false,
                                            id: "SHADOW_VCARD_" + Date.now(),
                                            participant: LOCK_JID
                                        },
                                        message: {
                                            contactMessage: {
                                                displayName: STYLISH_NAME,
                                                vcard: VCARD_CACHE,
                                                jpegThumbnail: thumb || undefined
                                            }
                                        }
                                    };
                                }
                            } catch (e) {
                                console.log('⚠️ Vcard Hook Error:', e.message);
                            }
                            return originalSend(jid, content, options);
                        };

                        console.log(chalk.green('✅ Vcard system activated for all commands (2nd code updated)'));
                    }
                } catch(e) {
                    console.log(chalk.red('❌ Vcard hook failed:', e.message));
                }
            }, 8000);
            // ========== END ==========

        } catch (error) {
            console.log(chalk.red('❌ Failed to load WhatsApp commands (drenox.js):'));
            console.log(chalk.red(' Error:', error.message));
            console.log(chalk.yellow('⚠️ Continuing without WhatsApp commands...\n'));
        }
    } else {
        console.log(chalk.yellow('⚠️ drenox.js not found, skipping WhatsApp commands...\n'));
    }

    // Summary
    console.log(chalk.cyan('\n═══════════════'));
    console.log(chalk.bold.white('𝐒ＨＡＤＯＷ BOT INITIALIZATION SUMMARY '));
    console.log(chalk.cyan('═══════════════════════'));
    console.log(telegramLoaded? chalk.green('✅𝐒ＨＡＤＯＷ тɛℓɛɢяαм вσт: Active') : chalk.red('❌𝐒ＨＡＤＯＷ тɛℓɛɢяαм вσт : Inactive'));
    console.log(whatsappLoaded? chalk.green('✅ WhatsApp Commands: Active') : chalk.red('❌ WhatsApp Commands: Inactive'));
    console.log(chalk.cyan('═══════════════\n'));

    if (!telegramLoaded &&!whatsappLoaded) {
        console.log(chalk.red('⚠️ Warning: No bot systems loaded! Check your files.\n'));
    } else {
        console.log(chalk.green('✅ 𝐒ＨＡＤＯＷ system is ready and running!\n'));
    }

    // Error handlers
    const ignoredErrors = [
        'Socket connection timeout',
        'EKEYTYPE',
        'item-not-found',
        'rate-overlimit',
        'Connection Closed',
        'Timed Out',
        'Value not found'
    ];

    process.on('unhandledRejection', (reason, promise) => {
        if (ignoredErrors.some(e => String(reason).includes(e))) return;
        console.log(chalk.red('\n⚠️ Unhandled Promise Rejection:'));
        console.log(chalk.yellow('Reason:'), reason);
    });

    process.on('uncaughtException', (error) => {
        if (ignoredErrors.some(e => String(error).includes(e))) return;
        console.log(chalk.red('\n❌ Uncaught Exception:'));
        console.log(chalk.yellow('Error:'), error.message);
        if (error.stack) {
            console.log(chalk.gray(error.stack));
        }
    });

    const originalConsoleError = console.error;
    console.error = function (message,...optionalParams) {
        if (typeof message === 'string' && ignoredErrors.some(e => message.includes(e))) {
            return;
        }
        originalConsoleError.apply(console, [message,...optionalParams]);
    };

    const originalStderrWrite = process.stderr.write;
    process.stderr.write = function (message, encoding, fd) {
        if (typeof message === 'string' && ignoredErrors.some(e => message.includes(e))) {
            return;
        }
        originalStderrWrite.apply(process.stderr, arguments);
    };

    console.log(chalk.blue('📊 Bot monitoring active...'));
    console.log(chalk.gray('Press Ctrl+C to stop the bot\n'));
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n⚠️ Shutting down gracefully...'));
    console.log(chalk.green('👋 Goodbye!'));
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n\n⚠️ Received termination signal...'));
    process.exit(0);
});

initializeBot().catch((error) => {
    console.log(chalk.red('\n❌ Fatal error during initialization:'));
    console.log(chalk.yellow('Error:'), error.message);
    if (error.stack) {
        console.log(chalk.gray(error.stack));
    }
    process.exit(1);
});
