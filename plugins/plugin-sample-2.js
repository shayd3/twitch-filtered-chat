"use strict";

function SamplePlugin2(resolve, reject, client) { /* exported SamplePlugin2 */
  this.name = "SamplePlugin2";
  ChatCommands.add("hi", function() {
    Content.addPre("Hello there!");
  }, "From plugin SamplePlugin2: Say hello");
  resolve(this);
}

/* vim: set ts=2 sts=2 sw=2 et: */
