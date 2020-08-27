import fs from 'fs';

function getFileList() {
    return new Promise((resolve, reject) => {
        fs.readdir('static', (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
}

function getFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile('static/' + file, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.toString());
            }
        });
    });
}

getFileList()
    .then(files => console.log(files))
    .catch(err => console.error(err));

getFile('saref1.ttl')
    .then(content => console.log(content))
    .catch(err => console.error(err));