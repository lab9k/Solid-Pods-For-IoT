/***************************************
 * Title: Static Files
 * Description: Binds the routes to the correct functions for the files on the solid pods.
 * Author: Flor Sanders
 * Version: 1.0
*****************************************/

/* Importing required libraries */
import express from 'express';

/* Initializing libraries */
const router = express.Router();

/* Importing helper functions from files */
import { getFileList, getFile, addFileToList, removeFileFromList } from '../helpers/solidFileHelper.mjs';

/* Defining routes to obtain local files */

// Get a list of all local files available
router.get('/', async (req, res) => {
    try {
        console.log('Requested file list...');
        const files = await getFileList();
        res.status(200).json({
            value: files.map(file => {
                return {
                    name: file
                }
            })
        });
    } catch (err) {
        res.status(500).json({
            error: {
                code: "InternalError",
                message: "Unable to locate or fetch access list."
            }
        });
        console.log(`Error fetching fileList: ${err}`);
    }
});

router.get('/:filename', async (req, res) => {
    try {
        const filename = encodeURIComponent(req.params.filename);
        console.log(`Requested file contents: ${filename}`);
        const file = await getFile(filename);
        res.status(200).set('Content-Type', 'text/turtle').send(file);
    } catch (err) {
        switch (err.code) {
            case 'ENOENT':
                res.status(404).json({
                    error: {
                        code: 'ENOENT',
                        message: 'File not available'
                    }
                });
                break;
            default:
                res.status(500).json({
                    error: {
                        code: 'InternalError',
                        message: 'Process failed internally'
                    }
                });
                break;
        }
        console.log(`Error fetching file (${filename}): ${err}`);
    }
});

router.put('/:filename', async (req, res) => {
    try {
        var filename = req.body.title;
        var address = req.body.address;
        var message = await addFileToList(filename, address);
        res.status(201).json({
            value: message
        });
    } catch (err) {
        switch(err) {
            case 'Could not interpret address as URI':
                res.status(400).json({
                    error: {
                        code: 'BadURI',
                        message: err
                    }
                });
                break;
            case 'File already present':
                // Not an actual error
                res.status(200).json({
                    value: err
                });
                break;
            default: 
                res.status(500).json({
                    error: {
                        code: 'InternalError',
                        message: 'Process failed internally'
                    }
                });
                break;
        }
        console.log(err);
    }
});

router.delete('/:filename', async (req, res) => {
    try {
        var address = req.body.address;
        var message = await removeFileFromList(address);
        res.status(200).json({
            value: message
        });
    } catch (err) {
        switch(err) {
            case 'Could not interpret address as URI':
                res.status(400).json({
                    error: {
                        code: 'BadURI',
                        message: err
                    }
                });
                break;
            case "Exception in update: TypeError: Cannot read property 'toNT' of null":
                res.status(404).json({
                    error: {
                        code: 'ENOENT',
                        message: 'File was not present in access list'
                    }
                });
                break;
            default: 
                res.status(500).json({
                    error: {
                        code: 'InternalError',
                        message: 'Process failed internally'
                    }
                });
        }
        console.log(err);
    }
});

export { router };