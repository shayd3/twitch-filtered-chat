"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* Twitch Filtered Chat Commands */

var TFCChatCommandStore = function () {
  function TFCChatCommandStore() {
    _classCallCheck(this, TFCChatCommandStore);

    this._command_list = [];
    this._commands = {};
    this._aliases = {};
    this._help_text = [];
    this.add("help", this.command_help.bind(this), "Obtain help for a specific command or all commands");
    this.addAlias("?", "help");
    this.addAlias("", "help");
    this.addUsage("help", null, "Obtain help for all commands");
    this.addUsage("help", "command", "Obtain the usage information for <command>");
  }

  _createClass(TFCChatCommandStore, [{
    key: "add",
    value: function add(command, func, desc) {
      if (!command.match(/^[a-z0-9_-]+$/)) {
        Util.Error("Invalid command \"" + command.escape() + "\"");
      } else {
        var c = {};
        c.name = command;
        c.func = func;
        c.desc = desc;

        for (var _len = arguments.length, args = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
          args[_key - 3] = arguments[_key];
        }

        c.dflt_args = args.length > 0 ? args : null;
        this._command_list.push(command);
        this._commands[command] = c;
      }
    }
  }, {
    key: "addAlias",
    value: function addAlias(command, referred_command) {
      this._aliases[command] = referred_command;
    }
  }, {
    key: "addUsage",
    value: function addUsage(command, argstr, usagestr) {
      var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

      if (this.hasCommand(command, true)) {
        var c = this.getCommand(command);
        if (!c.usage) c.usage = [];
        c.usage.push({ args: argstr, usage: usagestr, opts: opts || {} });
      } else {
        Util.Error("Invalid command: " + command);
      }
    }
  }, {
    key: "addHelp",
    value: function addHelp(text) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      var o = opts || {};
      var t = text;
      if (!o.literal) t = this.formatArgs(t);
      if (o.indent) t = "&nbsp;&nbsp;" + t;
      if (o.command) {
        var cmd = t.substr(0, t.indexOf(':'));
        var msg = t.substr(t.indexOf(':') + 1);
        t = this.helpLine(cmd, msg);
      }
      this._help_text.push(t);
    }
  }, {
    key: "isCommandStr",
    value: function isCommandStr(msg) {
      return !!msg.match(/^\/\//);
    }
  }, {
    key: "hasCommand",
    value: function hasCommand(msg) {
      var native_only = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var cmd = msg.replace(/^\/\//, "");
      if (this._commands.hasOwnProperty(cmd)) {
        return true;
      } else if (!native_only && this._aliases.hasOwnProperty(cmd)) {
        return true;
      }
      return false;
    }
  }, {
    key: "execute",
    value: function execute(msg, client) {
      if (this.isCommandStr(msg)) {
        var cmd = msg.split(" ")[0].replace(/^\/\//, "");
        if (this.hasCommand(cmd)) {
          var tokens = msg.replace(/[\s]*$/, "").split(" ").slice(1);
          try {
            var c = this.getCommand(cmd);
            var obj = Object.create(this);
            obj.formatUsage = this.formatUsage.bind(this, c);
            obj.printUsage = this.printUsage.bind(this, c);
            obj.command = cmd;
            obj.cmd_func = c.func;
            obj.cmd_desc = c.desc;
            if (c.dflt_args) {
              c.func.bind(obj).apply(undefined, [cmd, tokens, client].concat(_toConsumableArray(c.dflt_args)));
            } else {
              c.func.bind(obj)(cmd, tokens, client);
            }
          } catch (e) {
            Content.addError(cmd + ": " + e.name + ": " + e.message);
            Util.Error(e);
          }
        } else {
          Content.addError(cmd + ": unknown command");
        }
      } else {
        Content.addError(JSON.stringify(msg) + ": not a command string");
      }
    }
  }, {
    key: "getCommands",
    value: function getCommands() {
      return Object.keys(this._commands);
    }
  }, {
    key: "getCommand",
    value: function getCommand(cmd) {
      var native_only = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var cname = cmd.replace(/^\/\//, "");
      var c = this._commands[cname];
      if (!c && !native_only && this._commands[this._aliases[cname]]) {
        c = this._commands[this._aliases[cname]];
      }
      return c;
    }
  }, {
    key: "formatHelp",
    value: function formatHelp(cmd) {
      return this.helpLine("//" + cmd.name, cmd.desc, true);
    }
  }, {
    key: "formatUsage",
    value: function formatUsage(cmd) {
      var _this = this;

      var usages = [];
      if (cmd.usage) {
        var _loop = function _loop(entry) {
          var fmtArg = function fmtArg(a) {
            return "&lt;" + _this.arg(a) + "&gt;";
          };
          if (entry.opts.literal) fmtArg = function fmtArg(a) {
            return a;
          };
          var argstr = "";
          var usagestr = _this.formatArgs(entry.usage);
          if (Util.IsArray(entry.args)) {
            argstr = entry.args.map(function (a) {
              return fmtArg(a);
            }).join(" ");
            usages.push(_this.helpLine("//" + cmd.name + " " + argstr, usagestr));
          } else if (entry.args) {
            argstr = fmtArg(entry.args);
            usages.push(_this.helpLine("//" + cmd.name + " " + argstr, usagestr));
          } else {
            usages.push(_this.helpLine("//" + cmd.name, usagestr));
          }
        };

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = cmd.usage[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var entry = _step.value;

            _loop(entry);
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
      } else {
        usages.push(this.helpLine("//" + cmd.name, this.formatArgs(cmd.desc)));
      }
      return usages;
    }

    /* Built-in //help command */

  }, {
    key: "command_help",
    value: function command_help(cmd, tokens /*, client*/) {
      if (tokens.length == 0) {
        Content.addHelp("Commands:");
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = Object.values(this._command_list)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var c = _step2.value;

            Content.addHelp(this.formatHelp(this._commands[c]));
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        Content.addHelp(this.formatArgs("Enter //help <command> for help on <command>"));
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = this._help_text[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var line = _step3.value;

            Content.addHelp(line);
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }
      } else if (this.hasCommand(tokens[0])) {
        Content.addHelp("Commands:");
        var obj = this.getCommand(tokens[0]);
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = this.formatUsage(obj)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _line = _step4.value;

            Content.addHelp(_line);
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }
      } else {
        Content.addError("Invalid command " + tokens[0].escape());
      }
    }
  }, {
    key: "arg",
    value: function arg(s) {
      return "<span class=\"arg\">" + s.escape() + "</span>";
    }
  }, {
    key: "helpLine",
    value: function helpLine(k, v) {
      var esc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      var d1 = "<div>" + (esc ? k.escape() : k) + "</div>";
      var d2 = "<div>" + (esc ? v.escape() : v) + "</div>";
      return "<div class=\"helpline\">" + d1 + d2 + "</div>";
    }
  }, {
    key: "formatArgs",
    value: function formatArgs(s) {
      var _this2 = this;

      return s.replace(/<([^>]+)>/g, function (m, g) {
        return '&lt;' + _this2.arg(g) + '&gt;';
      });
    }
  }, {
    key: "printUsage",
    value: function printUsage(cmdobj) {
      Content.addHelp("Usage:");
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = this.formatUsage(cmdobj)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var line = _step5.value;

          Content.addHelp(line);
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
    }
  }]);

  return TFCChatCommandStore;
}();

function command_log(cmd, tokens /*, client*/) {
  var logs = Util.GetWebStorage("debug-msg-log") || [];
  Content.addHelp("Debug message log length: " + logs.length);
  if (tokens.length > 0) {
    if (tokens[0] == "show") {
      if (tokens.length > 1) {
        var idx = Number.parseInt(tokens[1]);
        Content.addHelp(idx + ": " + JSON.stringify(logs[idx]).escape());
      } else {
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = Object.entries(logs)[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var _ref = _step6.value;

            var _ref2 = _slicedToArray(_ref, 2);

            var i = _ref2[0];
            var l = _ref2[1];

            Content.addHelp(i + ": " + JSON.stringify(l).escape());
          }
        } catch (err) {
          _didIteratorError6 = true;
          _iteratorError6 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
              _iterator6.return();
            }
          } finally {
            if (_didIteratorError6) {
              throw _iteratorError6;
            }
          }
        }
      }
    } else if (tokens[0] == "export") {
      var w = window.open("assets/log-export.html", "TFCLogExportWindow", "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes");
      if (w) {
        w.onload = function () {
          this.addEntries(logs);
        };
      }
    } else if (tokens[0] == "summary") {
      var lines = [];
      var line = [];
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = Object.values(logs)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var _l = _step7.value;

          var desc = '';
          if (_l._cmd) {
            desc = _l._cmd;
          } else {
            desc = JSON.stringify(_l).substr(0, 10);
          }
          line.push(desc);
          if (line.length >= 10) {
            lines.push(line);
            line = [];
          }
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }

      if (line.length > 0) lines.push(line);
      var lidx = 0;
      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = Object.values(lines)[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var _l2 = _step8.value;

          Content.addHelp(lidx + "-" + (lidx + _l2.length) + ": " + JSON.stringify(_l2));
          lidx += _l2.length;
        }
      } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion8 && _iterator8.return) {
            _iterator8.return();
          }
        } finally {
          if (_didIteratorError8) {
            throw _iteratorError8;
          }
        }
      }
    } else if (tokens[0] == "shift") {
      logs.shift();
      Content.addHelp("New logs length: " + logs.length);
      Util.SetWebStorage(logs, "debug-msg-log");
    } else if (tokens[0] == "pop") {
      logs.pop();
      Content.addHelp("New logs length: " + logs.length);
      Util.SetWebStorage(logs, "debug-msg-log");
    } else if (tokens[0] == "size") {
      var b = JSON.stringify(logs).length;
      Content.addHelp("Logged bytes: " + b + " (" + b / 1024.0 + " KB)");
    } else if (tokens[0].match(/^[1-9][0-9]*$/)) {
      var _idx = Number(tokens[0]);
      Content.addHelp(JSON.stringify(logs[_idx]).escape());
    } else {
      Content.addHelp("Unknown argument " + tokens[0]);
    }
  } else {
    Content.addHelp("Use //log summary to view a summary");
    Content.addHelp("Use //log show to view them all");
    Content.addHelp(this.formatArgs("Use //log show <N> to show item <N>"));
    Content.addHelp(this.formatArgs("Use //log <N> to show item <N>"));
    Content.addHelp("Use //log shift to remove one entry from the start");
    Content.addHelp("Use //log pop to remove one entry from the end");
    Content.addHelp("Use //log export to open a new window with the logged items");
    Content.addHelp("Use //log size to display the number of bytes logged");
  }
}

