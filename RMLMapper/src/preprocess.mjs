import { DEBUG } from './config.mjs';

// Pre-processing function on the incoming SenML records before mapping is applied.
export const preprocess = function (senml_records, callback) {
    // Combining base and normal fields from the SenML records to reconstruct the actual data
    var senml_data = reconstruct_data(senml_records);
    // Pass the reconstructed message on to callback function.
    callback(senml_data);
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