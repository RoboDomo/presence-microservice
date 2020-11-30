process.title = process.env.TITLE || "presence-microservice";
// process.env.DEBUG = "PresenceHost,HostBase";

const debug = require("debug")("PresenceHost"),
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

    console.log(
      "construct",
      this.person,
      this.device,
      TOPIC_ROOT + "/" + presence.person
    );
    this.poll();
  }

  async poll() {
    const s = {},
      device = this.device;

    for (;;) {
      try {
        const result = await superagent
          .get(`http://${this.device}`)
          .timeout(TIMEOUT);
        console.log("result", result);
      } catch (e) {
        // console.log(this.device, e.code);
        if (e.code === "ECONNREFUSED") {
          if (this.state.person !== true) {
            debug(this.device, this.person, "PRESENT!");
          }
          s[device] = true;
          this.state = s;
        } else {
          if (this.state.person !== false) {
            debug(this.device, this.person, "AWAY!");
          }
          s[device] = false;
          this.state = s;
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
};

main();
