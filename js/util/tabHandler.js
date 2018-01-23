$(document).ready(function() {
  var dialogOpened = false;
  $('.css_td').on('click', '.box, .preview', function() {
    console.log(dialogOpened);
    if (!dialogOpened) {
      dialogOpened = true;
      const {dialog} = require('electron').remote;
      var elements = new Object();
      elements.current = $(this);
      elements.parent = elements.current.parent();
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
          updateCss_trClassAttr(elements.parent.parent());
        }
      });
    }
  });

  $('.css_td').on('drop', '.box, .preview', function(e) {
    $(this).css('box-shadow', '');
    var elements = new Object();
    elements.current = $(this);
    elements.parent = elements.current.parent();
    elements.imgPath = e.originalEvent.dataTransfer.files[0].path;
    appendPreviewImg(elements);
    console.log(elements.imgPath);
  });

  $('.css_td').on('dragover', '.box, .preview', function() {
    $(this).css('box-shadow', '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)');
  });

  $('.css_td').on('dragleave', '.box, .preview', function() {
    $(this).css('box-shadow', '');
  });

  $('.css_td').on('contextmenu', '.preview', function() {
    var clickedPreviewImg = $(this);
    var parent = clickedPreviewImg.parent();
    var classes = parent.attr('class');
    var boxHtml = '<div class="box' + classes.replace('css_td', '') + '">'
                    + '<i class="material-icons image">add_a_photo</i>'
                  +'</div>';
    clickedPreviewImg.remove();
    parent.append(boxHtml);
  });

  function appendPreviewImg(elements) {
    const sharp = require('sharp');
    sharp(elements.imgPath)
    .resize(undefined, 300)
    .toBuffer(function(err, imgBuffer, info) {
      var imgBase64 = imgBuffer.toString('base64');
      var classes = elements.parent.attr('class');
      var imgHtml = '<img class="preview' + classes.replace('css_td', '') + '"' + 'src="data:image/jpeg;base64,' + imgBase64 + '">';
      elements.current.remove();
      elements.parent.append(imgHtml);
    });
  }

  function updateCss_trClassAttr(css_tr) {
    console.log(css_tr);
    var css_tds = css_tr.children();
    var counter = 0;
    for (var i = 0; i < css_tds.length; i++) {
      /* if (css_tds[i].children.hasClass('preview')) {
        counter++;
      } */
      console.log(css_tds[i].children[0]);
    }
    console.log(counter);
  }
});

