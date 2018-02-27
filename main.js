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
const RENDERER_REQ = {ADD_IMG: 'REQ:ADD_IMG', DEL_IMG: 'REQ:DEL_IMG', GO: 'REQ:GO',
  CHANGE_SETTING: 'REQ:CHANGE_SETTING'};
const MAIN_REPLY = {
  ADD_IMG: {
    ACCEPTED: 'REPLY:ADD_IMG:ACCEPTED',
    REJECTED: 'REPLY:ADD_IMG:REJECTED'},
  DEL_IMG: 'REPLY:DEL_IMG'
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

ipcMain.on(RENDERER_REQ.GO, function(e) {
  autoProcess();
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

async function autoProcess() {
  /* let autoModel = new AutoModel();
  await autoModel.login();
  await autoModel.deletePreviousDrafts(); */
  //await autoModel.renewRoute(false);
  let imgSetsForInspect = [];
  let imgSetsForCleanUp = [];
  for (tr_n in imagesContainer.tab_inspect) {
    if (imagesContainer.tab_inspect[tr_n].isPaired()) {
      //await ImagesProcessor.modifyImageSet(imagesContainer.tab_inspect[tr_n], setting);
      await imagesContainer.tab_inspect[tr_n].modify(setting);
      imgSetsForInspect.push(imagesContainer.tab_inspect[tr_n]);
    }
    if (imagesContainer.tab_clean_up[tr_n].isPaired()) {
      //await ImagesProcessor.modifyImageSet(imagesContainer.tab_inspect[tr_n], setting);
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
      let ids = ["1002101001", "1002101037", "1002101044", "1002101019", "1002101046", 
                  "1002101041", "1002101054", "1002101040", "1002101049", "1002101033",
                    "1002101029", "1002101006", "1002101035", "1002101013", "1002101027",
                      "1002101021", "1002101016", "1002101048", "1002101022", "1002101020",
                        "1002101032", "1002101017", "1002101042", "1002101045", "1002101028",
                          "1002101050", "1002101047", "1002101039", "1002101023", "1002101055",
                            "1002101038", "1002101030", "1002101034", "1002101004", "1002101036",
                              "1002101043", "1002101003", "1002101007", "1002101010", "1002101053",
                                "1002101018", "1002101025", "1002101051", "1002101052", "1002101015"]
      for (let i = 12; i < ids.length; i++) {
        console.log('Now is testing id: ' + ids[i]);
        let autoModel = new AutoModel();
        await autoModel.login(ids[i]);
        await autoModel.renewRoute(isForCleanUp);
        let newTitle = await autoModel.renewRoute(isForInspect);
        let idx_ref = newTitle.indexOf('里');
        let idx_begin = idx_ref - 2;
        let idx_end = idx_ref + 1;
        let villageName = newTitle.substring(idx_begin, idx_end);
        //fs.appendFileSync(__base + 'usersInfo.txt', 'test');
        await autoModel.quiteChrome();
        fs.appendFileSync(__base + 'usersInfo.txt', '\r\n' + ids[i].toString() + ' ' + villageName);
      }
      
      //await autoModel.headlessTest();
     /*  for (let i = 0; i < imgSetsForInspect.length; i++) {
        await autoModel.publishJournal(imgSetsForInspect[i], isForInspect);
      }
      for (let i = 0; i < imgSetsForCleanUp.length; i++) {
        await autoModel.publishJournal(imgSetsForCleanUp[i], isForCleanUp);
      } */
      console.log('============ Finished ============');
    } catch (err) {
      console.log('============ MAIN CATCHED! ============');
      console.log('Stage: ' + err.stage);
      console.log('Origin: ' + err.errOrigin);
      console.log('Type: ' + err.type);
    }
  } else {
    console.log('There is no image set can be uploaded');
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