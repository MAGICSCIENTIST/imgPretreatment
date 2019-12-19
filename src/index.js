let commonFunc = require('uglifysite/common/commonFunc');
let log = require('uglifysite/common/log')
let fs = require("fs-extra")
let path = require('path')
let pathFunc = require('./common/pathFunc')
let eventproxy = require('eventproxy')
let mapLimit = require("async/mapLimit")
let promisemapLimit = require('promise-map-limit');
let extend = require('node.extend')
let fileType = require('./common/fileType')
let imgsimiler = require('./common/imgsimiler')
let imgminfy = require('./common/imgminfy')



// Promise.mapLimit = async (funcs, limit) => {
//     let results = [];
//     await Promise.all(funcs.slice(0, limit).map(async (func, i) => {
//         results[i] = func? await func(): null;
//         while ((i = limit++) < funcs.length) {
//             results[i] = await funcs[i]();
//         }
//     }));
//     return results;
// };

// const fileType = {
//     image: [".jpg", ".png", ".bmp", ".gif", ".jpeg"],
//     video: [".mp4", ".avi"]
// }

// function filterFile(files, fileType) {
//     var fileList = (files instanceof Array) ? files : [files]
//     for (let i = 0; i < fileList.length; i++) {
//         const file = fileList[i];
//         file
//         path.extname(file).toLowerCase()

//     }
// }

function generateID() {
    return (Math.random() + +new Date()).toString(16)
}

function caculatSimilerImgCount(someExceptAllFiles) {
    // var resID = []
    for (let i = 0; i < someExceptAllFiles.length; i++) {
        const efile = someExceptAllFiles[i];
        for (let j = i + 1; j < someExceptAllFiles.length; j++) {
            const efile_next = someExceptAllFiles[j];
            if (!efile_next) {
                continue
            }

            if (imgsimiler.isSimilar(efile.pHash, efile_next.pHash, 10)) {
                //如果相似, 则把本身的相似数添加到next的相似数里, 网络状的传递
                if (!efile_next.similarCount) {
                    efile_next.similarCount = 1
                } else {
                    efile_next.similarCount += (efile.similarCount || 1)
                }

                if (!efile.similarID) {
                    efile.similarID = generateID()
                }
                if (!efile_next.similarID) {
                    efile_next.similarID = efile.similarID;
                }
            }

        }

    }
    return [...new Set(someExceptAllFiles.map(x => x.similarID))].filter(x => x)
}
class imagefilter {
    // options = {
    //     output: './results',
    //     entry: "",
    // }

    constructor(options) {

        this.options = {
            output: './results',
            entry: "",
            resize: {
                min: ['all'], //all, train, test                
                maxBytes: 2 * 1024 * 1024,
            },
            checkSimlier: true,
            maxSimilarCount: 4 //取一半, 但不超过这个数字
        }
        this.options = extend(this.options, options)

    }
    checkExceptTarget(path, exceptList) {

        if (!fs.statSync(path).isFile()) {
            return null
        }

        for (let i = 0; i < exceptList.length; i++) {
            const exceptName = exceptList[i];
            if (path.match(exceptName)) {
                return {
                    path: path,
                    name: exceptName
                }
            }

        }
    }
    async copyFile(source, middleFolder, move, target) {
        var sourcePath = source.path;
        var targetPath = target || path.resolve(this.options.output, source.name, middleFolder || "", path.basename(sourcePath))
        return commonFunc.ensureDir(targetPath).then(x => {
            if (move) {
                log.info(`move from ${sourcePath}  to  ${targetPath}`)
                fs.moveSync(sourcePath, targetPath)
            } else {
                log.info(`copy from ${sourcePath}  to  ${targetPath}`)
                fs.copySync(sourcePath, targetPath)
            }
            return targetPath
        }).catch(x => {
            console.error(x)
            return null
        })
    }

