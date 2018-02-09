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
    REJECTED: 'REPLY:ADD_IMG:REJECTED'},
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
    let imgInfo = await getImageValidity(packet);
    let replyType;
    if (imgInfo.isValid) {
      packet.dateTimeOriginal = imgInfo.dateTimeOriginal;
      replyType = MAIN_REPLY.ADD_IMG.ACCEPTED;
      updateImagesContainer(replyType, packet);
    } else {
      console.log(imgInfo.error);
      packet.deniedError = imgInfo.error;
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

ipcMain.on(RENDERER_REQ.GO, function(e) {
  autoProcess();
});

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
      imgSetsForInspect.push(imagesContainer.tab_inspect[tr_n]);
    }
    if (imagesContainer.tab_clean_up[tr_n].isPaired()) {
      imgSetsForCleanUp.push(imagesContainer.tab_clean_up[tr_n]);
    }
  }
  let isForCleanUp = true;
  if (imgSetsForInspect.length !== 0 || imgSetsForCleanUp.length !== 0) {
    try {
      let autoModel = new AutoModel();
      await autoModel.login();
      //await autoModel.renewRoute(isForCleanUp);
      for (let i = 0; i < imgSetsForInspect.length; i++) {
        await autoModel.publishJournal(imgSetsForInspect[i], !isForCleanUp);
      }
      for (let i = 0; i < imgSetsForCleanUp.length; i++) {
        await autoModel.publishJournal(imgSetsForCleanUp[i], isForCleanUp);
      }
    } catch (err) {
      console.log('main catched!');
      console.log(err);
    }
  } else {
    console.log('There is no image set can be uploaded');
  }
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
    case MAIN_REPLY.ADD_IMG.REJECTED:
    case MAIN_REPLY.DEL_IMG:
      mainWindow.webContents.send(replyType, packet);
      break;
  }
}