let fs = require('fs-extra')
let path = require('path')

let imageExName = [
    '.jpg', '.png', '.jpeg'
]
let videoExName = [
    '.mp4', '.avi'
]

module.exports = {
    checkFiletype(source) {
        if (this.isImage(source)) {
            return this.fileType.image
        }

        if (this.isVideo(source)) {
            return this.fileType.video
        }

        return this.fileType.UNKNOW

    },
    isImage(source) {

        let exName = path.extname(source)
        return imageExName.filter(x => x == exName.toLowerCase()).length > 0
    },
    isVideo(source) {
        let exName = path.extname(source)
        return videoExName.filter(x => x == exName.toLowerCase()).length > 0
    },

    fileType: {
        UNKNOW: 0,
        image: 1,
        video: 2,
    }
}
