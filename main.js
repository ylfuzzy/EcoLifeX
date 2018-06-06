global.__base = __dirname + '/';
const electron = require('electron');
const fs = require('fs');
const url = require('url');
const path = require('path');
const {exec} = require('child_process');
const sharp = require('sharp');
const AutoModel = require(path.normalize(__base + 'js/model/autoModel'));
const ImagesContainer = require(path.normalize(__base + 'js/utility/imagesContainer'));
const ImagesProcessor = require(path.normalize(__base + 'js/utility/imagesProcessor'));
const {app, BrowserWindow, ipcMain, dialog} = electron;
const {autoUpdater, CancellationToken} = require('electron-updater');
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';
const PRIMARY_SOURCE = {provider: 'generic', url:'https://bartzutow.xyz:5678/latest/', channel: 'latest'};
const REDUNDANT_SOURCE = {provider: 'github', owner: 'ylfuzzy', repo: 'EcoLifeX'};
const SETTING_JSON_PATH = path.normalize(app.getPath('userData') + '/setting.json');
const MODIFIED_IMGS_FOLDER_PATH = path.normalize(app.getPath('userData') + '/modifiedImgs/');
const RENDERER_REQ = {
  INIT_SETTING: 'REQ:INIT_SETTING',
  CHECK_UPDATE: {
    CHECK: 'REQ:CHECK_UPDATE:CHECK',
    CONFIRM: 'REQ:CHECK_UPDATE:CONFIRM',
    ABORT_DOWNLOAD: 'REQ:CHECK_UPDATE:ABORT_DOWNLOAD'},
  ADD_IMG: 'REQ:ADD_IMG',
  DEL_IMG: 'REQ:DEL_IMG',
  GO: {
    REQUEST_TO_GO:'REQ:GO:REQUEST_TO_GO',
    CONFIRMED: 'REQ:GO:CONFIRMED',
    ABORT: 'REPLY:GO:ABORT'},
  CHANGE_SETTING: 'REQ:CHANGE_SETTING'};
const MAIN_REPLY = {
  INIT_SETTING: 'REPLY:INIT_SETTING',
  CHECK_UPDATE: {
    CHECK: 'REPLY:CHECK_UPDATE:CHECK',
    SWITCH_SOURCE: 'REPLY:CHECK_UPDATE:SWITCH_SOURCE',
    NOT_AVAILABLE: 'REPLY:CHECK_UPDATE:NOT_AVAILABLE'
  },
  ADD_IMG: {
    ACCEPTED: 'REPLY:ADD_IMG:ACCEPTED',
    REJECTED: 'REPLY:ADD_IMG:REJECTED'},
  DEL_IMG: 'REPLY:DEL_IMG',
  GO: {
    PLEASE_CONFIRM: 'REPLY:GO:PLEASE_CONFIRM',
    REJECTED: 'REPLY:GO:REJECTED',
    UPDATE_AUTOPROCESS_INFO: 'REPLY:GO:UPDATE_AUTOPROCESS_INFO',
    ERROR: 'REPLY:GO:ERROR'}
};

let mainWindow;
let imagesContainer = new ImagesContainer();
let setting = {compressing: false, dateChanging: false, pickedDate: undefined, autoUpdating: false};
let cancellationToken;
let updateCheckTriggeredByUser;
let updateTriggered = false
let downloadAbortByUser;
let updateFromPrimarySource;

// Save user setting
function saveSetting() {
  let settingToSave = {compressing: setting.compressing, dateChanging: setting.dateChanging, autoUpdating: setting.autoUpdating};
  let data = JSON.stringify(settingToSave, null, 2);
  fs.writeFileSync(SETTING_JSON_PATH, data);
}

// Listen for app to be ready
app.on('ready', function() {
  // Create new window
  mainWindow = new BrowserWindow({});

  // Load html into window
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'mainWindow.html'),
    protocol: 'file',
    slashes: true
  }));

  mainWindow.on('closed', function() {
    console.log('app quit');
    app.quit();
  });

  // Create modifiedImgs folder if necessary
  if (!fs.existsSync(MODIFIED_IMGS_FOLDER_PATH)){
    fs.mkdirSync(MODIFIED_IMGS_FOLDER_PATH);
  }
});

