# presence-microservice

Determines presence of one or more persons based upon presence of their phone.

It's a simple trick to determine if the phone is present. We try an http connection to the phone and it will return ECONNREFUSED error if the phone is present. Otherwise, the http request times out and we assume the phone is not present or turned off.

For robust present/not present determination, a variety of methods should be used.

# Installation

You have three ways to run this.

## Clone repository

Clone this repository and run it using the `npm start` command.

## Docker container

_Note_ - Docker must be installed on the host you want to run this microservice.

There is a premade Docker container on Docker Hub for this microservice.

You may:

1. Modify and use the start-presence.sh script in the https://github.com/RoboDomo/docker-scripts repository.
2. Execute a command like this, modified to your liking:

```
docker run \
 -d \
 -log-opt max-size=10m --log-opt max-file=5 \
 --net=host \
 --restart always \
 --name presence-microservice \
 -e DEBUG="PresenceHost,HostBase" \
 -e MQTT_HOST=<your MQTT broker> \
 -e MONGODB_URL="mongodb://<your mongo host>" \
 -e TITLE=""presence-microservice" \"
 robodomo/presence-microservice
```

# Configuration

Configuratino is done via a subscription to the MQTT config topic. The config message received contains a JSON object with configuration data for all sorts of things RoboDomo related. The releveant member of the Config object looks something like:

```
  presence: [
	{ person: "Me", device: "me-iphone" },
	{ person: "Wifey", device: "wife-iphone"}
  ],
```

The config-microservice monitors changes to the master config.js file on the host it is running. Edit the config.js there and add your presence configuration, based upon the above example. When you save the config.js, a new MQTT config message is sent so anyone listening can handle configuration change.

For more robust presence determination, you might want to add both the person's phone and person's watch to the presence: member array in config.js.

# MQTT

This microservice posts MQTT messages of the form:

```
* topic: presence/<person>/status/<device>
* message: true|false
```

You can derive the topic from the global config.js sent via MQTT.

# Developing

If you want to modify how this program works, clone the repository and edit away. PRs welcome.

# License:

See LICENSE file in the root of this repository

# See Also

- RoboDomo Documentation repository: https://github.com/RoboDomo/Documentation
- microservice-core repository: https://github.com/RoboDomo/microservice-core
