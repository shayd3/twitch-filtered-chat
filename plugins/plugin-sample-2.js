
function SamplePlugin2(resolve, reject, client) {
  this._debug = client.GetDebug();
  Plugins.AddChatCommand("//hi", this, function() {
    add_pre("Hello there!");
  });
  this.name = "SamplePlugin2";
  resolve(this);
}

SamplePlugin2.prototype.toString = function() {
  return "[object SamplePlugin2]";
};

window.SamplePlugin2 = SamplePlugin2;

