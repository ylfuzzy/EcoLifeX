

$(document).ready(function() {
  var dialogOpened = false;
  $('.css_td').on('click', '.box, .preview', function() {
    console.log(dialogOpened);
    if (!dialogOpened) {
      dialogOpened = true;
      const {dialog} = require('electron').remote;
      var clickedElement = $(this);
      var parent = clickedElement.parent();
      var options = {filters: [{name: 'Images', extensions: ['jpg', 'png']}]};
      dialog.showOpenDialog(options, function(imgPaths) {
        try {
          console.log(imgPaths[0]);
          console.log(parent);
          var classes = parent.attr('class');
          var imgHtml = '<img class="preview' + classes.replace('css_td', '') + '"' + 'src="' + imgPaths[0] + '">';
          clickedElement.remove();
          parent.append(imgHtml);


          getFileContentAsBase64(imgPaths[0],function(base64Image){
            console.log('base64!!!!!');
            //window.open(base64Image);
            console.log(base64Image); 
            // Then you'll be able to handle the myimage.png file as base64
          });
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