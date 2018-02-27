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
  let packet = pack(current);
  console.log(packet);
  ipcRenderer.send(RENDERER_REQ.DEL_IMG, packet);
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
    $('#container_pickers').css('display', css_displayValue);
    if (isOn) {
      console.log(getPickedDate());
      packet.pickedDate = getPickedDate();
    }
  }
  ipcRenderer.send(RENDERER_REQ.CHANGE_SETTING, packet);
});

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
  $('.modal-content').empty();
  $('.modal-content').append('<h4>無法使用</h4>')
  $('.modal-content').append('<p>' + packet.rejectedReason + '</p>');
  $('.modal').modal();

  //now you can open modal from code
  $('#modal1').modal('open');
  //$('.modal').modal('open');
});

ipcRenderer.on(MAIN_REPLY.DEL_IMG, function(e, packet) {
  updateHtml(packet, MAIN_REPLY.DEL_IMG);
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