"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/** Fanfare Plugin
 *
 * Demonstrates an example "Fanfare" plugin that displays a FrankerZ whenever
 * someone subscribes.
 *
 * Commands:
 *  //ff on:    Enables fanfare
 *  //ff off:   Disables fanfare
 *  //ff:       Displays //ff usage and whether or not fanfare is enabled
 */

var FanfareCSS = "\nimg.fanfare {\n  position: absolute;\n  display: none;\n}\n";

var FanfarePlugin = function () {
  /* exported FanfarePlugin */
  function FanfarePlugin(resolve, reject, client, args) {
    _classCallCheck(this, FanfarePlugin);

    this._args = args;
    this._on = false;
    this.setupCSS();
    ChatCommands.add("ff", this._onFfCmd, "Enable or disable fanfare", this);
    ChatCommands.addUsage("ff", "on", "Enable fanfare", { literal: true });
    ChatCommands.addUsage("ff", "off", "Disable fanfare", { literal: true });
    client.bind("twitch-sub", this._onSubEvent.bind(this, client));
    client.bind("twitch-resub", this._onSubEvent.bind(this, client));
    client.bind("twitch-giftsub", this._onSubEvent.bind(this, client));
    client.bind("twitch-anongiftsub", this._onSubEvent.bind(this, client));
    resolve(this);
  }

  _createClass(FanfarePlugin, [{
    key: "setupCSS",
    value: function setupCSS() {
      var e = document.createElement("style");
      e.setAttribute("type", "text/css");
      e.setAttribute("id", "ff-styles");
      e.setAttribute("data-from", "plugin");
      e.innerText = FanfareCSS;
      document.head.appendChild(e);
    }
  }, {
    key: "_onFfCmd",
    value: function _onFfCmd(cmd, tokens, client, self) {
      if (tokens.length === 0) {
        if (self._on) {
          Content.addInfo("Fanfare is enabled");
        } else {
          Content.addInfo("Fanfare is disabled");
        }
        this.printUsage();
      } else if (tokens[0] === "on" || tokens[0] === "off") {
        self._on = tokens[0] === "on";
        Content.addInfo("Fanfare is now " + (self._on ? "enabled" : "disabled"));
      } else {
        Content.addError("Fanfare: unknown argument " + tokens[0].escape());
        this.printUsage();
      }
    }
  }, {
    key: "_onSubEvent",
    value: function _onSubEvent(client, event) {
      var _this = this;

      if (this._on) {
        var _loop = function _loop(c) {
          var $c = $(c);
          var $i = $("<img class=\"fanfare\" width=\"100%\" height=\"100%\" />");
          $i.attr("src", client.GetEmote("FrankerZ"));
          $i.css("position", "absolute");
          var self = _this;
          $i.on("load", function () {
            $(this).fadeTo(400, 0.25);
            window.setTimeout(self._removeFanfare.bind(self, this), 1000);
          });
          $c.prepend($i);
        };

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = $(".module .content")[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var c = _step.value;

            _loop(c);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    }
  }, {
    key: "_removeFanfare",
    value: function _removeFanfare(i) {
      $(i).fadeOut(400, function () {
        $(this).hide();
      });
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