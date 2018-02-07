class ImageData {
  constructor() {
    this.path = undefined;
    this.dateTimeOriginal = undefined;
  }
  addData(packet) {
    this.path = packet.imgPath;
    this.dateTimeOriginal = packet.dateTimeOriginal;
  }
  deleteData() {
    this.path = undefined;
    this.dateTimeOriginal = undefined;
  }
}

class ImageSet {
  constructor() {
    this.dirty = new ImageData();
    this.clean = new ImageData();
  }
  isPaired() {
    return (typeof this.dirty.path !== 'undefined' && typeof this.clean.path !== 'undefined');
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