/***************************************
 * Title: Config
 * Description: Contains all the configurable constants used throughout the application, in a central place.
 * Author: Flor Sanders
 * Version: 1.0
*****************************************/

// Importing required libraries
import dotenv from 'dotenv';
dotenv.config();

export const DEBUG = true;

export const IDENTITY_PROVIDER = 'https://solidweb.org';
export const USERNAME = process.env.SOLIDUSERNAME;
export const PASSWORD = process.env.SOLIDPASSWORD;
export const ACCESSLISTLOCATION = 'private/iotaccess.ttl';