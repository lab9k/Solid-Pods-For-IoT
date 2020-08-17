/***************************************
 * Title: Mapper
 * Description: Takes preprocessed message and maps it to RDF format
 * Author: Flor Sanders
 * Version: 1.0
*****************************************/

// Importing the required libraries
import rml from 'rocketrml';
import fs from 'fs';

// Importing configuration parameters
import { RML_FILE, RML_OPTIONS, DEBUG } from './config.mjs';

// Global variable to load mapping file is
var rml_file;

// Take stringified JSON object and map it to rdf
export const map_to_rdf = async function (jsonstring, callback) {
    // Load thr rml file into memory (once only)
    if (!rml_file) {
        rml_file = await loadFileToString(RML_FILE).catch((err) => {
            if (DEBUG) console.error(err);
        });
        if (DEBUG) console.log('RML File Loaded');
    }
    // Map the jsonstring to RDF format, on the condition it is loaded correctly.
    if (!!rml_file) {
        var rdf_file = await rml.parseFileLive(rml_file, { input: jsonstring }, RML_OPTIONS).catch((err) => {
            if (DEBUG) console.error(err);
        });
        callback(rdf_file);
    }
}

// Function to load file contents to a string
function loadFileToString(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.toString());
            }
        });
    });
}