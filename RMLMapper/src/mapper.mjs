/***************************************
 * Title: Mapper
 * Description: Takes preprocessed message and maps it to RDF format (SSN or SAREF)
 * Author: Flor Sanders
 * Version: 1.0
*****************************************/

// Importing the required libraries
import rml from 'rocketrml';
import fs from 'fs';

// Importing configuration parameters
import { RML_FILE, RML_OPTIONS } from './config.mjs';

// Global variable to load mapping file is
const rml_file;

// Take stringified JSON object and map it to rdf
export const map_to_rdf = async function(jsonstring) {
    // Load thr rml file into memory (once only)
    if(!rml_file) {
        rml_file = await loadFileToString(RML_FILE);
    }
    var rdf_file = rml.parseFileLive(rml_file, jsonstring, RML_OPTIONS);
    return rdf_file;
}

// Function to load file contents to a string
function loadFileToString(filename){
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if(err){
                reject(err);
            } else {
                resolve(data.toString());
            }
        })
    })
}