app.on('before-quit', function(e) {
  console.log('app is going to quit');
  //e.preventDefault();
  ImagesProcessor.deleteModifiedImages();
  let cmd_killChromeDriverExe = 'taskkill /im chromedriver.exe /f';
  exec(cmd_killChromeDriverExe, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
  });
  if (!updateTriggered) {
    saveSetting();
  }
});

ipcMain.on(RENDERER_REQ.INIT_SETTING, function() {
  // Load setting from setting.json
  console.log('SETTING_JSON_PATH: ', SETTING_JSON_PATH);
  //let settingFilePath = __base + 'setting.json';
  fs.readFile(SETTING_JSON_PATH, function(err, rawSettingContent) {
    let packet = {compressing: false, dateChanging: false, autoUpdating: false, version: app.getVersion()};
    if (err) {
      // setting.json doesn't exist, using default setting (turn on all options)
      packet.compressing = true;
      packet.dateChanging = true;
      packet.autoUpdating = true;
    } else {
      try {
        // setting.json exists
        let settingJson = JSON.parse(rawSettingContent);
        packet.compressing = settingJson.compressing
        packet.dateChanging = settingJson.dateChanging
        packet.autoUpdating = settingJson.autoUpdating
      } catch (contentErr) {
        console.log(contentErr);
        packet.compressing = true;
        packet.dateChanging = true;
        packet.autoUpdating = true;
      }
    }
    if (packet.autoUpdating) {
      updateCheckTriggeredByUser = false;
      updateFromPrimarySource = true;
      autoUpdater.setFeedURL(PRIMARY_SOURCE);
      autoUpdater.checkForUpdates();
      console.log('auto check update');
    }
    console.log('current version: ', packet.version);
    replyRendererReq(MAIN_REPLY.INIT_SETTING, packet);
  });
});

ipcMain.on(RENDERER_REQ.CHECK_UPDATE.CHECK, function(e, packet) {
  sourceMesg = ''
  if (packet.updateFromPrimarySource) {
    // Updating from primary source means it's running for the first time.
    // Therefore some vars need to be initalized.
    updateCheckTriggeredByUser = true;
    downloadAbortByUser = false;
    updateFromPrimarySource = true;
    autoUpdater.setFeedURL(PRIMARY_SOURCE);
    sourceMesg = 'check update from Bartzutow';
  } else {
    updateFromPrimarySource = false;
    autoUpdater.setFeedURL(REDUNDANT_SOURCE);
    sourceMesg = 'check update from Github';
  }
  autoUpdater.checkForUpdates();
  console.log(sourceMesg);
});

ipcMain.on(RENDERER_REQ.CHECK_UPDATE.CONFIRM, function(e, packet) {
  let packetToReply = {title: '處理中...', showCancelBtn: false, showConfirmBtn: false, showCircle: true, showProgress: false};
  replyRendererReq(MAIN_REPLY.CHECK_UPDATE.CHECK, packetToReply);
  switch (packet.type) {
    case 'download':
      cancellationToken = new CancellationToken();
      autoUpdater.downloadUpdate(cancellationToken);
      break;
    case 'update':
      updateTriggered = true;
      saveSetting();
      autoUpdater.quitAndInstall(false, false);
      console.log('quit and update');
      break;
  } 
});

ipcMain.on(RENDERER_REQ.CHECK_UPDATE.ABORT_DOWNLOAD, function() {
  downloadAbortByUser = true;
  cancellationToken.cancel();
});

ipcMain.on(RENDERER_REQ.ADD_IMG, function(e, packet) {
  (async function() {
    let replyType;
    let imgInfo = await getImageValidity(packet);
    if (imgInfo.isValid) {
      packet.dateTimeOriginal = imgInfo.dateTimeOriginal;
      replyType = MAIN_REPLY.ADD_IMG.ACCEPTED;
      updateImagesContainer(replyType, packet);
    } else {
      console.log(imgInfo.error);
      packet.rejectedReason = imgInfo.error;
      replyType = MAIN_REPLY.ADD_IMG.REJECTED;
    }
    replyRendererReq(replyType, packet);
  })();
});

