# RML Mapper

A node.js server instance which connects to the the MQTT broker and converts the [SenML](https://tools.ietf.org/html/rfc8428) data to [RDF](https://www.w3.org/RDF/) format by means of an [RML](https://rml.io/) mapper, after which the data is saved to a Solid Pod.

## Installation

- Install [node.js](https://nodejs.org/en/).
- Open a terminal in the `RMLMapper` folder and run `npm install` to install the dependencies.
  A list of the used packages can be found in `package.json` under `"dependencies"`.

## Usage

- Configure the program parameters in `src/config.mjs`.

  - `MQTT_SERVER` and `MQTT_TOPIC` should correspond to the server and topic the sensor publishes its SenML messages to.
  - `DEBUG` enables showing information messages about the program stages.
  - `SHOW_DATA` enables showing the data at different stages in the process.
  - Two `RML_FILE` options are available for SSN and SAREF mapping respectively.
  - `UNITS_OM` and `PROPERTIES_OM` contain the mapping from the units supported by SenML to units and quantities supported by the om-2 ontology. Unsupported units are mapped to `undefined`.
  - 3 options for Solid identity providers are included, but this can be set to any valid address.
  - `LOCATION` defines the default location where the IoT gets saved to on the Pod.
    If there's already a file present at another location, this gets discovered automatically.
  - `UPDATER_DELAY_MS` defines the amount of time that has to be waited between updating the pod store with the local one.
    This is done to avoid sending too many fetch requests to the Solid server and thereby overloading it.

- Create a `credentials.mjs` file in the `src` folder and add the following code:

  ```javascript
  export const username = "YOUR_USERNAME";
  export const password = "YOUR_PASSWORD";
  ```

  This file is imported in `config.mjs`, and the parameters can also be immediately set over there.
  The reason for splitting it of is to avoid uploading credentials to Github by accident, hence the addition of the `credentials.mjs` in the `.gitignore` file.

- Start the program by running `npm start` or `node src/index.mjs`.

## Working

The program flow goes as follows.

1. The program connects to the MQTT server and subscribes to the predefined topic.
2. Incoming MQTT messages get passed to the parser where they get interpreted as a JSON string.
3. Once parsed, the base fields and normal fields of the SenML messages are reconstructed to obtain the data, in accordance with the [specifications](https://tools.ietf.org/html/rfc8428).
4. After reconstruction, the messages get preprocessed to simplify the mapping process, this includes:
   1. Filtering the messages to see whether they comply to spec, and contain numerical values.
      (Boolean and string values are currently not supported in SAREF.)
   2. Adding a [UUIDv4](https://www.ietf.org/rfc/rfc4122.txt) as a unique identifier for the measurement.
   3. Converting the timestamp from Unix format to the ISO-like format used in theNow xsd scheme.
   4. Converting units and values not supported in the om-2 ontology to ones that are
   5. Uses the unit from the SenML message to get both unit and quantity supported by the om-2 ontology, if supported.
   6. Stringifies the JSON.
5. Now the message is ready to be mapped, using the RocketRML library and an RML turtle file.
   The result is an RDF graph in either SSN or SAREF format containing the measurement information, serialized in N3 format.
6. Finally, the new graph gets merged with the existing data on the Solid Pod and saved to it, by means of the rdflib.js library.

Each of the steps mentioned here is implemented in a separate file, which are combined as functional building blocks in the main `index.mjs` file as callback functions.