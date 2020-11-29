const debug = require("debug")("presence"),
  console = require("console"),
  superagent = require("superagent"),
  HostBase = require("microservice-core/HostBase");

const POLL_TIME = 3 * 1000,
  TIMEOUT = 3 * 1000;

const TOPIC_ROOT = process.env.TOPIC_ROOT || "presence",
  MQTT_HOST = process.env.MQTT_HOST;

class Presence extends HostBase {
  constructor(presence) {
    super(MQTT_HOST, TOPIC_ROOT + "/" + presence.person);
    this.presence = presence;
    this.person = presence.person;
    this.device = presence.device;

    this.state = {};

    this.poll();
  }

  async poll() {
    for (;;) {
      try {
        const result = await superagent
          .get(`http://${this.device}`)
          .timeout(TIMEOUT);
        console.log("result", result);
      } catch (e) {
        console.log(this.device, e.code);
        if (e.code === "ECONNREFUSED") {
          console.log(this.person, "PRESENT!");
        } else {
          console.log(this.person, "AWAY!");
        }
      }
      await this.wait(POLL_TIME);
    }
  }
}

const main = async () => {
  const people = {};
  const Config = await HostBase.config();
  console.log("Config", Config.presence);
  for (const presence of Config.presence) {
    people[presence.device] = new Presence(presence);
  }
  // try {
  //   const result = await superagent.get("http://mike-iphone12");
  //   console.log("result", result.code);
  // } catch (e) {
  //   console.log(e.code);
  // }
};

main();
