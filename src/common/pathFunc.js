let path = require('path');
let fs = require('fs-extra')


/**
 *　读取文件夹下的文件, 返回其相对路径数组
 *  返回路径带着root!!!!!!
 * @param {string} root  哪个目录
 * @param {bool} opt 
 *  {bool} recursive 是否递归查询子项文件夹里的内容 default:true 递归
 *  {bool} sync  是否同步 default:false TODO: SUPPORT ASYNC default:false 异步
 *  {bool} returnAll  是否返回所有name,(包括市文件夹的) default:false 只返回是文件的
 */
function _readDir(root, opt = { recursive: true, returnAll: false }) {
    let result = [];
    let names = fs.readdirSync(root)
    for (let i = 0; i < names.length; i++) {
        const filepath = root + '\\' + names[i];
        //如果是文件夹
        if (fs.statSync(filepath).isDirectory()) {
            //要求递归则深入
            if (opt.recursive) {
                Array.prototype.push.apply(result, _readDir(filepath + '/', opt));
            } else if (!opt.returnAll) {//如果不是指定也要floder的则忽略此name
                continue
            }
        }
        result.push(filepath)
    }
    return result;
}

// class readDirOpt {
//     recursive: boolean = true;
//     returnAll: boolean = true;
// }


module.exports = {
    readDir: _readDir
}