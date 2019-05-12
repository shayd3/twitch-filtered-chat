"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* Twitch Filtered Chat Commands */

var TFCChatCommandStore = function () {
  function TFCChatCommandStore() {
    _classCallCheck(this, TFCChatCommandStore);

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

      if (this.has_command(command, true)) {
        var c = this.get_command(command);
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
    key: "is_command_str",
    value: function is_command_str(msg) {
      return !!msg.match(/^\/\//);
    }
  }, {
    key: "has_command",
    value: function has_command(msg) {
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
      if (this.is_command_str(msg)) {
        var cmd = msg.split(" ")[0].replace(/^\/\//, "");
        if (this.has_command(cmd)) {
          var tokens = msg.replace(/[\s]*$/, "").split(" ").slice(1);
          try {
            this._do_execute(cmd, tokens, client);
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
    key: "_do_execute",
    value: function _do_execute(cmd, tokens, client) {
      var c = this.get_command(cmd);
      var obj = Object.create(this);
      obj.format_usage = this.format_usage.bind(this, c);
      obj.printUsage = this.printUsage.bind(this, c);
      obj.command = cmd;
      obj.cmd_func = c.func;
      obj.cmd_desc = c.desc;
      if (c.dflt_args) {
        c.func.bind(obj).apply(undefined, [cmd, tokens, client].concat(_toConsumableArray(c.dflt_args)));
      } else {
        c.func.bind(obj)(cmd, tokens, client);
      }
    }
  }, {
    key: "get_commands",
    value: function get_commands() {
      return Object.keys(this._commands);
    }
  }, {
    key: "get_command",
    value: function get_command(cmd) {
      var native_only = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var cname = cmd.replace(/^\/\//, "");
      var c = this._commands[cname];
      if (!c && !native_only && this._commands[this._aliases[cname]]) {
        c = this._commands[this._aliases[cname]];
      }
      return c;
    }
  }, {
    key: "format_help",
    value: function format_help(cmd) {
      return this.helpLine("//" + cmd.name.escape(), cmd.desc.escape());
    }
  }, {
    key: "format_usage",
    value: function format_usage(cmd) {
      var _this = this;

      var usages = [];
      if (cmd.usage) {
        var _loop = function _loop(entry) {
          var fmtArg = function fmtArg(a) {
            return _this.arg(a);
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
        this.printHelp("Commands:");
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = Object.values(this._commands)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var obj = _step2.value;

            this.printHelp(this.format_help(obj));
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

        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = this._help_text[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var line = _step3.value;

            this.printHelp(line);
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
      } else if (this.has_command(tokens[0])) {
        this.printHelp("Commands:");
        var _obj = this.get_command(tokens[0]);
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = this.format_usage(_obj)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _line = _step4.value;

            this.printHelp(_line);
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

    /* Specific formatters */

  }, {
    key: "arg",
    value: function arg(s) {
      return "<span class=\"arg\">" + s.escape() + "</span>";
    }
  }, {
    key: "helpcmd",
    value: function helpcmd(s) {
      return "<span class=\"help helpcmd\">" + s + "</span>";
    }
  }, {
    key: "helpmsg",
    value: function helpmsg(s) {
      return "<span class=\"help helpmsg\">" + s + "</span>";
    }
  }, {
    key: "helpLine",
    value: function helpLine(k, v) {
      return "<div class=\"help_line\">" + this.helpcmd(k) + this.helpmsg(v) + "</div>";
    }
  }, {
    key: "formatArgs",
    value: function formatArgs(s) {
      var _this2 = this;

      return s.replace(/<([^>]+)>/g, function (m, g) {
        return '&lt;' + _this2.arg(g) + '&gt;';
      });
    }

    /* Display functions */

  }, {
    key: "printHelpLine",
    value: function printHelpLine(k, v) {
      Content.addPre(this.helpLine(k, v));
    }
  }, {
    key: "printHelp",
    value: function printHelp(s) {
      Content.addHTML($("<div class=\"help pre\">" + s + "</div>"));
    }
  }, {
    key: "printUsage",
    value: function printUsage(cmdobj) {
      this.printHelp("Usage:");
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = this.format_usage(cmdobj)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var line = _step5.value;

          this.printHelp(line);
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
  this.printHelp("Debug message log length: " + logs.length);
  if (tokens.length > 0) {
    if (tokens[0] == "show") {
      if (tokens.length > 1) {
        var idx = Number.parseInt(tokens[1]);
        this.printHelp(idx + ": " + JSON.stringify(logs[idx]).escape());
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

            this.printHelp(i + ": " + JSON.stringify(l).escape());
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
          var _iteratorNormalCompletion7 = true;
          var _didIteratorError7 = false;
          var _iteratorError7 = undefined;

          try {
            for (var _iterator7 = Object.entries(logs)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
              var _ref3 = _step7.value;

              var _ref4 = _slicedToArray(_ref3, 2);

              var _i = _ref4[0];
              var _l = _ref4[1];

              this.addEntry(_i, _l);
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
        };
      }
    } else if (tokens[0] == "summary") {
      var lines = [];
      var line = [];
      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = Object.values(logs)[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var _l2 = _step8.value;

          var desc = '';
          if (_l2._cmd) {
            desc = _l2._cmd;
          } else {
            desc = JSON.stringify(_l2).substr(0, 10);
          }
          line.push(desc);
          if (line.length >= 10) {
            lines.push(line);
            line = [];
          }
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

      if (line.length > 0) lines.push(line);
      var lidx = 0;
      var _iteratorNormalCompletion9 = true;
      var _didIteratorError9 = false;
      var _iteratorError9 = undefined;

      try {
        for (var _iterator9 = Object.values(lines)[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
          var _l3 = _step9.value;

          this.printHelp(lidx + "-" + (lidx + _l3.length) + ": " + JSON.stringify(_l3));
          lidx += _l3.length;
        }
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
    } else if (tokens[0] == "shift") {
      logs.shift();
      this.printHelp("New logs length: " + logs.length);
      Util.SetWebStorage(logs, "debug-msg-log");
    } else if (tokens[0] == "pop") {
      logs.pop();
      this.printHelp("New logs length: " + logs.length);
      Util.SetWebStorage(logs, "debug-msg-log");
    } else {
      this.printHelp("Unknown argument " + tokens[0]);
    }
  } else {
    this.printHelp("Use //log summary to view a summary");
    this.printHelp("Use //log show to view them all");
    this.printHelp(this.formatArgs("Use //log show <N> to show item <N>"));
    this.printHelp("Use //log shift to remove one entry from the start");
    this.printHelp("Use //log pop to remove one entry from the end");
    this.printHelp("Use //log export to open a new window with the logged items");
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
  var all_badges = [];
  var _iteratorNormalCompletion10 = true;
  var _didIteratorError10 = false;
  var _iteratorError10 = undefined;

  try {
    for (var _iterator10 = Object.entries(client.GetGlobalBadges())[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
      var _ref5 = _step10.value;

      var _ref6 = _slicedToArray(_ref5, 2);

      var bname = _ref6[0];
      var badge = _ref6[1];
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
          all_badges.push("<img src=\"" + url + "\" " + attr + " alt=\"" + bname + "\" />");
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

  Content.addNotice(all_badges.join(''));
}

function command_plugins() /*cmd, tokens, client*/{
  try {
    var _iteratorNormalCompletion12 = true;
    var _didIteratorError12 = false;
    var _iteratorError12 = undefined;

    try {
      for (var _iterator12 = Object.entries(Plugins.plugins)[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
        var _ref7 = _step12.value;

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
    this.printHelp("Client information:");
    var cstatus = client.ConnectionStatus();
    this.printHelpLine("Socket:", cstatus.open ? "Open" : "Closed");
    this.printHelpLine("Status:", cstatus.connected ? "Connected" : "Not connected");
    this.printHelpLine("Identified:", cstatus.identified ? "Yes" : "No");
    this.printHelpLine("Authenticated:", cstatus.authed ? "Yes" : "No");
    this.printHelpLine("Name:", client.GetName());
    this.printHelpLine("FFZ:", client.FFZEnabled() ? "Enabled" : "Disabled");
    this.printHelpLine("BTTV:", client.BTTVEnabled() ? "Enabled" : "Disabled");
    var channels = client.GetJoinedChannels();
    var us = client.SelfUserState() || {};
    if (channels && channels.length > 0) {
      this.printHelp("&gt; Channels connected to: " + channels.length);
      var _iteratorNormalCompletion13 = true;
      var _didIteratorError13 = false;
      var _iteratorError13 = undefined;

      try {
        for (var _iterator13 = channels[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
          var c = _step13.value;

          var ci = client.GetChannelInfo(c);
          var nusers = ci && ci.users ? ci.users.length : 0;
          var rooms = ci.rooms || {};
          var status = (ci.online ? "" : "not ") + "online";
          this.printHelpLine(c, "Status: " + status + ("; id=" + ci.id));
          this.printHelpLine("&nbsp;", "Active users: " + nusers);
          this.printHelpLine("&nbsp;", "Rooms: " + Object.keys(rooms));
          var ui = us[c];
          this.printHelp("User information for " + c + ":");
          if (ui.color) {
            this.printHelpLine("Color", ui.color);
          }
          if (ui.badges) {
            this.printHelpLine("Badges", JSON.stringify(ui.badges));
          }
          this.printHelpLine("Name", "" + ui["display-name"]);
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
    }
    this.printHelpLine("User ID", "" + us.userid);
  } else {
    this.printUsage();
  }
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