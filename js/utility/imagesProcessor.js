const fastExif = require('fast-exif');

class ImagesProcessor {
  static async isValidImage(newImgPath, comparedImgPath) {
    let imgInfo = {isValid: true, error: undefined};
    try {
      let newImgExif = await fastExif.read(newImgPath);
      newImgExif.exif.DateTimeOriginal.getTime();

      if (typeof comparedImgPath !== 'undefined') {
        let comparedImgExif = await fastExif.read(comparedImgPath);
        let onTheSameDay = await this.__areOnTheSameDay(newImgExif, comparedImgExif);
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

  static async __areOnTheSameDay(newImgExif, comparedImgExif) {
    if (newImgExif.exif.DateTimeOriginal.getFullYear() === comparedImgExif.exif.DateTimeOriginal.getFullYear() &&
        newImgExif.exif.DateTimeOriginal.getMonth() === comparedImgExif.exif.DateTimeOriginal.getMonth() &&
        newImgExif.exif.DateTimeOriginal.getDate() === comparedImgExif.exif.DateTimeOriginal.getDate()) {
      return true;
    } else {
      return false;
    }
  }
}

module.exports = ImagesProcessor;