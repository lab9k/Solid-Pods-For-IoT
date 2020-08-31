# Solid API

An API implemented using node.js which acts as an authentication and management wrapper for the IoT data in RDF format (Turtle serialization) saved either in Solid pods or on local storage. Its main purpose is to offer our LinkedPipes ETL service to acquire the available datasets without having to deal with Solid authentication.

## Installation

- Install [node.js](https://nodejs.org/en/).
- Open a terminal in the `RMLMapper` folder and run `npm install` to install the dependencies.
  A list of the used packages can be found in `package.json` under `"dependencies"`.

## Usage

- Configure the program constants in `config.mjs`.

- Create a `.env` file in the `API` folder with the following content

  ```
  SOLIDUSERNAME=YOUR_USERNAME
  SOLIDPASSWORD=YOUR_PASSWORD
  ```

- Place the files that should be available locally in the `static` folder. Some example files are provided in this repository.

- Start the program by running `npm start` or `node index.mjs`.

## Working

The API has the following paths available for calls:

- `GET`

  - `GET http://localhost:LISTEN_PORT/v1/localfiles`: Returns a list of the files in the `static` subfolder. E.g.

    ```json
    {"value":[{"name":"example1.ttl"},{"name":"example2.ttl"},{"name":"example3.ttl"},{"name":"example4.ttl"}]}
    ```

  - `GET http://localhost:LISTEN_PORT/v1/localfiles/filename.ttl`: Returns the contents of the file `filename.ttl` in the `static` subfolder.
    Note: Only support for turtle files is provided, so the media type will always be set to `text/turtle`.

  - `GET http://localhost:LISTEN_PORT/v1/solidfiles`: Returns a list of the files available to be fetched from the Solid Pods.
    Note: The returned format is identical to the one used for normal files.

  - `GET http://localhost:LISTEN_PORT/v1/solidfile/filename.ttl`: Fetches the file contents from the file `filename.ttl` on a Solid Pod and returns the contents.
    Note: If our client doesn't have access to the file for some reason, it will not be deleted from the available resources list, but return a status code of `500` to the client, indicating an internal error.

- `PUT`

  - `PUT http://localhost:LISTEN_PORT/v1/solidfile/filename.ttl`: Verifies if read access was granted for that file and if it contains valid turtle syntax. If so, the file and its address (available in the body) are saved to the list of resources available to the API. The body should look like so:

    ```json
    {"title":"filename.ttl","address":"http://somesolidpod.example.org/location/filename.ttl"}
    ```
    
    If the `title` field is not included, a [uuidv4](https://tools.ietf.org/html/rfc4122) will be generated and used as filename to avoid collisions in the access list.

- `DELETE`

  - `DELETE http://localhost:LISTEN_PORT/v1/solidfile/filename.ttl`: The file with that name will be removed from the list of available resources. The body should look identical to the one used for the PUT request.

Note: Each of the requests above is defined in either the `solidFiles.mjs` or `staticFiles.mjs` files in the `routes` subfolder and bound to one of the functions defined in the `solidFileHelper.mjs` or `staticFileHelper.mjs` files in the `helpers` subfolder.

Note: The link formats, response codes, content structure of the body, etc. were constructed conforming as closely as possible to the [Digipolis REST API Guidelines](https://github.com/digipolisgent/api-guidelines). (Currently afaik only the logging doesn't suffice to this spec.)