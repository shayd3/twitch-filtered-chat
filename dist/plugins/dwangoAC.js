"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DwangoACPlugin = function () {
  function DwangoACPlugin(resolve, reject, client) {
    _classCallCheck(this, DwangoACPlugin);

    this._debug = client.GetDebug();
    Plugins.AddChatCommand("//tastree5", this, function (obj) {
      client.SendMessageToAll("tasbTASBot ".repeat(1).trim());
      client.SendMessageToAll("tasbTASBot ".repeat(2).trim());
      client.SendMessageToAll("tasbTASBot ".repeat(3).trim());
      client.SendMessageToAll("tasbTASBot ".repeat(2).trim());
      client.SendMessageToAll("tasbTASBot ".repeat(1).trim());
    }.bind(this));
    Plugins.AddChatCommand("//spamtree", this, function (obj) {
      var n = 0;
      if (obj.tokens.length > 1 && obj.tokens[0].match(/^[0-9]+$/)) {
        n = Number(obj.tokens[0]);
        obj.tokens.shift();
      }
      var msg = obj.tokens.join(" ");
      for (var i = 1; i < n * 2; ++i) {
        var c = i < Math.floor(n) ? i : n * 2 - i;
        var msgi = (msg + " ").repeat(c).trim();
        client.SendMessageToAll(msgi);
      }
    }.bind(this));
    resolve(this);
  }

  _createClass(DwangoACPlugin, [{
    key: "toString",
    value: function toString() {
      return "[object DwangoACPlugin]";
    }
  }]);

  return DwangoACPlugin;
}();

window.DwangoACPlugin = DwangoACPlugin;