function command_clear(cmd, tokens /*, client*/) {
  if (tokens.length == 0) {
    $(".content").find(".line-wrapper").remove();
  } else if (tokens[0] == "module1") {
    $("#module1").find(".line-wrapper").remove();
  } else if (tokens[0] == "module2") {
    $("#module2").find(".line-wrapper").remove();
  } else {
    this.printUsage();
  }
}

function command_join(cmd, tokens, client) {
  if (tokens.length > 0) {
    client.JoinChannel(tokens[0]);
  } else {
    this.printUsage();
  }
}

function command_part(cmd, tokens, client) {
  if (tokens.length > 0) {
    client.LeaveChannel(tokens[0]);
  } else {
    this.printUsage();
  }
}

function command_badges(cmd, tokens, client) {
  var badges = [];
  /* Obtain global badges */
  var _iteratorNormalCompletion9 = true;
  var _didIteratorError9 = false;
  var _iteratorError9 = undefined;

  try {
    for (var _iterator9 = Object.entries(client.GetGlobalBadges())[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
      var _ref3 = _step9.value;

      var _ref4 = _slicedToArray(_ref3, 2);

      var bname = _ref4[0];
      var badge = _ref4[1];
      var _iteratorNormalCompletion11 = true;
      var _didIteratorError11 = false;
      var _iteratorError11 = undefined;

      try {
        for (var _iterator11 = Object.values(badge.versions)[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
          var bdef = _step11.value;

          var url = bdef.image_url_2x;
          var size = 36;
          if (tokens.indexOf("small") > -1) {
            url = bdef.image_url_1x;
            size = 18;
          } else if (tokens.indexOf("large") > -1) {
            url = bdef.image_url_4x;
            size = 72;
          }
          var attr = "width=\"" + size + "\" height=\"" + size + "\" title=\"" + bname + "\"";
          badges.push("<img src=\"" + url + "\" " + attr + " alt=\"" + bname + "\" />");
        }
      } catch (err) {
        _didIteratorError11 = true;
        _iteratorError11 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion11 && _iterator11.return) {
            _iterator11.return();
          }
        } finally {
          if (_didIteratorError11) {
            throw _iteratorError11;
          }
        }
      }
    }
    /* Print global badges */
  } catch (err) {
    _didIteratorError9 = true;
    _iteratorError9 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion9 && _iterator9.return) {
        _iterator9.return();
      }
    } finally {
      if (_didIteratorError9) {
        throw _iteratorError9;
      }
    }
  }

  Content.addNotice(badges.join(''));
  /* Obtain channel badges */
  var _iteratorNormalCompletion10 = true;
  var _didIteratorError10 = false;
  var _iteratorError10 = undefined;

  try {
    for (var _iterator10 = client.GetJoinedChannels()[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
      var ch = _step10.value;

      badges = [];
      var _iteratorNormalCompletion12 = true;
      var _didIteratorError12 = false;
      var _iteratorError12 = undefined;

      try {
        for (var _iterator12 = Object.entries(client.GetChannelBadges(ch))[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
          var _ref5 = _step12.value;

          var _ref6 = _slicedToArray(_ref5, 2);

          var _bname = _ref6[0];
          var _badge = _ref6[1];

          var _url = _badge.image || _badge.svg || _badge.alpha;
          badges.push("<img src=\"" + _url + "\" width=\"36\" height=\"36\" title=\"" + _bname + "\" alt=\"" + _bname + "\" />");
        }
        /* Print channel badges */
      } catch (err) {
        _didIteratorError12 = true;
        _iteratorError12 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion12 && _iterator12.return) {
            _iterator12.return();
          }
        } finally {
          if (_didIteratorError12) {
            throw _iteratorError12;
          }
        }
      }

      Content.addNotice(Twitch.FormatChannel(ch) + ": " + badges.join(''));
    }
  } catch (err) {
    _didIteratorError10 = true;
    _iteratorError10 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion10 && _iterator10.return) {
        _iterator10.return();
      }
    } finally {
      if (_didIteratorError10) {
        throw _iteratorError10;
      }
    }
  }
}

