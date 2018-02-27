const ImagesProcessor = require(__base + 'js/utility/imagesProcessor');

class ImageData {
  /* constructor() {
    this.previewPath = undefined;
    this.uploadingPath = undefined;
    this.dateTimeOriginal = undefined;
  } */

  constructor() {
    this.sourcePath = undefined;
    this.uploadingPath = undefined;
    this.dateTimeOriginal = undefined;
  }

  addSourceData(packet) {
    this.sourcePath = packet.imgPath;
    this.dateTimeOriginal = packet.dateTimeOriginal;
  }

  addUploadingData(packet) {
    this.uploadingPath = packet.imgPath;
    this.dateTimeOriginal = packet.dateTimeOriginal;
  }

  deleteData() {
    this.sourcePath = undefined;
    this.uploadingPath = undefined;
    this.dateTimeOriginal = undefined;
  }

  async modify(setting) {
    await ImagesProcessor.modifyImageData(this, setting);
  }

  /* async modify(setting) {
    if (this.__needsToModify(setting)) {
      await ImagesProcessor.modifyImageData(this, setting);
    } else {
      console.log('Does not need to modify!');
    }
  } */

  /* addModifiedData(sourcePath, uploadingPath) {
    this.sourcePath = sourcePath;
    this.uploadingPath = uploadingPath;
  } */

  /* __needsToModify(setting) {
    let previewHasChanged = this.previewPath !== this.sourcePath;
    let settingHaveChanged = (setting.needsDateChanging !== setting.lastOptions.needsDateChanging)
      || (setting.needsCompressing !== setting.lastOptions.needsCompressing);

    return previewHasChanged || settingHaveChanged;
  } */
}

class ImageSet {
  constructor() {
    this.dirty = new ImageData();
    this.clean = new ImageData();
  }

  isPaired() {
    return (typeof this.dirty.sourcePath !== 'undefined' && typeof this.clean.sourcePath !== 'undefined');
  }

  async modify(setting) {
    await this.dirty.modify(setting);
    await this.clean.modify(setting);
  }
}

class ImagesContainer {
  constructor() {
    this.tab_inspect = {
      tr_1: new ImageSet(), tr_2: new ImageSet(), tr_3: new ImageSet(), tr_4: new ImageSet()
    };
    this.tab_clean_up = {
      tr_1: new ImageSet(), tr_2: new ImageSet(), tr_3: new ImageSet(), tr_4: new ImageSet()
    };
  }

  addSourceImage(packet) {
    this[packet.tabID][packet.tr_n][packet.imgType].addSourceData(packet);
  }

  deleteImage(packet) {
    this[packet.tabID][packet.tr_n][packet.imgType].deleteData();
  }

  getImage(packet) {
    return this[packet.tabID][packet.tr_n][packet.imgType];
  }

  getImagesForCInspect() {
    return this.tab_inspect;
  }

  getImagesForCleanUp() {
    return this.tab_clean_up;
  }
}

module.exports = ImagesContainer;