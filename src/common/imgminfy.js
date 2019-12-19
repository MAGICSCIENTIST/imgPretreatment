var fs = require('fs-extra');
var gm = require('gm');
let extend = require('node.extend')
var sizeOf = require('image-size');

const fileType = require('./fileType')
const util = require('util');
const toArray = require('stream-to-array');

function minfy() {

}

module.exports = {
    async  min(file, options) {        

        var res = file;
        var opt = extend(options, {
            maxSize: [4000, 4000],
            maxBytes: 4 * 1024 * 1024
        })
        var dimensions = sizeOf(file)

        if (opt.maxBytes) {
            var fsstatus = fs.statSync(file)
            var fileSizeInBytes = fsstatus.size
            
            //超过了, 所以压缩
            if (fileSizeInBytes > opt.maxBytes) {


                res = await gm(file)
                    .resize(options.maxSize[0], options.maxSize[1])
                    .stream()
                    // .write('D:\\work\\daguishan\\imgPretreatment\\splitResults_tumuji\\东方白鹳\\训练_min\\resized.jpg',function(err){
                    //     var a = 1+1
                    // })
                    // .stream(function (err, stdout, stderr) {
                    //     var writeStream = fs.createWriteStream('D:/work/daguishan/imgPretreatment/resized.jpg');
                    //     stdout.pipe(writeStream);
                    // })

                //TODO: 压缩到目标下
                // const parts = await toArray(res.pipe(myPngQuanter));
                // const buffers = parts.map(part => util.isBuffer(part) ? part : Buffer.from(part));
                // const compressedBuffer = Buffer.concat(buffers);
                // console.log(compressedBuffer.length); // here is the size of the compressed data
                // res.write(compressedBuffer);

                // var b = gm(file).toBuffer('PNG', function (err, buffer) {
                //     var ccc = buffer
                // })

                // .stream(function (err, stdout, stderr) {                        
                //     stdout.on('data', function(d){ buffers.push(d); });
                //     stdout.on('end', function(){
                //       var buf = Buffer.concat(buffers);
                //     }
                //     stdout.
                //     var writeStream = fs.createWriteStream('/path/to/my/resized.jpg');
                //     stdout.pipe(writeStream);
                // });

            }
        }



        return res;

    }
}