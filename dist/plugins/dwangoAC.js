"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DwangoACPlugin = function () {
  function DwangoACPlugin(resolve, reject, client) {
    _classCallCheck(this, DwangoACPlugin);

    this._debug = client.GetDebug();
    Plugins.AddChatCommand("//tastree5", this, this.cmd_tastree.bind(this));
    Plugins.AddChatCommand("//tree", this, this.cmd_spamtree.bind(this));
    resolve(this);
  }

  _createClass(DwangoACPlugin, [{
    key: "cmd_tastree",
    value: function cmd_tastree(cmd, tokens, client) {
      client.SendMessageToAll("tasbTASBot ".repeat(1).trim());
      client.SendMessageToAll("tasbTASBot ".repeat(2).trim());
      client.SendMessageToAll("tasbTASBot ".repeat(3).trim());
      client.SendMessageToAll("tasbTASBot ".repeat(2).trim());
      client.SendMessageToAll("tasbTASBot ".repeat(1).trim());
    }
  }, {
    key: "cmd_spamtree",
    value: function cmd_spamtree(cmd, tokens, client) {
      var n = 0;
      if (tokens.length > 1 && tokens[0].match(/^[0-9]+$/)) {
        n = Number(tokens[0]);
        tokens.shift();
        var msg = tokens.join(" ");
        for (var i = 1; i < n * 2; ++i) {
          var c = i < Math.floor(n) ? i : n * 2 - i;
          var msgi = (msg + " ").repeat(c).trim();
          client.SendMessageToAll(msgi);
        }
      } else {
        Content.addPre("Usage: //tree &lt;N&gt; &lt;msg&gt;: &lt;N&gt;-tree &lt;msg&gt;");
      }
    }
  }, {
    key: "toString",
    value: function toString() {
      return "[object DwangoACPlugin]";
    }
  }, {
    key: "name",
    get: function get() {
      return "DwangoACPlugin";
    }
  }]);

  return DwangoACPlugin;
}();

window.DwangoACPlugin = DwangoACPlugin;