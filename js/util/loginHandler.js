$(document).ready(function() {
  $('#btn_go').on('click', function() {
    console.log($('#switch_compress').is(':checked'));
    console.log($('.css_tr.tr_1').has('.preview'));
  });

  function getImgPaths() {
    var imgPathSet = {
      dirty: undefined,
      clean: undefined
    };
    var tables = [];
  }
});