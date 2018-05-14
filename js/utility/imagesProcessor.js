const path = require('path');
const fastExif = require('fast-exif');
const piexif = require(path.normalize(__base + 'js/utility/piexif.js'));
const sharp = require('sharp');
const fs = require('fs');
const {app} = require('electron');
const MODIFIED_IMGS_FOLDER_PATH = path.normalize(app.getPath('userData') + '/modifiedImgs/');

class ImagesProcessor {
  static async isValidImage(comparedInfo) {
    let imgInfo = {isValid: true, dateTimeOriginal: undefined, error: undefined};
    try {
      if (await this.__isValidFormat(comparedInfo.newImgPath, 'jpeg') || await this.__isValidFormat(comparedInfo.newImgPath, 'png')) {
        if (!comparedInfo.dateChanging) {
          // read new image's exif
          console.log('asdfsdfsfs');
          let newImgExif = await fastExif.read(comparedInfo.newImgPath);

          // Check whether this new image's exif exists DateTimeOrigianl
          // If it does not exist, the line below will throw a error
          newImgExif.exif.DateTimeOriginal.getTime();
          imgInfo.dateTimeOriginal = newImgExif.exif.DateTimeOriginal;
          if (typeof comparedInfo.comparedImgDateTimeOriginal !== 'undefined') {
            console.log('aaaaaaaaaaaaaaaa');
            let onTheSameDay = await this.__areOnTheSameDay(imgInfo.dateTimeOriginal, comparedInfo.comparedImgDateTimeOriginal);
            if (!onTheSameDay) {
              imgInfo.isValid = false;
              let chineseImgType = comparedInfo.comparedImgType === 'dirty' ? '有垃圾' : '沒垃圾';
              imgInfo.error = '照片日期與「' + chineseImgType + '」的照片不同';
            }
          }
        }
      } else {
        imgInfo.isValid = false;
        imgInfo.error = '只接受.jpg, .png的照片格式';
      }
    } catch (err) {
      console.log(err);
      imgInfo.isValid = false;
      imgInfo.error = '日期資訊不存在';
    } finally {
      return imgInfo;
    }
  }

  static async __isValidFormat(imgPath, imgFormat) {
    try {
      let metadata = await sharp(imgPath).metadata();
      return metadata.format === imgFormat;
    } catch (err) {
      console.log('is not ' + imgFormat);
      return false;
    }
  }

  static async __areOnTheSameDay(newImgDateTimeOriginal, comparedImgDateTimeOriginal) {
    console.log('new datetime: ' + newImgDateTimeOriginal);
    console.log('old datetime: ' + comparedImgDateTimeOriginal);
    if (newImgDateTimeOriginal.getUTCFullYear() === comparedImgDateTimeOriginal.getUTCFullYear() &&
        newImgDateTimeOriginal.getUTCMonth() === comparedImgDateTimeOriginal.getUTCMonth() &&
        newImgDateTimeOriginal.getUTCDate() === comparedImgDateTimeOriginal.getUTCDate()) {
      return true;
    } else {
      return false;
    }
  }

