
class SamplePlugin { /* exported SamplePlugin */
  constructor(resolve, reject, client, args) {
    this._debug = client.GetDebug();
    this._args = args;
    let prefix = "From plugin " + this.name + ": ";
    ChatCommands.add("sample-plugin", this._say_hi.bind(this), prefix + "Say hello");
    resolve(this);
  }

  _say_hi(cmd, tokens, client) {
    Content.addPre(`Hi from ${this.name} ${client.GetName()}!`);
    if (tokens && tokens.length > 0) {
      Content.addPre("Command arguments: " + JSON.stringify(tokens).escape());
    }
    if (this._args && this._args.length > 0) {
      Content.addPre("Plugin args: " + JSON.stringify(this._args).escape());
    }
  }

  get name() { return "SamplePlugin"; }

  toString() {
    return "[object SamplePlugin]";
  }
}

/* vim: set ts=2 sts=2 sw=2 et: */
