const ImagesProcessor = require(__base + 'js/utility/imagesProcessor');
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
        await this.__fillUpIdPasswd(testID, testPasswd);

        // try click "go to admin button"
        await this.__goToAdmin();
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

  async __fillUpIdPasswd(userID, userPasswd) {
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

  async __goToAdmin() {
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
  async renewRoute(isForCleanUp) {
    let settingPage = 'https://ecolifepanel.epa.gov.tw/map/area.aspx';
    if (!isForCleanUp) {
      settingPage += '?tab=1';
    }
    let trial = 0;
    let maxTrial = 5;
    while (trial < maxTrial) {
      try {
        // go to setting page
        console.log('Go to setting page');
        await this.__goToSettingPageHelper(settingPage);
  
        // fill up new title
        console.log('Fill up new title');
        await this.__fillUpTitleHelper(isForCleanUp);
  
        // switch user
        console.log('Try switch user');
        await this.__switchUserHelper();
  
        // click white square png
        console.log('Try click a square.png');
        await this.__clickWhiteSquareHelper();
        break;
      } catch (err) {
        console.log('============== final catch ==============');
        console.log('catch times: ' + trial);
        console.log(err);
        trial++;
      }
    }
  }

  async __goToSettingPageHelper(settingPage) {
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
  
  async __fillUpTitleHelper(isForCleanUp) {
    let timeout = 5000;
    try {
      let title_inspect = '107/02-崇文里巡檢路線';
      let title_cleanUp = '107/02-崇文里清理路線';
      let titleToBeFilled = isForCleanUp ? title_cleanUp : title_inspect;
      let id_tf_title = 'cphMain_txtAreaName';
      let tf_title = await this.driver.wait(until.elementLocated(By.id(id_tf_title)), timeout);
      await tf_title.clear();
      await tf_title.sendKeys(titleToBeFilled);
    } catch (err) {
      throw err;
    }
  }
  
  async __clickWhiteSquareHelper() {
    let tiemout = 10000;
    let trial = 0;
    let maxTrial = 5;
    while (true) {
      try {
        let squares = await this.__getWhiteSquares();
        // if the number of squares is even, add a point, else delete the last point.
        console.log('squares length: ' + squares.length);
        let actions = this.driver.actions();
        if (squares.length % 2 === 0) {
          await actions.mouseMove(squares[0], {x: 5, y: 0}).click().perform();
        } else {
          // await squares[squares.length - 1].click();
          await actions.mouseMove(squares[squares.length - 1]).click().perform();
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

  async __getWhiteSquares() {
    let timeout = 5000;
    try {
      let css_squareSelector = '.leaflet-marker-pane img';
      let unfilteredImgs = await this.driver.wait(until.elementsLocated(By.css(css_squareSelector)), timeout);
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
  
  async __switchUserHelper() {
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
      throw err;
    }
  }

  /**
   *  The following is for upload image
   */
  async publishJournal(imageSet, isForCleanUp) {
    let trial = 0;
    let maxTrial = 5;
    while (trial < maxTrial) {
      try {
        await this.__goToPublishPage(isForCleanUp);
        await this.__selectTimeRange(imageSet, isForCleanUp);
        await this.__selectRoute();
        await this.__clickJournalCreationButton(isForCleanUp);
        await this.__selectTrashIcon();
        await this.__clickRandomWhiteSquare();
        await this.__selectArea();
        await this.__uplaodImageSet(imageSet);
        await this.__deleteJournalDraft();
        break;
      } catch (err) {
        console.log('publish journal: ' + trial);
        console.log(err);
        trial++
      }
    }
  }

  async __goToPublishPage(isForCleanUp) {
    let timeout = 5000;
    let page = 'https://ecolifepanel.epa.gov.tw/journal/';
    page += isForCleanUp ? 'clear.aspx' : 'inspect.aspx';
    try {
      await this.driver.get(page);
      let alert = await this.driver.wait(until.alertIsPresent(), timeout);
      await alert.accept();
    } catch(err) {
      console.log('__goToPublishPage');
      console.log(err);
      throw err;
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
                                    css_beginHoursOptions, css_beginMinutesOptions, css_endHoursOptions,
                                      css_endMinutesOptions, css_cleanUpOnly_endDateOptions];
      let selectorsLength = isForCleanUp ? css_dateTimeSelectors.length : css_dateTimeSelectors.length - 1;
      for (let idx_selector = 0; idx_selector < selectorsLength; idx_selector++) {
        let dateTimeOptions = await this.driver.wait(until.elementsLocated(By.css(css_dateTimeSelectors[idx_selector])), timeout);
        for (let idx_option = 0; idx_option < dateTimeOptions.length; idx_option++) {
          let value = await dateTimeOptions[idx_option].getAttribute('value');
          if (value === sutableTimeRange[idx_selector].toString()) {
            await dateTimeOptions[idx_option].click();
            break;
          }
        }
      }
    } catch (err) {
      console.log('__selectTimeRange');
      throw err;
    }
  }

  async __selectRoute() {
    let timeout = 5000;
    try {
      let css_routeOptions = '#cphMain_cboClear option';
      let routeOptions = await this.driver.wait(until.elementsLocated(By.css(css_routeOptions)), timeout);
      let idx_firstRoute = 1;
      await routeOptions[idx_firstRoute].click();
    } catch (err) {
      console.log('__selectRoute');
      throw err;
    }
  }

  async __clickJournalCreationButton(isForCleanUp) {
    let timeout = 5000;
    try {
      let id_btn_createJournal = 'cphMain_btnOk';
      await this.driver.wait(until.elementLocated(By.id(id_btn_createJournal)), timeout).click();
      let alert = await this.driver.wait(until.alertIsPresent(), timeout);
      await alert.accept();

      // If the date is a week before the current date
		  // there will be another popup alert.
      if (!isForCleanUp) {
        try {
          alert = await this.driver.wait(until.alertIsPresent(), timeout);
          await alert.accept();
        } catch (err) {
          console.log('Since images are not taken a week before today, there is no another alert');
        }
      }
    } catch (err) {
      console.log('__clickJournalCreationButton');
      throw err;
    }
  }

  async __selectTrashIcon() {
    let timeout = 5000;
    let trial = 0;
    let maxTrial = 5;
    while (true) {
      try {
        let id_btn_iconSelection = 'cphMain_btnIcon';
        await this.driver.wait(until.elementLocated(By.id(id_btn_iconSelection)), timeout).click();
        let xpath_trashIcon = '//*[@id="cphMain_ucIcon_divEcolife"]/ul[2]/li[10]/a';
        await this.driver.wait(until.elementLocated(By.xpath(xpath_trashIcon)), timeout).click();
        break;
      } catch (err) {
        if (trial < maxTrial) {
          console.log(err);
          await this.driver.navigate().refresh();
          trial++;
        } else {
          console.log('__selectTrashIcon');
          throw err;
        }
      }
    }
  }

  async __clickRandomWhiteSquare() {
    try {
      let squares = await this.__getWhiteSquares();
      let idx_randomSquare = Math.floor(Math.random() * Math.floor(squares.length));
      console.log('random square is: ' + idx_randomSquare);
      let actions = this.driver.actions();
      await actions.mouseMove(squares[idx_randomSquare]).click().perform();
    } catch (err) {
      console.log('err occurred: ' + i);
      throw err;
    }
  }

  async __selectArea() {
    let timeout = 5000;
    try {
      let css_areaOptions = '#cphMain_cboLocality option';
      let areaOptions = await this.driver.wait(until.elementsLocated(By.css(css_areaOptions)), timeout);
      let idx_road = 8;
      await areaOptions[idx_road].click();
    } catch (err) {
      throw err;
    }
  }

  async __uplaodImageSet(imageSet) {
    let timeout = 5000;
    try {
      let id_btn_dirtyImageSelection = 'cphMain_ucImageUpload_1_fup';
      let id_btn_cleanImageSelection = 'cphMain_ucImageUpload_3_fup';
      await this.driver.wait(until.elementLocated(By.id(id_btn_dirtyImageSelection)), timeout).sendKeys(imageSet.dirty.path);
      await this.driver.wait(until.elementLocated(By.id(id_btn_cleanImageSelection)), timeout).sendKeys(imageSet.clean.path);
    } catch (err) {
      throw err;
    }
  }

  async __deleteJournalDraft() {
    let timeout = 5000;
    try {
      let id_btn_draftDeletion = 'cphMain_btnDelete';
      await this.driver.wait(until.elementLocated(By.id(id_btn_draftDeletion)), timeout).click();
      let alert = await this.driver.wait(until.alertIsPresent(), timeout);
      await alert.accept();
      alert = await this.driver.wait(until.alertIsPresent(), timeout);
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
          await this.driver.get(page);
          isFirstTime = false;
        }
        let css_listTable = '.gray';
        let listTable = await this.driver.wait(until.elementsLocated(By.css(css_listTable)), timeout);
        if (listTable.length === 0) {
          break;
        }
        let row = await listTable[0].findElements(By.css('.cell-actions'));
        let btn_view = await row[0].findElements(By.css('input'));
        await btn_view[0].click();
        let windowHandles = await this.driver.getAllWindowHandles();
        console.log(windowHandles.length);        
        await this.driver.close();
        await this.driver.switchTo().window(windowHandles[1]);
        //console.log(await this.driver.getTitle());
        let id_btn_draftDeletion = 'cphMain_btnDelete';
        await this.driver.wait(until.elementLocated(By.id(id_btn_draftDeletion)), timeout).click();
        let alert = await this.driver.wait(until.alertIsPresent(), timeout);
        await alert.accept();
        alert = await this.driver.wait(until.alertIsPresent(), timeout);
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
}

module.exports= AutoModel;
