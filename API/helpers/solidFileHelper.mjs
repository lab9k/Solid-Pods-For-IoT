/***************************************
 * Title: Solid File Helper
 * Description: Handles all the intricacies needed to fetch and update the files and access list on the Solid Pod
 * Author: Flor Sanders
 * Version: 1.0
*****************************************/

// Importing required libraries
import auth from 'solid-auth-cli';
import $rdf from 'rdflib';
import { v4 as uuidv4 } from 'uuid';

// Importing constants from the configuration file
import { IDENTITY_PROVIDER, USERNAME, PASSWORD, ACCESSLISTLOCATION } from '../config.mjs'

// Defining the ontology namespaces for querying the files
const PIM = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
const DCTERMS = $rdf.Namespace('http://purl.org/dc/terms/');
const DCTYPE = $rdf.Namespace('http://purl.org/dc/dcmitype/');
var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');

// Function to add a file to the list of files we have access to
export const addFileToList = async function (title, address) {
    // If no title is given, a random uuid is created as filename
    var title = !!title ? title : uuidv4() + '.ttl';
    return new Promise((resolve, reject) => {
        // Get the location of the access list
        getLocation().then((location) => {
            var store = $rdf.graph();
            var accesslist = store.sym(location);
            var accessdoc = accesslist.doc();
            var updater = new $rdf.UpdateManager(store);
            var fetcher = new $rdf.Fetcher(store);
            // Fetch the access list
            fetcher.load(accessdoc).then((res) => {
                // Check if the address variable contains a valid uri
                try {
                    var addressNode = store.sym(address);
                } catch(err) {
                    reject('Could not interpret address as URI')
                }
                // Check if the file is already in the list
                var result = store.any(addressNode, DCTERMS('title'), null, null);
                if (!result) {
                    // File was not yet present, adding it.
                    var additions = [$rdf.st(addressNode, RDF('type'), DCTYPE('Dataset'), accessdoc), $rdf.st(store.sym(address), DCTERMS('title'), title, accessdoc)];
                    updater.update(null, additions, (uri, ok, msg) => {
                        if (!ok) {
                            reject(msg);
                        } else {
                            resolve(`File ${title} was added.`);
                        }
                    });
                } else {
                    // File was already present 
                    reject('File already present');
                }

            }).catch(err => reject(err));
            
        }).catch(err => reject(err));
    });
}

// Function that removes an entry from the access list
export const removeFileFromList = async function (address) {
    return new Promise((resolve, reject) => {
        // Get the location of the access list
        getLocation().then((location) => {
            var store = $rdf.graph();
            var accesslist = store.sym(location);
            var accessdoc = accesslist.doc();
            var updater = new $rdf.UpdateManager(store);
            var fetcher = new $rdf.Fetcher(store);
            // Fetching the access list
            fetcher.load(accessdoc).then((res) => {
                // Check if the address variable contains a valid uri
                try {
                    var addressNode = store.sym(address);
                } catch(err) {
                    reject('Could not interpret address as URI')
                }
                // Searching for the title 
                var title = store.any(addressNode, DCTERMS('title'), null, null);
                var title = (!!title) ? title.value : title;
                var removals = [$rdf.st(addressNode, RDF('type'), DCTYPE('Dataset'), accessdoc), $rdf.st(store.sym(address), DCTERMS('title'), title, accessdoc)];
                updater.update(removals, null, (uri, ok, msg) => {
                    if (!ok) {
                        reject(msg.split('\n')[0]);
                    } else {
                        resolve(`File ${title} was removed.`);
                    }
                });
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

// Function to obtain the list of files we have access to
export const getFileList = async function () {
    return new Promise((resolve, reject) => {
        getLocation().then((location) => {
            var store = $rdf.graph();
            var fetcher = new $rdf.Fetcher(store);
            fetcher.nowOrWhenFetched(location, (ok, msg, res) => {
                if (!ok) {
                    reject(msg.split('\n')[0]);
                } else {
                    const store = $rdf.graph();
                    $rdf.parse(res.responseText, store, location, 'text/turtle');
                    var quads = store.match(null, RDF('type'), DCTYPE('Dataset'), null);
                    var list = quads.map((quad) => {
                        var title = store.any(quad.subject, DCTERMS('title'), null, null);
                        return title.value;
                    });
                    resolve(list);
                }
            });
        }).catch(err => reject(err));
    });
}

// Function to read the file contents from a file on one of the Solid pods we have access to
export const getFile = async function (title) {
    return new Promise((resolve, reject) => {
        getLocation().then((location) => {
            var store = $rdf.graph();
            var fetcher = new $rdf.Fetcher(store);
            fetcher.nowOrWhenFetched(location, (ok, msg, res) => {
                if (!ok) {
                    reject(msg.split('\n')[0]);
                } else {
                    $rdf.parse(res.responseText, store, location, 'text/turtle');
                    var file = store.any(null, DCTERMS('title'), title, null);
                    var file = (!!file) ? file.value : file;
                    // Fetch the file
                    fetcher.nowOrWhenFetched(file, (ok, msg, res) => {
                        if (!ok) {
                            reject(msg.split('\n')[0]);
                        } else {
                            var content = res.responseText;
                            resolve(content);
                        }
                    });
                }
            });
        }).catch(err => reject(err))
    });
}

// Get the location of the access file
const getLocation = async function () {
    return new Promise((resolve, reject) => {
        // Logging in if we haven't already
        login().then((session) => {
            // Getting storage base location
            getAppStorage(session.webId).then((base) => {
                // Adding relative file location
                resolve(base + ACCESSLISTLOCATION);
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
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

// At the first moment of running, the access list should be created if it doesn't exist
console.log('Logging in and getting access list location...');
getLocation().then((location) => {
    console.log(`Creating access list at ${location} if it doesn't exist yet...`);
    var store = $rdf.graph();
    var fetcher = new $rdf.Fetcher(store);
    fetcher.createIfNotExists($rdf.sym(location), 'text/turtle').then((res) => {
        console.log(`Document at ${location} found or created.`);
    }).catch(err => console.error(console.error(err))); 
}).catch(err => console.error(err));