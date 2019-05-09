
class SamplePlugin {
  constructor(resolve, reject, client) {
    this._debug = client.GetDebug();
    Plugins.AddChatCommand("//sample-plugin", this, this._say_hi.bind(this));
    Plugins.AddChatCommand("//sample-plugin-2", this, function(cmd, tokens /*, client*/) {
      add_pre("SamplePlugin was here!");
      if (tokens.length > 0) {
        add_pre(`You entered ${tokens.length} tokens: ${tokens.join(" ").escape()}`);
      }
    });
    resolve(this);
  }

  _say_hi() {
    add_pre("Hi! from " + JSON.stringify(this));
  }

  get name() { return "SamplePlugin"; }

  toString() {
    return "[object SamplePlugin]";
  }
}

window.SamplePlugin = SamplePlugin;

