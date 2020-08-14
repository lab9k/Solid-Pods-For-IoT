/***************************************
 * Title: Preprocess
 * Description: Takes incoming messages, and:
 * 1. Reconstructs the data from the SenML records.
 * 2. Filters the incoming packages based on validity and usefulness.
 * 3. Applies a pre-processing step for easy mapping:
 *  a. Add uuid
 *  b. Convert unix timestamp to xsd:dateTime format
 *  c. Translate unit to the one used in the om scheme.
 *  d. Use the unit to define a category from the om scheme.
 * 4. Stringifies the JSON
 * Author: Flor Sanders
 * Version: 1.0
*****************************************/

import { v4 as uuidv4 } from 'uuid';

import { DEBUG, UNITS_OM, PROPERTIES_OM } from './config.mjs';

// Pre-processing function on the incoming SenML records before mapping is applied.
export const preprocess = function (senml_records, callback) {
    // 1. Combining base and normal fields from the SenML records to reconstruct the actual data
    var senml_data = reconstruct_data(senml_records);
    // 2. Filtering data for validity and usefulness
    var filtered_data = filter_data(senml_data);
    // 3. Apply actual preprocessing step
    var preprocessed_data = anteprocess(filtered_data);
    // 4. Stringify
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
        // Adding data that needs no processing
        var preprocessed = { name, value };
        // Add unit and property (if not undefined)
        if (!!unit) {
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

// Reconstruct the data in the SenML records by combining the base and normal fields.
const reconstruct_data = function (senml_records) {
    // Sanity check: Does the array actually contain any records?
    if (!!senml_records.length) {
        // Get base values
        var base_fields = get_base_fields(senml_records);
        // Reconstruct data
        var senml_data = senml_records.map((senml_record) => get_senml_data(senml_record, base_fields));
        return senml_data;
    } else {
        // Ignore message, report error to console
        if (DEBUG) console.error(`Error: message contains no records. ${senml_records}`);
    }
}

// Extract the base fields out of the message and assign default value if undefined
const get_base_fields = function (senml_records) {
    // Destructure the base fields from the first record
    var { bn, bt, bu, bv, bs } = senml_records[0];
    // If the base fields are undefined, assign default value according to specification
    bn = !!bn ? bn : '';
    bt = !!bt ? bt : 0;
    bv = !!bv ? bv : 0;
    bs = !!bs ? bs : 0;
    // Returning the values
    return { bn, bt, bu, bv, bs }
}

// Function to reconstruct the data from the SenML records by combining the base and normal fields according to the specifications.
const get_senml_data = function (senml_record, base_fields) {
    // Destructure base fields
    var { bn, bt, bu, bv, bs } = base_fields;
    // Destructure the fields form the record
    var { v, vs, vd, vb, n, u, s, t } = senml_record;
    // Reconstruct data
    var type = !!v ? 'double' : ((!!vs || !!vd) ? 'string' : (!!vb ? 'boolean' : undefined));
    var value = !!v ? bv + v : (!!vs ? vs : (!!vd ? vd : vb));
    var name = bn + (!!n ? n : '');
    var unit = !!u ? u : bu;
    var sum = !!s ? bs + s : undefined;
    var time = !!t ? bt + t : bt;
    time = time < 2 ** 28 ? Math.floor(Date.now() / 1000) + time : time;
    return { type, value, name, unit, sum, time }
}