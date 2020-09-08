# SPARQL Queries

This document lists some [SPARQL](https://www.w3.org/TR/rdf-sparql-query/) queries to query the data stored in the [Virtuoso triple store](https://virtuoso.openlinksw.com/).
It only makes use of the [SSN](https://www.w3.org/TR/vocab-ssn/) ontology since all (supported) [Saref](https://sites.google.com/site/smartappliancesproject/ontologies/reference-ontology) triples have been converted to SSN in the [LinkedPipes ETL pipeline](https://github.com/lab9k/Solid-Pods-For-IoT/tree/master/Linkedpipe).

## All sensors

```SPARQL
prefix saref: <https://w3id.org/saref#>
prefix sosa: <http://www.w3.org/ns/sosa/>
prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
prefix xsd:  <http://www.w3.org/2001/XMLSchema#>
prefix om2: <http://www.ontology-of-units-of-measure.org/resource/om-2/>
prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
prefix terms: <http://purl.org/dc/terms/>

SELECT ?name ?description ?property ?location
WHERE {
    ?name rdf:type sosa:Sensor .
    OPTIONAL{?name terms:description ?description .}
    OPTIONAL{?name sosa:observes ?property .}
    OPTIONAL{?name geo:lat_long ?location .}
}
```

## All measurement data

```SPARQL
prefix sosa: <http://www.w3.org/ns/sosa/>
prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
prefix xsd:  <http://www.w3.org/2001/XMLSchema#>
prefix om2: <http://www.ontology-of-units-of-measure.org/resource/om-2/>

SELECT ?name ?time ?value ?unit ?property
WHERE {
    ?name rdf:type sosa:Sensor .
    OPTIONAL{?name sosa:observes ?property .}
    ?name sosa:madeObservation ?uuid .
    ?uuid rdf:type sosa:Observation .
    ?uuid sosa:resultTime ?time .
    ?uuid sosa:hasResult ?uuidresult .
    ?uuidresult rdf:type om2:Measure .
    OPTIONAL{?uuidresult om2:hasUnit ?unit .}
    ?uuidresult om2:hasNumericalValue ?value .
}
```

## Measurement data between preset dates

```SPARQL
prefix sosa: <http://www.w3.org/ns/sosa/>
prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
prefix xsd:  <http://www.w3.org/2001/XMLSchema#>
prefix om2: <http://www.ontology-of-units-of-measure.org/resource/om-2/>

SELECT ?name ?time ?value ?unit ?property
WHERE {
    ?name rdf:type sosa:Sensor .
    OPTIONAL{?name sosa:observes ?property .}
    ?name sosa:madeObservation ?uuid .
    ?uuid rdf:type sosa:Observation .
    ?uuid sosa:resultTime ?time .
    ?uuid sosa:hasResult ?uuidresult .
    ?uuidresult rdf:type om2:Measure .
    OPTIONAL{?uuidresult om2:hasUnit ?unit .}
    ?uuidresult om2:hasNumericalValue ?value .
    FILTER (str(?time) > "2020-09-06T06:00:00Z")
    FILTER (str(?time) < "2020-09-06T06:05:00Z")
}
```

## Measurement data between preset dates for a specific property

```SPARQL
prefix sosa: <http://www.w3.org/ns/sosa/>
prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
prefix xsd:  <http://www.w3.org/2001/XMLSchema#>
prefix om2: <http://www.ontology-of-units-of-measure.org/resource/om-2/>

SELECT ?name ?time ?value ?unit ?property
WHERE {
    BIND(om2:Temperature AS ?property)

    ?name rdf:type sosa:Sensor .
    ?name sosa:observes ?property .
    ?name sosa:madeObservation ?uuid .
    ?uuid rdf:type sosa:Observation .
    ?uuid sosa:resultTime ?time .
    ?uuid sosa:hasResult ?uuidresult .
    ?uuidresult rdf:type om2:Measure .
    OPTIONAL{?uuidresult om2:hasUnit ?unit .}
    ?uuidresult om2:hasNumericalValue ?value .
    FILTER (str(?time) > "2020-09-06T06:00:00Z")
    FILTER (str(?time) < "2020-09-06T06:01:00Z")
}
```

