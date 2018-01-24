const electron = require('electron');
const url = require('url');
const path = require('path');

const {app, BrowserWindow, ipcMain, dialog} = electron;
const sharp = require('sharp');
const RENDERER_REQ = {ADD_IMG: 'REQ:ADD_IMG', DEL_IMG: 'REQ:DEL_IMG'};
const MAIN_REPLY = {ADD_IMG: 'REPLY:ADD_IMG', DEL_IMG: 'REPLY:DEL_IMG'};
let mainWindow;

function ImageSet() {
  this.dirty = undefined;
  this.clean = undefined;
}

let previewImages = {
  tab_inspect: {
    tr_1: new ImageSet(), tr_2: new ImageSet(), tr_3: new ImageSet(), tr_4: new ImageSet()
  },
  tab_clean_up: {
    tr_1: new ImageSet(), tr_2: new ImageSet(), tr_3: new ImageSet(), tr_4: new ImageSet()
  }
};

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
  // add imgPath into previewImage
  updatePreviewImages(packet, RENDERER_REQ.ADD_IMG);
  replyRendererReq(packet, RENDERER_REQ.ADD_IMG);
});

ipcMain.on(RENDERER_REQ.DEL_IMG, function(e, packet) {
  console.log('main received del request');
  // Delete imgPath
  updatePreviewImages(packet, RENDERER_REQ.DEL_IMG);
  replyRendererReq(packet, RENDERER_REQ.DEL_IMG);
});

function updatePreviewImages(packet, reqType) {
  let imgPath;
  switch (reqType) {
    case RENDERER_REQ.ADD_IMG:
      imgPath = packet.imgPath;
      break;
    case RENDERER_REQ.DEL_IMG:
      imgPath = undefined;
      break;
  }
  previewImages[packet.tabID][packet.tr_n][packet.imgType] = imgPath;
  console.log(previewImages);
}

function sendBase64(packet) {
  let imgWidth = undefined;
  let imgHeight = 300;
  sharp(packet.imgPath)
  .resize(imgWidth, imgHeight)
  .toBuffer(function(err, imgBuffer) {
    packet.imgBase64 = 'data:image/jpeg;base64,' + imgBuffer.toString('base64');
    mainWindow.webContents.send(MAIN_REPLY.ADD_IMG, packet);
  });
}

function sendDelConfirmation(packet) {
  console.log('Im here!!!!');
  mainWindow.webContents.send(MAIN_REPLY.DEL_IMG, packet);
}

function replyRendererReq(packet, reqType) {
  switch (reqType) {
    case RENDERER_REQ.ADD_IMG:
      sendBase64(packet);
      break;
    case RENDERER_REQ.DEL_IMG:
      sendDelConfirmation(packet);
      break;
  }
}