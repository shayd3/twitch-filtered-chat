"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SamplePlugin = function () {
  /* exported SamplePlugin */
  function SamplePlugin(resolve, reject, client, args) {
    _classCallCheck(this, SamplePlugin);

    this._debug = client.GetDebug();
    this._args = args;
    var prefix = "From plugin " + this.name + ": ";
    ChatCommands.add("sample-plugin", this._say_hi.bind(this), prefix + "Say hello");
    resolve(this);
  }

  _createClass(SamplePlugin, [{
    key: "_say_hi",
    value: function _say_hi(cmd, tokens, client) {
      Content.addPre("Hi from " + this.name + " " + client.GetName() + "!");
      if (tokens && tokens.length > 0) {
        Content.addPre("Command arguments: " + JSON.stringify(tokens).escape());
      }
      if (this._args && this._args.length > 0) {
        Content.addPre("Plugin args: " + JSON.stringify(this._args).escape());
      }
    }
  }, {
    key: "toString",
    value: function toString() {
      return "[object SamplePlugin]";
    }
  }, {
    key: "name",
    get: function get() {
      return "SamplePlugin";
    }
  }]);

  return SamplePlugin;
}();

/* vim: set ts=2 sts=2 sw=2 et: */