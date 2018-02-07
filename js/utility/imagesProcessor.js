const fastExif = require('fast-exif');

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