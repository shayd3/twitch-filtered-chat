"use strict";

class SamplePlugin { /* exported SamplePlugin */
  constructor(resolve, reject, client, args) {
    this._args = args;
    let prefix = "From plugin " + this.name + ": ";
    ChatCommands.add("sample-plugin", this._say_hi.bind(this), prefix + "Say hello");
    resolve(this);
  }

  _say_hi(cmd, tokens, client) {
    Content.addPreText(`Hi from ${this.name} ${client.GetName()}!`);
    if (tokens && tokens.length > 0) {
      Content.addPreText("Command arguments: " + JSON.stringify(tokens));
    }
    if (this._args && this._args.length > 0) {
      Content.addPreText("Plugin args: " + JSON.stringify(this._args));
    }
  }

  get name() { return "SamplePlugin"; }
}

/* vim: set ts=2 sts=2 sw=2 et: */
