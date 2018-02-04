$('#btn_go').on('click', function() {
  console.log($('#switch_compress').is(':checked'));
  console.log($('.css_tr.tr_1').has('.preview'));
  ipcRenderer.send(RENDERER_REQ.GO);
});

function getImgPaths() {
  var imgPathSet = {
    dirty: undefined,
    clean: undefined
  };
  var tables = [];
}