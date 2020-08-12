/***************************************
 * Title: MQTTClient
 * Description: Connects to the configured MQTT server, subscribes to the configured MQTT topic and passes incoming messages to callback function.
 * Author: Flor Sanders
 * Version: 1.0
*****************************************/

// Importing the required libraries
import mqtt from 'mqtt';

// Importing configuration parameters
import { DEBUG, MQTT_SERVER, MQTT_TOPIC } from './config.mjs';

export const connect_mqtt = function (callback) {
    // Initializing MQTT Client and connecting to the configured server
    if (DEBUG) console.log(`connecting to ${MQTT_SERVER}...`);
    var client = mqtt.connect('', { host: MQTT_SERVER, protocol: 'mqtt' });

    // Report connection errors
    client.on('error', (err) => {
        if (DEBUG) console.error(`Error connecting: ${err}.`);
    });

    // Upon connection, subscribe to the configured topic
    client.on('connect', () => {
        if (DEBUG) console.log(`Connected!\nSubscribing to ${MQTT_TOPIC}...`);
        client.subscribe(MQTT_TOPIC, (err) => {
            // Report subscription errors
            if (err) {
                if (DEBUG) console.error(`Error subscribing: ${err}.`);
            } else {
                if (DEBUG) console.log(`Subscribed!`);
            }
        });
    });

    // Pass incoming messages through to the callback function.
    client.on('message', (topic, msg) => {
        if (DEBUG) console.log(msg.toString());
        callback(msg.toString());
    });
}