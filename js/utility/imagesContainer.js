class ImageSet {
  constructor() {
    this.dirty = undefined;
    this.clean = undefined;
  }
  isPaired() {
    return (typeof this.dirty !== 'undefined' && typeof this.clean !== 'undefined');
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
    this[packet.tabID][packet.tr_n][packet.imgType] = packet.imgPath;
  }

  deleteImage(packet) {
    this[packet.tabID][packet.tr_n][packet.imgType] = undefined;
  }
}

module.exports = ImagesContainer;