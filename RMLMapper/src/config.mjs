/***************************************
 * Title: Config
 * Description: Contains all the configurable constants used throughout the application, in a central place.
 * Author: Flor Sanders
 * Version: 1.0
*****************************************/

// Importing required libraries
import dotenv from 'dotenv';
dotenv.config();

// Program constants
export const DEBUG = true;
export const SHOW_DATA = false;

// MQTT constants
export const MQTT_SERVER = 'broker.hivemq.com';
// export const MQTT_TOPIC = 'solid_iot_one';
export const MQTT_TOPIC = 'solid_iot_two';

// Mapping constants (which SenML unit maps to which om-2 unit and quantity) (SSN/SAREF)
export const RML_FILE = './src/rml/rml_ssn.ttl';
// export const RML_FILE = './src/rml/rml_saref.ttl';
export const RML_OPTIONS = {
    toRDF: true,
    verbose: false,
    xmlPerformanceMode: false,
    replace: false
}
export const UNITS_OM = {
    "m": "metre",
    "kg": "kilogram",
    "g": "gram",
    "s": "second-Time",
    "A": "ampere",
    "K": "kelvin",
    "cd": "candela",
    "mol": "mole",
    "Hz": "hertz",
    "rad": "radian",
    "sr": "steradian",
    "N": "newton",
    "Pa": "pascal",
    "J": "joule",
    "W": "watt",
    "C": "coulomb",
    "V": "volt",
    "F": "farad",
    "Ohm": "ohm",
    "S": "siemens",
    "Wb": "weber",
    "T": "tesla",
    "H": "henry",
    "Cel": "degreeCelsius",
    "lm": "lumen",
    "lx": "lux",
    "Bq": "becquerel",
    "Gy": "gray",
    "Sv": "sievert",
    "kat": "katal",
    "m2": "squareMetre",
    "m3": "cubicMetre",
    "l": "litre",
    "m/s": "metrePerSecond-Time",
    "m/s2": "metrePerSecond-TimeSquared",
    "m3/s": "cubicMetrePerSecond-Time",
    "l/s": undefined,
    "W/m2": "wattPerSquareMetre",
    "cd/m2": "candelaPerSquareMetre",
    "bit": "bit",
    "bit/s": "bitPerSecond-Time",
    "lat": "degree",
    "lon": "degree",
    "pH": undefined,
    "dB": undefined,
    "dBW": undefined,
    "Bspl": undefined,
    "count": "one",
    "/": "one",
    "%": "one",
    "%RH": "percent",
    "%EL": "percent",
    "EL": "second-Time",
    "1/s": "reciprocalSecond-Time",
    "1/min": undefined,
    "beat/min": undefined,
    "beats": "one",
    "S/m": "siemensPerMetre"
}
export const PROPERTIES_OM = {
    "m": "Length",
    "kg": "Mass",
    "g": "Mass",
    "s": "Time",
    "A": "ElectricCurrent",
    "K": "Temperature",
    "cd": "LuminousIntensity",
    "mol": "AmountOfSubstance",
    "Hz": "Frequency",
    "rad": "Angle",
    "sr": "SolidAngle",
    "N": "Force",
    "Pa": "Pressure",
    "J": "Energy",
    "W": "Power",
    "C": "ElectricCharge",
    "V": "ElectricPotential",
    "F": "Capacitance",
    "Ohm": "ElectricalResistance",
    "S": "ElectricalConductance",
    "Wb": "MagneticFlux",
    "T": "MagneticFluxDensity",
    "H": "Inductance",
    "Cel": "Temperature",
    "lm": "LuminousFlux",
    "lx": "Illuminance",
    "Bq": "Frequency",
    "Gy": "AbsorbedDose",
    "Sv": "AbsorbedDose",
    "kat": "CatalyticActivity",
    "m2": "Area",
    "m3": "Volume",
    "l": "Volume",
    "m/s": "Velocity",
    "m/s2": "Acceleration",
    "m3/s": "VolumetricFlowRate",
    "l/s": "VolumetricFlowRate",
    "W/m2": "Irradiance",
    "cd/m2": "Luminance",
    "bit": "InformationCapacity",
    "bit/s": "SymbolRate",
    "lat": undefined,
    "lon": undefined,
    "pH": "Acidity",
    "dB": "Magnitude",
    "dBW": undefined,
    "Bspl": undefined,
    "count": "Number",
    "/": "Ratio",
    "%": "Ratio",
    "%RH": "RelativeHumidity",
    "%EL": "Percentage",
    "EL": "Time",
    "1/s": "Frequency",
    "1/min": "Frequency",
    "beat/min": "Frequency",
    "beats": "Number",
    "S/m": "ElectricalConductivity"
}

// Solid Pod constants (Credentials saved in a dotenv file to avoid pushing them to github)
export const IDENTITY_PROVIDER = 'https://inrupt.net';
// export const IDENTITY_PROVIDER = 'https://solid.community';
// export const IDENTITY_PROVIDER = 'https://solidweb.org';
// export const IDENTITY_PROVIDER = 'https://pods.pool42.io:8443';
export const USERNAME = process.env.SOLIDUSERNAME;
export const PASSWORD = process.env.SOLIDPASSWORD;
export const LOCATION = 'private/iot/'
export const UPDATER_DELAY_MS = 30e3;