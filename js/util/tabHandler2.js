const {ipcRenderer} = require('electron');
let dialogOpened = false;
$('.css_td').on('click', '.box, .preview', function() {
  console.log(dialogOpened);
  let current = $(this);
  console.log(current.closest('.col').attr('id'));
  let classes = current.attr('class').split(' ');
  let packet = {};
  packet.elementType = classes[0];
  packet.tr_n = classes[1];
  packet.imgType = classes[2];
  console.log(packet);
  if (!dialogOpened) {
    dialogOpened = true;
    const {dialog} = require('electron').remote;
    let options = {filters: [{name: 'Images', extensions: ['jpg', 'png']}]};
    dialog.showOpenDialog(options, function(imgPaths) {
      try {
        packet.imgPath = imgPaths[0];
        // Send to main to check the validity
        ipcRenderer.send('REQ:addImg', packet);
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
  $(this).css('box-shadow', '');
  let current = $(this);
  let classes = current.attr('class').split(' ');
  let packet = {};
  packet.elementType = classes[0];
  packet.tr_n = classes[1];
  packet.imgType = classes[2];
  let path = e.originalEvent.dataTransfer.files[0].path;
  let fileExtension = path.split('.').pop().toLowerCase();
  if (isImage(fileExtension)) {
    packet.imgPath = path;
    console.log(packet);
    ipcRenderer.send('REQ:addImg', packet);
  } else {
    console.log(fileExtension + ' is not a image!');
  }
});

function isImage(fileExtension) {
  switch (fileExtension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
      return true;
  }
  return false;
}

ipcRenderer.on('RSPNS:addImg', function(e, packet) {
  let currentClasses = '.' + packet.elementType + '.' + packet.tr_n + '.' + packet.imgType;
  let current = $(currentClasses);
  let parent = current.parent();
  let imgHtml = '<img class="preview' + parent.attr('class').replace('css_td', '') + '" src="' + packet.imgBase64 + '">';
  console.log(current);
  current.remove();
  parent.append(imgHtml);
  //console.log(imgHtml);
  //current.remove();
  /* let parentClasses = '.css_td' + '.' + packet.tr_n + '.' + packet.imgType;
  parent = $(parentClasses);
  let imgClasses = 'preview ' + packet.tr_n + ' ' + packet.imgType;
  var imgHtml = '<img class="' + imgClasses + '" src="' + packet.imgBase64 + '">'; */
  
  /* pointedElements.current.remove();
  pointedElements.parent.append(imgHtml);
  pointedElements = undefined; */
});