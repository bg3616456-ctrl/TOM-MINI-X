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
const STYLISH_NAME = "𝐱-𝐓𝐨𝐦♡ 💗𝐌𝐢𝐧𝐢";
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

            // ========== VCARD SYSTEM ==========
            // The main vCard wrapper is in pair.js on the actual WhatsApp socket.
            // This adds a secondary hook on global.conn for any other message paths.
            setTimeout(async () => {
                try {
                    // Find the actual socket instance
                    const sock = global.conn || global.badboiConnect || global.sock;
                    if (sock && typeof sock.sendMessage === 'function') {
                        const origSend = sock.sendMessage.bind(sock);
                        sock.sendMessage = async (jid, content, options = {}) => {
                            try {
                                let msg = content;
                                if (typeof msg === 'string' && msg.trim()) msg = { text: msg };
                                if (msg && typeof msg === 'object' && (msg.text || msg.image || msg.video || msg.document || msg.audio)) {
                                    msg.contextInfo = {
                                        ...(msg.contextInfo || {}),
                                        stanzaId: msg.contextInfo?.stanzaId || ('VC_' + Date.now()),
                                        participant: msg.contextInfo?.participant || '0@s.whatsapp.net',
                                        quotedMessage: {
                                            contactMessage: {
                                                displayName: STYLISH_NAME,
                                                vcard: VCARD_CACHE,
                                                jpegThumbnail: await getBuffer(BOT_PIC).catch(() => undefined)
                                            }
                                        }
                                    };
                                }
                                return origSend(jid, msg, options);
                            } catch(e) { return origSend(jid, content, options); }
                        };
                        console.log(chalk.green('✅ Vcard system ACTIVE on global socket'));
                    } else {
                        console.log(chalk.green('✅ Vcard system is ACTIVE (handled in pair.js)'));
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
