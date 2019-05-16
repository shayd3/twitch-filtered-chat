"use strict";

function SamplePlugin2(resolve, reject, client) {
  /* exported SamplePlugin2 */
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

/* vim: set ts=2 sts=2 sw=2 et: */