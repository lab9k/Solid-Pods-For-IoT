# Linked pipe

A pipeline set up in [LinkedPipes ETL](https://etl.linkedpipes.com/) which fetches the turtle files from containing IoT data from the [Solid API](), combines and transforms them and saves them in a [Virtuoso](https://virtuoso.openlinksw.com/) database.

## Installation

While LinkedPipes ETL can be built from the codebase, the easiest way of installation is through docker.

- Install [Docker](https://docs.docker.com/get-docker/).
- Install [Docker Compose](https://docs.docker.com/compose/install/).
- Install [LinkedPipes ETL](https://etl.linkedpipes.com/installation/). At the time of writing this could be done using this one-liner:
  `curl https://raw.githubusercontent.com/linkedpipes/etl/master/docker-compose.yml | docker-compose -f - up`
- Open the GUI in the browser at `http://localhost:8080/#/pipelines` (default config).
- Click the hamburger button followed by the upload button.
  ![image-20200828145516395](README.assets/image-20200828145516395.png)
- Upload the `config.json` file found in this repository.

## Usage

- Configure and start the Solid API.
- In the `config.json` file found in this repository, search and replace `http://solid.pool42.io:8030/` by the address where your API is hosted.
- (TODO: configure the address of the virtuoso server.)
- Open the `Solid Datapod Combiner` pipeline in LinkedPipes ETL and press the EXECUTE button.
  ![image-20200828150138253](README.assets/image-20200828150138253.png)
- The result is a merged triple store database in which all (supported*) SAREF triples were converted to SSN/SOSA.

Note: The errors for failed `HTTP GET` requests for the files and parses to RDF will be suppressed. This behavior can be changed by switching the Skip on error option in the configuration.

