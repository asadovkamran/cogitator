const {app, BrowserWindow, globalShortcut} = require('electron');
const { glob } = require('original-fs');
const path = require('path');

const BOOT_DELAY_MS = 0;
const START_AT_LOGIN = false;

let win;

function createWindow() {
    win = new BrowserWindow({
        fullscreen: true,
        frame: false,
        backgroundColor: '#030b06',
        icon: path.join(__dirname, 'assets', 'emblem.png'),
        webPreferences: {
            webSecurity: false,
            autoplayPolicy: 'no-user-gesture-required'
        }
    });

    win.loadFile('index.html');

    win.once('ready-to-show', () => {
        win.show();
        win.moveTop();
        win.focus();
    })

    setTimeout(() => {
        if (win) {win.moveTop(); win.focus();}
    }, 5000);

    setTimeout(() => {
        if (win) {win.moveTop(); win.focus();}
    }, 12000);

    globalShortcut.register('CommandOrControl+Shift+X', () => {
        app.quit();
    });
}

app.whenReady().then(() => {
    if (START_AT_LOGIN) {
        app.setLoginItemSettings({openAtLogin: true});
    }

    setTimeout(createWindow, BOOT_DELAY_MS);
});

app.on('window-all-closed', () => {
    app.quit();
})