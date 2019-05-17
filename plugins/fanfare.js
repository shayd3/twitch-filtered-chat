/** Fanfare Plugin
 *
 * Demonstrates an example "Fanfare" plugin that displays a FrankerZ whenever
 * someone subscribes.
 *
 * Commands:
 *  //ff on:    Enables fanfare
 *  //ff off:   Disables fanfare
 *  //ff:       Displays //ff usage and whether or not fanfare is enabled
 */

const FanfareCSS = `
img.fanfare {
  position: absolute;
  display: none;
}
`;

class FanfarePlugin { /* exported FanfarePlugin */
  constructor(resolve, reject, client, args) {
    this._args = args;
    this._on = false;
    this._setupCSS();
    ChatCommands.add("ff", this._onFfCmd, "Enable or disable fanfare", this);
    ChatCommands.addUsage("ff", "on", "Enable fanfare", {literal: true});
    ChatCommands.addUsage("ff", "off", "Disable fanfare", {literal: true});
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

  _onFfCmd(cmd, tokens, client, self) {
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
    } else {
      Content.addError(`Fanfare: unknown argument ${tokens[0].escape()}`);
      this.printUsage();
    }
  }

  _onSubEvent(client, event) {
    if (this._on) {
      for (let c of $(".module .content")) {
        let $c = $(c);
        let $i = $(`<img class="fanfare" width="100%" height="100%" />`);
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

  toString() {
    return "[object FanfarePlugin]";
  }
}

/* vim: set ts=2 sts=2 sw=2 et: */
