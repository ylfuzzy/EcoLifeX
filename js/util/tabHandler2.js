const {ipcRenderer} = require('electron');
const RENDERER_REQ = {ADD_IMG: 'REQ:ADD_IMG', DEL_IMG: 'REQ:DEL_IMG'};
const MAIN_REPLY = {ADD_IMG: 'REPLY:ADD_IMG', DEL_IMG: 'REPLY:DEL_IMG'};

// Select image by dialog
let dialogOpened = false;
$('.css_td').on('click', '.box, .preview', function() {
  let current = $(this);
  console.log(dialogOpened);
  if (!dialogOpened) {
    dialogOpened = true;
    const {dialog} = require('electron').remote;
    let options = {filters: [{name: 'Images', extensions: ['jpg', 'png']}]};
    dialog.showOpenDialog(options, function(imgPaths) {
      try {
        let packet = pack(current);
        packet.imgPath = imgPaths[0];
        console.log(packet);
        // Send to main to check the validity
        ipcRenderer.send(RENDERER_REQ.ADD_IMG, packet);
      } catch (err) {
        //logMyErrors(err);
        console.log('catched');
        console.log(err.message);
      } finally {
        dialogOpened = false;
      }
    });
  }
});

// Drag and drop
$('.css_td').on('drop', '.box, .preview', function(e) {
  let current = $(this);
  current.css('box-shadow', '');
  let path = e.originalEvent.dataTransfer.files[0].path;
  let fileExtension = path.split('.').pop().toLowerCase();
  if (isImage(fileExtension)) {
    let packet = pack(current);
    packet.imgPath = path;
    console.log(packet);
    ipcRenderer.send(RENDERER_REQ.ADD_IMG, packet);
  } else {
    console.log(fileExtension + ' is not a image!');
  }
});

$('.css_td').on('dragover', '.box, .preview', function() {
  $(this).css('box-shadow', '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)');
});

$('.css_td').on('dragleave', '.box, .preview', function() {
  $(this).css('box-shadow', '');
});

// Right click to delete image
$('.css_td').on('contextmenu', '.preview', function() {
  console.log('dbclick detected!!!!');
  let current = $(this);
  let packet = pack(current);
  console.log(packet);
  ipcRenderer.send(RENDERER_REQ.DEL_IMG, packet);
});

ipcRenderer.on(MAIN_REPLY.ADD_IMG, function(e, packet) {
  updateHtml(packet, MAIN_REPLY.ADD_IMG);
});

ipcRenderer.on(MAIN_REPLY.DEL_IMG, function(e, packet) {
  updateHtml(packet, MAIN_REPLY.DEL_IMG);
});

function updateHtml(packet, replyType) {
  let unpackedData = unpack(packet, replyType);
  unpackedData.current.remove();
  unpackedData.parent.append(unpackedData.htmlContent);
}

function isImage(fileExtension) {
  switch (fileExtension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
      return true;
  }
  return false;
}

function pack(current) {
  let packet = {};
  // Determine whether it is in tab_inspect or tab_clean_up
  packet.tabID =  current.closest('.col').attr('id');
  let classes = current.attr('class').split(' ');
  packet.elementType = classes[0];
  packet.tr_n = classes[1];
  packet.imgType = classes[2];
  return packet;
}

function unpack(packet, replyType) {
  let unpackedData = {};
  let tabID = '#' + packet.tabID;
  let currentClasses = '.' + packet.elementType + '.' + packet.tr_n + '.' + packet.imgType;
  unpackedData.current = $(tabID).find(currentClasses);
  unpackedData.parent = unpackedData.current.parent();
  let htmlContent;
  switch (replyType) {
    case MAIN_REPLY.ADD_IMG:
      htmlContent = '<img class="preview' + unpackedData.parent.attr('class').replace('css_td', '') + '" src="' + packet.imgBase64 + '">';
      break;
    case MAIN_REPLY.DEL_IMG:
      htmlContent = '<div class="box' + unpackedData.parent.attr('class').replace('css_td', '') + '">'
                    + '<i class="material-icons image">add_a_photo</i>'
                  + '</div>';
      break;
  }
  unpackedData.htmlContent = htmlContent;
  return unpackedData;
}