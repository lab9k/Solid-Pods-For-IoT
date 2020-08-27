/* Importing require libraries */
import express from 'express';

/* Initializing libraries */
const app = express();

/* Define program constants */
const LISTEN_PORT = 8090;

/* Importing routers from files */
import { router as localFilesRouter } from './routes/localFiles.mjs';

/* Define routes and middleware */
app.use('/v1/localfiles', localFilesRouter);

/* Start services */
console.info(`Starting to listen on port ${LISTEN_PORT}...`);
app.listen(LISTEN_PORT);