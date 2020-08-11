/***************************************
 * MQTT_SenML_DHT
 * Sensor: DHT11
 * Data serialization: SenML
 * Transport protocol: MQTT
 * Author: Flor Sanders
 * Version: 1.0
*****************************************/

// Including required libraries
#include "DHT.h"
#include <kpn_senml.h>
#include <NTPClient.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <PubSubClient.h>
#include "ProgramConfig.h"

// Initializing DHT Object
DHT dht(DHT_PIN, DHT_TYPE);

// Initializing NTPClient Object
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, NTP_SERVER, 0);
double baseTime;

// Initializing SenML Objects
SenMLPack doc(SENSOR_NAME);
SenMLFloatRecord temperature(KPN_SENML_TEMPERATURE, SENML_UNIT_DEGREES_CELSIUS);
SenMLFloatRecord humidity(KPN_SENML_HUMIDITY, SENML_UNIT_RELATIVE_HUMIDITY);

// Initializing MQTT Objects
WiFiClient espClient;
PubSubClient client(espClient);
char msg[MSG_BUFFER_SIZE];

// Reconnect to MQTT broker if connection was lost
void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Create a random client ID
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX);
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      // Once connected, publish an announcement...
      client.publish("outTopic", "hello world");
      // ... and resubscribe
      client.subscribe("inTopic");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

// Callback function for processing of incoming messages (if desired)
void callback(char* topic, byte* payload, unsigned int length) {
  return;
}

// Function to convert a MAC address to the corresponding EUI64 URI
String MACtoEUI64(String MAC) {
  for(int i = 1; i <= 5; i++) {
    MAC.remove(2*i, 1);
  }
  String EUI64 = MAC.substring(0, 6) + "fffe" + MAC.substring(6);
  return EUI64;
}

// Setup function ran after every reset
void setup() {
  // Begin serial output
  Serial.begin(115200);
  Serial.println("Program started.");

  // Connecting to wifi
  Serial.println("Connecting to WiFi.");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(".");

  // Initializing DHT Sensor
  Serial.println("Starting DHT Sensor.");
  dht.begin();

  // Initializing the Time client
  Serial.println("Starting NTP Client.");
  timeClient.begin();
  timeClient.update();
  baseTime = timeClient.getEpochTime();

  // Getting MAC and EUI64
  String MAC = WiFi.macAddress();
  MAC.toLowerCase();
  String EUI64 = MACtoEUI64(MAC);
  String URN = "urn:dev:mac:" + EUI64;

  // Configuring the SenML Doc
  Serial.println("Configuring SenML Doc.");
  doc.setBaseName(URN.c_str());
  doc.setBaseTime(baseTime);
  doc.add(&temperature);
  doc.add(&humidity);

  // Configure the MQTT client
  Serial.println("Configuring MQTT Client.");
  client.setServer(MQTT_SERVER, 1883);
  client.setCallback(callback);

  Serial.println("Setup complete, starting loop.");
}

void loop() {
  // Make sure the MQTT client has a connection to the broker
  if(!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Wait a few seconds between measurements. (The DHT is a very slow sensor)
  delay(2000);

  // Reading humidity and temperature from the dht22
  float humVal = dht.readHumidity();
  float tempVal = dht.readTemperature();
  
  // Check if any reads failed and exit early (to try again).
  if (isnan(tempVal) || isnan(humVal)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  // Updating the timeClient
  timeClient.update();
  double timeVal = timeClient.getEpochTime();

  // Setting the new measured values in the document
  temperature.set(tempVal, timeVal);
  humidity.set(humVal, timeVal);
  // Parsing the document to JSON and printing it to Serial output.
  doc.toJson(msg, MSG_BUFFER_SIZE);
  Serial.print("Publish message: ");
  Serial.println(msg);
  client.publish(MQTT_TOPIC, msg);
}
