# Sensor

A small network of IoT sensors publishing real-time data in [SenML](https://tools.ietf.org/html/rfc8428) format over the [MQTT](http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html) protocol. The implementation is done in an Arduino environment for the [NodeMCU](https://www.nodemcu.com/index_en.html) development board.

## Sensor_DHT

The `Sensor_DHT` folder contains the Arduino sketch which implements above description for a DHT11 temperature and air humidity sensor.

### Installation

- Install [Arduino IDE](https://www.arduino.cc/en/Main/Software).

- [Add ESP8266 board package](https://create.arduino.cc/projecthub/electropeak/getting-started-w-nodemcu-esp8266-on-arduino-ide-28184f) to the Arduino IDE.

- [Install libraries](https://www.arduino.cc/en/guide/libraries):

  - Using the library manager:
    - [NTPClient](https://github.com/arduino-libraries/NTPClient)
    - [PubSubClient](https://github.com/knolleary/pubsubclient)
  - Import as zip file:
    - [KPN SenML](https://github.com/kpn-iot/senml-c-library)
    - [Base64](https://github.com/adamvr/arduino-base64)

- At the time of writing, it is necessary to apply the following workaround to avoid compilation errors:

  - In the `Base64` library folder rename `Base64.h` and `Base64.cpp` to `MyBase64.h` and `MyBase64.cpp`.
  - In the `KPN SenML` library `src` folder change `#include <Base64.h>` to `#include <MyBase64.h>` in both `senml_binary_actuator.cpp` and `senml_helpers.cpp`.
  - In `ArduinoData/packages/esp8266/hardware/esp8266/2.7.1/cores/esp8266`, open `base64.h` and add `#include <WString.h>` under ` #define CORE_BASE_64_H_`. 

  The cause of the compilation errors seem to stem from the presence of a `base64.h` file in the core packages for the 8266 platform.

### Usage

- Configure the sketch parameters in `ProgramConfig.h`.

- [Connect the DHT11](https://learn.adafruit.com/dht/connecting-to-a-dhtxx-sensor) to the NodeMCU, data pin to `D3` in default configuration.

- Build the sketch and upload to the NodeMCU, it will:

  - Connect to the configured Wi-Fi network.
  - Connect to the configured MQTT Broker.
    We used a [Mosquitto](https://mosquitto.org/) instance running on a Raspberry Pi, but any broker will do.

  - Take measurements using the DHT11 sensor and publish them to the configured MQTT topic in SenML format. For example:
    ` [{"bn":"urn:dev:mac:B4E62DFFFE28E081","n":"temperature","t":1597134862.0,"u":"Cel","v":26.0},{"n":"humidity","t":1597134862.0,"u":"%RH","v":18.0}]`.