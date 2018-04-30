// Select image by dialog
let dialogOpened = false;
$('.css_td').on('click', '.box, .preview', function() {
  /* console.log('$(this): ', $(this));
  let preview_arr = $('.preview');
  console.log('$preview_arr: ', $($('.preview')[0]));
  if (typeof preview_arr[0] !== 'undefined') {
    let test_pack = pack($($(preview_arr[0])));
    console.log(test_pack);
  } */
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
  let packet = pack(current);
  packet.imgPath = path;
  console.log(packet);
  ipcRenderer.send(RENDERER_REQ.ADD_IMG, packet);
});
/* $('.box, .preview').on('drop', function(e) {
  let current = $(this);
  current.css('box-shadow', '');
  let path = e.originalEvent.dataTransfer.files[0].path;
  let packet = pack(current);
  packet.imgPath = path;
  console.log(packet);
  ipcRenderer.send(RENDERER_REQ.ADD_IMG, packet);
}); */

$('.css_td').on('dragover', '.box, .preview', function() {
  $(this).css('box-shadow', '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)');
});
/* $('.box, .preview').on('dragover', function() {
  console.log('dragover');
  $(this).css('box-shadow', '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)');
}); */

$('.css_td').on('dragleave', '.box, .preview', function() {
  $(this).css('box-shadow', '');
});
/* $('.box, .preview').on('dragleave', function() {
  console.log('dragleave');
  $(this).css('box-shadow', '');
}); */

// Right click to delete image
$('.css_td').on('contextmenu', '.preview', function() {
  let current = $(this);
  console.log('delete current: ', current);
  let packet = pack(current);
  console.log(packet);
  ipcRenderer.send(RENDERER_REQ.DEL_IMG, packet);
});

$('#btn_go').on('click', function() {
  packet = {id: $('#input_id').val(), password: $('#input_password').val()};
  console.log('babababababaabababa');
  ipcRenderer.send(RENDERER_REQ.GO.REQUEST_TO_GO, packet);
});

/**
 * Login page funcitons
 */

$('#input_id').autocomplete({
  data: {
    "1002101001 富裕里": null,
    "1002101003 裕農里": null,
    "1002101004 大智里": null,
    "1002101006 崇學里": null,
    "1002101007 泉南里": null,
    "1002101010 仁和里": null,
    "1002101013 後甲里": null,
    "1002101015 東光里": null,
    "1002101016 新東里": null,
    "1002101017 中西里": null,
    "1002101018 東安里": null,
    "1002101019 崇明里": null,
    "1002101020 自強里": null,
    "1002101021 和平里": null,
    "1002101022 路東里": null,
    "1002101023 大德里": null,
    "1002101025 關聖里": null,
    "1002101027 衛國里": null,
    "1002101028 崇善里": null,
    "1002101029 富強里": null,
    "1002101030 圍下里": null,
    "1002101032 小東里": null,
    "1002101033 大學里": null,
    "1002101034 龍山里": null,
    "1002101035 虎尾里": null,
    "1002101036 德高里": null,
    "1002101037 莊敬里": null,
    "1002101038 大福里": null,
    "1002101039 忠孝里": null,
    "1002101040 崇誨里": null,
    "1002101041 東明里": null,
    "1002101042 崇德里": null,
    "1002101043 東智里": null,
    "1002101044 東聖里": null,
    "1002101045 崇成里": null,
    "1002101046 東門里": null,
    "1002101047 成大里": null,
    "1002101048 大同里": null,
    "1002101049 德光里": null,
    "1002101050 崇信里": null,
    "1002101051 崇文里": null,
    "1002101052 復興里": null,
    "1002101053 裕聖里": null,
    "1002101054 南聖里": null,
    "1002101055 文聖里": null
  },
  //limit: 20, // The max amount of results that can be shown at once. Default: Infinity.
  onAutocomplete: function(val) {
    // Callback function when value is autcompleted.
    let id = val.split(' ')[0];
    let password = 'east' + id;
    $('#input_id').val(id);
    $('#input_password').focus();
    $('#input_password').val('');
    $('#input_password').val(password);
    console.log('id: ' + id);
    console.log('password: ' + password);
  },
  minLength: 1, // The minimum length of the input for the autocomplete to start. Default: 1.
});

