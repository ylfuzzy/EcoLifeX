const {ipcRenderer} = require('electron');
const RENDERER_REQ = {
  ADD_IMG: 'REQ:ADD_IMG',
  DEL_IMG: 'REQ:DEL_IMG',
  GO: 'REQ:GO'};
const MAIN_REPLY = {
  ADD_IMG: {
      ACCEPTED: 'REPLY:ADD_IMG:ACCEPTED',
      DENIED: 'REPLY:ADD_IMG:DENIED'
      },
  DEL_IMG: 'REPLY:DEL_IMG'
  };