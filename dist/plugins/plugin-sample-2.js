"use strict";

function SamplePlugin2(resolve, reject, client) {
  this._debug = client.GetDebug();
  Plugins.AddChatCommand("//hi", this, function () {
    Content.addPre("Hello there!");
  });
  this.name = "SamplePlugin2";
  resolve(this);
}

SamplePlugin2.prototype.toString = function () {
  return "[object SamplePlugin2]";
};

window.SamplePlugin2 = SamplePlugin2;