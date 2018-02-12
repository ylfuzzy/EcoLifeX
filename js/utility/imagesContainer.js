const ImagesProcessor = require(__base + 'js/utility/imagesProcessor');

class ImageData {
  constructor() {
    this.previewPath = undefined;
    this.sourcePath = undefined;
    this.uploadingPath = undefined;
    this.dateTimeOriginal = undefined;
  }

  addData(packet) {
    this.previewPath = packet.imgPath;
    this.dateTimeOriginal = packet.dateTimeOriginal;
  }

  deleteData() {
    this.previewPath = undefined;
    this.dateTimeOriginal = undefined;
  }

  async modify(settingOptions) {
    if (this.__previewPathIsNotTheSource()) {
      await ImagesProcessor.modifyImageData(this, settingOptions);
    }
  }

  addModifiedData(sourcePath, uploadingPath) {
    this.sourcePath = sourcePath;
    this.uploadingPath = uploadingPath;
  }

  __previewPathIsNotTheSource() {
    return (typeof this.previewPath !== 'undefined') && (this.previewPath !== this.sourcePath);
  }
}

class ImageSet {
  constructor() {
    this.dirty = new ImageData();
    this.clean = new ImageData();
  }

  isPaired() {
    return (typeof this.dirty.previewPath !== 'undefined' && typeof this.clean.previewPath !== 'undefined');
  }

  async modify(settingOptions) {
    await this.dirty.modify(settingOptions);
    await this.clean.modify(settingOptions);
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

  addImage(packet) {
    this[packet.tabID][packet.tr_n][packet.imgType].addData(packet);
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