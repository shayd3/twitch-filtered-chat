
class SamplePlugin {
  constructor(resolve, reject, client) {
    this._debug = client.GetDebug();
    Plugins.AddChatCommand("//sample-plugin", this, this._say_hi.bind(this));
    Plugins.AddChatCommand("//sample-plugin-2", this, function(obj) {
      let line = obj.line;
      let command = obj.command;
      let tokens = obj.tokens;
      add_pre("SamplePlugin was here!");
      if (tokens.length > 0) {
        add_pre(`You entered "${line}" with ${tokens.length} tokens`);
      }
    });
    this.loaded = true; /* unused */
    resolve(this);
  }

  _say_hi() {
    add_pre("Hi! from " + JSON.stringify(this));
  }

  toString() {
    return "[object SamplePlugin]";
  }
}

window.SamplePlugin = SamplePlugin;

