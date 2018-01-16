$(document).ready(function() {
  var dialogOpened = false;
  $('.css_td').on('click', '.box, .preview', function() {
    console.log(dialogOpened);
    if (!dialogOpened) {
      dialogOpened = true;
      const {dialog} = require('electron').remote;
      var elements = new Object();
      elements.clickedElement = $(this);
      elements.parent = elements.clickedElement.parent();
      var options = {filters: [{name: 'Images', extensions: ['jpg', 'png']}]};
      dialog.showOpenDialog(options, function(imgPaths) {
        try {
          elements.imgPath = imgPaths[0];
          appendPreviewImg(elements);
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
});

function appendPreviewImg(elements) {
  const sharp = require('sharp');
  sharp(elements.imgPath)
  .resize(undefined, 300)
  .toBuffer(function(err, imgBuffer, info) {
    var imgBase64 = imgBuffer.toString('base64');
    var classes = elements.parent.attr('class');
    var imgHtml = '<img class="preview' + classes.replace('css_td', '') + '"' + 'src="data:image/jpeg;base64,' + imgBase64 + '">';
    elements.clickedElement.remove();
    elements.parent.append(imgHtml);
  });
}