  static async getBase64(imgPath, withBase64Header) {
    try {
      let imgWidth = undefined;
      let imgHeight = 300;
      let rawImgData = await sharp(imgPath).resize(imgWidth, imgHeight).toBuffer();
      let base64Header = 'data:image/jpeg;base64,';
      let imgBase64 = withBase64Header ? base64Header + rawImgData.toString('base64') : rawImgData.toString('base64');
      return imgBase64;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

  static async modifyImageData(imageData, setting) {
    // default paths
    let uploadingPath = imageData.sourcePath;
    let dateTimeOriginal = imageData.dateTimeOriginal;
    try {
      if (setting.compressing || setting.dateChanging) {
        let jpgBinary = await this.__getModifiedJpgBinary(imageData.sourcePath, setting);
        let imgName = new Date().getTime().toString() + '.jpg';
        let outputPath = this.__writeJpgToModifiedImgsFolder(imgName, jpgBinary);
        if (fs.existsSync(outputPath)) {
          console.log('heeeeeeee');
          uploadingPath = outputPath;
          let newImgExif = await fastExif.read(uploadingPath);
          console.log(newImgExif);
          dateTimeOriginal = newImgExif.exif.DateTimeOriginal; 
        }
      }
      let packet = {imgPath: uploadingPath, dateTimeOriginal: dateTimeOriginal};
      imageData.addUploadingData(packet);
    } catch (err) {
      console.log('heeeeeeeeeeelooooooooooo');
      console.log(err);
    }
  }

  static async __getModifiedJpgBinary(imgPath, setting) {
    try {
      let jpgData;
      let jpgBinary;
      if (setting.compressing || await this.__isValidFormat(imgPath, 'png')) {
        let imgWidth = undefined;
        let imgHeight = 300;
        jpgData = await sharp(imgPath).withMetadata().resize(imgWidth, imgHeight).jpeg().toBuffer();
        console.log('compressing');
      } else {
        jpgData = fs.readFileSync(imgPath);
      }
      if (setting.dateChanging) {
        jpgBinary = this.__getDateChangedJpgBinary(jpgData.toString('binary'), setting.pickedDate);
      } else {
        jpgBinary = jpgData;
        console.log('no dateChanging');
      }
      return jpgBinary;
    } catch (err) {
      throw err;
    }
  }

  static __getDateChangedJpgBinary(jpgBinary, pickedDate) {
    let formatedTime = this.__getFormatedTime(pickedDate);
    let zeroth = {};
    let exif = {};
    let gps = {};
    zeroth[piexif.ImageIFD.Make] = 'Make';
    zeroth[piexif.ImageIFD.XResolution] = [777, 1];
    zeroth[piexif.ImageIFD.YResolution] = [777, 1];
    zeroth[piexif.ImageIFD.Software] = 'SONY';
    exif[piexif.ExifIFD.DateTimeDigitized] = formatedTime;
    exif[piexif.ExifIFD.DateTimeOriginal] = formatedTime;//'2018:02:09 10:10:00';
    exif[piexif.ExifIFD.LensMake] = 'SONY';
    exif[piexif.ExifIFD.Sharpness] = 777;
    exif[piexif.ExifIFD.LensSpecification] = [[1, 1], [1, 1], [1, 1], [1, 1]];
    gps[piexif.GPSIFD.GPSVersionID] = [7, 7, 7, 7];
    gps[piexif.GPSIFD.GPSDateStamp] = '1999:99:99 99:99:99';
    let exifObj = {'0th':zeroth, 'Exif':exif, 'GPS':gps};
    try {
      let exifbytes = piexif.dump(exifObj);
      let newData = piexif.insert(exifbytes, jpgBinary);
      let newJpg = new Buffer(newData, 'binary');
      return newJpg;
    } catch (err) {
      throw err;
    }
  }

  static __writeJpgToModifiedImgsFolder(imgName, jpgBinary) {
    try {
      let outputPath = MODIFIED_IMGS_FOLDER_PATH + imgName;
      fs.writeFileSync(outputPath, jpgBinary);
      return outputPath;
    } catch (err) {
      throw err;
    }
  }

  static __getFormatedTime(pickedDate) {
    console.log('formated: ' + typeof pickedDate);
    let timeShift = 8 * 60 * 60 * 1000;
    let formatedTime = pickedDate.getUTCFullYear().toString() + ':';
    let dateInfo = [pickedDate.getUTCMonth()+1, pickedDate.getUTCDate(),
                      pickedDate.getUTCHours(), pickedDate.getUTCMinutes(), pickedDate.getUTCSeconds()];
    for (let i = 0; i < dateInfo.length; i++) {
      let formatedStr = (dateInfo[i] < 10) ? '0' + dateInfo[i].toString() : dateInfo[i].toString();
      if (i === 1) {
        formatedStr += ' ';
      } else if (i < dateInfo.length - 1) {
        formatedStr += ':';
      }
      formatedTime += formatedStr;
    }
    return formatedTime;
  }

  static async compressImage(imgPath) {
    let imgWidth = undefined;
    let imgHeight = 300;
    let rawJpegData = sharp(imgPath).resize(imgWidth, imgHeight).jpeg().withMetadata()
      .toBuffer((err, data, info) => {
        var zeroth = {};
        var exif = {};
        var gps = {};
        zeroth[piexif.ImageIFD.Make] = "Make";
        zeroth[piexif.ImageIFD.XResolution] = [777, 1];
        zeroth[piexif.ImageIFD.YResolution] = [777, 1];
        zeroth[piexif.ImageIFD.Software] = "SONY";
        exif[piexif.ExifIFD.DateTimeOriginal] = "2018:02:09 10:10:00";
        exif[piexif.ExifIFD.LensMake] = "SONY";
        exif[piexif.ExifIFD.Sharpness] = 777;
        exif[piexif.ExifIFD.LensSpecification] = [[1, 1], [1, 1], [1, 1], [1, 1]];
        gps[piexif.GPSIFD.GPSVersionID] = [7, 7, 7, 7];
        gps[piexif.GPSIFD.GPSDateStamp] = "1999:99:99 99:99:99";
        var exifObj = {"0th":zeroth, "Exif":exif, "GPS":gps};
        var exifbytes = piexif.dump(exifObj);

        var newData = piexif.insert(exifbytes, data.toString('binary'));
        var newJpeg = new Buffer(newData, "binary");
        let outputImgName = 'ggininder.jpg'
        fs.writeFileSync(outputImgName, newJpeg);
    });
    /* sharp(imgPath).jpeg({quality: 10}).withMetadata().toFile('mlgb.jpg', function(err, info){
      console.log(info);
    }); */
   /*  fs.writeFile("pngTojpg.jpg", await this.getBase64(imgPath, false), 'base64', function(err) {
      console.log(err);
    }); */
  }

  /**
   * Compare dirty and clean images' DateTimeOriginal and return a suitable time range
   */
  static getSutableTimeRange(imageSet) {
    let earlyTime = imageSet.clean.dateTimeOriginal;
    let laterTime = imageSet.dirty.dateTimeOriginal;
    if (earlyTime > laterTime) {
      let tempTime = earlyTime;
      earlyTime = laterTime;
      laterTime = tempTime;
    }
    let yearTheImgTaken = laterTime.getUTCFullYear();
    let monthTheImgTaken = laterTime.getUTCMonth() + 1;
    let dateTheImgTaken = laterTime.getUTCDate();
    let beginHours = 8;
    let beginMinutes = 0;
    let endHours = 17;
    let endMinutes = 30;
    let cleanUpOnly_endDate = dateTheImgTaken;
    let sutableTimeRange = [yearTheImgTaken, monthTheImgTaken, dateTheImgTaken,
                              beginHours, beginMinutes, endHours, endMinutes, cleanUpOnly_endDate];
    let idx_beginHours = 3;
    if (earlyTime.getUTCHours() < sutableTimeRange[idx_beginHours]) {
      sutableTimeRange[idx_beginHours] = earlyTime.getUTCHours();
    }
    let idx_endHours = 5;
    let idx_endMinutes = 6;
    if (laterTime.getUTCHours() >= sutableTimeRange[idx_endHours]) {
      sutableTimeRange[idx_endHours] = laterTime.getUTCHours();
      if (laterTime.getUTCMinutes() >= sutableTimeRange[idx_endMinutes]) {
        sutableTimeRange[idx_endMinutes] = 59;
      }
    }
    return sutableTimeRange;
  }

  static deleteModifiedImages() {
    try {
      let images = fs.readdirSync(MODIFIED_IMGS_FOLDER_PATH);
      for (let i = 0; i < images.length; i++) {
        console.log(i);
        let image = MODIFIED_IMGS_FOLDER_PATH + images[i];
        console.log(image);
        fs.unlinkSync(image);
      }
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = ImagesProcessor;