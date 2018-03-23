global.__base = __dirname + '/';
const electron = require('electron');
const fs = require('fs');
const url = require('url');
const path = require('path');
const {app, BrowserWindow, ipcMain, dialog} = electron;
const sharp = require('sharp');
const AutoModel = require(__base + 'js/model/autoModel');
const ImagesContainer = require(__base + 'js/utility/imagesContainer');
const ImagesProcessor = require(__base + 'js/utility/imagesProcessor');
const RENDERER_REQ = {
  ADD_IMG: 'REQ:ADD_IMG',
  DEL_IMG: 'REQ:DEL_IMG',
  GO: {
    REQUEST_TO_GO:'REQ:GO:REQUEST_TO_GO',
    CONFIRMED: 'REQ:GO:CONFIRMED',
    ABORT: 'REPLY:GO:ABORT'},
  CHANGE_SETTING: 'REQ:CHANGE_SETTING'};
const MAIN_REPLY = {
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
let setting = {compressing: false, dateChanging: false, pickedDate: undefined};
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
});

app.on('before-quit', function(e) {
  console.log('app quits');
  //e.preventDefault();
  ImagesProcessor.deleteModifiedImages();
  //autoModel.quitChrome(); bug occurs!!!!
});

ipcMain.on(RENDERER_REQ.ADD_IMG, function(e, packet) {
  (async function() {
    //ImagesProcessor.compressImage(packet.imgPath);
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
        //await imagesContainer.tab_inspect[tr_n].modify(setting);
        imgSetsForInspect.push(imagesContainer.tab_inspect[tr_n]);
      }
      if (imagesContainer.tab_clean_up[tr_n].isPaired()) {
        //await imagesContainer.tab_clean_up[tr_n].modify(setting);
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
  //autoProcess(packet.id, packet.password);
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
  }
  console.log(setting);
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
    //await upload(imgSetsForInspect, isForInspect);
    //await upload(imgSetsForCleanUp, isForCleanUp);

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

/* async function autoProcess(id, password) {
  let imgSetsForInspect = [];
  let imgSetsForCleanUp = [];
  for (tr_n in imagesContainer.tab_inspect) {
    if (imagesContainer.tab_inspect[tr_n].isPaired()) {
      await imagesContainer.tab_inspect[tr_n].modify(setting);
      imgSetsForInspect.push(imagesContainer.tab_inspect[tr_n]);
    }
    if (imagesContainer.tab_clean_up[tr_n].isPaired()) {
      await imagesContainer.tab_clean_up[tr_n].modify(setting);
      imgSetsForCleanUp.push(imagesContainer.tab_clean_up[tr_n]);
    }
  }
  for (let i = 0; i < imgSetsForInspect.length; i++) {
    console.log(imgSetsForInspect[i]);
  }
  for (let i = 0; i < imgSetsForCleanUp.length; i++) {
    console.log(imgSetsForCleanUp[i]);
  }
  let isForCleanUp = true;
  let isForInspect = !isForCleanUp;
  if (imgSetsForInspect.length !== 0 || imgSetsForCleanUp.length !== 0) {
    try {
      let autoModel = new AutoModel();
      await autoModel.initChromeDriver();
      await autoModel.login(id, password);
      for (let i = 0; i < imgSetsForInspect.length; i++) {
        await autoModel.renewRoute(isForInspect);
        await autoModel.publishJournal(imgSetsForInspect[i], isForInspect);
      }
      for (let i = 0; i < imgSetsForCleanUp.length; i++) {
        await autoModel.renewRoute(isForCleanUp);
        await autoModel.publishJournal(imgSetsForCleanUp[i], isForCleanUp);
      }
      console.log('============ Finished ============');
    } catch (err) {
      console.log('============ MAIN CATCHED! ============');
      console.log('Discription: ' + err.discription);
      console.log('Type: ' + err.type);
      console.log('Origin: ' + err.errOrigin);
      console.log('OriginalErr: ' + err.originalErr);
    }
  } else {
    console.log('There is no image set can be uploaded');
  }
} */

async function testAllUsers() {
  let ids = ['1002101001', '1002101037', '1002101044', '1002101019', '1002101046', 
              '1002101041', '1002101054', '1002101040', '1002101049', '1002101033',
                '1002101029', '1002101006', '1002101035', '1002101013', '1002101027',
                  '1002101021', '1002101016', '1002101048', '1002101022', '1002101020',
                    '1002101032', '1002101017', '1002101042', '1002101045', '1002101028',
                      '1002101050', '1002101047', '1002101039', '1002101023', '1002101055',
                        '1002101038', '1002101030', '1002101034', '1002101004', '1002101036',
                          '1002101043', '1002101003', '1002101007', '1002101010', '1002101053',
                            '1002101018', '1002101025', '1002101051', '1002101052', '1002101015']
  for (let i = 0; i < ids.length; i++) {
    //console.log('Now is testing id: ' + ids[i]);
    let autoModel = new AutoModel();
    await autoModel.login(ids[i], 'east' + ids[i]);
    await autoModel.renewRoute(isForCleanUp);
    let newTitle = await autoModel.renewRoute(isForInspect);
    await autoModel.quitChrome();
  }
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
//  imagesContainer[packet.tabID][packet.tr_n][packet.imgType] = imgPath;
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
  packet.finished = indicatorTitle === '上傳完畢';
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
    case MAIN_REPLY.ADD_IMG.REJECTED:
    case MAIN_REPLY.DEL_IMG:
    case MAIN_REPLY.GO.PLEASE_CONFIRM:
    case MAIN_REPLY.GO.REJECTED:
      mainWindow.webContents.send(replyType, packet);
      break;
    case MAIN_REPLY.GO.ERROR:
      mainWindow.webContents.send(replyType, packet);
      break;
  }
}