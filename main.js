const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const BOOT_DELAY_MS = 0;
const START_AT_LOGIN = false;
const SPIRIT_PORT = 11434;

const args = process.argv.slice(1);
const isSaver = args.some(a => a === '/s' || a === '/S');
const isDialog = args.some(a => a === '/p' || a === '/P' || a === '/c' || a === '/C');

if (isDialog) app.exit(0);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.exit(0);
}

let win = null;
let ollamaProc = null;

function findVendor() {
    const candidates = [
        path.join(__dirname, 'vendor'),
        path.join(path.dirname(process.execPath), 'vendor'),
        path.join(path.dirname(process.execPath), '..', 'vendor')
    ];
    return candidates.find(p =>
        fs.existsSync(path.join(p, 'ollama', 'ollama.exe')) &&
        fs.existsSync(path.join(p, 'models'))
    );
}

function startBundledOllama(vendor) {
    ollamaProc = spawn(path.join(vendor, 'ollama', 'ollama.exe'), ['serve'], {
        env: {
            ...process.env,
            OLLAMA_HOST: '127.0.0.1:' + SPIRIT_PORT,
            OLLAMA_MODELS: path.join(vendor, 'models'),
            OLLAMA_ORIGINS: '*'
        },

        stdio: ['ignore', 'ignore', 'pipe']
    });

    ollamaProc.on('error', (err) => {
        console.error('[machine-spirit] failed to spawn ollama:', err.message);
        ollamaProc = null;
    });

    ollamaProc.stderr.on('data', (chunk) => {
        console.error('[machine-spirit] ollama stderr:', chunk.toString().trim());
    });

    ollamaProc.on('exit', (code, signal) => {
        if (code !== 0 && code !== null) {
            console.error(`[machine-spirit] ollama exited early (code ${code}, signal ${signal})`);
        }
        ollamaProc = null;
    });
}

function createWindow() {
    win = new BrowserWindow({
        fullscreen: true,
        frame: false,
        backgroundColor: '#030b06',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            autoplayPolicy: 'no-user-gesture-required'
        }
    });

    const query = { spirit: 'http://127.0.0.1:' + SPIRIT_PORT + '/api/generate' };
    if (isSaver) query.saver = '1';
    win.loadFile('index.html', { query });

    win.once('ready-to-show', () => {
        win.show();
        win.moveTop();
        win.focus();
    });

    if (!isSaver) {
        setTimeout(() => { if (win) { win.moveTop(); win.focus(); } }, 5000);
        setTimeout(() => { if (win) { win.moveTop(); win.focus(); } }, 12000);
    }

    globalShortcut.register('CommandOrControl+Shift+X', () => app.quit());
}

app.whenReady().then(() => {
    const vendor = findVendor();
    if (vendor) {
        startBundledOllama(vendor);
    } else {
        console.error('[machine-spirit] vendor folder not found — running without a model backend.');
    }

    if (!isSaver && START_AT_LOGIN) {
        app.setLoginItemSettings({ openAtLogin: true });
    }

    setTimeout(createWindow, isSaver ? 500 : BOOT_DELAY_MS);
});

app.on('second-instance', () => {
    if (win) {
        if (win.isMinimized()) win.restore();
        win.moveTop();
        win.focus();
    }
});

app.on('window-all-closed', () => app.quit());
app.on('quit', () => { if (ollamaProc) ollamaProc.kill(); });