/***************************************
 * RMLMapper
 * MQTT + SenML -[RML]-> RDF + Solid Pod
 * Author: Flor Sanders
 * Version: 1.0
*****************************************/

// Importing the required libraries
import mqtt from 'mqtt';

// Importing configuration parameters
import {MQTT_SERVER, MQTT_TOPIC} from './config.mjs';

// Initializing MQTT client and connecting to the configured server
console.log(`connecting to ${MQTT_SERVER}...`)
var client = mqtt.connect('', {host: MQTT_SERVER, protocol: 'mqtt'});

// Report connection errors
client.on('error', (err) => {
    console.error(`Error connecting: ${err}.`);
});

// Upon connection, subscribe to the configured topic
client.on('connect', () => {
    console.log(`Connected!\nSubscribing to ${MQTT_TOPIC}...`);
    client.subscribe(MQTT_TOPIC, (err) => {
        if (err) {
            console.error(`Error subscribing: ${err}.`);
        } else {
            console.log(`Subscribed!`);
        }
    });
});

// Handle the messages as they come in
client.on('message', (topic, message) => {
    console.log(message.toString());
});