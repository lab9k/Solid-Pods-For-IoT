/* Importing required libraries */
import express from 'express';

/* Initializing libraries */
const router = express.Router();

/* Importing helper functions from files */
import { getFileList, getFile } from '../helpers/staticFileHelper.mjs';

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
                message: "Unable to read locally available files"
            }
        });
        console.log(`Error fetching fileList: ${err}`);
    }
});

router.get('/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
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
            default:
                res.status(500).json({
                    error: {
                        code: 'InternalError',
                        message: 'Process failed internally'
                    }
                });
        }
        console.log(`Error fetching file (${filename}): ${err}`);
    }
});

export { router };