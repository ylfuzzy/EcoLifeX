global.__base = __dirname + '/';
const electron = require('electron');
const url = require('url');
const path = require('path');
const {app, BrowserWindow, ipcMain, dialog} = electron;
const sharp = require('sharp');
const AutoModel = require(__base + 'js/model/autoModel');
const ImagesContainer = require(__base + 'js/utility/imagesContainer');
const ImagesProcessor = require(__base + 'js/utility/imagesProcessor');
const RENDERER_REQ = {ADD_IMG: 'REQ:ADD_IMG', DEL_IMG: 'REQ:DEL_IMG', GO: 'REQ:GO'};
const MAIN_REPLY = {
  ADD_IMG: {
    ACCEPTED: 'REPLY:ADD_IMG:ACCEPTED',
    DENIED: 'REPLY:ADD_IMG:DENIED'
    },
  DEL_IMG: 'REPLY:DEL_IMG'
};

let mainWindow;
let imagesContainer = new ImagesContainer();

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

ipcMain.on(RENDERER_REQ.ADD_IMG, function(e, packet) {
  (async function() {
    let imgInfo = await getImageValidityInfo(packet);
    let replyType;
    if (imgInfo.isValid) {
      replyType = MAIN_REPLY.ADD_IMG.ACCEPTED;
      updateImagesContainer(replyType, packet);
    } else {
      console.log(imgInfo.error);
      packet.deniedError = imgInfo.error;
      replyType = MAIN_REPLY.ADD_IMG.DENIED;
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

async function getImageValidityInfo(packet) {
  let newImagePath = packet.imgPath;
  let comparedImgType = (packet.imgType === 'dirty') ? 'clean' : 'dirty';
  let comparedImgPath = imagesContainer[packet.tabID][packet.tr_n][comparedImgType];
  return await ImagesProcessor.isValidImage(newImagePath, comparedImgPath);
}

async function autoProcess() {
  let autoModel = new AutoModel();
  let flag_cleanUp = true;
  await autoModel.login();
  //await autoModel.renewRoute(flag_cleanUp);
  await autoModel.publishDiary(flag_cleanUp);
}

function updateImagesContainer(replyType, packet) {
  let imgPath;
  switch (replyType) {
    case MAIN_REPLY.ADD_IMG.ACCEPTED:
      imgPath = packet.imgPath;
      break;
    case MAIN_REPLY.DEL_IMG:
      imgPath = undefined;
      break;
  }
  imagesContainer[packet.tabID][packet.tr_n][packet.imgType] = imgPath;
  console.log(imagesContainer);
}

function sendBase64(packet) {
  let imgWidth = undefined;
  let imgHeight = 300;
  sharp(packet.imgPath)
  .resize(imgWidth, imgHeight)
  .toBuffer(function(err, imgBuffer) {
    packet.imgBase64 = 'data:image/jpeg;base64,' + imgBuffer.toString('base64');
    mainWindow.webContents.send(MAIN_REPLY.ADD_IMG.ACCEPTED, packet);
  });
}

function replyRendererReq(replyType, packet) {
  switch (replyType) {
    case MAIN_REPLY.ADD_IMG.ACCEPTED:
      sendBase64(packet);
      break;
    case MAIN_REPLY.ADD_IMG.DENIED:
    case MAIN_REPLY.DEL_IMG:
      mainWindow.webContents.send(replyType, packet);
      break;
  }
}