const ImagesProcessor = require(__base + 'js/utility/imagesProcessor');
const {Builder, Capabilities, By, Key, until} = require('selenium-webdriver');
const SeleniumError = require('selenium-webdriver/lib/error');
const chrome = require('selenium-webdriver/chrome');
const path = __base + 'js/model/chromedriver';//'node_modules/.bin/chromedriver'
const service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);
/* const options = new chrome.Options().headless();
options.windowSize({width: 1270, height: 720});
const fs = require('fs'); */
/* const chromeCapabilities = Capabilities.chrome();
chromeCapabilities.set('chromeOptions', {args: ['start-maximized']}); */
/* const chromeCapabilities = Capabilities.chrome();
chromeCapabilities.set('chromeOptions', {args: ['disable-gpu', 'headless', 'window-size=1280,720']}); */

/* const driver = new webdriver.Builder()
  .forBrowser('chrome')
  .withCapabilities(chromeCapabilities)
  .build(); */
/* const ERROR_TYPES = {
  WRONG_ID_PASSWD: 'WRONG_ID_PASSWD', UNEXPECTED_ALERT: 'UNEXPECTED_ALERT', TIMEOUT: 'TIMEOUT', UNKNOWN: 'UNKNOWN'}; */
const ERROR_TYPES = {WRONG_ID_PASSWD: 'WRONG_ID_PASSWD', UNEXPECTED_ALERT: 'UNEXPECTED_ALERT', TIMEOUT: 'TIMEOUT', UNKNOWN: 'UNKNOWN'};
const CURRENT_DATE = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
let driver;
class AutoModel {
  /* constructor() {
    //console.log(path);
    //driver = new Builder().withCapabilities(Capabilities.chrome()).build();
  } */

  async initChromeDriver() {
    try {
      console.log('chromedriver path: ' + path);
      driver = await new Builder().withCapabilities(Capabilities.chrome()).build();
    } catch (err) {
      throw err;
    }
  }

