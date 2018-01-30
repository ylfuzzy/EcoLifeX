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
  let waitTime = 5000;
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
      await driver.wait(until.elementLocated(By.id(tf_id)), waitTime).sendKeys(testID);
      await driver.wait(until.elementLocated(By.id(tf_passwd)), waitTime).sendKeys(testPasswd);
      await driver.wait(until.elementLocated(By.id(btn_login)), waitTime).click();
      //let loginIndicator = await driver.wait(until.elementsLocated(By.id(successfullyLoginID)), waitTime);
      let trialToAdmin = 0;
      while (trialToAdmin < 5) {
        try {
          await driver.wait(until.elementLocated(By.id(btn_goToAdmin)), waitTime).click();
          await driver.wait(until.titleContains('管理後台'), waitTime);
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
  let waitTime = 5000;
  let page_cleanRouteSetting = 'https://ecolifepanel.epa.gov.tw/map/area.aspx';
  let xpath_btn_firstRow = '//*[@id="cphMain_UPList"]/table/tbody/tr[2]/td[6]/input[1]';
  let id_btn_edit = 'cphMain_btnEdit';
  let id_myMap = 'my_map';
  let class_markers = 'leaflet-marker-pane';
  try {
    await driver.get(page_cleanRouteSetting);
    await driver.wait(until.elementLocated(By.xpath(xpath_btn_firstRow)), waitTime).click();
    await driver.wait(until.elementLocated(By.id(id_btn_edit)), waitTime).click();

    // get white squere markers .pngs
    //let mapContainer = await driver.wait(until.elementLocated(By.id(id_myMap)), waitTime);
    let squares = await driver.wait(until.elementsLocated(By.css('.leaflet-marker-pane img')));
    for (let i = 0; i < squares.length; i++) {
      let img_src = await squares[i].getAttribute('src');
      if (!img_src.includes('square.png')) {
        squares.splice(i, 1);
      }
    }
    for (let i = 0; i < squares.length; i++) {
      console.log(await squares[i].getAttribute('src'));
    }
  } catch (err) {
    console.log(err);
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