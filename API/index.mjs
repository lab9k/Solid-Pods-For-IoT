import fs from 'fs';



function getFileList() {
    return new Promise((resolve, reject) => {
        fs.readdir('static', (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        })
    })
}

getFileList()
    .then(files => console.log(files))
    .catch(err => console.error(err));