# EcoLifeX

EcoLifeX, an evolutionary version of QuickEcoLife, is a customized Desktop App specially written to reduce unnecessary workload of the staffs at the Eastern District Office.

When I served in the mandatory substitute service for one year at the Office, I found the Office's managers insanely desired "to be prominent" in the annual Government Performance Review. In order to be "eye-catching", they forced their staffs to deliberately do a lot of flattering tasks, all of which were superfical, tedious, and meaningless. Their only purpose was to attract evaluation committee's attention.

Among these flattering tasks, one requires the staffs to "accidentally" find trashes on the streets, pick them off the ground on purpose while recording the entire staged scenario by photos, and then upload them to an official website called "ecolife". To make matters worse, due to bad webiste designs, manually uploading photos to ecolife is extremely time consumming.

Fortunately, the uploading process is a very routine operation and can be swiftly done by a computer program. Therefore, I decided to write a user friendly software - EcoLifeX - automatically uploading photos for my former colleages. I hope it could relieve their heavy burdens.

## Installing

### Operating Systems Supported

Currently only supports Windows 7 and above. Doesn't support Windows XP.

### Prerequisite

Make sure you have installed Chrome in your computer. It is very important!!!
If you have not, you can [download Chrome directly from Google](https://www.google.com.tw/chrome/)

### Installation Steps

1. Please make sure Chrome has been installed in your computer!!!

2. Download the latest version of EcoLifeX from [Latest Release](https://github.com/ylfuzzy/EcoLifeX/releases/latest).
You should only download "ecolifex-Setup-x.x.x.exe". Other files are not required.

3. Double click the Windows installer and follow its instructions.

## Built With

* [Electron](https://electronjs.org/) - The framework for creating Desktop App with web technologies
* [Selenium](https://www.seleniumhq.org/) The module for browser automation
* [sharp](http://sharp.dimens.io/en/stable/) - The Node.js images processing module
* [fast-exif](https://www.npmjs.com/package/fast-exif) - The light weight Node.js module for extracting images' exif
* [piexif](http://piexifjs.readthedocs.io/en/latest/) - The JavaScript API for editing images' exif 

## Versioning

For all the versions available, see [EoLifeX tags](https://github.com/ylfuzzy/EcoLifeX/tags).
[SemVer](http://semver.org/) is applied.