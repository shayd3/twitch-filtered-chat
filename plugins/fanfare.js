/** Fanfare Plugin
 *
 * Demonstrates an example "Fanfare" plugin that displays a FrankerZ whenever
 * someone subscribes.
 *
 * Commands:
 *  //ff on:        Enables fanfare
 *  //ff off:       Disables fanfare
 *  //ff show-sub:  Demonstrates the subscription fanfare
 *  //ff:           Displays //ff usage and whether or not fanfare is enabled
 */

const FanfareCSS = `
img.ff.ff-sub {
  position: absolute;
  display: none;
}
.ff.ff-particle {
  position: absolute;
  top: 0px;
  left: 0px;
  z-index: 100;
}
`;

class FanfarePlugin { /* exported FanfarePlugin */
  constructor(resolve, reject, client, args, config) {
    this._args = args;
    this._on = false;
    this._particles = [];
    this._nparticles = args.nparticles || 10;
    if (config.PluginConfig) {
      if (config.PluginConfig.Fanfare) {
        let ffcfg = config.PluginConfig.Fanfare;
        if (ffcfg.N) {
          this._nparticles = ffcfg.N;
        }
        if (ffcfg.On) {
          this._on = true;
        }
      }
    }
    this._setupCSS();
    this._setupParticles();
    let prefix = "From plugin FanfarePlugin: ";
    ChatCommands.add("ff", this._onCmd, prefix + "Enable or disable fanfare", this);
    ChatCommands.addUsage("ff", "on", prefix + "Enable fanfare");
    ChatCommands.addUsage("ff", "off", prefix + "Disable fanfare");
    ChatCommands.addUsage("ff", "show-sub", prefix + "Display the subscriber fanfare");
    ChatCommands.addUsage("ff", "particles <N>", prefix + "Set the number of particles to <N>");
    client.bind("twitch-sub", this._onSubEvent.bind(this, client));
    client.bind("twitch-resub", this._onSubEvent.bind(this, client));
    client.bind("twitch-giftsub", this._onSubEvent.bind(this, client));
    client.bind("twitch-anongiftsub", this._onSubEvent.bind(this, client));
    resolve(this);
  }

  _setupCSS() {
    let e = document.createElement("style");
    e.setAttribute("type", "text/css");
    e.setAttribute("id", "ff-styles");
    e.setAttribute("data-from", "plugin");
    e.innerText = FanfareCSS;
    document.head.appendChild(e);
  }

  _setupParticles() {
    for (let p of this._particles) {
      $(p).remove();
    }
    this._particles = [];
    for (let i = 0; i < this._nparticles; ++i) {
      let p = $("<span class=\"ff ff-particle\"></span>");
      p.attr("data-source", "FanfarePlugin");
      p.attr("data-ff-particle", i);
      p.attr("id", `ff-particle-${i}`);
      p.hide();
      $("body").append(p);
    }
  }

  _onCmd(cmd, tokens, client, self) {
    if (tokens.length === 0) {
      if (self._on) {
        Content.addInfo("Fanfare is enabled");
      } else {
        Content.addInfo("Fanfare is disabled");
      }
      this.printUsage();
    } else if (tokens[0] === "on" || tokens[0] === "off") {
      self._on = tokens[0] === "on";
      Content.addInfo("Fanfare is now " + (self._on ? "enabled" : "disabled"));
    } else if (tokens[0] === "show-sub") {
      let old_on = self._on;
      self._on = true;
      self._onSubEvent(client, {});
      self._on = old_on;
    } else {
      Content.addError(`Fanfare: unknown argument ${tokens[0].escape()}`);
      this.printUsage();
    }
  }

  _onSubEvent(client, event) {
    if (this._on) {
      for (let c of $(".module .content")) {
        let $c = $(c);
        let $i = $(`<img class="ff ff-sub" width="100%" height="100%" />`);
        $i.attr("src", client.GetEmote("FrankerZ"));
        $i.css("position", "absolute");
        let self = this;
        $i.on("load", function() {
          $(this).fadeTo(400, 0.25);
          window.setTimeout(self._removeFanfare.bind(self, this), 1000);
        });
        $c.prepend($i);
      }
    }
  }

  _removeFanfare(i) {
    $(i).fadeOut(400, function() { $(this).hide(); });
  }

  get name() { return "FanfarePlugin"; }

  toString() { return "[object FanfarePlugin]"; }
}

/* vim: set ts=2 sts=2 sw=2 et: */