ipcMain.on(RENDERER_REQ.DEL_IMG, function(e, packet) {
  console.log('main received del request');
  // Delete imgPath
  updateImagesContainer(MAIN_REPLY.DEL_IMG, packet);
  replyRendererReq(MAIN_REPLY.DEL_IMG, packet);
});

let userInfo = {};
let imgSetsForInspect = [];
let imgSetsForCleanUp = [];
ipcMain.on(RENDERER_REQ.GO.REQUEST_TO_GO, function(e, packet) {
  imgSetsForInspect = [];
  imgSetsForCleanUp = [];
  let replyType;
  let userInfoIsValid = (packet.id !== '' && packet.password !== '');
  if (userInfoIsValid) {
    userInfo.id = packet.id;
    userInfo.password = packet.password;
    for (tr_n in imagesContainer.tab_inspect) {
      if (imagesContainer.tab_inspect[tr_n].isPaired()) {
        imgSetsForInspect.push(imagesContainer.tab_inspect[tr_n]);
      }
      if (imagesContainer.tab_clean_up[tr_n].isPaired()) {
        imgSetsForCleanUp.push(imagesContainer.tab_clean_up[tr_n]);
      }
    }
    if (imgSetsForInspect.length !== 0 || imgSetsForCleanUp.length !== 0) {
      replyType = MAIN_REPLY.GO.PLEASE_CONFIRM;
      packet.alertContent = getConfirmMessage();
    } else {
      console.log('else');
      replyType = MAIN_REPLY.GO.REJECTED;
      packet.alertTitle = '錯誤';
      packet.alertContent = '沒有照片可以上傳';
    }
  } else {
    replyType = replyType = MAIN_REPLY.GO.REJECTED;
    packet.alertTitle = '錯誤';
    packet.alertContent = '請填入帳號與密碼';
  }
  console.log('replyType: ' + replyType);
  replyRendererReq(replyType, packet)
});

ipcMain.on(RENDERER_REQ.GO.CONFIRMED, function(e) {
  console.log('auto uploading process begins');
  console.log('user id: ' + userInfo.id);
  console.log('user password: ' + userInfo.password);
  console.log('imgSets to be uploaded:');
  console.log('for inspect: ');
  console.log(imgSetsForInspect);
  console.log('for cleanUp: ');
  console.log(imgSetsForCleanUp);
  autoProcess();
});

ipcMain.on(RENDERER_REQ.GO.ABORT, function(e) {
  (async function() {
    console.log('try to quit chrome!');
    abortedByUser = true;
    await autoModel.quitChrome();
  })();
});

ipcMain.on(RENDERER_REQ.CHANGE_SETTING, function(e, packet) {
  switch (packet.setting) {
    case 'compressing':
      setting.compressing = packet.option;
      break;
    case 'date_changing':
      setting.dateChanging = packet.option;
      if (typeof packet.pickedDate !== 'undefined') {
        setting.pickedDate = new Date(packet.pickedDate);
      }
      break;
    case 'auto_updating':
      setting.autoUpdating = packet.option;
      break;
  }
  console.log('SETTING CHANGED:\r\n', setting);
});

