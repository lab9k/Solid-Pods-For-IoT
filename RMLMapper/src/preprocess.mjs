/***************************************
 * Title: Preprocess
 * Description: Takes incoming messages, and:
 * 1. Filters the incoming packages based on validity and usefulness.
 * 2. Applies a pre-processing step for easy mapping:
 *  a. Add uuid
 *  b. Convert unix timestamp to xsd:dateTime format
 *  c. Translate unit to the one used in the om scheme.
 *  d. Use the unit to define a category from the om scheme.
 * 3. Stringifies the JSON
 * Author: Flor Sanders
 * Version: 1.0
*****************************************/

// Importing the required libraries
import { v4 as uuidv4 } from 'uuid';

// Importing configuration parameters
import { UNITS_OM, PROPERTIES_OM } from './config.mjs';

// Pre-processing function on the incoming SenML records before mapping is applied.
export const preprocess = function (data, callback) {
    // 1. Filtering data for validity and usefulness
    var filtered_data = filter_data(data);
    // 2. Apply actual preprocessing step
    var preprocessed_data = anteprocess(filtered_data);
    // 3. Stringify
    var preprocessed_string = JSON.stringify(preprocessed_data);
    // Pass the reconstructed message on to callback function.
    callback(preprocessed_string);
}

// The actual pre-processing step
const anteprocess = function (filtered_data) {
    // Preprocess the data
    var preprocessed_data = filtered_data.map((data) => {
        // Destructure data
        var { value, name, unit, time } = data;
        // Add name
        var preprocessed = {name};
        // Add unit and property (if not undefined)
        if (!!unit) {
            // Converting non-supported units to supported ones
            switch (unit) {
                case 'l/s':
                    unit = 'm3/s';
                    value = value/1000;
                case '1/min':
                    unit = '1/s';
                    value = value/60;
                case 'beat/min':
                    unit = '1/s';
                    value = value/60;
            }
            var translated_unit = UNITS_OM[unit];
            preprocessed.unit = (!!translated_unit) ? translated_unit : "one";
            var translated_property = PROPERTIES_OM[unit];
            if (!!translated_property) preprocessed.property = translated_property;
        }
        // Convert epoch time in seconds to xsd:dateTime format
        var xsd_time = epoch_to_xsd_datetime(time);
        preprocessed.time = xsd_time;
        // Add uuid
        preprocessed.uuid = uuidv4();
        // Adding remaining data
        preprocessed.value = value;
        // Returning preprocessed
        return preprocessed;
    });
    // Returning preprocessed data
    return preprocessed_data;
}

const epoch_to_xsd_datetime = function (epoch_time) {
    var date_time = new Date(epoch_time * 1000);
    var xsd_time = date_time.toISOString().slice(0, 19) + 'Z';
    return xsd_time;
}

// Filter records by checking validity and usefulness
const filter_data = function (senml_data) {
    var filtered_data = senml_data.filter((data) => {
        // Sanity check
        if (!!data) {
            // Destructure data
            var { type, value, name } = data;
            // Record is not valid if name isn't a unique identifier
            if (!!name && name.length > 0) {
                // We'll only be processing packages containing numerical measurements
                if (!!value && type === "double") {
                    return true;
                }
            }
        }
        return false;
    });
    return filtered_data;
}