// Change setting values
/* $(':checkbox').on('change', function() {
  let option = $(this).attr('id');
  let settingValue = $(this).prop('checked');
  let packet = {};
  packet.option = option;
  packet.settingValue = settingValue;
  ipcRenderer.send(RENDERER_REQ.CHANGE_OPTION, packet);
  if (option === 'date_changing') {
    let isOn = settingValue;
    let css_displayValue = isOn ? 'block' : 'none';
    $('#container_pickers').css('display', css_displayValue);
  }
}); */
const START = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
const _YEAR = START.getUTCFullYear().toString();
const _MONTH = (START.getUTCMonth() + 1) < 10 ? '0' + (START.getUTCMonth() + 1).toString() : (START.getUTCMonth() + 1).toString();
const _DATE = START.getUTCDate() < 10 ? '0' + START.getUTCDate().toString() : START.getUTCDate().toString();
const DEFAULT_DATE = _YEAR + ' 年 ' + _MONTH + ' 月 ' + _DATE + ' 日';
const _HOUR = START.getUTCHours() < 10 ? '0' + START.getUTCHours().toString() : START.getUTCHours().toString();
const _MINUTES = START.getUTCMinutes() < 10 ? '0' + START.getUTCMinutes().toString() : START.getUTCMinutes().toString();
const DEFAULT_TIME = _HOUR + ':' + _MINUTES;
$(document).ready(function() {
  $('#id_datepicker').val(DEFAULT_DATE);
  $('#id_timepicker').val(DEFAULT_TIME);
  $('#id_datepicker').keydown(false);
  $('#id_timepicker').keydown(false);
});
$('.setting').on('click', function() {
  let setting = $(this).attr('id');
  let option = $(this).prop('checked');
  let packet = {};
  packet.setting = setting;
  packet.option = option;
  //ipcRenderer.send(RENDERER_REQ.CHANGE_OPTION, packet);
  if (setting === 'date_changing') {
    let isOn = option;
    let css_displayValue = isOn ? 'block' : 'none';
    //$('#container_pickers').css('display', css_displayValue);
    if (isOn) {
      console.log(getPickedDate());
      packet.pickedDate = getPickedDate();
      $('#container_pickers').removeClass('hide');
    } else {
      $('#container_pickers').addClass('hide');
      //$('.tab_content').load('tab.html');
      let gotImagesToDelete = deleteAllImages();
      if (gotImagesToDelete) {
        showAlertModal('提醒', '為重新驗證照片日期，已放置的預覽照片將被移除');
      }
    }
  }
  ipcRenderer.send(RENDERER_REQ.CHANGE_SETTING, packet);
});

function deleteAllImages() {
  let preview_images = $('.preview');
  let gotImagesToDelete = (preview_images.length > 0);
  for (let i = 0; i < preview_images.length; i++) {
    let packet = pack($($(preview_images[i])));
    ipcRenderer.send(RENDERER_REQ.DEL_IMG, packet);
  }
  return gotImagesToDelete;
  /* console.log('$preview_arr: ', $($('.preview')[0]));
  if (typeof preview_arr[0] !== 'undefined') {
    let test_pack = pack($($(preview_arr[0])));
    console.log(test_pack);
  } */
}