autoUpdater.on('checking-for-update', () => {
  if (updateCheckTriggeredByUser) {
    let packet = {title: '檢查更新中...', showCancelBtn: false, showConfirmBtn: false, showCircle: true, showProgress: false};
    replyRendererReq(MAIN_REPLY.CHECK_UPDATE.CHECK, packet);
    console.log('Checking for update...');
  }
});
autoUpdater.on('update-available', (info) => {
  let packet = {title: '有可用更新，是否立即下載？', showCancelBtn: true, showAbortBtn: false, showConfirmBtn: true, showCircle: false, showProgress: false, type: 'download'};
  replyRendererReq(MAIN_REPLY.CHECK_UPDATE.CHECK, packet);
  console.log('Update available.', info);
});
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  let percent = Math.floor(progressObj.percent).toString() + '%';
  let packet = {title: '正在下載更新', showCancelBtn: false, showAbortBtn: true, showConfirmBtn: false, showCircle: false, showProgress: true, progressPercent: percent};
  replyRendererReq(MAIN_REPLY.CHECK_UPDATE.CHECK, packet);
  console.log(log_message);
});
autoUpdater.on('update-downloaded', (info) => {
  let packet = {title: '下載完畢，是否立即更新？', showCancelBtn: true, showAbortBtn: false, showConfirmBtn: true, showCircle: false, showProgress: true, progressPercent: '100%', type: 'update'};
  replyRendererReq(MAIN_REPLY.CHECK_UPDATE.CHECK, packet);
  console.log('Update downloaded');
});
autoUpdater.on('update-not-available', (info) => {
  if (updateCheckTriggeredByUser) {
    let packet = {title: '沒有可用更新', showCancelBtn: true, showAbortBtn: false, showConfirmBtn: false, showCircle: false, showProgress: false};
    replyRendererReq(MAIN_REPLY.CHECK_UPDATE.CHECK, packet);
    console.log('Update not available.', info);
  }
});
autoUpdater.on('error', (err) => {
  if (!downloadAbortByUser) {
    if (updateFromPrimarySource) {
      console.log('TRY SWITCHING UPDATE SERVER TO GITHUB');
      let packet = {};
      replyRendererReq(MAIN_REPLY.CHECK_UPDATE.SWITCH_SOURCE, packet);
    } else {
      let packet = {title: '檢查更新發生錯誤！', showCancelBtn: true, showAbortBtn: false, showConfirmBtn: false, showCircle: false, showProgress: false};
      replyRendererReq(MAIN_REPLY.CHECK_UPDATE.CHECK, packet);
      
    }
  } else {
    console.log('DOWNLOAD PROCESS ABORTED BY USER');
  }
  console.log('Error in auto-updater: ' + err);
  /* if (updateFromPrimarySource) {
    if (!downloadAbortByUser) {
      console.log('TRY SWITCHING UPDATE SERVER TO GITHUB');
      let packet = {title: '無法從Bartzutow更新，嘗試從Github更新...', switchToRedundantSource: true, showCancelBtn: false, showConfirmBtn: false, showCircle: true, showProgress: false};
      replyRendererReq(MAIN_REPLY.CHECK_UPDATE.CHECK, packet);
      //autoUpdater.checkForUpdates();
    }
  } else {
    if (!downloadAbortByUser) {
      let packet = {title: '檢查更新發生錯誤！', showCancelBtn: true, showAbortBtn: false, showConfirmBtn: false, showCircle: false, showProgress: false};
      replyRendererReq(MAIN_REPLY.CHECK_UPDATE.CHECK, packet);
      console.log('error~~~~~');
      console.log('Error in auto-updater. ' + err);
    }
  } */
});

async function getImageValidity(packet) {
  let newImgPath = packet.imgPath;
  let comparedImgDateTimeOriginal = undefined;
  let comparedImgType = undefined;
  if (!setting.dateChanging) {
    console.log('bababba');
    comparedImgType = (packet.imgType === 'dirty') ? 'clean' : 'dirty';
    comparedPacket = {tabID: packet.tabID, tr_n: packet.tr_n, imgType: comparedImgType};
    comparedImgDateTimeOriginal = imagesContainer.getImage(comparedPacket).dateTimeOriginal;
    console.log(imagesContainer.getImage(comparedPacket));
    console.log('check!!!: ' + comparedImgDateTimeOriginal); 
  }
  let comparedInfo = {dateChanging: setting.dateChanging, newImgPath: newImgPath, comparedImgDateTimeOriginal: comparedImgDateTimeOriginal, comparedImgType: comparedImgType};
  return await ImagesProcessor.isValidImage(comparedInfo);
}

