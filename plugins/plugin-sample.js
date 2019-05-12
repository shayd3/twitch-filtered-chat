
class SamplePlugin {
  constructor(resolve, reject, client) {
    this._debug = client.GetDebug();
    Plugins.AddChatCommand("//sample-plugin", this, this._say_hi.bind(this), "Say hello");
    Plugins.AddChatCommand("//sample-plugin-2", this, function(cmd, tokens /*, client*/) {
      Content.addPre("SamplePlugin was here!");
      if (tokens.length > 0) {
        Content.addPre(`You entered ${tokens.length} tokens: ${tokens.join(" ").escape()}`);
      }
    }, "Example showing arguments");
    resolve(this);
  }

  _say_hi() {
    Content.addPre("Hi! from " + this.name + ": " + JSON.stringify(this));
  }

  get name() { return "SamplePlugin"; }

  toString() {
    return "[object SamplePlugin]";
  }
}

window.SamplePlugin = SamplePlugin;

