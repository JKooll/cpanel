const electron = require('electron')
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Notification = electron.Notification;
const dialog = electron.dialog;
const ClipboardManagerSigleton = require('./assets/js/clipboardmanager');
const Tock = require('tocktimer');
const log = require('electron-log');
const ElectronStore = require('electron-store');
const ipcMain = electron.ipcMain;
const DatabaseSingleton = require('./assets/js/database/database');
const config = require('./assets/js/config/app');
const prefs = new ElectronStore(config.get('app.preferences.store'));
const fs = require('fs');
const sizeOf = require('image-size');

// env settings
process.env.NODE_ENV = 'production';

let win;
// 窗口宽度和高度
let win_width = 800;
let win_height = 600;
let full_content_win_default_width = 600;
let full_content_win_default_height = 900;
const clipboardManager = ClipboardManagerSigleton.getInstance();
let database = new DatabaseSingleton.getInstance();

let MODEPAUSE = false;

// 将数据库记录移动到剪切板
function db2Clipboard (idx) {
    let contents = database.get(idx).content;
    clipboardManager.setClipboard(contents)
    log.info('< ' + contents[0].type + '...')
    notify('cPanel', 'Now in clipboard :', contents[0].content)
}

// 弹出通知
function notify (title, subtitle, body) {
    if (Notification.isSupported()) {
        if (prefs.get('Notifications', false) === true) {
            let notif = new Notification({
                title: title,
                subtitle: subtitle,
                body: contentextract(body),
                silent: true,
                icon: config.get('app.iconPath')
            })
            notif.show()
        }
    }
}

// 前端请求记录数据
ipcMain.on('request-data', function (event, arg) {
    event.returnValue = database
});

// 前端请求复制数据库记录到剪切板
ipcMain.on('request-copy', function (event, arg) {
    db2Clipboard(arg);
});

// 前端请求移除数据库记录
ipcMain.on('request-remove', function (event, arg) {
    database.delRecord(arg);
    updateDetailedView();
});

// 前端请求清空数据库记录
ipcMain.on('request-removeAll', function (event, arg) {
    clearDB();
    updateDetailedView();
    log.info('> (clear)');
    event.returnValue = database;
});

// 前端请求保存数据库内容
ipcMain.on('request-save', function(event, arg) {
    var path = dialog.showOpenDialog({ title: '将文件保存到', properties: ['openDirectory'] });
    let record = database.get(arg);
    
    for (let i = 0; i < record.content.length; i++) {
        let content = record.content[i];

        let type = content.type;

        if (type.indexOf('text') !== -1) {
            fs.writeFile(path + '/text.txt', content.content, function(err) {
                log.info(err);
            });
        } else if(type.indexOf('image') !== -1) {
            // 存储图片
            const base64Data = content.content.replace(/^data:image\/png;base64,/, "");
            fs.writeFile(path + '/image.png', base64Data, 'base64', function (err) {
                log.info(err);
            });
        }
    }
});

// 前端请求在新窗口显示完整记录
ipcMain.on('request-fullContent', function(event, arg) {
    if (!win) {
        return;
    }

    let record = database.records[arg];

    let content = record.content[0];

    if (content.type.substr(0, 5) == 'image') {
        log.debug(app.getPath('userData') + '/image.png');
        fs.writeFile(app.getPath('userData') + '/image.png', content.content, 'base64', function (err) {
            log.info(err);

            sizeOf(app.getPath('userData') + 'image.png', function (err, dimensions) {
                if (err) {
                    log.debuy(err);
                    return;
                }
    
                let image_width = dimensions.width;
                let image_height = dimensions.height;
                
                let full_content_win = new BrowserWindow({parent: win, width: image_width, height: image_height, center: true, webPreferences: {
                    nodeIntegration: true,
                }});
            
                full_content_win.loadFile('./assets/pages/full_content.html');
            
                if (config.app.debug) {
                    full_content_win.webContents.openDevTools();
                }
                
                full_content_win.webContents.on('did-finish-load', () => {
                    log.debug('send show content');
                    full_content_win.webContents.send('show-content', record);
                });
            
                full_content_win.on('closed', () => {
                    full_content_win = null;
                });
            
                full_content_win.show();
            });
        });          
    } else {
        let full_content_win = new BrowserWindow({width: full_content_win_default_width, height: full_content_win_default_height, webPreferences: {
            nodeIntegration: true,
        }});
    
        full_content_win.loadFile('./assets/pages/full_content.html');
    
        if (config.app.debug) {
            full_content_win.webContents.openDevTools();
        }
        
        full_content_win.webContents.on('did-finish-load', () => {
            log.debug('send show content');
            full_content_win.webContents.send('show-content', record);
        });
    
        full_content_win.on('closed', () => {
            full_content_win = null;
        });
    
        full_content_win.show();
    }
});

// 前端请求暂停获取剪切板内容
ipcMain.on('request-mode-pause-on', function(event, arg) {
    MODEPAUSE = true;
});

// 前端请求开始获取剪切板内容
ipcMain.on('request-mode-pause-off', function(event, arg) {
    MODEPAUSE = false;
});

// 清空数据库
function clearDB () {
    database.clear();
}

// 更新前端页面
function updateDetailedView() {
    if (win) {
        win.webContents.send('detailedview-update');
    }
}

// manage clipboard
function getClipboardCallback() {
    try {
        let cbcontent = clipboardManager.getFromClipboard();
        if (cbcontent.new && !MODEPAUSE){
            if (!clipboardManager.ignorenext){
                if (cbcontent.content.length > 0) {
                    log.debug('adding to database...')
                    database.addRecord(
                        clipboardManager.encode64(cbcontent.content),
                        'multi-value'
                    );

                    // update view
                    updateDetailedView();
                }
            } else {
                clipboardManager.ignorenext = false
            }
        }
    } catch (e) {
        log.error(e);
    }
}

function launchGetClipboard() {
    clipboardManager.init();
    var timer = new Tock({
        countdown: false,
        interval: 700,
        callback: getClipboardCallback
    });
    timer.start();
}

function createWindow() {
    win = new BrowserWindow({width: win_width, height: win_height, center: true, webPreferences: {
        nodeIntegration: true,
    }});

    win.loadFile('./assets/pages/index.html');

    if (config.app.debug) {
        win.webContents.openDevTools();
    }

    win.on('closed', () => {
        win = null;
    });
}

function initApp() {
    database.init(config.get('database'))
    log.info('database: ' + database.config.path)
    log.info('preferences: ' + prefs.path)

    launchGetClipboard();
    createWindow();
}

app.on('ready', initApp);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win == null) {
        createWindow();
    }
});