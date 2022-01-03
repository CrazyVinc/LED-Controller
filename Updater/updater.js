const fs = require('fs');
const unzip = require('unzip');
var mv = require('mv');

var ts = fs.createReadStream('../temp/update.zip').pipe(unzip.Extract({ path: '..' }));
ts.on('close', function () {
    unlink();
});


function unlink() {
    fs.unlinkSync("../temp/update.zip");
}
console.log("Finishing in a bit, still extracting...");


// mv('../temp', '../', {mkdirp: true}, function(err) {
//     // done. it first created all the necessary directories, and then
//     // tried fs.rename, then falls back to using ncp to copy the dir
//     // to dest and then rimraf to remove the source dir
// });