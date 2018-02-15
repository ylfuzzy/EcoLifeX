const fastExif = require('fast-exif');
const piexif = require('./piexif.js');
const sharp = require('sharp');
const fs = require('fs');
const MODIFIED_IMGS_FOLDER_PATH = __base + 'modifiedImgs/';

class ImagesProcessor {
  static async isValidImage(newImgPath, comparedImgDateTimeOriginal) {
    let imgInfo = {isValid: true, dateTimeOriginal: undefined, error: undefined};
    try {
      // read new image's exif
      let newImgExif = await fastExif.read(newImgPath);

      // Check whether this new image's exif exists DateTimeOrigianl
      // If it does not exist, the line below will throw a error
      newImgExif.exif.DateTimeOriginal.getTime();
      imgInfo.dateTimeOriginal = newImgExif.exif.DateTimeOriginal;

      if (typeof comparedImgDateTimeOriginal !== 'undefined') {
        let onTheSameDay = await this.__areOnTheSameDay(imgInfo.dateTimeOriginal, comparedImgDateTimeOriginal);
        if (!onTheSameDay) {
          imgInfo.isValid = false;
          imgInfo.error = 'are not on the same day';
        }
      }
    } catch (err) {
      console.log(err);
      imgInfo.isValid = false;
      imgInfo.error = 'cannot read DateTimeOriginal';
    } finally {
      return imgInfo;
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

  /* static async modifyImages(imageSet, options) {
    let zeroth = {};
    let exif = {};
    let gps = {};
    zeroth[piexif.ImageIFD.Make] = 'Make';
    zeroth[piexif.ImageIFD.XResolution] = [777, 1];
    zeroth[piexif.ImageIFD.YResolution] = [777, 1];
    zeroth[piexif.ImageIFD.Software] = 'SONY';
    exif[piexif.ExifIFD.DateTimeOriginal] = this.__getModifiedTime();//'2018:02:09 10:10:00';
    exif[piexif.ExifIFD.LensMake] = 'SONY';
    exif[piexif.ExifIFD.Sharpness] = 777;
    exif[piexif.ExifIFD.LensSpecification] = [[1, 1], [1, 1], [1, 1], [1, 1]];
    gps[piexif.GPSIFD.GPSVersionID] = [7, 7, 7, 7];
    gps[piexif.GPSIFD.GPSDateStamp] = '1999:99:99 99:99:99';
    let exifObj = {'0th':zeroth, 'Exif':exif, 'GPS':gps};
    let imgWidth = undefined;
    let imgHeight = 300;
    try {
      if (settingOptins.dateChanging && options.compressing) {
        // Deal with dirty image
        let compressedJpgData = await sharp(imageSet.dirty.path).resize(imgWidth, imgHeight).jpeg().withMetadata().toBuffer();
        let exifbytes = piexif.dump(exifObj);
        let newData = piexif.insert(exifbytes, compressedJpgData.toString('binary'));
        let newJpg = new Buffer(newData, 'binary');
        let outputPath = modifiedImgsFolderPath + options.modifiedImgsName.dirty;
        fs.writeFileSync(outputPath, newJpg);

        // After writing file to the path, we need to update the pathToUpload & sourcePath in the imageData

      }
    } catch (err) {
      console.log(err);
    }
  } */

  /* static async modifyImageData(imageData, options) {
    // default paths
    let sourcePath = imageData.previewPath;
    let uploadingPath = imageData.previewPath;
    try {
      if (options.dateChanging && options.compressing) {
        // Deal with dirty image
        let compressedJpgBinary = await this.__getCompressedJpgData(imageData.previewPath, 'binary');
        let dateChangedJpgBinary = this.__getDateChangedJpgBinary(compressedJpgBinary);
        let imgName = new Date().getTime().toString() + '.jpg';
        let outputPath = this.__writeJpgToModifiedImgsFolder(imgName, dateChangedJpgBinary);
        if (fs.existsSync(outputPath)) {
          //imageData.addModifiedData(imageData.previewPath, outputPath);
          uploadingPath = outputPath;
        }
      }
      imageData.addModifiedData(sourcePath, uploadingPath);
    } catch (err) {
      console.log(err);
    }
  } */

  static async modifyImageData(imageData, options) {
    // default paths
    let uploadingPath = imageData.previewPath;
    try {
      if (options.dateChanging && options.compressing) {
        // Deal with dirty image
        let compressedJpgBinary = await this.__getCompressedJpgData(imageData.previewPath, 'binary');
        let dateChangedJpgBinary = this.__getDateChangedJpgBinary(compressedJpgBinary);
        let imgName = new Date().getTime().toString() + '.jpg';
        let outputPath = this.__writeJpgToModifiedImgsFolder(imgName, dateChangedJpgBinary);
        if (fs.existsSync(outputPath)) {
          //imageData.addModifiedData(imageData.previewPath, outputPath);
          uploadingPath = outputPath;
        }
      }
      imageData.uploadingPath = uploadingPath;
    } catch (err) {
      console.log(err);
    }
  }

  static async __getCompressedJpgData(imgPath, type) {
    let imgWidth = undefined;
    let imgHeight = 300;
    try {
      let compressedJpgData = await sharp(imgPath).resize(imgWidth, imgHeight).jpeg().withMetadata().toBuffer();
      return compressedJpgData.toString(type);
    } catch (err) {
      throw err;
    }
  }

  static __getDateChangedJpgBinary(jpgBinary) {
    let formatedTime = this.__getModifiedTime();
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

  static __getModifiedTime() {
    let timeShift = 8 * 60 * 60 * 1000;
    let currentTime = new Date(new Date().getTime() + timeShift);
    let formatedTime = currentTime.getUTCFullYear().toString() + ':';
    let dateInfo = [currentTime.getUTCMonth()+1, currentTime.getUTCDate(),
                      currentTime.getUTCHours(), currentTime.getUTCMinutes(), currentTime.getUTCSeconds()];
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
}

module.exports = ImagesProcessor;