$('#id_datepicker, #id_timepicker').on('change', function() {
  if ($('#id_datepicker').val() === '') {
    $('#id_datepicker').val(DEFAULT_DATE);
  }
  if ($('#id_timepicker').val() === '') {
    $('#id_timepicker').val(DEFAULT_TIME);
  }

  // To make sure the date and time selected from pickers are not beyond "START"
  if (getPickedDate() > START) {
    console.log('reset to default');
    $('#id_datepicker').val(DEFAULT_DATE);
    $('#id_timepicker').val(DEFAULT_TIME);
  }
  let packet = {setting: 'date_changing', option: true, pickedDate: getPickedDate()};
  ipcRenderer.send(RENDERER_REQ.CHANGE_SETTING, packet);
  console.log(getPickedDate());
});

$('#id_datepicker').on('click', function() {
  console.log('click');
  //let START = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
  let minDate = [START.getUTCFullYear(), START.getUTCMonth(), 1];
  let maxDate = [START.getUTCFullYear(), START.getUTCMonth(), START.getUTCDate()];
  $('#id_datepicker').data('stay_open', true);
  $('#id_datepicker').pickadate({
    monthsFull: [ '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月' ],
    monthsShort: [ '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月' ],
    weekdaysFull: [ '星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六' ],
    weekdaysShort: [ '星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六' ],
    today: '今天',
    clear: '預設值',
    close: '關閉',
    firstDay: 1,
    format: 'yyyy 年 mm 月 dd 日',
    formatSubmit: 'yyyy/mm/dd',
    selectMonths: false, // Creates a dropdown to control month
    selectYears: false, // Creates a dropdown of 15 years to control year,
    closeOnSelect: true, // Close upon selecting a date,
    min: minDate,
    max: maxDate,
    onOpen : function() {
      if (!$('#id_datepicker').data('stay_open')) {
        this.stop();
        console.log('stopped');
      }
    },
    onClose: function() {
      $('#id_datepicker').data('stay_open', false);
      //console.log(this._hidden.defaultValue);
      this.stop();
    }
  });
});

$('#id_timepicker').pickatime({
  default: 'now', // Set default time: 'now', '1:30AM', '16:30'
  fromnow: 0,       // set default time to * milliseconds from now (using with default = 'now')
  twelvehour: false, // Use AM/PM or 24-hour format
  donetext: '確認', // text for done-button
  cleartext: '預設值', // text for clear-button
  canceltext: '取消', // Text for cancel-button
  autoclose: false, // automatic close timepicker
  ampmclickable: true, // make AM PM clickable
  aftershow: function(){} //Function for after opening timepicker
});

function getPickedDate() {
  let date = $('#id_datepicker').val();
  let time = $('#id_timepicker').val();
  date = date.replace(/ |日/g, '');
  date = date.replace(/年|月/g, ':');
  date = date.split(':');
  date[0] = Number(date[0]);
  date[1] = Number(date[1]) - 1;
  date[2] = Number(date[2]);
  console.log(date);
  time = time.split(':');
  time[0] = Number(time[0]);
  time[1] = Number(time[1]);
  console.log(time);
  let tempDate = new Date(date[0], date[1], date[2], time[0], time[1]);
  return new Date(tempDate.getTime() + 8 * 60 * 60 * 1000);
}

/* $('#date_changing').on('change', function() {
  let needsDateChanging = $(this).prop('checked');
  ipcRenderer.send(RENDERER_REQ.OPTIONS.DATE_CHANGING, needsDateChanging);
}); */

// callback when main accepted a image
ipcRenderer.on(MAIN_REPLY.ADD_IMG.ACCEPTED, function(e, packet) {
  updateHtml(packet, MAIN_REPLY.ADD_IMG.ACCEPTED);
});

// callback when main rejected a image
ipcRenderer.on(MAIN_REPLY.ADD_IMG.REJECTED, function(e, packet) {
  console.log(packet.rejectedReason);
  showAlertModal('無法使用', packet.rejectedReason);
  /* $('.modal-content').empty();
  $('.modal-content').append('<h4>無法使用</h4>')
  $('.modal-content').append('<p>' + packet.rejectedReason + '</p>');
  $('.modal').modal();

  //now you can open modal from code
  $('#modal1').modal('open'); */
  //$('.modal').modal('open');
});

