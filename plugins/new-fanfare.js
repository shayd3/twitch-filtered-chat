/* Example plugin defining a new fanfare
 *
 * Shows a splash of PJSalt emotes when a NOTICE is received from Twitch.
 *
 * To add, type the following commands:
 *  //plugins add SampleFanfarePlugin new-fanfare.js [<config>]
 *
 * Anything passed via <config> can be accessed through
 * this._config.PluginConfig
 */

"use strict";

class SampleFanfareEffect extends FanfareEffect {
  constructor(host, config, event) {
    super(host, config);
    this._host = host;
    this._config = config;
    this._event = event;
  }

  get name() { return "SampleFanfareEffect"; }

  get num() { return 30; }

  get emote() { return "PJSalt"; }

  initialize() {
    for (let i = 0; i < this.num; ++i) {
      this._particles.push(new FanfareParticle({
        xrange: [0, this._host.width - 40],
        y: this._host.height - 30,
        dxrange: [-1, 1],
        dyrange: [-20, -10],
        xforcerange: [-0.1, 0.1],
        yforcerange: [1.1, 0.9],
        image: this._image
      }));
    }
  }
}

class SampleFanfarePlugin { /* exported SampleFanfarePlugin */
  constructor(resolve, reject, client, args, config) {
    this._args = args;
    this._config = config;
    this._host = client.get("Fanfare");
    this._host.bindClient("twitch-notice", this._onEvent.bind(this, client));
    ChatCommands.add("newffdemo", this._onCmd, "From plugin SampleFanfarePlugin: demonstrate the effect", this);
    resolve(this);
  }

  get config() {
    if (this._config.PluginConfig.SampleFanfare) {
      return this._config.PluginConfig.SampleFanfare;
    } else {
      return {enable: true};
    }
  }

  _onCmd(cmd, tokens, client, self) {
    self._onEvent(client, {});
  }

  _onEvent(client, event) {
    Util.Debug("Received event:", event);
    let e = new SampleFanfareEffect(this._host, this.config, event);
    e.load().then(() => {
      this._host.addEffect(e);
    }).catch((err) => {
      Util.Error(`Failed to load effect ${e.name}:`, err, e);
    });
  }

  get name() { return "SampleFanfarePlugin"; }
}

/* globals FanfareEffect FanfareParticle */
/* vim: set ts=2 sts=2 sw=2 et: */
