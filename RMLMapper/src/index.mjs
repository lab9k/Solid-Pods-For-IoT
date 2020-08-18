/***************************************
 * Title: RMLMapper
 * Description: Node.js instance which:
 * 1. Connects to an MQTT server of choice and subscribes to a configurable topic.
 * 2. Parses incoming message strings as SenML records (ignores other messages).
 * 3. Pre-processes the SenML records, reconstructing the contained data.
 * 4. Maps the processed SenML records to RDF format (either SSN or SAREF).
 * 5. Merges the new measurements with the existing graph and saves the data to a Solid Pod.
 * MQTT + SenML -[RML]-> RDF + Solid Pod
 * Author: Flor Sanders
 * Version: 1.0
*****************************************/

// Importing building block functions
import { connect_mqtt } from './mqtt.mjs';
import { parse_senml } from './parse.mjs';
import { reconstruct } from './reconstruct.mjs';
import { preprocess } from './preprocess.mjs';
import { map_to_rdf } from './mapper.mjs';
import { save } from './save.mjs';

// Importing configuration parameters
import { SHOW_DATA } from './config.mjs';

// Combining building block functions to obtain desired functionality
// Connect the MQTT client
connect_mqtt((msg) => {
    if (SHOW_DATA) console.log(`1. Message incoming:\n${msg}`);
    // Parse incoming messages to JSON
    parse_senml(msg, (senml_records) => {
        if (SHOW_DATA) console.log(`2. Message parsed:`);
        if (SHOW_DATA) console.log(senml_records);
        // Reconstruct data from SenML records
        reconstruct(senml_records, (senml_data) => {
            if (SHOW_DATA) console.log(`3. Data reconstructed:`);
            if (SHOW_DATA) console.log(senml_data);
            // Preprocess data before mapping
            preprocess(senml_data, (json_string) => {
                if (SHOW_DATA) console.log(`4. Data preprocessed:\n${json_string}`);
                // Mapping data to RDF format
                map_to_rdf(json_string, (rdf_data) => {
                    if (SHOW_DATA) console.log(`5. Mapped to RDF:\n${rdf_data}`);
                    // Saving the graph to the Solid Pod
                    save(rdf_data);
                });
            });
        });
    });
});