ipcRenderer.on(MAIN_REPLY.DEL_IMG, function(e, packet) {
  updateHtml(packet, MAIN_REPLY.DEL_IMG);
});

ipcRenderer.on(MAIN_REPLY.GO.PLEASE_CONFIRM, function(e, packet) {
  //showAlertModal(packet.alertTitle, packet.alertContent);
  showConfirmationModal(packet.alertContent);
});

ipcRenderer.on(MAIN_REPLY.GO.REJECTED, function(e, packet) {
  showAlertModal(packet.alertTitle, packet.alertContent);
});

function updateHtml(packet, replyType) {
  let unpackedData = unpack(packet, replyType);
  unpackedData.current.remove();
  unpackedData.parent.append(unpackedData.htmlContent);
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
    case MAIN_REPLY.ADD_IMG.ACCEPTED:
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

function showAlertModal(title, content) {
  $('#alert_modal .modal-content').empty();
  $('#alert_modal .modal-content').append('<h4>' + title + '</h4>')
  $('#alert_modal .modal-content').append('<p>' + content + '</p>');
  $('#alert_modal').modal();

  //now you can open modal from code
  $('#alert_modal').modal('open');
  /* $('#modal_confirm_btn').on('click', function() {
    clickCounter++;
    console.log('click modal confirm button: ' + clickCounter);
  }); */
  //$('.modal').modal('open');
}

function showConfirmationModal(content) {
  $('#confirmation_modal').data('confirmed', false);
  $('#confirmation_modal .modal-content').empty();
  $('#confirmation_modal .modal-content').append(content);
  $('#confirmation_modal').modal({
    dismissible: false, // Modal cannot be dismissed by clicking outside of the modal
    complete: function() { // Callback for Modal close
      let confirmed = $('#confirmation_modal').data('confirmed');
      if (confirmed) {
        ipcRenderer.send(RENDERER_REQ.GO.CONFIRMED);
      }
    }
  });

  //now you can open modal from code
  $('#confirmation_modal').modal('open');
}

$('#confirmation_modal_confirm_btn').on('click', function() {
  $('#confirmation_modal').data('confirmed', true);
});

function showInfoupdatingModal(packet) {
  let indicatorTitle = packet.indicatorTitle;
  let preloaderInspect = packet.preloaderInspect;
  let preloaderCleanUp = packet.preloaderCleanUp;
  let data_hasTurnedOn = $('#infoupdating_modal').data('hasTurnedOn');
  let hasTurnedOn = (typeof data_hasTurnedOn === 'undefined') ? false : data_hasTurnedOn;
  console.log('hasTurnedOn: ' + hasTurnedOn);
  if (!hasTurnedOn) {
    $('#infoupdating_modal').modal({
      dismissible: false, // Modal cannot be dismissed by clicking outside of the modal
      complete: function() { // Callback for Modal close
        $('#infoupdating_modal').data('hasTurnedOn', false);
        $('#circle_preloader').removeClass('hide');//.css('display', 'block');
        $('#preloader_inspect').removeClass('hide');//.css('display', 'block');
        $('#preloader_cleanup').removeClass('hide');//.css('display', 'block');

        // buttons
        $('#infoupdating_modal_cancel_btn').removeClass('hide');//.css('display', '');
        $('#infoupdating_modal_confirm_btn').addClass('hide');//.css('display', 'none');

        // hide cancel reconfirmation
        $('.cancel_reconfirm').addClass('hide');
      }
    });
  }
  if (packet.finished) {
    // hide cancel reconfirmation, because it is too late to cancel the uploading process
    $('.cancel_reconfirm').addClass('hide');

    $('#circle_preloader').addClass('hide');//.css('display', 'none');
    $('#infoupdating_modal_cancel_btn').addClass('hide');//.css('display', 'none');
    $('#infoupdating_modal_confirm_btn').removeClass('hide');//.css('display', '');
  }

  $('#stage_indicator .title').empty();
  $('#stage_indicator .title').append('<h5>' + indicatorTitle + '</h5>');

  //$('#preloader_inspect').css('display', 'block');
  let isForCleanUp = true;
  let isForInspect = !isForCleanUp;
  updatePreloader(preloaderInspect, isForInspect);
  updatePreloader(preloaderCleanUp, isForCleanUp);

  //now you can open modal from code
  if (!hasTurnedOn) {
    $('#infoupdating_modal_confirm_btn').addClass('hide');
    $('#infoupdating_modal').modal('open');
    $('#infoupdating_modal').data('hasTurnedOn', true);
  }
}

$('#infoupdating_modal_cancel_btn').on('click', function() {
  $('#infoupdating_modal_cancel_btn').addClass('hide');
  $('.cancel_reconfirm').removeClass('hide');
});

$('#infoupdating_modal_abort_btn').on('click', function() {
  ipcRenderer.send(RENDERER_REQ.GO.ABORT);
});

$('#infoupdating_modal_forget_btn').on('click', function() {
  $('.cancel_reconfirm').addClass('hide');
  $('#infoupdating_modal_cancel_btn').removeClass('hide');
});

function updatePreloader(preloader, isForCleanUp) {
  let id_preloader = isForCleanUp ? '#preloader_cleanup' : '#preloader_inspect';
  let determinateSelector = id_preloader + ' .determinate';
  let fractionSelector = id_preloader + ' .fraction';
  if (preloader.turnOff) {
    $(id_preloader).addClass('hide');//.css('display', 'none');
  } else {
    $(determinateSelector).css('width', preloader.progressPercent);
    $(fractionSelector).empty();
    $(fractionSelector).append(preloader.progressFraction);
  }
}

ipcRenderer.on(MAIN_REPLY.GO.ERROR, function(e, packet) {
  showErrorModal(packet.err);
});

function showErrorModal(err) {
  /* console.log('Discription: ' + err.discription);
  console.log('Type: ' + err.type);
  console.log('Origin: ' + err.errOrigin);
  console.log('OriginalErr: ' + err.originalErr); */
  $('#error_modal .modal-content').empty();
  $('#error_modal .modal-content').append('<h5>發生錯誤</h5>')
  $('#error_modal .modal-content').append('<p>' + err.discription + '</p>');
  
  $('#error_modal .modal-content').append('<h5>錯誤類別</h5>')
  $('#error_modal .modal-content').append('<p>' + err.type + '</p>');
  
  $('#error_modal .modal-content').append('<h5>錯誤起源</h5>')
  $('#error_modal .modal-content').append('<p>' + err.errOrigin + '</p>');

  $('#error_modal .modal-content').append('<h5>原始錯誤訊息</h5>')
  $('#error_modal .modal-content').append('<p>' + err.originalErr + '</p>');
  $('#error_modal').modal();

  //now you can open modal from code
  $('#error_modal').modal('open');
}

function showCancellationModel() {
  $('#cancellation_model').modal();
  $('#cancellation_model').modal('open');
}

ipcRenderer.on(MAIN_REPLY.GO.UPDATE_AUTOPROCESS_INFO, function(e, packet) {
  /* let indicatorTitle = '準備中...';
  let preloaderInspect = {turnOn: true, progressPercent: '87%', progressFraction: '87/100'};
  let preloaderCleanUp = {turnOn: false, progressPercent: '56%', progressFraction: '56/100'};
  let info = {};
  info.indicatorTitle = indicatorTitle;
  info.preloaderInspect = preloaderInspect;
  info.preloaderCleanUp = preloaderCleanUp; */
  showInfoupdatingModal(packet);
}); 