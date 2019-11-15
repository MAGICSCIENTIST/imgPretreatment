let filter = require('../src/index')
let config = {
    output: './splitResults3',
    entry: 'D:\\BaiduNetdiskDownload\\大桂山',
    // entry: "D:\\BaiduNetdiskDownload\\大桂山\\仁义\\6月\\R06",    
    exceptList: [
        "白鹇", "山斑鸠", "松鼠", "野猪", "黄鼠狼", "黄猄", "猕猴", "小灵猫", "豹猫", "紫啸鸫", "果子狸"
    ],
    checkSimlier: true, //区分训练和测试
    maxSimilarCount: 2 //取一半, 但不超过这个数字
}

var _f = new filter(config)

// 从头开始初始化
// _f.start().then(x => {
//     console.log(`一共搞定了 ${x.length} 个文件`)
// })

//从分好的地方开始区分训练集和测试集
var pathList = _f.readDir("D:\\work\\daguishan\\daguishan_imgfIlter\\splitResults3", { recursive: true, returnAll: false })
// var pathList = _f.readDir("D:\\work\\daguishan\\daguishan_imgfIlter\\splitResults3\\黄猄", { churecursive: true, returnAll: false })
pathList = pathList.filter(x => {
    return !x.match("测试") && !x.match("训练")
})
_f.splitSimilerData(pathList).then(x=>{    
    console.log(`已处理${x.length}个文件`);    
})