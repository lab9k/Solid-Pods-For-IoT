/* Importing require libraries */
import express from 'express';
import cors from 'cors';

/* Initializing libraries */
const app = express();

/* Define program constants */
const LISTEN_PORT = 8090;

/* Importing routers from files */
import { router as localFilesRouter } from './routes/localFiles.mjs';

/* Define routes and middleware */
app.use(cors());
app.use('/v1/localfiles', localFilesRouter);

/* Start services */
console.info(`Starting to listen on port ${LISTEN_PORT}...`);
app.listen(LISTEN_PORT, '127.0.0.1');