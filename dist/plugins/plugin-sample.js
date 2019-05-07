"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SamplePlugin = function () {
  function SamplePlugin(resolve, reject, client) {
    _classCallCheck(this, SamplePlugin);

    this._debug = client.GetDebug();
    Plugins.AddChatCommand("//sample-plugin", this, this._say_hi.bind(this));
    Plugins.AddChatCommand("//sample-plugin-2", this, function (obj) {
      var line = obj.line;
      var command = obj.command;
      var tokens = obj.tokens;
      add_pre("SamplePlugin was here!");
      if (tokens.length > 0) {
        add_pre("You entered \"" + line + "\" with " + tokens.length + " tokens");
      }
    });
    resolve(this);
  }

  _createClass(SamplePlugin, [{
    key: "_say_hi",
    value: function _say_hi() {
      add_pre("Hi! from " + JSON.stringify(this));
    }
  }, {
    key: "toString",
    value: function toString() {
      return "[object SamplePlugin]";
    }
  }]);

  return SamplePlugin;
}();

window.SamplePlugin = SamplePlugin;