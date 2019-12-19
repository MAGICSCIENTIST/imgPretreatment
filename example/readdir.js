let filter = require('../src/index')
let path = require('path')
let fs = require('fs-extra')


var _f = new filter({})
var pathList = _f.readDir("D:\\work\\SmartForestV1.0\\trunk\\doc\\01工程过程\\PH14验收\\终验前所有文档, 以此为准", { recursive: true, returnAll: false })


let resultsFile = path.join(__dirname, 'results', '监理.md')

if (!fs.existsSync(resultsFile)) {
    fs.createFileSync(resultsFile)
}

//  let writeStream = fs.createWriteStream(resultsFile);
// fs.writeFileSync(resultsFile,"--------------")
// fs.writeFileSync(resultsFile,"--------------")

var result = `--------------${new Date()}--------------------\n`
result += `|名称|已打印|总数|\n|--|--|--|\n `


let isCodeFounded
var resultList = []
for (let i = 0; i < pathList.length; i++) {
    const _path = pathList[i];
    let baseName = path.basename(_path)


    if (!fs.statSync(_path).isFile()) {
        continue
    }
    if (_path.match("源代码")) {

        if (!isCodeFounded) {
            resultList.push(`|源代码光盘|0|2| \n`)
            isCodeFounded = true
        }
        continue
    }

    //临时文件
    if (_path.match('~')) {
        continue
    }


    let totalCount = 2
    //附件2份
    if (baseName.match('附件')) {
        totalCount = 2
    }
    // 监理要提供的表格, 开头是C
    else if (baseName.trim().substring(0, 1) == "C") {
        totalCount = 6
    }

    resultList.push(`|${baseName}|0|${totalCount}| \n`)

}


resultList.sort()
result += resultList.join("")
fs.writeFileSync(resultsFile, result)