function getConfirmMessage() {
  let msgForInspect = '巡檢照片：' + imgSetsForInspect.length.toString() + ' 組';
  let msgForCleanUp = '清理照片：' + imgSetsForCleanUp.length.toString() + ' 組';
  let megForImgSets = '<h5>即將上傳：</h5>' + msgForInspect + '<br />' + msgForCleanUp;
  let msgForCompressing = '壓縮照片：';
  msgForCompressing += setting.compressing ? '開啟' : '關閉';
  let msgForDateChanging = '調整照片日期：';
  msgForDateChanging += setting.dateChanging ? '開啟' : '關閉';
  let msgForSetting = '<h5>設定值：</h5>' + msgForCompressing + '<br />' + msgForDateChanging;
  if (setting.dateChanging) {
    let dateInfo = [setting.pickedDate.getUTCFullYear(), setting.pickedDate.getUTCMonth() + 1, setting.pickedDate.getUTCDate(),
      setting.pickedDate.getUTCHours(), setting.pickedDate.getUTCMinutes()];
    for (let i = 0; i < dateInfo.length; i++) {
      dateInfo[i] = dateInfo[i] < 10 ? '0' + dateInfo[i].toString() : dateInfo[i].toString();
    }
    let msgForDateInfo = dateInfo[0] + ' 年 ' + dateInfo[1] + ' 月 ' + dateInfo[2] + ' 日 ' + dateInfo[3] + ':' + dateInfo[4];
    msgForSetting += '<br />日期將調整到：' + msgForDateInfo;
  }
  let alertContent = '<p>' + megForImgSets + '</p> <p>' + msgForSetting + '</p>';
  return alertContent;
}

let indicatorTitle;
let preloaderInspect;
let preloaderCleanUp;
let autoModel;
let abortedByUser;
async function autoProcess() {
  initAutoProcessInfo();
  updateAutoProcessInfo(packAutoProcessInfo(indicatorTitle, preloaderInspect, preloaderCleanUp));
  for (let i = 0; i < imgSetsForInspect.length; i++) {
    await imgSetsForInspect[i].modify(setting);
    console.log(imgSetsForInspect[i]);
  }
  for (let i = 0; i < imgSetsForCleanUp.length; i++) {
    await imgSetsForCleanUp[i].modify(setting);
    console.log(imgSetsForCleanUp[i]);
  }
  try {
    autoModel = new AutoModel();
    await autoModel.initChromeDriver();

    // info updating
    indicatorTitle = '登入中...';
    updateAutoProcessInfo(packAutoProcessInfo(indicatorTitle, preloaderInspect, preloaderCleanUp));
    await autoModel.login(userInfo.id, userInfo.password);
    let isForCleanUp = true;
    let isForInspect = !isForCleanUp;
    await upload(imgSetsForInspect, isForInspect);
    await upload(imgSetsForCleanUp, isForCleanUp);

    // info update
    indicatorTitle = '上傳完畢';
    updateAutoProcessInfo(packAutoProcessInfo(indicatorTitle, preloaderInspect, preloaderCleanUp));
    console.log('============ Finished ============');
  } catch (err) {
    console.log('============ MAIN CATCHED! ============');
    console.log('Discription: ' + err.discription);
    console.log('Type: ' + err.type);
    console.log('Origin: ' + err.errOrigin);
    console.log('OriginalErr: ' + err.originalErr);
    if (typeof err.originalErr === 'undefined') {
      console.log(err);
      err.originalErr = err.toString();
    }
    if (!abortedByUser) {
      err.originalErr = err.originalErr.toString();
      let packet = {err: err};
      replyRendererReq(MAIN_REPLY.GO.ERROR, packet);
    }
  }
}