function command_plugins() /*cmd, tokens, client*/{
  try {
    var _iteratorNormalCompletion13 = true;
    var _didIteratorError13 = false;
    var _iteratorError13 = undefined;

    try {
      for (var _iterator13 = Object.entries(Plugins.plugins)[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
        var _ref7 = _step13.value;

        var _ref8 = _slicedToArray(_ref7, 2);

        var n = _ref8[0];
        var p = _ref8[1];

        var msg = n + ": " + p.file + " @ " + p.order;
        if (p._error) {
          Content.addError(msg + ": Failed: " + JSON.stringify(p._error_obj));
        } else if (p._loaded) {
          msg = msg + ": Loaded";
          if (p.commands) {
            msg = msg + ": Commands: " + p.commands.join(" ");
          }
          Content.addPre(msg);
        }
      }
    } catch (err) {
      _didIteratorError13 = true;
      _iteratorError13 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion13 && _iterator13.return) {
          _iterator13.return();
        }
      } finally {
        if (_didIteratorError13) {
          throw _iteratorError13;
        }
      }
    }
  } catch (e) {
    if (e.name === "ReferenceError") {
      Content.addError("Plugin information unavailable");
    } else {
      throw e;
    }
  }
}

function command_client(cmd, tokens, client) {
  if (tokens.length === 0 || tokens[0] == "status") {
    Content.addHelp("Client information:");
    var cstatus = client.ConnectionStatus();
    Content.addHelpLine("Socket:", cstatus.open ? "Open" : "Closed");
    Content.addHelpLine("Status:", cstatus.connected ? "Connected" : "Not connected");
    Content.addHelpLine("Identified:", cstatus.identified ? "Yes" : "No");
    Content.addHelpLine("Authenticated:", cstatus.authed ? "Yes" : "No");
    Content.addHelpLine("Name:", client.GetName());
    Content.addHelpLine("FFZ:", client.FFZEnabled() ? "Enabled" : "Disabled");
    Content.addHelpLine("BTTV:", client.BTTVEnabled() ? "Enabled" : "Disabled");
    var channels = client.GetJoinedChannels();
    var us = client.SelfUserState() || {};
    if (channels && channels.length > 0) {
      Content.addHelp("&gt; Channels connected to: " + channels.length);
      var _iteratorNormalCompletion14 = true;
      var _didIteratorError14 = false;
      var _iteratorError14 = undefined;

      try {
        for (var _iterator14 = channels[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
          var c = _step14.value;

          var ci = client.GetChannelInfo(c);
          var nusers = ci && ci.users ? ci.users.length : 0;
          var rooms = ci.rooms || {};
          var status = (ci.online ? "" : "not ") + "online";
          Content.addHelpLine(c, "Status: " + status + ("; id=" + ci.id));
          Content.addHelpLine("&nbsp;", "Active users: " + nusers);
          Content.addHelpLine("&nbsp;", "Rooms: " + Object.keys(rooms));
          var ui = us[c];
          Content.addHelp("User information for " + c + ":");
          if (ui.color) {
            Content.addHelpLine("Color", ui.color);
          }
          if (ui.badges) {
            Content.addHelpLine("Badges", JSON.stringify(ui.badges));
          }
          Content.addHelpLine("Name", "" + ui["display-name"]);
        }
      } catch (err) {
        _didIteratorError14 = true;
        _iteratorError14 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion14 && _iterator14.return) {
            _iterator14.return();
          }
        } finally {
          if (_didIteratorError14) {
            throw _iteratorError14;
          }
        }
      }
    }
    Content.addHelpLine("User ID", "" + us.userid);
  } else {
    this.printUsage();
  }
}

