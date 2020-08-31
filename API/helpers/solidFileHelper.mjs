
// Importing required libraries
import auth from 'solid-auth-cli';
import $rdf from 'rdflib';

// Importing constants from the configuration file
import {IDENTITY_PROVIDER, USERNAME, PASSWORD, ACCESSLISTLOCATION, DEBUG} from '../config.mjs'

// Defining the ontology namespaces for querying the files
const PIM = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
const DCTERMS = $rdf.Namespace('http://purl.org/dc/terms/');
const DCTYPE = $rdf.Namespace('http://purl.org/dc/dcmitype/');
var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');

// Function to obtain the list of files we have access to
export const getFileList = async function () {
    return new Promise((resolve, reject) => {
        getLocation().then((location) => {
            var store = $rdf.graph();
            var fetcher = new $rdf.Fetcher(store);
            console.log('loading file')
            fetcher.nowOrWhenFetched(location, (ok, msg, res) => {
                if (!ok) {
                    reject(msg);
                } else {
                    const store = $rdf.graph();
                    $rdf.parse(res.responseText, store, location, 'text/turtle');
                    console.log('text parsed')
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
                if(!ok){
                    reject(msg);
                } else {
                    $rdf.parse(res.responseText, store, location, 'text/turtle');
                    var file = store.any(null, DCTERMS('title'), title, null);
                    var file = (!!file) ? file.value : file;
                    // Fetch the file
                    fetcher.nowOrWhenFetched(file, (ok, msg, res) => {
                        if(!ok) {
                            reject(msg);
                        } else {
                            var content = res.responseText;
                            resolve(content);
                        }
                    });
                }
            });
        }).catch(err => reject(err))
    })
}

// Get the location of the access file
const getLocation = async function() {
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
        fetcher.load(profile)
            .then((res) => {
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
const sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

getFileList()
    .then(res => {
        console.log(`File list: ${res}`);
        console.log(`Fetching file ${res[0]}`);
        getFile(res[0]).then((file) => {
            console.log(file.length)
        }).catch(err => console.log(err));

    })
    .catch(err => console.log(err));