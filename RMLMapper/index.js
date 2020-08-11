/***************************************
 * RMLMapper
 * MQTT + SenML -[RML]-> RDF + Solid Pod
 * Author: Flor Sanders
 * Version: 1.0
*****************************************/

// Importing the required libraries
var mqtt = require('mqtt');

// Defining program constants
const MQTT_SERVER = '192.168.0.249';
const MQTT_TOPIC = 'solid_iot_one';

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