
class FanfarePlugin { /* exported FanfarePlugin */
  constructor(resolve, reject, client, args) {
    this._args = args;
    this._on = false;
    ChatCommands.add("ff", this.ff_cmd, "Enable or disable fanfare", this);
    ChatCommands.addUsage("ff", "on", "Enable fanfare", {literal: true});
    ChatCommands.addUsage("ff", "off", "Disable fanfare", {literal: true});
    resolve(this);
  }

  ff_cmd(cmd, tokens, client, self) {
    if (tokens.length === 0) {
      if (self._on) {
        Content.addInfo("Fanfare is enabled");
      } else {
        Content.addInfo("Fanfare is disabled");
      }
      this.printUsage();
    } else if (tokens[0] === "on" || tokens[0] === "off") {
      self._on = tokens[0] === "on";
      Content.addInfo("Fanfare is now " + self._on ? "enabled" : "disabled");
    } else {
      Content.addError(`Fanfare: unknown argument ${tokens[0].escape()}`);
      this.printUsage();
    }
  }

  get name() { return "FanfarePlugin"; }

  toString() {
    return "[object FanfarePlugin]";
  }
}

/* vim: set ts=2 sts=2 sw=2 et: */