    async splitSimilerData(pathList) {
        var self = this

        var taskList = []

        var pHashList = await promisemapLimit(pathList, 8, x => {
            var xType = fileType.checkFiletype(x)
            log.info(`处理类型${xType},  ${x}`)
            switch (xType) {
                case fileType.fileType.image:
                    return imgsimiler.pHash(x).then(_ => { return { pHash: _ } }); break;
                default: return {}
            }
        })
        log.succes(`预处理${pHashList.length}个, 其中${pHashList.filter(x => x.pHash).length}可以用作训练`)

        for (let i = 0; i < pHashList.length; i++) {
            const x = pHashList[i];
            if (!x) {
                continue
            }
            x.path = pathList[i];
            x.exceptName = path.basename(path.dirname(x.path))
            x.name = x.exceptName
        }

        for (let i = 0; i < this.options.exceptList.length; i++) {
            const exceptName = this.options.exceptList[i];
            var someExceptAllFiles = pHashList.filter(x => x.exceptName == exceptName);
            var simliarIdList = caculatSimilerImgCount(someExceptAllFiles)
            //控制并发
            for (let j = 0; j < simliarIdList.length; j++) {
                const similarID = simliarIdList[j];
                let _idFiles = someExceptAllFiles.filter(x => x.similarID == similarID);
                //TODO: 排序

                let _half = Math.round(_idFiles.length / 2);
                var _trainList = _idFiles.splice(0, _half > this.options.maxSimilarCount ? this.options.maxSimilarCount : _half)
                //控制并发
                taskList.push(promisemapLimit(_trainList, 2, (x) => { return this.copyFile.call(self, x, "训练", true) }))
                taskList.push(promisemapLimit(_idFiles, 2, (x) => { return this.copyFile.call(self, x, "测试", true) }))
            }
            taskList.push(promisemapLimit(someExceptAllFiles.filter(x => !x.similarID), 2, (x) => { return this.copyFile.call(self, x, "测试", true) }))
        }

        return Promise.all(taskList).then(x => {
            return Array.prototype.concat.apply([], x)
        }).catch(x => {
            debugger
        })

    }
    async minfy(fileList) {
        var self = this
        var res = await promisemapLimit(fileList, 1, async function (_f) {
            var file = (typeof _f == "string") ? _f : _f.path            

            var _fileType = fileType.checkFiletype(file)
            var exceptName = self.checkExceptTarget(file, self.options.exceptList)
            var _dir = path.resolve(path.dirname(file))
            var middleFolderName = _dir.substring(_dir.lastIndexOf("\\") + 1)
            var middleFolderName_min = middleFolderName + "_min"

            var target = file.replace(middleFolderName, middleFolderName_min)
            var result = ''

            if (_fileType == fileType.fileType.image) {
                var res = await imgminfy.min(file, {
                    maxBytes: self.options.maxBytes
                })
                if (typeof res == "string") {
                    result = await self.copyFile.call(self, exceptName, middleFolderName_min, false)
                } else {
                    fs.ensureDirSync(path.dirname(target))
                    var writeStream = fs.createWriteStream(target);
                    
                    result = await new Promise((resolve,reject)=>{
                        res.pipe(writeStream).on('finish',function(err){                            
                            resolve(target)
                            log.succes(`压缩结束: ${file}`)
                        })
                    })
                    
                    

                }
            } else {
                result = await self.copyFile.call(self, exceptName, middleFolderName_min, false, target)
            }

            return result

        })
        return res


    }
    async start() {
        //var ep = new eventproxy();
        var pathList = pathFunc.readDir(this.options.entry, { recursive: true, returnAll: true });

        var fileList = pathList
            .map(x => {
                //去掉未知格式                
                if (fileType.checkFiletype(x) == fileType.fileType.UNKNOW) {
                    log.warn(`去掉未知格式${path.extname(x)} 文件:${x}`)
                    return null
                }
                //找出目标物种
                let target = this.checkExceptTarget(x, this.options.exceptList)
                return target
            })
            .filter(x => x)

        var res = fileList
        log.succes(`需要复制的文件数目: ${fileList.length}`)

        //控制并发
        // var res = await mapLimit(res, 5, this.copyFile.bind(this))        

        // //相似分为测试和训练集
        // if (this.options.checkSimlier) {
        //     res = await this.splitSimilerData(res)

        //     // fileList.map(x => {
        //     //     x.phash = imgsimiler.pHash(x)
        //     //     return x;
        //     // })
        // }

        //压缩
        if (this.options.resize.min) {

            //压缩训练集
            if (this.options.resize.min.filter(x => x == 'all').length > 0) {
                res = await this.minfy(res)
            }
            else if (this.options.resize.min.filter(x => x == 'train').length > 0) {
                var filelist = res.filter(x => x.indexOf("训练") != -1)
                res = await this.minfy(filelist)
            }
            else if (this.options.resize.min.filter(x => x == 'test').length > 0) {
                var filelist = res.filter(x => x.indexOf("测试") != -1)
                res = await this.minfy(filelist)
            }

        }

        return res

    }
    readDir(path, options) {
        return pathFunc.readDir(path, options)
    }

}

function fuck(source) {
    var sourcePath = source.path;
    var targetPath = path.resolve(this.options.output, source.name, path.basename(sourcePath))



}

module.exports = imagefilter