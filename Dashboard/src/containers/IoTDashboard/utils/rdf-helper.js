import SolidAuth from 'solid-auth-client';
import { graph, Fetcher, parse, Namespace, UpdateManager, st} from 'rdflib';
import { errorToaster, successToaster } from '@utils';
import auth from 'solid-auth-client';
import FC from 'solid-file-client';

// Introducing our namespaces (Used for querying the data!)
var SOSA = Namespace("http://www.w3.org/ns/sosa/");
var SAREF = Namespace("https://w3id.org/saref#");
var OM = Namespace("http://www.ontology-of-units-of-measure.org/resource/om-2/");
var RDF = Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
const PIM = Namespace('http://www.w3.org/ns/pim/space#');
const DCTERMS = Namespace('http://purl.org/dc/terms/');
const GEO = Namespace('http://www.w3.org/2003/01/geo/');

// Function that returns a list of files available in the subfolder of choice
export async function getFiles(subfolder) {
    var fc = new FC(auth);
    return new Promise((resolve, reject) => {
        SolidAuth.trackSession((session) => {
            if (!!session) {
                // Get base storage location
                getAppStorage(session.webId).then((location) => {
                    // Add subfolder path and fetch
                    var url = `${location}${subfolder}`;
                    fc.readFolder(url).then((res) => {
                        // Return file list
                        var files = res.files.map((file) => file.url);
                        resolve(files);
                    }).catch((err) => reject(err));
                }).catch(err => reject(err));
            } else {
                reject('Not logged in?!');
            }
        });
    });
}

// Function which creates store, fetches the database and saves it to the store
export function retrieveStore(url) {
    const store = graph();
    const fetcher = new Fetcher(store);
    const updater = new UpdateManager(store);
    return new Promise((resolve, reject) => {
        // Check if the user is actually logged in
        SolidAuth.trackSession(session => {
            if (!!session) {
                // We're logged in! --> Retrieving the document
                fetcher.nowOrWhenFetched(url, (ok, msg, response) => {
                    if (!ok) {
                        reject(`Failed fetching: ${msg}`);
                    } else {
                        // Fetch returned ok --> Parse the data to the store
                        try {
                            parse(response.responseText, store, url, 'text/turtle');
                            // Parsing succesful --> Return store and fetcher
                            resolve({ store, fetcher, updater, webId: session.webId });
                        } catch (err) {
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

// Obtain the saref/sosa sensor saved in the store
export function getSensor(store) {
    // Check if any triples match either a sosa or saref sensor
    var sensor_sosa = store.any(null, RDF('type'), SOSA('Sensor'), null);
    var sensor_saref = store.any(null, RDF('type'), SAREF('Device'), null);
    // Return the sensor that's found as well as its type
    var sensor = !!(sensor_sosa) ? sensor_sosa : sensor_saref;
    var type = !!(sensor_sosa) ? 'sosa' : (!!(sensor_saref) ? 'saref' : 'none');
    return { sensor, type };
}

// Get the description of the sensor in the store
export function getDescription(store) {
    var {sensor} = getSensor(store);
    // Check if the sensor contains a description
    var description = store.any(sensor, DCTERMS('description'), null, null);
    description = !!description ? description.value : '';
    return description;
}

// Update the description for the sensor in the store
export function updateDescription(description, file, store, updater) {
    var {sensor, type} = getSensor(store);
    if (type !== 'none') {
        // First get the previous description
        var old_description = getDescription(store);
        let del = !!old_description.length ? st(sensor, DCTERMS('description'), old_description, store.sym(file)) : null;
        let ins = st(sensor, DCTERMS('description'), description, store.sym(file));
        updater.update(del, ins, (uri, ok, msg) => {
            if (!ok) {
                errorToaster(msg);
            } else {
                successToaster('Updated description');
            }
        });
    }
}

// Get the location of the sensor in the store
export function getLocation(store){
    var {sensor} = getSensor(store);
    // Check if the sensor has a latitude and longitude
    var latlon = store.any(sensor, GEO('wgs84_pos#lat_long'), null, null);
    latlon = !!latlon ? latlon.value : ',';
    var latitude = latlon.split(',')[0];
    var longitude = latlon.split(',')[1];
    return {latitude, longitude}
}

// Update the location of the sensor in the store
export function updateLocation(latitude, longitude, file, store, updater){
    var {sensor, type} = getSensor(store);
    if (type !== 'none') {
        // First get the previous location
        var location = getLocation(store);
        var old_latitude = location.latitude;
        var old_longitude = location.longitude;
        let del = !!(old_latitude.length + old_longitude.length) ? st(sensor, GEO('wgs84_pos#lat_long'),`${old_latitude},${old_longitude}`, store.sym(file)) : null;
        let ins = st(sensor, GEO('wgs84_pos#lat_long'), `${latitude},${longitude}`, store.sym(file));
        updater.update(del, ins, (uri, ok, msg) => {
            if (!ok) {
                errorToaster(msg);
            } else {
                successToaster('Updated location');
            }
        });
    }
}

// Get the measurement nodes for the sensor
export function getMeasurements(sensor, type, store) {
    if (type === 'sosa') {
        return store.match(sensor, SOSA('madeObservation'), null, null).map((quad) => quad.object);
    } else if (type === 'saref') {
        return store.match(sensor, SAREF('makesMeasurement'), null, null).map((quad) => quad.object);
    }
}

// Get the sensor measurement data either a sosa or saref sensor
export function getData(measurements, type, store) {
    var data;
    if (type === 'sosa') {
        data = measurements.map((measurement) => {
            var timestamp = store.any(measurement, SOSA('resultTime'), null, null);
            timestamp = (!!timestamp) ? timestamp.value : undefined;

            var result = store.any(measurement, SOSA('hasResult'), null, null);

            var value = store.any(result, OM('hasNumericalValue'), null, null);
            value = (!!value) ? parseFloat(value.value) : undefined;

            var unit = store.any(result, OM('hasUnit'), null, null);
            unit = (!!unit) ? unit.value : undefined;

            return { timestamp, value, unit }
        });
        return sortByDate(data);
    } else if (type === 'saref') {
        data = measurements.map((measurement) => {
            var timestamp = store.any(measurement, SAREF('hasTimeStamp'), null, null);
            timestamp = (!!timestamp) ? timestamp.value : undefined;

            var value = store.any(measurement, SAREF('hasValue'), null, null);
            value = (!!value) ? parseFloat(value.value) : undefined;

            var unit = store.any(measurement, SAREF('isMeasuredIn'), null, null);
            unit = (!!unit) ? unit.value : undefined;

            return { timestamp, value, unit }
        });
        return sortByDate(data);
    }
}


// Function to figure out the storage base
async function getAppStorage (webId) {
    return new Promise((resolve, reject) => {
        const store = graph();
        const me = store.sym(webId);
        const profile = me.doc();
        const fetcher = new Fetcher(store);
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

function sortByDate(sensorData) {
    // Sort list of data by timestamp if they are available.
    if (sensorData[0].timestamp !== undefined) {
        return sensorData.sort((data1, data2) => (data1.timestamp > data2.timestamp) ? 1 : -1);
    } else {
        return sensorData;
    }
}