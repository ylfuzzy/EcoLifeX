const {Builder, Capabilities, By, Key, until} = require('selenium-webdriver');
const SeleniumError = require('selenium-webdriver/lib/error');
const chrome = require('selenium-webdriver/chrome');
const path = __base + 'js/model/chromedriver';
const service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

class AutoModel {
  constructor() {
    console.log(path);
    this.driver = new Builder().withCapabilities(Capabilities.chrome()).build();
  }

  /**
   * The following block is for login
   */
  async login() {
    let timeout = 5000;
    let trial = 0;
    let maxTrial = 5;
    while (trial < maxTrial) {
      try {
        // fill up user id & password
        let testID = '1002101051';
        let testPasswd = 'east1002101051';
        await this.loginHelper_fillUpIdPasswd(testID, testPasswd);

        // try click "go to admin button"
        await this.loginHelper_goToAdmin();
        break;
      } catch (err) {
        console.log('login trial: ' + trial);
        if (err instanceof SeleniumError.UnexpectedAlertOpenError) {
          let alertMessage = await this.driver.switchTo().alert().getText();
          let typoString = '很抱歉，您輸入的帳號無法登入，可能原因為帳號輸入錯誤';
          if (alertMessage.includes(typoString)) {
            console.log(alertMessage);
            break;
          }
        } else {
          console.log(err);
          trial++;
        }
      }
    }
  }

  async loginHelper_fillUpIdPasswd(userID, userPasswd) {
    try {
      let timeout = 5000;
      let homePage = 'https://ecolife.epa.gov.tw/';
      let id_tf_id = 'cphMain_yAxle_y_login_txtID';
      let id_tf_passwd = 'cphMain_yAxle_y_login_txtPWD';
      let id_btn_login = 'cphMain_yAxle_y_login_btnLogin';
      await this.driver.get(homePage);
      await this.driver.wait(until.elementLocated(By.id(id_tf_id)), timeout).sendKeys(userID);
      await this.driver.wait(until.elementLocated(By.id(id_tf_passwd)), timeout).sendKeys(userPasswd);
      await this.driver.wait(until.elementLocated(By.id(id_btn_login)), timeout).click();
    } catch (err) {
      throw err;
    }
  }

  async loginHelper_goToAdmin() {
    let timeout = 5000;
    let trial = 0;
    let maxTrial = 5;
    while (true) {
      try {
        let id_btn_goToAdmin = 'cphMain_yAxle_y_login_btnAdmin';
        await this.driver.wait(until.elementLocated(By.id(id_btn_goToAdmin)), timeout).click();
        await this.driver.wait(until.titleContains('管理後台'), timeout);
        break;
      } catch (err) {
        if (trial < maxTrial) {
          console.log(err);
          let homePage = 'https://ecolife.epa.gov.tw/';
          await this.driver.get(homePage);
          trial++;
        } else {
          throw err;
        }
      }
    }
  }

  /**
   * The following block is for monthly route renew
   */
  async renewRoute(flag_cleanUp) {
    let settingPage = 'https://ecolifepanel.epa.gov.tw/map/area.aspx';
    if (!flag_cleanUp) {
      settingPage += '?tab=1';
    }
    let trial = 0;
    let maxTrial = 5;
    while (trial < maxTrial) {
      try {
        // go to setting page
        console.log('Go to setting page');
        await this.renewRouteHelper_goToSettingPageHelper(settingPage);
  
        // fill up new title
        console.log('Fill up new title');
        await this.renewRouteHelper_fillUpTitleHelper(flag_cleanUp);
  
        // switch user
        console.log('Try switch user');
        await this.renewRouteHelper_switchUserHelper();
  
        // click white square png
        console.log('Try click a square.png');
        await this.renewRouteHelper_clickWhiteSquareHelper();
        break;
      } catch (err) {
        console.log('============== final catch ==============');
        console.log('catch times: ' + trial);
        console.log(err);
        trial++;
      }
    }
  }

  async renewRouteHelper_goToSettingPageHelper(settingPage) {
    // wait for elements to be located (milliseconds)
    let timeout = 5000;
    let trial = 0;
    let maxTrial = 5;
    while (true) {
      try {
        // go to setting page
        let xpath_btn_firstRow = '//*[@id="cphMain_UPList"]/table/tbody/tr[2]/td[6]/input[1]';
        let id_btn_edit = 'cphMain_btnEdit';
        await this.driver.get(settingPage);
        await this.driver.wait(until.elementLocated(By.xpath(xpath_btn_firstRow)), timeout).click();
        await this.driver.wait(until.elementLocated(By.id(id_btn_edit)), timeout).click();
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
  
  async renewRouteHelper_fillUpTitleHelper(flag_cleanUp) {
    let timeout = 5000;
    try {
      let title_inspect = '107/02-崇文里巡檢路線';
      let title_cleanUp = '107/02-崇文里清理路線';
      let titleToBeFilled = flag_cleanUp ? title_cleanUp : title_inspect;
      let id_tf_title = 'cphMain_txtAreaName';
      let tf_title = await this.driver.wait(until.elementLocated(By.id(id_tf_title)), timeout);
      await tf_title.clear();
      await tf_title.sendKeys(titleToBeFilled);
    } catch (err) {
      throw err;
    }
  }
  
  async renewRouteHelper_clickWhiteSquareHelper() {
    let tiemout = 10000;
    let trial = 0;
    let maxTrial = 5;
    while (true) {
      try {
        // get white squere markers .png
        let css_squareSelector = '.leaflet-marker-pane img';
        let squares = await this.driver.wait(until.elementsLocated(By.css(css_squareSelector)), tiemout);
        for (let i = 0; i < squares.length; i++) {
          let img_src = await squares[i].getAttribute('src');
          if (!img_src.includes('square.png')) {
            squares.splice(i, 1);
          }
        }
        // if the number of squares is even, add a point, else delete the last point.
        console.log('squares length: ' + squares.length);
        let actions = this.driver.actions();
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
  
  async renewRouteHelper_switchUserHelper() {
    let timeout = 10000;
    try {
      let id_switchUser = 'divShiftList';
      let xpath_hrefForSwitchUser = '//*[@id="divShiftList"]/a';
      await this.driver.wait(until.elementLocated(By.xpath(xpath_hrefForSwitchUser)), timeout).click();
      
      // Get user list and switch user
      let css_userListSelector = 'ul.user_list li';
      let userList = await this.driver.wait(until.elementsLocated(By.css(css_userListSelector)), timeout);
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

  /**
   *  The following is for upload image
   */
  async publishDiary(flag_cleanUp) {
    let trial = 0;
    let maxTrial = 5;
    while (trial < maxTrial) {
      await this.publishDiaryHelper_goToPublishPage(flag_cleanUp);
      break;
    }
  }

  async publishDiaryHelper_goToPublishPage(flag_cleanUp) {
    let timeout = 5000;
    let page = 'https://ecolifepanel.epa.gov.tw/journal/';
    page += flag_cleanUp ? 'clear.aspx' : 'inspect.aspx';
    try {
      await this.driver.get(page);
      let alert = await this.driver.wait(until.alertIsPresent(), timeout);
      await alert.accept();
    } catch(err) {
      console.log(err);
    }
    
  }
}

module.exports= AutoModel;
