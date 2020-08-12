/***************************************
 * Title: SenML Parser
 * Description: Tries to parse incoming messages to JSON, passing them on to the callback function. Otherwise ignoring them.
 * Author: Flor Sanders
 * Version: 1.0
*****************************************/

import {DEBUG} from './config.mjs';

// Parse SenML records from a string to an array of JSON objects
export const parse_senml = function(msg, callback){
    try {
        // Try parsing to JSON, pass on to callback
        var parsed = JSON.parse(msg);
        callback(parsed);
    } catch (err) {
        // Parsing failed, ignoring message and reporting error to the console.
        if (DEBUG) console.err(`Error parsing message: ${err}.\nMessage: ${msg}.`)
    }
}