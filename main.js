const electron = require('electron');
const url = require('url');
const path = require('path');

const {app, BrowserWindow, ipcMain, dialog} = electron;
const sharp = require('sharp');
let mainWindow;

function ImageSet() {
  this.dirty;
  this.clean;
}

let previewImages = {
  tr_1: new ImageSet(),
  tr_2: new ImageSet(),
  tr_3: new ImageSet(),
  tr_4: new ImageSet(),
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

ipcMain.on('REQ:addImg', function(e, packet) {
  // add imgPath into previewImage
  updatePreviewImages(packet.tr_n, packet.imgType, packet.imgPath);
  sendBackBase64(packet);
});

function updatePreviewImages(tr_n, imgType, imgPath) {
  previewImages[tr_n][imgType] = imgPath;
  console.log(previewImages);
}

function sendBackBase64(packet) {
  let imgWidth = undefined;
  let imgHeight = 300;
  sharp(packet.imgPath)
  .resize(imgWidth, imgHeight)
  .toBuffer(function(err, imgBuffer) {
    packet.imgBase64 = 'data:image/jpeg;base64,' + imgBuffer.toString('base64');
    mainWindow.webContents.send('RSPNS:addImg', packet);
  });
}