  async headlessTest() {
    try {
      // Navigate to google.com, enter a search.
    /* await driver.get('https://bartzutow.xyz/');
    let windowHandles = await driver.getAllWindowHandles();
    console.log(windowHandles.length);
    await driver.switchTo().window(windowHandles[0]);
    await driver.findElement({id: 'user'}).sendKeys('ylfuzzy');
    await driver.findElement({id: 'password'}).sendKeys('babababa');
    //await driver.wait(until.titleIs('webdriver - Google 搜尋'), 1000); */

    // Try to loing in headless mode
    await this.login();
    let page = 'https://ecolifepanel.epa.gov.tw/journal/clear.aspx';
    await driver.get(page);
    console.log(await driver.getTitle());
  
    // Take screenshot of results page. Save to disk.
    driver.takeScreenshot().then(base64png => {
      fs.writeFileSync('screenshot.png', new Buffer(base64png, 'base64'));
    });

    await driver.quit();
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * The following block is for login
   */
  async login(id, password) {
    let timeout = 5000;
    let trial = 0;
    let maxTrial = 5;
    while (true) {
      try {
        // fill up user id & password
        //let testID = '1002101052';
        //let testPasswd = 'east' + id;
        await this.__fillInIDPasswd(id, password);

        // try click "go to admin button"
        await this.__goToAdmin();
        break;
      } catch (errFromOrigin) {
        console.log('login trial: ' + trial);
        let errToMain = errFromOrigin;
        errToMain.stage = 'login';
        if (errToMain.type === ERROR_TYPES.WRONG_ID_PASSWD || errToMain.type === ERROR_TYPES.UNEXPECTED_ALERT) {
          throw errToMain
        }
        if (trial < maxTrial) {
          console.log(errFromOrigin);
          trial++;
        } else {
          throw errToMain;
        }
      }
    }
  }

  async __fillInIDPasswd(userID, userPasswd) {
    try {
      let timeout = 5000;
      let homePage = 'https://ecolife.epa.gov.tw/';
      let id_tf_id = 'cphMain_yAxle_y_login_txtID';
      let id_tf_passwd = 'cphMain_yAxle_y_login_txtPWD';
      let id_btn_login = 'cphMain_yAxle_y_login_btnLogin';
      await driver.get(homePage);
      await driver.wait(until.elementLocated(By.id(id_tf_id)), timeout).sendKeys(userID);
      await driver.wait(until.elementLocated(By.id(id_tf_passwd)), timeout).sendKeys(userPasswd);
      await driver.wait(until.elementLocated(By.id(id_btn_login)), timeout).click();
    } catch (err) {
      let errToThrow = await this.__checkError('__fillInIDPasswd', '無法於登入頁面填入帳號密碼', err);
      throw errToThrow;
    }
  }

  async __goToAdmin() {
    let timeout = 5000;
    let trial = 0;
    let maxTrial = 5;
    while (true) {
      try {
        let id_btn_goToAdmin = 'cphMain_yAxle_y_login_btnAdmin';
        await driver.wait(until.elementLocated(By.id(id_btn_goToAdmin)), timeout).click();
        await driver.wait(until.titleContains('管理後台'), timeout);
        break;
      } catch (err) {
        let errToThrow = await this.__checkError('__goToAdmin', '無法進入管理後台', err);
        if (errToThrow.type === ERROR_TYPES.WRONG_ID_PASSWD || errToThrow.type === ERROR_TYPES.UNEXPECTED_ALERT) {
          throw errToThrow;
        }
        if (trial < maxTrial) {
          console.log(errToThrow);
          let homePage = 'https://ecolife.epa.gov.tw/';
          await driver.get(homePage);
          trial++;
        } else {
          throw errToThrow;
        }
      }
    }
  }

  /**
   * The following block is for monthly route renew
   */
  async renewRoute(isForCleanUp) {
    try {
      let renewInfo = await this.__checkRoutes(isForCleanUp);
      if (renewInfo.isRequired) {
        await this.__fillInRouteSetting(renewInfo.newTitle);
      } else {
        console.log(renewInfo.newTitle + ' does not need to renew.');
      }
    } catch (errToMain) {
      throw errToMain;
    }
  }

  async quitChrome() {
    try {
      await driver.quit();
    } catch (err) {
      console.log(err);
    }
  }

  async __checkRoutes(isForCleanUp) {
    let settingPage = 'https://ecolifepanel.epa.gov.tw/map/area.aspx';
    if (!isForCleanUp) {
      settingPage += '?tab=1';
    }
    let renewInfo = {isRequired: true, newTitle: undefined};
    let timeout = 5000;
    let trial = 0;
    let maxTrial = 5;
    while (true) {
      try {
        await driver.get(settingPage);
        let css_listTable = '#cphMain_UPList tr';
        let listTable = await driver.wait(until.elementsLocated(By.css(css_listTable)), timeout);
        // idx 1 represents first raw at listTable
        let idx_1stRow = 1;
        let titleColumn = await listTable[idx_1stRow].findElement(By.css('.cell-title'));
        let title = await titleColumn.getText();
        renewInfo.newTitle = await this.__generateTitle(isForCleanUp);
        console.log('the title should be: ' + renewInfo.newTitle);
        if (title === renewInfo.newTitle) {
          renewInfo.isRequired = false;
          return renewInfo;
        }

        let btnColumnAt1stRow = await listTable[idx_1stRow].findElements(By.css('.cell-large-actions'));
        let btns = await btnColumnAt1stRow[0].findElements(By.css('input'));

        // idx 0 represents the "view btn"
        let idx_btnViewRoute = 0;
        await btns[idx_btnViewRoute].click();
        let id_btnEdit = 'cphMain_btnEdit';
        await driver.wait(until.elementLocated(By.id(id_btnEdit)), timeout).click();
        return renewInfo;
      } catch (err) {
        if (trial < maxTrial) {
          trial++
        } else {
          let routeName = isForCleanUp ? '清理' : '巡檢';
          let discription = '檢查是否需更新' + routeName + '路線時發生錯誤';
          let errToThrow = await this.__checkError('__checkRoute', discription, err);
          throw errToThrow;
        }
      }
    }
  }

  async __generateTitle(isForCleanUp) {
    let yearROC = (CURRENT_DATE.getUTCFullYear() - 1911).toString();
    let month = (CURRENT_DATE.getUTCMonth() + 1) < 10 ? '0' + (CURRENT_DATE.getUTCMonth() + 1).toString() : (CURRENT_DATE.getUTCMonth() + 1).toString();
    let routeName = isForCleanUp ? '清理路線' : '巡檢路線';
    let timeout = 5000;
    try {
      let id_sideBar = 'cphMain_ucSidebar_txtNowBlog';
      let sideBar = await driver.wait(until.elementLocated(By.id(id_sideBar)), timeout);
      let sideBarFullName = await sideBar.getAttribute('value');
      let idx_ref = sideBarFullName.indexOf('里');
      let idx_begin = idx_ref - 2;
      let idx_end = idx_ref + 1;
      let villageName = sideBarFullName.substring(idx_begin, idx_end);
      return yearROC + '年' + month + '月-' + villageName + routeName; 
    } catch (err) {
      throw err;
    }
  }

  async __fillInRouteSetting(newTitle) {
    let lastClickInfo = {status: undefined};
    let clickTrial = 0;
    let trial = 0;
    let maxTrial = 5;
    while (true) {
      try {
        if (trial > 0 || clickTrial > 0) {
          await driver.navigate().refresh();
        }
        await this.__fillInRouteTitle(newTitle);
        let clickInfo = await this.__clickWhiteSquare(lastClickInfo);
        let shouldBreak = true;
        if (!clickInfo.successfullyClicked && clickTrial < maxTrial) {
          clickTrial++;
          lastClickInfo = clickInfo;
          shouldBreak = false;
        }
        if (shouldBreak) {
          await this.__switchUser();
          await this.__saveRoute();
          break;
        }
      } catch (errFromOrigin) {
        if (trial < maxTrial) {
          trial++;
        } else {
          throw errFromOrigin;
        }
      }
    }
  }
  
  async __fillInRouteTitle(newTitle) {
    let timeout = 5000;
    try {
      let id_tf_title = 'cphMain_txtAreaName';
      let tf_title = await driver.wait(until.elementLocated(By.id(id_tf_title)), timeout);
      await tf_title.clear();
      await tf_title.sendKeys(newTitle);
    } catch (err) {
      let errToThrow = await this.__checkError('__fillInRouteTitle', '更新路線標題時發生錯誤', err);
      throw errToThrow;
    }
  }
  
  async __clickWhiteSquare(lastClickInfo) {
    let tiemout = 10000;
    let trial = 0;
    let maxTrial = 5;
    while (true) {
      try {
        let squares = await this.__getWhiteSquares();
        // if the number of squares is even, add a point, else delete the last point.
        console.log('squares length before click: ' + squares.length);
        let actions = driver.actions();
        let shouldAddNewSquare = squares.length % 2 === 0;
        let adjustment;
        let x_offset;
        if (shouldAddNewSquare) {
          x_offset = this.__getRandomInt(100, 200);//300;//110 + 100 * clickTrial;//this.__getRandomInt(100, 200);
          if (typeof lastClickInfo.status !== 'undefined') {
            adjustment = Math.floor(lastClickInfo.x_offset / 2);
            x_offset =  lastClickInfo.x_offset + (lastClickInfo.status === 'too_short' ? adjustment : -adjustment);
          }
          console.log('x offset: ' + x_offset);
          console.log('adjustment: ' + adjustment);
          await actions.mouseMove(squares[0], {x: x_offset, y: 0}).click().perform();
        } else {
          // await squares[squares.length - 1].click();
          let idx_squareToDelete = await this.__isRoute() ? squares.length - 1 : squares.length - 2;
          await actions.mouseMove(squares[idx_squareToDelete]).click().perform();
        }
        let squaresAfterClick = await this.__getWhiteSquares();
        console.log('squares length after click: ' + squaresAfterClick.length);
        let clickInfo = {successfullyClicked: true};
        if (shouldAddNewSquare) {
          clickInfo.x_offset = x_offset;
          if (squaresAfterClick.length < squares.length) {
            clickInfo.status = 'too_short';
            clickInfo.successfullyClicked = false;
          } else if (squaresAfterClick.length === squares.length) {
            clickInfo.status = 'too_long';
            clickInfo.successfullyClicked = false;
          }
        }
        return clickInfo;
      } catch (err) {
        if (trial < maxTrial) {
          console.log('click White Square: ' + trial);
          console.log(err);
          trial++
        } else {
          let errToThrow = await this.__checkError('__fillInRouteTitle', '調整地圖路線時發生錯誤', err);
          throw errToThrow;
        }
      }
    }
  }

  async __isRoute() {
    try {
      let type = await driver.wait(until.elementLocated(By.id('cphMain_labModeType')));
      let typeStr = await type.getText();
      return typeStr.includes('路線');
    } catch (err) {
      throw err;
    }
  }

  async __getWhiteSquares() {
    let timeout = 5000;
    try {
      let css_squareSelector = '.leaflet-marker-pane img';
      let unfilteredImgs = await driver.wait(until.elementsLocated(By.css(css_squareSelector)), timeout);
      let squares = [];
      for (let i = 0; i < unfilteredImgs.length; i++) {
        let img_src = await unfilteredImgs[i].getAttribute('src');
        if (img_src.includes('square.png')) {
          squares.push(unfilteredImgs[i]);
        }
      }
      return squares;
    } catch (err) {
      throw err;
    }
  }
  
  async __switchUser() {
    let timeout = 5000;
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
      let errToThrow = await this.__checkError('__switchUser', '更新路線管理人時發生錯誤', err);
      throw errToThrow;
    }
  }

  async __saveRoute() {
    let timeout = 5000;
    try {
      let id_btnSaveRoute = 'cphMain_btnOk';
      await driver.wait(until.elementLocated(By.id(id_btnSaveRoute)), timeout).click();
    } catch (err) {
      let errToThrow = await this.__checkError('__saveRoute', '無法儲存更新過後的路線', err);
      throw errToThrow;
    }
  }

  /**
   *  The following is for upload image
   */
  async publishJournal(imageSet, isForCleanUp) {
    console.log('publishing-----------------------');
    let timeout = 5000;
    let trial = 0;
    let maxTrial = 5;
    while (true) {
      try {
        await this.__createJournal(imageSet, isForCleanUp);
        await this.__fillInAndPublishJournal(imageSet);
        
        // To check whether the journal is succesfully published
        await this.__checkPublishStatus();
        break;
        /* let finalAlert = await driver.wait(until.alertIsPresent(), timeout);
        let message = await finalAlert.getText();
        await finalAlert.accept();
        if (message.includes('已經發表成功')) {
          console.log('goooooooood');
          return true;
        } else if (message.includes('拍攝時間不符合')) {
          return false;
        } */
      } catch (errFromOrigin) {
        console.log('publish journal: ' + trial);
        console.log(errFromOrigin);
        let errToMain = errFromOrigin;
        errToMain.stage = 'publishJournal';
        if (errToMain.type === ERROR_TYPES.UNEXPECTED_ALERT || errToMain.type === ERROR_TYPES.UNKNOWN) {
          throw errToMain;
        }
        if (trial < maxTrial) {
          trial++
        } else {
          throw errToMain;
        }
      }
    }
  }

  async __createJournal(imageSet, isForCleanUp) {
    try {
      await this.__goToPublishPage(isForCleanUp);
      await this.__selectTimeRange(imageSet, isForCleanUp);
      await this.__selectRoute();
      await this.__clickJournalCreationButton(isForCleanUp);
    } catch (errFromOrigin) {
      throw errFromOrigin;
    }
  }

  async __goToPublishPage(isForCleanUp) {
    let timeout = 5000;
    let page = 'https://ecolifepanel.epa.gov.tw/journal/';
    page += isForCleanUp ? 'clear.aspx' : 'inspect.aspx';
    try {
      await driver.get(page);
      await this.__acceptAlertAndGetText();
    } catch(err) {
      let errToThrow = await this.__checkError('__goToPublishPage', '無法進入發表頁面', err);
      throw errToThrow;
    }
  }

  async __selectTimeRange(imageSet, isForCleanUp) {
    let timeout = 5000;
    try {
      let sutableTimeRange = ImagesProcessor.getSutableTimeRange(imageSet);
      console.log('sutable time range is: ' + sutableTimeRange);
      
      // Initialize date time css selectors
      let css_yearOptions = '#cphMain_ucDateTime_cboYear option';
      let css_monthOptions = '#cphMain_ucDateTime_cboMonth option';
      let css_dateOptions = '#cphMain_ucDateTime_cboDay option';
      let css_beginHoursOptions = '#cphMain_ucDateTime_cboHour option';
      let css_beginMinutesOptions = '#cphMain_ucDateTime_cboMinute option';
      let css_endHoursOptions = '#cphMain_ucDateTime_cboHourEnd option';
      let css_endMinutesOptions = '#cphMain_ucDateTime_cboMinuteEnd option';
      let css_cleanUpOnly_endDateOptions = '#cphMain_ucDateTime_cboDayEnd option';
      let css_dateTimeSelectors = [css_yearOptions, css_monthOptions, css_dateOptions,
                                    css_beginHoursOptions, css_beginMinutesOptions, css_endHoursOptions, css_endMinutesOptions,
                                      css_cleanUpOnly_endDateOptions];
      let selectorsLength = isForCleanUp ? css_dateTimeSelectors.length : css_dateTimeSelectors.length - 1;
      for (let idx_selector = 0; idx_selector < selectorsLength; idx_selector++) {
        let dateTimeOptions = await driver.wait(until.elementsLocated(By.css(css_dateTimeSelectors[idx_selector])), timeout);
        for (let idx_option = 0; idx_option < dateTimeOptions.length; idx_option++) {
          let value = await dateTimeOptions[idx_option].getAttribute('value');
          if (value === sutableTimeRange[idx_selector].toString()) {
            await dateTimeOptions[idx_option].click();
            break;
          }
        }
      }
    } catch (err) {
      let errToThrow = await this.__checkError('__selectTimeRange', '選擇日期時發生錯誤', err);
      throw errToThrow;
    }
  }

  async __selectRoute() {
    let timeout = 5000;
    try {
      let css_routeOptions = '#cphMain_cboClear option';
      let routeOptions = await driver.wait(until.elementsLocated(By.css(css_routeOptions)), timeout);
      let idx_firstRoute = 1;
      await routeOptions[idx_firstRoute].click();
    } catch (err) {
      let errToThrow = await this.__checkError('__selectRoute', '選擇路線表單時發生錯誤', err);
      throw errToThrow;
    }
  }

  async __clickJournalCreationButton(isForCleanUp) {
    let timeout = 5000;
    try {
      let id_btn_createJournal = 'cphMain_btnOk';
      await driver.wait(until.elementLocated(By.id(id_btn_createJournal)), timeout).click();
      /* let alert = await driver.wait(until.alertIsPresent(), timeout);
      await alert.accept(); */
      await this.__acceptAlertAndGetText();

      // If the date is a week before the current date
		  // there will be another popup alert.
      if (!isForCleanUp) {
        try {
          /* alert = await driver.wait(until.alertIsPresent(), timeout);
          await alert.accept(); */
          await this.__acceptAlertAndGetText();
        } catch (err) {
          console.log('Since images are not taken a week before today, there is no another alert');
        }
      }
    } catch (err) {
      let errToThrow = await this.__checkError('__clickJournalCreationButton', '無法轉跳至建立新日誌的頁面', err);
      throw errToThrow;
    }
  }

  async __fillInAndPublishJournal(imageSet) {
    let trial = 0;
    let maxTrial = 5;
    while (true) {
      try {
        await this.__clickTrashIcon();
        await this.__clickRandomWhiteSquare();
        await this.__selectArea();
        await this.__uplaodImageSet(imageSet);
        await this.__clickJournalPublishButton();
        break;
      } catch (errFromOrigin) {
        console.log(errFromOrigin);
        if (errFromOrigin.type === ERROR_TYPES.UNEXPECTED_ALERT) {
          throw errFromOrigin;
        }
        if (trial < maxTrial) {
          await driver.navigate().refresh();
          trial++;
        } else {
          throw errFromOrigin;
        }
      }
    }
  }

  async __clickTrashIcon() {
    let timeout = 5000;
    let trial = 0;
    let maxTrial = 5;
    try {
      let id_btn_iconSelection = 'cphMain_btnIcon';
      await driver.wait(until.elementLocated(By.id(id_btn_iconSelection)), timeout).click();
      let xpath_trashIcon = '//*[@id="cphMain_ucIcon_divEcolife"]/ul[2]/li[10]/a';
      await driver.wait(until.elementLocated(By.xpath(xpath_trashIcon)), timeout).click();
    } catch (err) {
      let errToThrow = await this.__checkError('__clickTrashIcon', '點擊紅色的垃圾小圖示時發生錯誤', err);
      throw errToThrow;
    }
  }

  async __clickRandomWhiteSquare() {
    try {
      let squares = await this.__getWhiteSquares();
      let idx_randomSquare = this.__getRandomInt(0, squares.length - 1);//Math.floor(Math.random() * Math.floor(squares.length));
      console.log('random square is: ' + idx_randomSquare);
      let actions = driver.actions();
      await actions.mouseMove(squares[idx_randomSquare]).click().perform();
    } catch (err) {
      let errToThrow = await this.__checkError('__clickRandomWhiteSquare', '點擊地圖路線上的白點時發生錯誤', err);
      throw errToThrow;
    }
  }

  __getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async __selectArea() {
    let timeout = 5000;
    try {
      let css_areaOptions = '#cphMain_cboLocality option';
      let areaOptions = await driver.wait(until.elementsLocated(By.css(css_areaOptions)), timeout);
      let idx_road = 8;
      await areaOptions[idx_road].click();
    } catch (err) {
      let errToThrow = await this.__checkError('__selectArea', '選擇垃圾所在地的類別時發生錯誤', err);
      throw errToThrow;
    }
  }

  async __uplaodImageSet(imageSet) {
    let timeout = 5000;
    try {
      let id_btn_dirtyImageSelection = 'cphMain_ucImageUpload_1_fup';
      let id_btn_cleanImageSelection = 'cphMain_ucImageUpload_3_fup';
      await driver.wait(until.elementLocated(By.id(id_btn_dirtyImageSelection)), timeout).sendKeys(imageSet.dirty.uploadingPath);
      await driver.wait(until.elementLocated(By.id(id_btn_cleanImageSelection)), timeout).sendKeys(imageSet.clean.uploadingPath);
    } catch (err) {
      let errToThrow = await this.__checkError('__uplaodImageSet', '上傳照片時發生錯誤', err);
      throw errToThrow;
    }
  }

  async __clickJournalPublishButton() {
    let timeout = 5000;
    try {
      let id_btn_journalPublish = 'cphMain_btnPost';
      await driver.wait(until.elementLocated(By.id(id_btn_journalPublish)), timeout).click();
      /* let alert = await driver.wait(until.alertIsPresent(), timeout);
      await alert.accept(); */
      await this.__acceptAlertAndGetText();
    } catch (err) {
      let errToThrow = await this.__checkError('__clickJournalPublishButton', '點擊發表日誌的按鈕時發生錯誤', err);
      throw errToThrow;
    }
  }

  async __checkPublishStatus() {
    let timeout = 5000;
    let errToThrow;
    try {
      // To check whether the journal is succesfully published
      /* let finalAlert = await driver.wait(until.alertIsPresent(), timeout);
      let message = await finalAlert.getText();
      await finalAlert.accept(); */
      let alertMessage = await this.__acceptAlertAndGetText();
      if (!alertMessage.includes('已經發表成功')) {
        let discription = '日誌發表完畢後的最終檢查階段發生錯誤，因為出現不明警示視窗，內容為： ' + alertMessage;
        errToThrow = await this.__checkError('__checkPublishStatus', discription);
        errToThrow.type = ERROR_TYPES.UNEXPECTED_ALERT;
        throw errToThrow;
      }
    } catch (err) {
      errToThrow = await this.__checkError('__checkPublishStatus', '日誌發表完畢後的最終檢查階段發生錯誤', err);
      throw errToThrow;
    }
  }

  async __deleteJournalDraft() {
    let timeout = 5000;
    try {
      let id_btn_draftDeletion = 'cphMain_btnDelete';
      await driver.wait(until.elementLocated(By.id(id_btn_draftDeletion)), timeout).click();
      let alert = await driver.wait(until.alertIsPresent(), timeout);
      await alert.accept();
      alert = await driver.wait(until.alertIsPresent(), timeout);
      await alert.accept();
    } catch (err) {
      throw err;
    }
  }

  async deletePreviousDrafts() {
    let timeout = 5000;
    let trial = 0;
    let maxTrial = 5;
    let isFirstTime = true;
    while (true) {
      try {
        if (isFirstTime) {
          let page = 'https://ecolifepanel.epa.gov.tw/journal/inspectlist.aspx';
          await driver.get(page);
          isFirstTime = false;
        }
        let css_listTable = '.gray';
        let listTable = await driver.wait(until.elementsLocated(By.css(css_listTable)), timeout);
        if (listTable.length === 0) {
          break;
        }
        let row = await listTable[0].findElements(By.css('.cell-actions'));
        let btn_view = await row[0].findElements(By.css('input'));
        await btn_view[0].click();
        let windowHandles = await driver.getAllWindowHandles();
        console.log(windowHandles.length);        
        await driver.close();
        await driver.switchTo().window(windowHandles[1]);
        //console.log(await driver.getTitle());
        let id_btn_draftDeletion = 'cphMain_btnDelete';
        await driver.wait(until.elementLocated(By.id(id_btn_draftDeletion)), timeout).click();
        let alert = await driver.wait(until.alertIsPresent(), timeout);
        await alert.accept();
        alert = await driver.wait(until.alertIsPresent(), timeout);
        await alert.accept();
      } catch (err) {
        console.log(err);
        if (trial < maxTrial) {
          console.log('trial: ' + trial);
          trial++;
        } else {
          break;
        }
      }
    }
  }

  async __checkError(functionName, discription, err) {
    let errToThrow = {
      errOrigin: functionName, 
      discription: discription,
      type: ERROR_TYPES.TIMEOUT,
      originalErr: err};
    if (err instanceof SeleniumError.UnexpectedAlertOpenError) {
      errToThrow.type = ERROR_TYPES.UNEXPECTED_ALERT;
      let alert = await driver.switchTo().alert();
      let alertMessage = await alert.getText();
      await alert.accept();
      let wrongLoginInfo = '很抱歉，您輸入的帳號無法登入，可能原因為帳號輸入錯誤';
      if (alertMessage.includes(wrongLoginInfo)) {
        errToThrow.type = ERROR_TYPES.WRONG_ID_PASSWD;
      }
    }
    return errToThrow;
  }

  async __acceptAlertAndGetText() {
    let timeout = 5000;
    try {
      let alert = await driver.wait(until.alertIsPresent(), timeout);
      let alertMessage = await alert.getText();
      await alert.accept();
      return alertMessage;
    } catch (err) {
      throw err;
    }
  }
}

module.exports= AutoModel;
