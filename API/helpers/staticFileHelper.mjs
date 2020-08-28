/* Importing required libraries */
import fs from 'fs';

/* Defining helper functions to read in static files */
// Function to read the files available in the static subfolder
export const getFileList = function () {
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

// Function to read the file contents from one of the files in the static subfolder
export const getFile = function (filename) {
    return new Promise((resolve, reject) => {
        fs.readFile('static/' + filename, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.toString());
            }
        });
    });
}