async function upload(imgSets, isForCleanUp) {
  try {
    let type = isForCleanUp ? '清理' : '巡檢';
    for (let i = 0; i < imgSets.length; i++) {
      // info update
      indicatorTitle = '正在更新' + type + '路線';
      updateAutoProcessInfo(packAutoProcessInfo(indicatorTitle, preloaderInspect, preloaderCleanUp));
      await autoModel.renewRoute(isForCleanUp);

      // info update
      indicatorTitle = '正在上傳' + type + '照片';
      let currentImgSet = i + 1;
      let fraction = getPreloaderFraction(currentImgSet, imgSets.length);
      if (isForCleanUp) {
        preloaderCleanUp.progressFraction = fraction;
      } else {
        preloaderInspect.progressFraction = fraction;
      }
      updateAutoProcessInfo(packAutoProcessInfo(indicatorTitle, preloaderInspect, preloaderCleanUp));
      await autoModel.publishJournal(imgSets[i], isForCleanUp);

      // info update
      let percent = getPreloaderPercent(currentImgSet, imgSets.length);
      if (isForCleanUp) {
        preloaderCleanUp.progressPercent = percent;
      } else {
        preloaderInspect.progressPercent = percent;
      }
      updateAutoProcessInfo(packAutoProcessInfo(indicatorTitle, preloaderInspect, preloaderCleanUp));
    }
  } catch (err) {
    throw err;
  }
}

function initAutoProcessInfo() {
  abortedByUser = false;
  indicatorTitle = '準備中...';
  let turnOff = imgSetsForInspect.length === 0 ? true : false;
  preloaderInspect = {turnOff: turnOff, progressPercent: '0%', progressFraction: '0/' + imgSetsForInspect.length.toString()};
  turnOff = imgSetsForCleanUp.length === 0 ? true : false;
  preloaderCleanUp = {turnOff: turnOff, progressPercent: '0%', progressFraction: '0/' + imgSetsForCleanUp.length.toString()};
}

function getPreloaderPercent(i, total) {
  return Math.floor(100 * i / total).toString() + '%';
}

function getPreloaderFraction(i, total) {
  return i.toString() + '/' + total.toString();
}

function updateImagesContainer(replyType, packet) {
  switch (replyType) {
    case MAIN_REPLY.ADD_IMG.ACCEPTED:
      imagesContainer.addSourceImage(packet);
      break;
    case MAIN_REPLY.DEL_IMG:
      imagesContainer.deleteImage(packet);
      break;
  }
  console.log(imagesContainer.getImage(packet));
}

function sendBase64(packet) {
  (async function() {
    let replyType;
    let withBase64Header = true;
    let imgBase64 = await ImagesProcessor.getBase64(packet.imgPath, withBase64Header);
    if (typeof imgBase64 !== 'undefined') {
      packet.imgBase64 = imgBase64;
      replyType = MAIN_REPLY.ADD_IMG.ACCEPTED;
    } else {
      imagesContainer.deleteImage(packet);
      packet.rejectedReason = 'Unable to generate base64';
      replyType = MAIN_REPLY.ADD_IMG.REJECTED;
    }
    mainWindow.webContents.send(replyType, packet);
  })();
}

function packAutoProcessInfo(indicatorTitle, preloaderInspect, preloaderCleanUp) {
  packet = {};
  packet.indicatorTitle = indicatorTitle;
  packet.preloaderInspect = preloaderInspect;
  packet.preloaderCleanUp = preloaderCleanUp;
  packet.finished = (indicatorTitle === '上傳完畢');
  console.log(packet);
  return packet
}

function updateAutoProcessInfo(packet) {
  mainWindow.webContents.send(MAIN_REPLY.GO.UPDATE_AUTOPROCESS_INFO, packet);
}

function replyRendererReq(replyType, packet) {
  switch (replyType) {
    case MAIN_REPLY.ADD_IMG.ACCEPTED:
      sendBase64(packet);
      break;
    case MAIN_REPLY.INIT_SETTING:
    case MAIN_REPLY.CHECK_UPDATE.CHECK:
    case MAIN_REPLY.CHECK_UPDATE.SWITCH_SOURCE:
    case MAIN_REPLY.ADD_IMG.REJECTED:
    case MAIN_REPLY.DEL_IMG:
    case MAIN_REPLY.GO.PLEASE_CONFIRM:
    case MAIN_REPLY.GO.REJECTED:
    case MAIN_REPLY.GO.ERROR:
      mainWindow.webContents.send(replyType, packet);
      break;
  }
}