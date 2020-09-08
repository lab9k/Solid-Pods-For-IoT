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
    - [Adafruit DHT](https://github.com/adafruit/DHT-sensor-library)

- At the time of writing, it is necessary to apply the following workaround to avoid compilation errors:

  - In the `Base64` library folder rename `Base64.h` and `Base64.cpp` to `MyBase64.h` and `MyBase64.cpp`.
    A version of the library where these changes are applied can be found [here](https://github.com/FlorSanders/arduino-my-base64).
  - In the `KPN SenML` library `src` folder change `#include <Base64.h>` to `#include <MyBase64.h>` in both `senml_binary_actuator.cpp` and `senml_helpers.cpp`.
  A version of the library where these changes are applied can be found [here](https://github.com/FlorSanders/senml-c-library).
  - In `ArduinoData/packages/esp8266/hardware/esp8266/2.7.1/cores/esp8266`, open `base64.h` and add `#include <WString.h>` under ` #define CORE_BASE_64_H_`. 
    An [issue](https://github.com/esp8266/Arduino/issues/7516) has been opened, the change has been incorporated in the master branch. Should be fixed when running the latest version.
  
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

## Sensor_LDR

The `Sensor_LDR` folder contains the Arduino sketch which implements above description for a light dependent resistor (LDR) in a voltage divider configuration. Since no calibration has been done it just converts the analog reading to a percentage value.

### Installation

The installation is identical as for the `Sensor_DHT` sketch, with the exception that the Adafruit DHT library doesn't need to be installed.

### Usage

- Configure the sketch parameters in `ProgramConfig.h`.
- Connect one leg of the LDR to the 3.3V terminal and the other to the analog input (`A0` in default configuration). Add a pull-down resistor from the analog input to ground to complete the voltage divider.
  (Since the resistance of the LDR is inversely proportional to the illuminance strength, this configuration will yield a voltage that's proportional to the amount of light falling on it.)
- Build the sketch and upload to the NodeMCU, it will:

  - Connect to the configured Wi-Fi network.
  - Connect to the configured MQTT Broker.
    We used a [Mosquitto](https://mosquitto.org/) instance running on a Web Server, but any broker will do.

  - Take measurements using the DHT11 sensor and publish them to the configured MQTT topic in SenML format. For example:
    ` [{"bn":"urn:dev:mac:b4e62dfffe28dfd0_","bt":1597846496.0,"n":"light","t":150.0,"v":93.0}]`.