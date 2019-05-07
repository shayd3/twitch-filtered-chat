"use strict";

function SamplePlugin2(resolve, reject, client) {
  this._debug = client.GetDebug();
  Plugins.AddChatCommand("//hi", this, function (obj) {
    add_pre("Hello there!");
  });
  resolve(this);
}

SamplePlugin2.prototype.toString = function () {
  return "[object SamplePlugin2]";
};

window.SamplePlugin2 = SamplePlugin2;