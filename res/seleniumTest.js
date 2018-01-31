//import { setInterval } from 'timers';

//var webdriver = require('selenium-webdriver');
const {Builder, Capabilities, By, Key, until} = require('selenium-webdriver');
const Error = require('selenium-webdriver/lib/error');
let chrome = require('selenium-webdriver/chrome');
let fs = require('fs');
//var path = require('chromedriver').path;
let path = './chromedriver';
let service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

/* var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .build(); */

let driver = new Builder().withCapabilities(Capabilities.chrome()).build();

//login(0);
let asyncLogin = async function() {
  let timeout = 5000;
  let trialLogin = 0;
  let homePage = 'https://ecolife.epa.gov.tw/';
  let tf_id = 'cphMain_yAxle_y_login_txtID';
  let tf_passwd = 'cphMain_yAxle_y_login_txtPWD';
  let btn_login = 'cphMain_yAxle_y_login_btnLogin';
  //let successfullyLoginID = 'cphMain_yAxle_y_login_lnkName';
  let btn_goToAdmin = 'cphMain_yAxle_y_login_btnAdmin';
  let testID = '1002101051';
  let testPasswd = 'east1002101051';
  while (trialLogin < 5) {
    try {
      await driver.get(homePage);
      await driver.wait(until.elementLocated(By.id(tf_id)), timeout).sendKeys(testID);
      await driver.wait(until.elementLocated(By.id(tf_passwd)), timeout).sendKeys(testPasswd);
      await driver.wait(until.elementLocated(By.id(btn_login)), timeout).click();
      //let loginIndicator = await driver.wait(until.elementsLocated(By.id(successfullyLoginID)), timeout);
      let trialToAdmin = 0;
      while (trialToAdmin < 5) {
        try {
          await driver.wait(until.elementLocated(By.id(btn_goToAdmin)), timeout).click();
          await driver.wait(until.titleContains('管理後台'), timeout);
          return true;
        } catch (err) {
          console.log(err);
          await driver.get(homePage);
          trialToAdmin++;
        }
      }
      return false;
    } catch (err) {
      console.log('trialLogin: ' + trialLogin);
      if (err instanceof Error.UnexpectedAlertOpenError) {
        let alertMessage = await driver.switchTo().alert().getText();
        let typoString = '很抱歉，您輸入的帳號無法登入，可能原因為帳號輸入錯誤';
        if (alertMessage.includes(typoString)) {
          console.log(alertMessage);
          return false;
        }
      } else {
        console.log(err);
        counter++;
      }
    }
  }
  return false;
}

let asyncUpdateCleanRoute = async function() {
  let timeout = 5000;
  let forCleanRouteSetting = false;
  let page = 'https://ecolifepanel.epa.gov.tw/map/area.aspx';
  if (!forCleanRouteSetting) {
    page += '?tab=1';
  }
  let trial = 0;
  let maxTrial = 5;
  while (trial < maxTrial) {
    try {
      // go to setting page
      console.log('Go to setting page');
      await goToSettingPageHelper(page);

      // switch user
      console.log('Try switch user');
      await switchUserHelper();

      // click white square png
      console.log('Try click a white square .png');
      await clickWhiteSquareHelper();
      break;
    } catch (err) {
      console.log('============== final catch ==============');
      console.log(err);
      trial++;
    }
  }
}

let goToSettingPageHelper = async function(settingPage) {
  // wait for elements to be located (milliseconds)
  let timeout = 5000;
  let trial = 0;
  let maxTrial = 5;
  while (true) {
    try {
      // go to setting page
      let xpath_btn_firstRow = '//*[@id="cphMain_UPList"]/table/tbody/tr[2]/td[6]/input[1]';
      let id_btn_edit = 'cphMain_btnEdit';
      await driver.get(settingPage);
      await driver.wait(until.elementLocated(By.xpath(xpath_btn_firstRow)), timeout).click();
      await driver.wait(until.elementLocated(By.id(id_btn_edit)), timeout).click();
      break;
    } catch (err) {
      if (trial < maxTrial) {
        console.log(err);
        trial++;
      } else {
        throw err;
      }
    }
  }
}

let clickWhiteSquareHelper = async function() {
  let tiemout = 10000;
  let trial = 0;
  let maxTrial = 5;
  while (true) {
    try {
      // get white squere markers .png
      let css_squareSelector = '.leaflet-marker-pane img';
      let squares = await driver.wait(until.elementsLocated(By.css(css_squareSelector)), tiemout);
      for (let i = 0; i < squares.length; i++) {
        let img_src = await squares[i].getAttribute('src');
        if (!img_src.includes('square.png')) {
          squares.splice(i, 1);
        }
      }
      // if the number of squares is even, add a point, else delete the last point.
      console.log('squares length: ' + squares.length);
      let actions = driver.actions();
      if (squares.length % 2 === 0) {
        await actions.mouseMove(squares[0], {x: 5, y: 0}).click().perform();
      } else {
        await squares[squares.length - 1].click();
      }
      break;
    } catch (err) {
      if (trial < maxTrial) {
        console.log('click White Square: ' + trial);
        console.log(err);
        trial++
      } else {
        throw err;
      }
    }
  }
}

let switchUserHelper = async function() {
  let timeout = 10000;
  try {
    let id_switchUser = 'divShiftList';
    let xpath_hrefForSwitchUser = '//*[@id="divShiftList"]/a';
    await driver.wait(until.elementLocated(By.xpath(xpath_hrefForSwitchUser)), timeout).click();
    
    // Get user list and switch user
    let css_userListSelector = 'ul.user_list li';
    let userList = await driver.wait(until.elementsLocated(By.css(css_userListSelector)), timeout);
    let activeUserExist = false;
    for (let i = 0; i < userList.length; i++) {
      let class_li = await userList[i].getAttribute('class');
      if (class_li.includes('active')) {
        await userList[i].findElement(By.css('a')).click();
        let i_nextUser = (i + 1) % userList.length;
        await userList[i_nextUser].findElement(By.css('a')).click();
        activeUserExist = true;
        break;
      }
    }
    if (!activeUserExist) {
      await userList[0].findElement(By.css('a')).click();
    }
  } catch (err) {
    console.log('switch user: ' + trial);
    throw err;
  }
}

let autoTest = async function() {
  let loginSuccesfully = await asyncLogin();
  if (loginSuccesfully) {
    console.log('hello');
    try {
      await asyncUpdateCleanRoute();
    } catch (err) {
      console.log(err);
    }
  }
}

autoTest();
let dragAndDropTest = async function() {
  let examplePage = 'https://www.html5rocks.com/en/tutorials/dnd/basics/#toc-examples';
  let firstDiv = '//*[@id="columns-full"]/div[1]';
  let secondDiv = '//*[@id="columns-full"]/div[2]';
  try {
    await driver.get(examplePage);
    let from = await driver.findElement(By.xpath(firstDiv));
    let to = await driver.findElement(By.xpath(secondDiv));
    let actions = driver.actions();
    await actions.dragAndDrop(from, to).perform();
    console.log(actions);
  } catch (err) {
    console.log('gg');
    console.log(err);
  }
}

//dragAndDropTest();