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
import { preprocess } from './preprocess.mjs';
import { map_to_rdf } from './mapper.mjs';

// Combining building block functions to obtain desired functionality
// Connect the MQTT client
connect_mqtt((msg) => {
    // Parse incoming messages to JSON
    parse_senml(msg, (senml_records) => {
        // Preprocess incoming data before mapping
        preprocess(senml_records, (json_string) => {
            // Map the incoming messages to RDF
            map_to_rdf(json_string, console.log)
        });
    });
});
