/***************************************
 * Title: Solid API
 * Description: REST API which acts as a compatibility layer/wrapper around the Solid pods it has access to. Can also expose static turtle files for debugging purposes?
 * Author: Flor Sanders
 * Version: 1.0
*****************************************/

/* Importing require libraries */
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

/* Initializing libraries */
const app = express();

/* Importing configuration parameters */
import { LISTEN_PORT } from './config.mjs';

/* Importing routers from files */
import { router as staticFilesRouter } from './routes/staticFiles.mjs';
import { router as solidFilesRouter } from './routes/solidFiles.mjs';

/* Define routes and middleware */
app.use(cors());
app.use(bodyParser.json());
app.use('/v1/localfiles', staticFilesRouter);
app.use('/v1/solidfiles', solidFilesRouter);

/* Start services */
console.info(`Starting to listen on port ${LISTEN_PORT}...`);
app.listen(LISTEN_PORT, '0.0.0.0');