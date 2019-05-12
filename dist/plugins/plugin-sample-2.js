"use strict";

function SamplePlugin2(resolve, reject, client) {
  this.name = "SamplePlugin2";
  this._debug = client.GetDebug();
  ChatCommands.add("hi", function () {
    Content.addPre("Hello there!");
  }, "From plugin SamplePlugin2: Say hello");
  resolve(this);
}

SamplePlugin2.prototype.toString = function () {
  return "[object SamplePlugin2]";
};

window.SamplePlugin2 = SamplePlugin2;