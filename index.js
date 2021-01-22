process.title = process.env.TITLE || "presence-microservice";
process.env.DEBUG = "PresenceHost,HostBase";

const debug = require("debug")("PresenceHost"),
  console = require("console"),
  superagent = require("superagent"),
  HostBase = require("microservice-core/HostBase");

const POLL_TIME = 5 * 1000,
  TIMEOUT = 15 * 1000;

const TOPIC_ROOT = process.env.TOPIC_ROOT || "presence",
  MQTT_HOST = process.env.MQTT_HOST;

let busy = false;

class PresenceHost extends HostBase {
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

  async pollOne() {
    const s = {},
      device = this.device;

    for (;;) {
      try {
        while (busy) {
          await this.wait(100);
        }
        busy = true;
        console.log(new Date().toLocaleTimeString(), "polling", this.device);
        const result = await superagent
          .get(`http://${this.device}`)
          .timeout(TIMEOUT);

        busy = false;
        console.log("result", result);
      } catch (e) {
        busy = false;
        debug(this.device, e.code);
//        if (e.code === "ECONNABORTED") {
//          await this.wait(1000);
//          continue;
//                  console.log(new Date().toLocaleTimeString(), this.device, "aborted");
//      } 
       if (e.code === "ECONNREFUSED" || e.code === "ECONNABORTED") {
          if (this.state.person !== true) {
            debug(this.device, this.person, "PRESENT!");
          }
          s[device] = true;
          this.state = s;
          return;
        } else {
          if (this.state.person !== false) {
            debug(this.device, this.person, "AWAY!");
          }
          s[device] = false;
          this.state = s;
          return;
        }
      }
    }
  }

  async poll() {
    for (;;) {
      await this.pollOne();
      console.log("poll completed");
      await this.wait(POLL_TIME);
    }
  }

  async command() {
    return false;
  }
}

const main = async () => {
  const people = {};
  const Config = await HostBase.config();
  console.log("Config", Config.presence);
  for (const presence of Config.presence) {
    const devices = Array.isArray(presence.device)
      ? presence.device
      : [presence.device];
    for (const device of devices) {
      //      if (presence.person.toLowerCase() !== "chris") {
      //        continue;
      //      }
      people[device] = new PresenceHost({
        person: presence.person,
        device: device,
      });
    }
  }
};

main();
