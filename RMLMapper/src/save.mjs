/***************************************
 * Title: Save 
 * Description: Connects to the configured Solid Pod, merges incoming rdf messages with the existing database and saves it to the Pod.
 * Author: Flor Sanders, Thijs Paelman
 * Version: 1.0
*****************************************/

// Importing the required libraries
import auth from 'solid-auth-cli';
import $rdf from 'rdflib';

// Importing configuration parameters
import { IDENTITY_PROVIDER, USERNAME, PASSWORD, LOCATION, UPDATER_DELAY_MS, DEBUG } from './config.mjs';

// Global variables
var session;
var login_called = false;
var iot_location;
var location_called = false;
const iot_store = $rdf.graph();
const iot_updater = new $rdf.UpdateManager(iot_store);
var previous_update = Date.now();
var local_store = new $rdf.Formula;
var message_amount = 0;

// RDF Namespaces
const LDP = new $rdf.Namespace('https://www.w3.org/ns/ldp#');
const SPACE = new $rdf.Namespace('http://www.w3.org/ns/pim/space#');
const SOLID = new $rdf.Namespace('http://www.w3.org/ns/solid/terms#');
const RDF = new $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
const SCHEMA = new $rdf.Namespace('http://schema.org/');

// Save rdf data to the configured Solid Pod
export const save = async function (rdf_data) {
    // Logging in if we haven't already -- Making sure the function only gets called once
    if (!session) {
        if(!login_called){
            login_called = true;
            if (DEBUG) console.log('Logging in...');
            session = await login().catch((err) => {
                if (DEBUG) console.error(`Error logging in: ${err}`);
            });
            if (DEBUG) console.log(`Logged in as: ${session.webId}`);
        } else {
            while(!session){
                await sleep(1000);
            }
        }
    }
    // Get the location of the IoT document and fetch it -- Making sure the function only gets called once
    if (!iot_location) {
        if(!location_called){
            location_called = true;
            iot_location = await get_or_create_iot_doc(session.webId);
        } else {
            while(!iot_location){
                await sleep(1000);
            }
        }
    }
    // Adding our translated graph to the store
    $rdf.parse(rdf_data, local_store, iot_location, 'text/n3');
    message_amount++;
    if (Date.now() - previous_update >= UPDATER_DELAY_MS) {
        if (DEBUG) console.log(`Saving ${message_amount} new messages to Pod.`);
        // Bunching up messages and sending them in a combined upload as not to overload the Solid server.
        iot_updater.update(null, local_store, (uri, ok, err) => {
            if (ok) {
                if (DEBUG) console.log('Succesfully saved new messages to Pod.');
            } else {
                if (DEBUG) console.error(`Error updating the IoT document: ${err}`);
            } 
        });
        // Clearing the local store
        local_store = new $rdf.Formula;
        // Resetting the current time
        previous_update = Date.now();
        // Resetting message amount
        message_amount = 0;
    }
}

// Log in to the configured Solid Pod
const login = async function () {
    var session = await auth.currentSession();
    if (!session) session = await auth.login({ idp: IDENTITY_PROVIDER, username: USERNAME, password: PASSWORD }).catch((err) => {
        if (DEBUG) console.error(`Error logging in: ${err}`);
    });
    return session;
}

// Discover storage location for our IoT document, create it if it doesn't exist yet. (Thijs Paelman/NotePod-Tripledoc)
const get_or_create_iot_doc = async function (webId) {
    // 1. Check if a Document tracking our IoT records already exists.
    if (DEBUG) console.log('Checking if the IoT document already exists...')
    // 1a. Load profile document
    const store = $rdf.graph();
    const fetcher = new $rdf.Fetcher(store);
    const updater = new $rdf.UpdateManager(store);
    const profile = store.sym(webId);
    const profileDoc = profile.doc();
    await fetcher.load(profileDoc).catch((err) => {
        if (DEBUG) console.error(`Error loading profile document: ${err}`);
    });
    const solidstorage = store.any(profile, SPACE('storage'), null, profileDoc);
    solidstorage.value += LOCATION;

    // 1b. Load private type index (contains file references)
    const privateTypeIndex = store.any(profile, SOLID('privateTypeIndex'), null, profileDoc);
    await fetcher.load(privateTypeIndex).catch((err) => {
        if (DEBUG) console.error(`Error loading private type index: ${err}`);
    });

    // 1c. Search for the private type registration
    const newBlankNode = new $rdf.BlankNode;
    const st1 = new $rdf.Statement(newBlankNode, RDF('type'), SOLID('TypeRegistration'), privateTypeIndex);
    const st2 = new $rdf.Statement(newBlankNode, SOLID('forClass'), SCHEMA('TextDigitalDocument'), privateTypeIndex);
    const matchingSubjects1 = store.match(null, st1.predicate, st1.object, st1.graph).map(quad => quad.subject);
    const matchingSubjects2 = store.match(null, st2.predicate, st2.object, st2.graph).map(quad => quad.subject);
    let iotTypeRegistration = matchingSubjects1.find((subj) => {
        return matchingSubjects2.includes(subj);
    });

    // 1d. Private type registration not found, making one
    if (!iotTypeRegistration) {
        if (DEBUG) console.log(`Didn't find an IoT type registration, making one...`);
        await updater
            .update(null, [st1, st2])
            .then((ok) => {
                if (DEBUG) console.log('Made IoT type registration');
            }, (err) => {
                if (DEBUG) console.error(`Error adding IoT type registration: ${err}`);
            });
        iotTypeRegistration = newBlankNode;
    }

    // 1e. Actually look for IoT document
    const st3 = new $rdf.Statement(iotTypeRegistration, SOLID('instance'), solidstorage, privateTypeIndex);
    let iotDoc = store.any(st3.subject, st3.predicate, null, st3.graph);

    // 2. If the IoT document doesn't exist, create one
    if (!iotDoc) {
        if (DEBUG) console.log('Document not found, creating one...');
        await updater
            .update(null, [st3])
            .then(() => { 
                if (DEBUG) console.log('Updated privateTypeIndex with a storage');
            }, (err) => { 
                if (DEBUG) console.error(`Error updating privateTypeIndex ${err}`);
            });
        await fetcher.createIfNotExists(solidstorage, 'text/turtle', '')
            .then((response) => {
                if (response.status === 201 && DEBUG) console.log('Created new IoT document.');
                else if (response.status === 200) throw new Error(solidstorage.value + ' is already in use by another application. Remove this file first...');
                else throw new Error('Unknown response status: ' + response.status + ' but it didn\'t seem to matter (bug)');
            })
            .catch((err) => { 
                if (DEBUG) console.log(`Failed to create new document: ${err}`); 
            });
        iotDoc = solidstorage;
    } else {
        // Sanity check: The document is mentioned in the type index, but is it actually there?
        await fetcher.createIfNotExists(iotDoc, 'text/turtle', '')
            .then((response) => { 
                if (response.status === 201 && DEBUG) console.warn(`Document was mentioned in type index, but didn't actually exist. Fixed this for you!`)
            })
            .catch((err) => {
                if (DEBUG) console.error(`Error running sanity check: ${err}`);
            });
    }

    if (DEBUG) console.log(`IoT document found or created, its location is: ${iotDoc.value}`);

    // Return location of the IoT doc
    return iotDoc.value;
}

// Simple sleep function
const sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}