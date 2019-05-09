"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* Twitch Filtered Chat Commands */

/* TODO:
 * command_config
 * command_badges
 */

var TFCChatCommandStore = function () {
  function TFCChatCommandStore() {
    _classCallCheck(this, TFCChatCommandStore);

    this._commands = {};
    this._aliases = {};
    this.add("help", this.command_help.bind(this), "Obtain help for a specific command or all commands");
    this.add_alias("?", "help");
    this.add_usage("help", null, "Obtain help for all commands");
    this.add_usage("help", "command", "Obtain the usage information for <command>");
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
    key: "add_alias",
    value: function add_alias(command, referred_command) {
      this._aliases[command] = referred_command;
    }
  }, {
    key: "add_usage",
    value: function add_usage(command, argstr, usagestr) {
      if (this.has_command(command, true)) {
        var c = this.get_command(command);
        if (!c.usage) c.usage = [];
        c.usage.push({ args: argstr, usage: usagestr });
      } else {
        Util.Error("Invalid command: " + command);
      }
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
            add_error(cmd + ": " + e.name + ": " + e.message);
            Util.Error(e);
          }
        } else {
          add_error(cmd + ": unknown command");
        }
      } else {
        add_error(JSON.stringify(msg) + ": not a command string");
      }
    }
  }, {
    key: "_do_execute",
    value: function _do_execute(cmd, tokens, client) {
      var c = this.get_command(cmd);
      var obj = Object.create(this);
      obj.format_usage = this.format_usage.bind(this, c);
      obj.print_usage = this.print_usage.bind(this, c);
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
      return this.helpline("//" + cmd.name.escape(), cmd.desc.escape());
    }
  }, {
    key: "format_usage",
    value: function format_usage(cmd) {
      var _this = this;

      var usages = [];
      if (cmd.usage) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = cmd.usage[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var entry = _step.value;

            var argstr = "";
            var usagestr = this.format_args(entry.usage);
            if (Util.IsArray(entry.args)) {
              argstr = entry.args.map(function (a) {
                return _this.arg(a);
              }).join(" ");
              usages.push(this.helpline("//" + cmd.name + " " + argstr, usagestr));
            } else if (entry.args) {
              argstr = this.arg(entry.args);
              usages.push(this.helpline("//" + cmd.name + " " + argstr, usagestr));
            } else {
              usages.push(this.helpline("//" + cmd.name, usagestr));
            }
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
        usages.push(this.helpline("//" + cmd.name, this.format_args(cmd.desc)));
      }
      return usages;
    }

    /* Built-in //help command */

  }, {
    key: "command_help",
    value: function command_help(cmd, tokens /*, client*/) {
      if (tokens.length == 0) {
        this.print_help("Commands:");
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = Object.values(this._commands)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var obj = _step2.value;

            this.print_help(this.format_help(obj));
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

        try {
          var lines = [];
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = Object.entries(Plugins.plugins)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var _ref = _step3.value;

              var _ref2 = _slicedToArray(_ref, 2);

              var n = _ref2[0];
              var p = _ref2[1];

              if (p._loaded && p.commands) {
                var _iteratorNormalCompletion5 = true;
                var _didIteratorError5 = false;
                var _iteratorError5 = undefined;

                try {
                  for (var _iterator5 = p.commands[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var plugin_cmd = _step5.value;

                    lines.push(this.helpline(plugin_cmd, "Command added by plugin " + n));
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

          if (lines.length > 0) {
            this.print_help("Plugin commands:");
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
              for (var _iterator4 = lines[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var l = _step4.value;

                this.print_help(l);
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
          }
        } catch (e) {
          if (e.name !== "ReferenceError") throw e;
        }
      } else if (this.has_command(tokens[0])) {
        var _obj = this.get_command(tokens[0]);
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = this.format_usage(_obj)[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var line = _step6.value;

            this.print_help(line);
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
      } else {
        add_error("Invalid command " + tokens[0].escape());
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
    key: "helpline",
    value: function helpline(k, v) {
      return "<div class=\"helpline\">" + this.helpcmd(k) + this.helpmsg(v) + "</div>";
    }
  }, {
    key: "format_args",
    value: function format_args(s) {
      var _this2 = this;

      return s.replace(/<([^>]+)>/g, function (m, g) {
        return _this2.arg(g);
      });
    }

    /* Display functions */

  }, {
    key: "print_helpline",
    value: function print_helpline(k, v) {
      add_pre(this.helpline(k, v));
    }
  }, {
    key: "print_help",
    value: function print_help(s) {
      add_pre("<div class=\"help\">" + s + "</div>");
    }
  }, {
    key: "print_usage",
    value: function print_usage(cmdobj) {
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = this.format_usage(cmdobj)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var line = _step7.value;

          this.print_help(line);
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
    }
  }]);

  return TFCChatCommandStore;
}();

var ChatCommands = new TFCChatCommandStore();

function command_log(cmd, tokens /*, client*/) {
  var logs = Util.GetWebStorage("debug-msg-log") || [];
  this.print_help("Debug message log length: " + logs.length);
  if (tokens.length > 0) {
    if (tokens[0] == "show") {
      if (tokens.length > 1) {
        var idx = Number.parseInt(tokens[1]);
        this.print_help(idx + ": " + JSON.stringify(logs[idx]).escape());
      } else {
        var _iteratorNormalCompletion8 = true;
        var _didIteratorError8 = false;
        var _iteratorError8 = undefined;

        try {
          for (var _iterator8 = Object.entries(logs)[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var _ref3 = _step8.value;

            var _ref4 = _slicedToArray(_ref3, 2);

            var i = _ref4[0];
            var l = _ref4[1];

            this.print_help(i + ": " + JSON.stringify(l).escape());
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
      }
    } else if (tokens[1] == "summary") {
      var lines = [];
      var line = [];
      var _iteratorNormalCompletion9 = true;
      var _didIteratorError9 = false;
      var _iteratorError9 = undefined;

      try {
        for (var _iterator9 = Object.values(logs)[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
          var _l = _step9.value;

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

      if (line.length > 0) lines.push(line);
      var lidx = 0;
      var _iteratorNormalCompletion10 = true;
      var _didIteratorError10 = false;
      var _iteratorError10 = undefined;

      try {
        for (var _iterator10 = Object.values(lines)[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
          var _l2 = _step10.value;

          this.print_help(lidx + "-" + (lidx + _l2.length) + ": " + JSON.stringify(_l2));
          lidx += _l2.length;
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
    } else if (tokens[1] == "shift") {
      logs.shift();
      this.print_help("New logs length: " + logs.length);
      Util.SetWebStorage(logs, "debug-msg-log");
    } else if (tokens[1] == "pop") {
      logs.pop();
      this.print_help("New logs length: " + logs.length);
      Util.SetWebStorage(logs, "debug-msg-log");
    } else {
      this.print_help("Unknown argument " + tokens[0]);
    }
  } else {
    this.print_help("Use //log summary to view a summary");
    this.print_help("Use //log show to view them all");
    this.print_help(this.format_args("Use //log show <N> to show item <N>"));
    this.print_help("Use //log shift to remove one entry from the start");
    this.print_help("Use //log pop to remove one entry from the end");
  }
}

function command_clear() /*cmd, tokens, client*/{
  $(".content").find(".line-wrapper").remove();
}

function command_join(cmd, tokens, client) {
  if (tokens.length > 0) {
    join_channel(client, tokens[0]);
  } else {
    this.print_usage();
  }
}

function command_part(cmd, tokens, client) {
  if (tokens.length > 0) {
    leave_channel(client, tokens[0]);
  } else {
    this.print_usage();
  }
}

function command_badges() /*cmd, tokens, client*/{
  /* TODO */
}

function command_plugins() /*cmd, tokens, client*/{
  try {
    var _iteratorNormalCompletion11 = true;
    var _didIteratorError11 = false;
    var _iteratorError11 = undefined;

    try {
      for (var _iterator11 = Object.entries(Plugins.plugins)[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
        var _ref5 = _step11.value;

        var _ref6 = _slicedToArray(_ref5, 2);

        var n = _ref6[0];
        var p = _ref6[1];

        var msg = n + ": " + p.file + " @ " + p.order;
        if (p._error) {
          add_error(msg + ": Failed: " + JSON.stringify(p._error_obj));
        } else if (p._loaded) {
          msg = msg + ": Loaded";
          if (p.commands) {
            msg = msg + ": Commands: " + p.commands.join(" ");
          }
          add_pre(msg);
        }
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
  } catch (e) {
    if (e.name === "ReferenceError") {
      add_error("Plugin information unavailable");
    } else {
      throw e;
    }
  }
}

ChatCommands.add("log", command_log, "Display logged messages");
ChatCommands.add_alias("logs", "log");
ChatCommands.add_usage("log", null, "Obtain all logged messages");
ChatCommands.add_usage("log", "number", "Obtain logged message <number>");
ChatCommands.add_usage("log", "shift", "Remove the first logged message");
ChatCommands.add_usage("log", "pop", "Remove the last logged message");

ChatCommands.add("clear", command_clear, "Clears all text from all visible modules");
ChatCommands.add_usage("clear", null, "Clears all text from all visible modules");
ChatCommands.add_usage("clear", "module", "Clears all text from <module> (either &quot;module1&quot; or &quot;module2&quot;)");

ChatCommands.add("join", command_join, "Join a channel");
ChatCommands.add_usage("join", "channel", "Connect to <channel>; leading # is optional");

ChatCommands.add("part", command_part, "Leave a channel");
ChatCommands.add_alias("leave", "part");
ChatCommands.add_usage("part", "channel", "Disconnect from <channel>; leading # is optional");

ChatCommands.add("badges", command_badges, "Display all known badges");

ChatCommands.add("plugins", command_plugins, "Display plugin information, if plugins are enabled");