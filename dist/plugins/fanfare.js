"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FanfarePlugin = function () {
  /* exported FanfarePlugin */
  function FanfarePlugin(resolve, reject, client, args) {
    _classCallCheck(this, FanfarePlugin);

    this._args = args;
    this._on = false;
    ChatCommands.add("ff", this.ff_cmd, "Enable or disable fanfare", this);
    ChatCommands.addUsage("ff", "on", "Enable fanfare", { literal: true });
    ChatCommands.addUsage("ff", "off", "Disable fanfare", { literal: true });
    resolve(this);
  }

  _createClass(FanfarePlugin, [{
    key: "ff_cmd",
    value: function ff_cmd(cmd, tokens, client, self) {
      if (tokens.length === 0) {
        if (self._on) {
          Content.addInfo("Fanfare is enabled");
        } else {
          Content.addInfo("Fanfare is disabled");
        }
        this.printUsage();
      } else if (tokens[0] === "on" || tokens[0] === "off") {
        self._on = tokens[0] === "on";
        Content.addInfo("Fanfare is now " + self._on ? "enabled" : "disabled");
      } else {
        Content.addError("Fanfare: unknown argument " + tokens[0].escape());
        this.printUsage();
      }
    }
  }, {
    key: "toString",
    value: function toString() {
      return "[object FanfarePlugin]";
    }
  }, {
    key: "name",
    get: function get() {
      return "FanfarePlugin";
    }
  }]);

  return FanfarePlugin;
}();

/* vim: set ts=2 sts=2 sw=2 et: */