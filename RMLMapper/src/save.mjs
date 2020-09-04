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
const iot_store = $rdf.graph();
const iot_fetcher = new $rdf.Fetcher(iot_store);
const iot_updater = new $rdf.UpdateManager(iot_store);
var webId;

// RDF Namespaces
const PIM = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
const resources = {};

// Save rdf data to the configured Solid Pod
export const save = async function (message) {
    //console.log(message);
    // Logging in if we haven't already -- Making sure the function only gets called once
    if (!session) {
        if(!login_called){
            login_called = true;
            if (DEBUG) console.log('Logging in...');
            session = await login().catch((err) => {
                if (DEBUG) console.error(`Error logging in: ${err}`);
            });
            webId = session.webId;
            if (DEBUG) console.log(`Logged in as: ${webId}`);
        } else {
            // If we're not logged in yet, but the login function has already been called, just wait a bit.
            while(!session){
                await sleep(1000);
            }
        }
    }

    // Check if a resource is not yet present
    if (!resources[message.name]) {
        var base = await getAppStorage(webId)
        // If no resource yet exists, create one.
        var location  = `${base}${LOCATION}${message.name.replace(/:/g,'_')}.ttl`
        var store = new $rdf.Formula;
        var updated = Date.now();
        var messages = 0;
        var called = false;
        var created = false
        resources[message.name] = {location, store, updated, messages, called, created}
    }

    var resource = resources[message.name];    
    // Create a document if it hasn't been done already -- Making sure the function gets called only once
    if (!resource.created) {
        if (!resource.called) {
            if (DEBUG) console.log(`Creating new document at ${location} if it doesn't exist yet.`)
            resource.called = true;
            // Create resource if it didn't exist yet
            await iot_fetcher.createIfNotExists($rdf.sym(location), 'text/turtle', '')
                .then((res) => {
                    if (DEBUG) console.log(`Created or found document at ${location}.`);
                    resource.created = true;
                })
                .catch((err) => {
                    if (DEBUG) console.error(`Error creating document: ${err}`);
                });
        } else {
            // If the resource doesn't exist yet, but the function has already been called, just wait a bit.
            while(!resource.created) {
                await sleep(1000);
            }
        }
    }

    // Parsing the message in the local store
    $rdf.parse(message.data, resource.store, resource.location, 'text/n3');
    resource.messages++;
    // Every so often, update the actual records in the Solid Pod
    if(Date.now() - resource.updated >= UPDATER_DELAY_MS) {
        if (DEBUG) console.log(`Updating the content at ${resource.location} with ${resource.messages} messages.`);
        // Update the Pod
        iot_updater.update(null, resource.store, (uri, ok, err) => {
            if (ok) {
                if (DEBUG) console.log(`Succesfully updated resource at ${uri}`);
            } else {
                if (DEBUG) console.log(`Error updating document: ${err}`);
            }
        });
        // Clear resource store
        resource.store = new $rdf.Formula;
        // Reset the update time
        resource.updated = Date.now();
        // Reset the message count
        resource.messages = 0;
    }
}

// Function to figure out the storage base
const getAppStorage = async function (webId) {
    return new Promise((resolve, reject) => {
        const store = $rdf.graph();
        const me = store.sym(webId);
        const profile = me.doc();
        const fetcher = new $rdf.Fetcher(store);
        // Fetch the profile document
        fetcher.load(profile)
            .then((res) => {
                // The location of the base storage must be mentioned in the profile document
                let location = store.any(me, PIM('storage'), null, null);
                resolve(location.value);
            })
            .catch((err) => {
                reject(err);
            })
    });
}

// Log in to the configured Solid Pod
const login = async function () {
    var session = await auth.currentSession();
    if (!session) session = await auth.login({ idp: IDENTITY_PROVIDER, username: USERNAME, password: PASSWORD }).catch((err) => {
        if (DEBUG) console.error(`Error logging in: ${err}`);
    });
    return session;
}

// Simple sleep function
const sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}