
class SamplePlugin { /* exported SamplePlugin */
  constructor(resolve, reject, client) {
    this._debug = client.GetDebug();
    let prefix = "From plugin " + this.name + ": ";
    ChatCommands.add("sample-plugin", this._say_hi.bind(this), prefix + "Say hello");
    resolve(this);
  }

  _say_hi(cmd, tokens, client) {
    Content.addPre(`Hi from ${this.name} ${client.GetName()}!`);
    if (tokens && tokens.length > 0) {
      Content.addPre("Arguments: " + JSON.stringify(tokens).escape());
    }
  }

  get name() { return "SamplePlugin"; }

  toString() {
    return "[object SamplePlugin]";
  }
}