function command_raw(cmd, tokens, client) {
  client.SendRaw(tokens.join(" "));
}

var ChatCommands = new TFCChatCommandStore();

ChatCommands.add("log", command_log, "Display logged messages");
ChatCommands.addAlias("logs", "log");
ChatCommands.addUsage("log", null, "Obtain all logged messages");
ChatCommands.addUsage("log", "number", "Display the message numbered <number>");
ChatCommands.addUsage("log", "summary", "Display a summary of the logged messages", { literal: true });
ChatCommands.addUsage("log", "shift", "Remove the first logged message", { literal: true });
ChatCommands.addUsage("log", "pop", "Remove the last logged message", { literal: true });
ChatCommands.addUsage("log", "export", "Open a new window with all of the logged items", { literal: true });
ChatCommands.addUsage("log", "size", "Display the number of bytes used by the log", { literal: true });

ChatCommands.add("clear", command_clear, "Clears all text from all visible modules");
ChatCommands.addUsage("clear", null, "Clears all text from all visible modules");
ChatCommands.addUsage("clear", "module1", "Clears all text from module1", { literal: true });
ChatCommands.addUsage("clear", "module2", "Clears all text from module2", { literal: true });

ChatCommands.add("join", command_join, "Join a channel");
ChatCommands.addUsage("join", "channel", "Connect to <channel>; leading # is optional");

ChatCommands.add("part", command_part, "Leave a channel");
ChatCommands.addAlias("leave", "part");
ChatCommands.addUsage("part", "channel", "Disconnect from <channel>; leading # is optional");

ChatCommands.add("badges", command_badges, "Display all known badges");

ChatCommands.add("plugins", command_plugins, "Display plugin information, if plugins are enabled");

ChatCommands.add("client", command_client, "Display numerous things about the client; use //help client for info");
ChatCommands.addUsage("client", null, "Show general information about the client");
ChatCommands.addUsage("client", "status", "Show current connection information", { literal: true });

ChatCommands.add("raw", command_raw, "Send a raw message to Twitch (for advanced users only!)");
ChatCommands.addUsage("raw", "message", "Send <message> to Twitch servers (for advanced users only!)");