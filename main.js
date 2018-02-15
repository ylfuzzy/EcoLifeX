global.__base = __dirname + '/';
const electron = require('electron');
const url = require('url');
const path = require('path');
const {app, BrowserWindow, ipcMain, dialog} = electron;
const sharp = require('sharp');
const AutoModel = require(__base + 'js/model/autoModel');
const ImagesContainer = require(__base + 'js/utility/imagesContainer');
const ImagesProcessor = require(__base + 'js/utility/imagesProcessor');
const RENDERER_REQ = {ADD_IMG: 'REQ:ADD_IMG', DEL_IMG: 'REQ:DEL_IMG', GO: 'REQ:GO',
  CHANGE_OPTION: 'REQ:CHANGE_OPTION'};
const MAIN_REPLY = {
  ADD_IMG: {
    ACCEPTED: 'REPLY:ADD_IMG:ACCEPTED',
    REJECTED: 'REPLY:ADD_IMG:REJECTED'},
  DEL_IMG: 'REPLY:DEL_IMG'
};

let mainWindow;
let imagesContainer = new ImagesContainer();
let options = {dateChanging: false, compressing: false};
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

app.on('quit', function() {
  console.log('app quits');
});

ipcMain.on(RENDERER_REQ.ADD_IMG, function(e, packet) {
  (async function() {
    //ImagesProcessor.compressImage(packet.imgPath);
    let replyType;
    if (!options.dateChanging) {
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
    } else {
      replyType = MAIN_REPLY.ADD_IMG.ACCEPTED;
      updateImagesContainer(replyType, packet);
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

ipcMain.on(RENDERER_REQ.GO, function(e) {
  autoProcess();
});

ipcMain.on(RENDERER_REQ.CHANGE_OPTION, function(e, packet) {
  switch (packet.option) {
    case 'compressing':
      options.compressing = packet.settingValue;
      break;
    case 'date_changing':
      options.dateChanging = packet.settingValue;
      break;
  }
  console.log(options);
});

/* ipcMain.on(RENDERER_REQ.OPTIONS.DATE_CHANGING, function(e, needsDateChanging) {
  options.needsDateChanging = needsDateChanging;
  console.log(options);
}); */

async function getImageValidity(packet) {
  let newImgPath = packet.imgPath;
  let comparedImgType = (packet.imgType === 'dirty') ? 'clean' : 'dirty';
  comparedPacket = {tabID: packet.tabID, tr_n: packet.tr_n, imgType: comparedImgType};
  let comparedImgDateTimeOriginal = imagesContainer.getImage(comparedPacket).dateTimeOriginal;
  console.log(imagesContainer.getImage(comparedPacket));
  console.log('check!!!: ' + comparedImgDateTimeOriginal);
  return await ImagesProcessor.isValidImage(newImgPath, comparedImgDateTimeOriginal);
}

async function autoProcess() {
  /* let autoModel = new AutoModel();
  await autoModel.login();
  await autoModel.deletePreviousDrafts(); */
  //await autoModel.renewRoute(false);
  let imgSetsForInspect = [];
  let imgSetsForCleanUp = [];
  for (tr_n in imagesContainer.tab_inspect) {
    if (imagesContainer.tab_inspect[tr_n].isPaired()) {
      //await ImagesProcessor.modifyImageSet(imagesContainer.tab_inspect[tr_n], options);
      await imagesContainer.tab_inspect[tr_n].modify(options);
      imgSetsForInspect.push(imagesContainer.tab_inspect[tr_n]);
    }
    if (imagesContainer.tab_clean_up[tr_n].isPaired()) {
      //await ImagesProcessor.modifyImageSet(imagesContainer.tab_inspect[tr_n], options);
      await imagesContainer.tab_clean_up[tr_n].modify(options);
      imgSetsForCleanUp.push(imagesContainer.tab_clean_up[tr_n]);
    }
  }
  for (let i = 0; i < imgSetsForInspect.length; i++) {
    console.log(imgSetsForInspect[i]);
  }
  for (let i = 0; i < imgSetsForCleanUp.length; i++) {
    console.log(imgSetsForCleanUp[i]);
  }
  /* let isForCleanUp = true;
  if (imgSetsForInspect.length !== 0 || imgSetsForCleanUp.length !== 0) {
    try {
      let autoModel = new AutoModel();
      //await autoModel.headlessTest();
      await autoModel.login();
      //await autoModel.renewRoute(isForCleanUp);
      for (let i = 0; i < imgSetsForInspect.length; i++) {
        await autoModel.publishJournal(imgSetsForInspect[i], !isForCleanUp);
      }
      for (let i = 0; i < imgSetsForCleanUp.length; i++) {
        await autoModel.publishJournal(imgSetsForCleanUp[i], isForCleanUp);
      }
      console.log('============ Finished ============');
    } catch (err) {
      console.log('============ MAIN CATCHED! ============');
      console.log('Stage: ' + err.stage);
      console.log('Origin: ' + err.errOrigin);
      console.log('Type: ' + err.type);
    }
  } else {
    console.log('There is no image set can be uploaded');
  } */
}

function updateImagesContainer(replyType, packet) {
  switch (replyType) {
    case MAIN_REPLY.ADD_IMG.ACCEPTED:
      imagesContainer.addImage(packet);
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

function replyRendererReq(replyType, packet) {
  switch (replyType) {
    case MAIN_REPLY.ADD_IMG.ACCEPTED:
      sendBase64(packet);
      break;
    case MAIN_REPLY.ADD_IMG.REJECTED:
    case MAIN_REPLY.DEL_IMG:
      mainWindow.webContents.send(replyType, packet);
      break;
  }
}