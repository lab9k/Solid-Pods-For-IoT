import SolidAuth from 'solid-auth-client';
import { graph, Fetcher, parse, Namespace } from 'rdflib';

// Introducing our namespaces (Used for querying the data!)
var SOSA = Namespace("http://www.w3.org/ns/sosa/");
var SAREF = Namespace("https://w3id.org/saref#");
var OM = Namespace("http://www.ontology-of-units-of-measure.org/resource/om-2/");
var RDF = Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");                         // Used mainly for RDF('type')
//var XSD = Namespace("http://www.w3.org/2001/XMLSchema#");                                   // Used for its units

// Function which creates store, fetches the database and saves it to the store
export function retrieveStore(url) {
    const store = graph();
    const fetcher = new Fetcher(store);
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
                            resolve({ store, fetcher, webId: session.webId });
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

export function getSensor(store) {
    var sensor_sosa = store.any(null, RDF('type'), SOSA('Sensor'), null);
    var sensor_saref = store.any(null, RDF('type'), SAREF('Device'), null);

    var sensor = !!(sensor_sosa.value) ? sensor_sosa : sensor_saref;
    var type = !!(sensor_sosa.value) ? 'sosa' : (!!(sensor_saref.value) ? 'saref' : 'none');
    return { sensor, type };
}

export function getMeasurements(sensor, type, store) {
    if (type === 'sosa') {
        return store.match(sensor, SOSA('madeObservation'), null, null).map((quad) => quad.object);
    } else if (type === 'saref') {
        return store.match(sensor, SAREF('makesMeasurement'), null, null).map((quad) => quad.object);
    }
}

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


function sortByDate(sensorData) {
    // Sort list of data by timestamp if they are available.
    if (sensorData[0].timestamp !== undefined) {
        return sensorData.sort((data1, data2) => (data1.timestamp > data2.timestamp) ? 1 : -1);
    } else {
        return sensorData;
    }

}