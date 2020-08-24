import SolidAuth from 'solid-auth-client';
import {graph, Fetcher, parse, Namespace} from 'rdflib';

// Introducing our namespaces (Used for querying the data!)
var SOSA = Namespace("http://www.w3.org/ns/sosa/");
var SAREF = Namespace("https://w3id.org/saref#")
var LWM2M = Namespace("https://iotsolidugent.inrupt.net/public/ontologies/omalwm2m.owl.ttl#");    // Self-published omalwm2m ontology
var RDF = Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");                         // Used mainly for RDF('type')
//var XSD = Namespace("http://www.w3.org/2001/XMLSchema#");                                   // Used for its units

// Function which creates store, fetches the database and saves it to the store
export function retrieveStore(url){
    const store = graph();
    const fetcher = new Fetcher(store);
    return new Promise((resolve, reject) => {
        // Check if the user is actually logged in
        SolidAuth.trackSession(session => {
            if(!!session){
                // We're logged in! --> Retrieving the document
                fetcher.nowOrWhenFetched(url, (ok, msg, response) => {
                    if(!ok) {
                        reject(`Failed fetching: ${msg}`);
                    } else {
                        // Fetch returned ok --> Parse the data to the store
                        try {
                            parse(response.responseText, store, url, 'text/turtle');
                            // Parsing succesful --> Return store and fetcher
                            resolve({store, fetcher});
                        } catch(err) {
                            reject(`Failed parsing: ${err.message}`)
                        }
                    }
                });
            } else {
                reject('Not logged in!')
            }
        }).catch(err => reject(`Error: ${err.message}`));
    })
}

export function getSensors(store) {
    var quads_sosa = store.match(null, RDF('type'), SOSA('Sensor'), null);
    var quads_saref = store.match(null, RDF('type'), SAREF('Device'), null);
}

// Function which fetches devices from the store
export function getDevices(store){
    // Query the store for the devices, map the results to the actual things we're looking for
    var quads = store.match(null, RDF('type'), LWM2M('Device'), null);
    var devices = quads.map(quad => quad.subject);
    return devices;
}

// Function which fetches the objects contained in the device
export function getObjects(store, device){
    // Query the store for the objects
    var quads = store.match(device, LWM2M('contains'), null, null);
    var objects = quads.map(quad => quad.object)
    return objects
}

// Function which fetches the resources organized into a given object
export function getResources(store, object){
    // Query the store for the resources
    var quads = store.match(object, LWM2M('consistsOf'), null, null);
    var resources = quads.map(quad => quad.object)
    return resources
}

export function getResourceTypes(store, resources){
    // Get types of all the resources
    var types = resources
        .map(resource => store.match(resource, RDF('type'), null, null).filter(quad => quad.object.value !== LWM2M('ResourceInstance').value)[0].object.value.slice(LWM2M().value.length))
    types = [...new Set(types)];
    return types;
}

function getResourcesWithType(store, object, type){
    var resources = getResources(store, object).filter(resource => {
        var resourceType = store.match(resource, RDF('type'), null, null).filter(quad => quad.object.value !== LWM2M('ResourceInstance').value)[0].object.value.slice(LWM2M().value.length);
        return resourceType === type;
    })
    return resources;
}

export function getData(store, object, type){
    var resources = getResourcesWithType(store, object, type);
    // If timestamps are available this will be plotted, else it will just be printed as a list.
    var data = resources.map(resource => {
        var timestamp = store.match(resource, LWM2M('hasTimeStamp'), null, null)[0];
        var value = store.match(resource, LWM2M('hasValue'), null, null)[0].object.value;
        if(timestamp === undefined){
            // No timestamp available, just getting value and getting out of here
            return value
        } else {
            timestamp = timestamp.object.value;
            return {timestamp, value}
        }
    });
    return sortByDate(data); 
}

function sortByDate(sensorData){
    // Sort list of data by timestamp if they are available.
    if(sensorData[0].timestamp !== undefined){
        return sensorData.sort((data1, data2) =>  (data1.timestamp > data2.timestamp) ? 1 : -1);
    } else {
        return sensorData;
    }
    
}