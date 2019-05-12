/* Twitch Filtered Chat Main Module */

"use strict";

/* TODO:
 * Persist "Show Clips" beyond reload
 * Add layout selection box to #settings (reloads page on change)
 * Add target to #settings help link
 * Add clip information
 * Hide getConfigObject() within client_main()
 */

/* IDEA
 * Allow for a configurable number of columns?
 */

/* NOTES:
 * Filtering ws "recv>" messages:
 *   Util.Logger.add_filter(((m) => !`${m}`.startsWith("recv> ")), "DEBUG");
 * Filtering ws PRIVMSG messages:
 *   Util.Logger.add_filter(((m) => `${m}`.indexOf(" PRIVMSG ") == -1, "DEBUG");
 */

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CACHED_VALUE = "Cached";
var AUTOGEN_VALUE = "Auto-Generated";

/* Document writing functions {{{0 */

var Content = function () {
  function Content() {
    _classCallCheck(this, Content);
  }

  _createClass(Content, null, [{
    key: "addHTML",
    /* exported Content */
    value: function addHTML(content) {
      var line = "<div class=\"line line-wrapper\"></div>";
      var $Content = $(".module").find($(".content"));
      $Content.append($(line).append(content));
      $Content.scrollTop(Math.pow(2, 31) - 1);
    }
  }, {
    key: "addPre",
    value: function addPre(content) {
      Content.addHTML($("<div class=\"pre\"></div>").html(content));
    }
  }, {
    key: "addInfo",
    value: function addInfo(content) {
      var pre = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var e = $("<div class=\"info\"></div>").html(content);
      if (pre) e.addClass("pre");
      Content.addHTML(e);
    }
  }, {
    key: "addNotice",
    value: function addNotice(content) {
      var pre = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var e = $("<div class=\"notice\"></div>").html(content);
      if (pre) e.addClass("pre");
      Content.addHTML(e);
    }
  }, {
    key: "addError",
    value: function addError(content) {
      var pre = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var e = $("<div class=\"error\"></div>").html(content);
      if (pre) e.addClass("pre");
      Content.addHTML(e);
    }
  }, {
    key: "addHelp",
    value: function addHelp(s) {
      ChatCommands.printHelp(s);
    }
  }, {
    key: "addHelpLine",
    value: function addHelpLine(c, s) {
      ChatCommands.printHelpLine(c, s);
    }
  }]);

  return Content;
}();

/* End document writing functions 0}}} */

/* Begin configuration section {{{0 */

/* Parse a query string into the config object given and return removals */


function parseQueryString(config) {
  var qs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

  var qs_data = void 0;
  if (qs === null) {
    qs = window.location.search;
    qs_data = Util.ParseQueryString(qs);
  } else if (typeof qs === "string") {
    qs_data = Util.ParseQueryString(qs);
  } else if ((typeof qs === "undefined" ? "undefined" : _typeof(qs)) === "object") {
    qs_data = qs;
  }

  if (qs_data.debug === undefined) qs_data.debug = false;
  if (qs_data.channels !== undefined) {
    if (typeof qs_data.channels != "string") {
      qs_data.channels = "";
    }
  }

  var query_remove = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.entries(qs_data)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _ref = _step.value;

      var _ref2 = _slicedToArray(_ref, 2);

      var k = _ref2[0];
      var v = _ref2[1];

      var key = k; /* config key */
      var val = v; /* config val */
      /* Parse specific items */
      if (k === "clientid") {
        key = "ClientID";
        config.__clientid_override = true;
        query_remove.push(k);
      } else if (k === "user" || k === "name" || k === "nick") {
        key = "Name";
      } else if (k === "pass") {
        key = "Pass";
        query_remove.push(k);
      } else if (k === "channel" || k === "channels") {
        key = "Channels";
        val = v.split(",").map(function (c) {
          return Twitch.FormatChannel(c);
        });
      } else if (k === "debug") {
        key = "Debug";
        val = Number(v);
        if (Number.isNaN(val)) {
          if (v === "debug") {
            val = Util.LEVEL_DEBUG;
          } else if (v === "trace") {
            val = Util.LEVEL_TRACE;
          } else {
            val = v ? 1 : 0;
          }
        }
        if (val < Util.LEVEL_MIN) val = Util.LEVEL_MIN;
        if (val > Util.LEVEL_MAX) val = Util.LEVEL_MAX;
      } else if (k === "noassets") {
        key = "NoAssets";
        val = v ? true : false;
      } else if (k === "noffz") {
        key = "NoFFZ";
        val = v ? true : false;
      } else if (k === "nobttv") {
        key = "NoBTTV";
        val = v ? true : false;
      } else if (k === "hmax") {
        key = "HistorySize";
        val = typeof v === "number" ? v : TwitchClient.DEFAULT_HISTORY_SIZE;
      } else if (k.match(/^module[12]?$/)) {
        if (k === "module") k = "module1";
        key = k === "module" ? "module1" : k;
        val = parseModuleConfig(v);
      } else if (k === "trans" || k === "transparent") {
        key = "Transparent";
        val = 1;
      } else if (k === "layout" && ParseLayout) {
        key = "Layout";
        val = ParseLayout(v);
      } else if (k == "reconnect") {
        key = "AutoReconnect";
        val = true;
      } else if (k == "size") {
        key = "Size";
        val = v + "pt";
      } else if (k == "plugins") {
        key = "Plugins";
        val = v ? true : false;
      } else if (k == "disable") {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = ("" + v).split(",")[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var e = _step2.value;

            if (CSSCheerStyles[e]) {
              CSSCheerStyles[e]._disabled = true;
            }
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
      } else if (k == "max") {
        key = "MaxMessages";
        val = typeof v === "number" ? v : TwitchClient.DEFAULT_MAX_MESSAGES;
      } else if (k == "font") {
        key = "Font";
        val = "" + v;
      } else if (k == "scroll") {
        key = "Scroll";
        val = v ? true : false;
      } else if (k == "clips") {
        key = "ShowClips";
        val = v ? true : false;
      }
      config[key] = val;
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

  if (!config.hasOwnProperty("Layout")) {
    config.Layout = ParseLayout("double:chat");
  }
  return query_remove;
}

/* Obtain configuration key */
function getConfigKey() {
  var config_key = "tfc-config";
  var qs = Util.ParseQueryString();
  if (qs.hasOwnProperty("config_key")) {
    config_key = config_key + "-" + qs.config_key.replace(/[^a-z]/g, "");
  }
  return config_key;
}

/* Obtain configuration */
function getConfigObject() {
  /* 1) Obtain configuration values
   *  a) from localStorage
   *  b) from query string (overrides (a))
   *  c) from settings elements (overrides (b))
   * 2) Store module configuration in each modules' settings window
   * 3) Remove sensitive values from the query string, if present
   */
  var config_key = getConfigKey();

  /* Query String object, parsed */
  var qs = Util.ParseQueryString();
  Util.SetWebStorageKey(config_key);
  if (config_key !== "tfc-config") {
    Util.Log("Using custom config key \"" + Util.GetWebStorageKey() + "\"");
  }
  /* Items to remove from the query string */
  var query_remove = [];

  /* Parse localStorage config */
  var config = Util.GetWebStorage();
  if (!config) config = {};

  /* Persist the config key */
  config.key = Util.GetWebStorageKey();

  /* Certain unwanted items may be preserved in localStorage */
  if (config.hasOwnProperty("NoAssets")) delete config["NoAssets"];
  if (config.hasOwnProperty("Debug")) delete config["Debug"];
  if (config.hasOwnProperty("AutoReconnect")) delete config["AutoReconnect"];
  if (config.hasOwnProperty("Layout")) delete config["Layout"];
  if (config.hasOwnProperty("Plugins")) delete config["Plugins"];

  /* Ensure certain keys are present and have expected values */
  if (!config.hasOwnProperty("MaxMessages")) {
    config.MaxMessages = TwitchClient.DEFAULT_MAX_MESSAGES;
  }
  if (!config.hasOwnProperty("Channels") || !Util.IsArray(config.Channels)) {
    config.Channels = [];
  }
  if (typeof config.Name != "string") config.Name = "";
  if (typeof config.ClientID != "string") config.ClientID = "";
  if (typeof config.Pass != "string") config.Pass = "";

  /* Parse the query string */
  query_remove = parseQueryString(config, qs);

  /* Parse div#settings config */
  var txtChannel = $("input#txtChannel")[0];
  var txtNick = $("input#txtNick")[0];
  var txtPass = $("input#txtPass")[0];
  if (txtChannel.value) {
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = txtChannel.value.split(",")[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var ch = _step3.value;

        var channel = Twitch.FormatChannel(ch.toLowerCase());
        if (config.Channels.indexOf(channel) == -1) {
          config.Channels.push(channel);
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
  }
  if (txtNick.value && txtNick.value != AUTOGEN_VALUE) {
    config.Name = txtNick.value;
  }
  if (txtPass.value && txtPass.value != CACHED_VALUE) {
    config.Pass = txtPass.value;
  }

  if (typeof config.Scroll !== "boolean") {
    config.Scroll = $("#cbScroll").is(":checked");
  }

  if (typeof config.ShowClips !== "boolean") {
    config.ShowClips = $("#cbClips").is(":checked");
  }

  function toArray(val) {
    return Util.IsArray(val) ? val : [];
  }

  /* Populate configs for each module */
  $(".module").each(function () {
    var id = $(this).attr("id");
    if (!config[id]) {
      config[id] = getModuleSettings($(this));
    }
    config[id].Pleb = Boolean(config[id].Pleb);
    config[id].Sub = Boolean(config[id].Sub);
    config[id].VIP = Boolean(config[id].VIP);
    config[id].Mod = Boolean(config[id].Mod);
    config[id].Event = Boolean(config[id].Event);
    config[id].Bits = Boolean(config[id].Bits);
    config[id].Me = Boolean(config[id].Me);
    config[id].IncludeKeyword = toArray(config[id].IncludeKeyword);
    config[id].IncludeUser = toArray(config[id].IncludeUser);
    config[id].ExcludeUser = toArray(config[id].ExcludeUser);
    config[id].ExcludeStartsWith = toArray(config[id].ExcludeStartsWith);
    config[id].FromChannel = toArray(config[id].FromChannel);
  });

  /* See if there's anything we need to remove */
  if (query_remove.length > 0) {
    /* The query string contains sensitive information; remove it */
    Util.SetWebStorage(config);
    var old_qs = window.location.search;
    var old_query = Util.ParseQueryString(old_qs.substr(1));
    var is_base64 = false;
    if (old_query.base64 && old_query.base64.length > 0) {
      is_base64 = true;
      old_query = Util.ParseQueryString(atob(old_query.base64));
    }
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = query_remove[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var e = _step4.value;

        delete old_query[e];
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

    var new_qs = Util.FormatQueryString(old_query);
    if (is_base64) {
      new_qs = "?base64=" + encodeURIComponent(btoa(new_qs));
    }
    window.location.search = new_qs;
  }

  /* Default ClientID */
  config.ClientID = [19, 86, 67, 115, 22, 38, 198, 3, 55, 118, 67, 35, 150, 230, 71, 134, 83, 3, 119, 166, 86, 39, 38, 167, 135, 134, 147, 214, 38, 55].map(function (i) {
    return Util.ASCII[(i & 15) * 16 + (i & 240) / 16];
  }).join("");

  return config;
}

/* Module configuration {{{1 */

/* Set the module's settings to the values given */
function setModuleSettings(module, config) {
  if (config.Name) {
    $(module).find("label.name").html(config.Name);
    $(module).find("input.name").val(config.Name);
  }
  function check(sel) {
    $(module).find(sel).attr("checked", "checked");
  }
  function uncheck(sel) {
    $(module).find(sel).removeAttr("checked");
  }
  if (config.Pleb) {
    check("input.pleb");
  } else {
    uncheck("input.pleb");
  }
  if (config.Sub) {
    check("input.sub");
  } else {
    uncheck("input.sub");
  }
  if (config.VIP) {
    check("input.vip");
  } else {
    uncheck("input.vip");
  }
  if (config.Mod) {
    check("input.mod");
  } else {
    uncheck("input.mod");
  }
  if (config.Event) {
    check("input.event");
  } else {
    uncheck("input.event");
  }
  if (config.Bits) {
    check("input.bits");
  } else {
    uncheck("input.bits");
  }
  if (config.Me) {
    check("input.me");
  } else {
    uncheck("input.me");
  }
  function addInput(cls, label, values) {
    if (values && values.length > 0) {
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = values[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var val = _step5.value;

          var $li = $("<li></li>");
          var isel = "input." + cls + "[value=\"" + val + "\"]";
          if ($(module).find(isel).length == 0) {
            var $l = $("<label></label>").val(label);
            var $cb = $("<input type=\"checkbox\" value=" + val.escape() + " checked />");
            $cb.addClass(cls);
            $cb.click(updateModuleConfig);
            $l.append($cb);
            $l.html($l.html() + label + val.escape());
            $li.append($l);
            $(module).find("li." + cls).before($li);
          }
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
  addInput("include_user", "From user: ", config.IncludeUser);
  addInput("include_keyword", "Contains: ", config.IncludeKeyword);
  addInput("exclude_user", "From user: ", config.ExcludeUser);
  addInput("exclude_startswith", "Starts with: ", config.ExcludeStartsWith);
  addInput("from_channel", "Channel:", config.FromChannel);
}

/* Obtain the settings from the module's settings html */
function getModuleSettings(module) {
  module = $(module);
  var s = {
    Name: module.find("input.name").val(),
    Pleb: module.find("input.pleb").is(":checked"),
    Sub: module.find("input.sub").is(":checked"),
    VIP: module.find("input.vip").is(":checked"),
    Mod: module.find("input.mod").is(":checked"),
    Event: module.find("input.event").is(":checked"),
    Bits: module.find("input.bits").is(":checked"),
    Me: module.find("input.me").is(":checked"),
    IncludeUser: [],
    IncludeKeyword: [],
    ExcludeUser: [],
    ExcludeStartsWith: [],
    FromChannel: []
  };

  module.find("input.include_user:checked").each(function () {
    s.IncludeUser.push($(this).val());
  });
  module.find("input.include_keyword:checked").each(function () {
    s.IncludeKeyword.push($(this).val());
  });
  module.find("input.exclude_user:checked").each(function () {
    s.ExcludeUser.push($(this).val());
  });
  module.find("input.exclude_startswith:checked").each(function () {
    s.ExcludeStartsWith.push($(this).val());
  });
  module.find("input.from_channel:checked").each(function () {
    s.FromChannel.push($(this).val());
  });

  return s;
}

/* Parse the module configuration from a query string component */
function parseModuleConfig(value) {
  var Decode = function Decode(vals) {
    return vals.map(function (v) {
      return decodeURIComponent(v);
    });
  };
  var parts = Decode(value.split(/,/g));
  while (parts.length < 7) {
    parts.push("");
  }var bits = Util.DecodeFlags(parts[1], 7);
  var config = {};
  config.Name = parts[0];
  config.Pleb = bits[0];
  config.Sub = bits[1];
  config.VIP = bits[2];
  config.Mod = bits[3];
  config.Event = bits[4];
  config.Bits = bits[5];
  config.Me = bits[6];
  config.IncludeKeyword = parts[2] ? Decode(parts[2].split(/,/g)) : [];
  config.IncludeUser = parts[3] ? Decode(parts[3].split(/,/g)) : [];
  config.ExcludeUser = parts[4] ? Decode(parts[4].split(/,/g)) : [];
  config.ExcludeStartsWith = parts[5] ? Decode(parts[5].split(/,/g)) : [];
  config.FromChannel = parts[6] ? Decode(parts[6].split(/,/g)) : [];
  return config;
}

/* Format the module configuration into a query string component */
function formatModuleConfig(cfg) {
  var Encode = function Encode(vals) {
    return vals.map(function (v) {
      return encodeURIComponent(v);
    });
  };
  var bits = [cfg.Pleb, cfg.Sub, cfg.VIP, cfg.Mod, cfg.Event, cfg.Bits, cfg.Me];
  var values = [cfg.Name, Util.EncodeFlags(bits, false), Encode(cfg.IncludeKeyword).join(","), Encode(cfg.IncludeUser).join(","), Encode(cfg.ExcludeUser).join(","), Encode(cfg.ExcludeStartsWith).join(","), Encode(cfg.FromChannel).join(",")];
  return Encode(values).join(",");
}

/* Update the local storage config with the current module settings */
function updateModuleConfig() {
  var config = getConfigObject();
  $(".module").each(function () {
    config[$(this).attr("id")] = getModuleSettings($(this));
  });
  Util.SetWebStorage(config);
}

/* End module configuration 1}}} */

/* Set the joined channels to the list given */
function setChannels(client, channels) {
  var fmt_ch = function fmt_ch(ch) {
    return Twitch.FormatChannel(Twitch.ParseChannel(ch));
  };
  var new_chs = channels.map(fmt_ch);
  var old_chs = client.GetJoinedChannels().map(fmt_ch);
  var to_join = new_chs.filter(function (c) {
    return old_chs.indexOf(c) == -1;
  });
  var to_part = old_chs.filter(function (c) {
    return new_chs.indexOf(c) == -1;
  });
  /* Join all the channels added */
  var _iteratorNormalCompletion6 = true;
  var _didIteratorError6 = false;
  var _iteratorError6 = undefined;

  try {
    for (var _iterator6 = to_join[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
      var ch = _step6.value;

      client.JoinChannel(ch);
      Content.addNotice("Joining " + ch);
    }
    /* Leave all the channels removed */
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

  var _iteratorNormalCompletion7 = true;
  var _didIteratorError7 = false;
  var _iteratorError7 = undefined;

  try {
    for (var _iterator7 = to_part[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
      var _ch = _step7.value;

      client.LeaveChannel(_ch);
      Content.addNotice("Leaving " + _ch);
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

/* End configuration section 0}}} */

/* Return whether or not the event should be filtered */
function shouldFilter(module, event) {
  var rules = getModuleSettings(module);
  if (event instanceof TwitchChatEvent) {
    var user = event.user ? event.user.toLowerCase() : "";
    var message = event.message ? event.message.toLowerCase() : "";
    /* sub < vip < mod for classification */
    var role = "pleb";
    if (event.issub) role = "sub";
    if (event.isvip) role = "vip";
    if (event.ismod) role = "mod";
    /* Includes take priority over excludes */
    if (rules.IncludeUser.any(function (u) {
      return u.toLowerCase() == user;
    })) return false;
    if (rules.IncludeKeyword.any(function (k) {
      return message.indexOf(k) > -1;
    })) return false;
    /* Role filtering */
    if (!rules.Pleb && role == "pleb") return true;
    if (!rules.Sub && role == "sub") return true;
    if (!rules.VIP && role == "vip") return true;
    if (!rules.Mod && role == "mod") return true;
    /* Content filtering ("Bits" also filters out cheer effects) */
    if (!rules.Bits && event.flags.bits) return true;
    if (!rules.Me && event.flags.action) return true;
    /* Exclude filtering */
    if (rules.ExcludeUser.any(function (u) {
      return u.toLowerCase() == user;
    })) return true;
    if (rules.ExcludeStartsWith.any(function (m) {
      return message.startsWith(m);
    })) return true;
    /* Filtering to permitted channels (default: permit all) */
    if (rules.FromChannel.length > 0) {
      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = rules.FromChannel[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var s = _step8.value;

          var c = s.indexOf("#") == -1 ? "#" + s : s;
          if (event.channel && event.channel.channel) {
            if (event.channel.channel.toLowerCase() != c.toLowerCase()) {
              return true;
            }
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
    }
  } else if (event instanceof TwitchEvent) {
    if (!rules.Event) {
      /* Filter out events and notices */
      if (event.command === "USERNOTICE") {
        return true;
      } else if (event.command === "NOTICE") {
        return true;
      }
    }
  }
  return false;
}

/* Handle a chat command */
function handleCommand(value, client) {
  var tokens = value.split(" ");
  var command = tokens.shift();

  /* Clear empty tokens at the end (\r\n related) */
  while (tokens.length > 0 && tokens[tokens.length - 1].length == 0) {
    tokens.pop();
  }

  if (ChatCommands.isCommandStr(value)) {
    if (ChatCommands.has_command(command)) {
      ChatCommands.execute(value, client);
      return true;
    }
  }

  /* Handle config command */
  if (command == "//config") {
    var config = getConfigObject();
    if (tokens.length > 0) {
      if (tokens[0] == "clientid") {
        Content.addHelpLine("ClientID", config.ClientID);
      } else if (tokens[0] == "pass") {
        Content.addHelpLine("Pass", config.Pass);
      } else if (tokens[0] == "purge") {
        Util.SetWebStorage({});
        Content.addNotice("Purged storage \"" + Util.GetWebStorageKey() + "\"");
      } else if (tokens[0] == "url") {
        var url = location.protocol + "//" + location.hostname + location.pathname;
        if (tokens.length > 1) {
          if (tokens[1].startsWith("git")) {
            url = "https://kaedenn.github.io/twitch-filtered-chat/index.html";
          }
        }
        var qs = [];
        var qsAdd = function qsAdd(k, v) {
          return qs.push(k + "=" + encodeURIComponent(v));
        };
        if (config.Debug > 0) {
          qsAdd("debug", config.Debug);
        }
        if (config.__clientid_override) {
          if (config.ClientID && config.ClientID.length == 30) {
            qsAdd("clientid", config.ClientID);
          }
        }
        if (config.Channels.length > 0) {
          qsAdd("channels", config.Channels.join(","));
        }
        if (tokens.indexOf("auth") > -1) {
          if (config.Name && config.Name.length > 0) {
            qsAdd("user", config.Name);
          }
          if (config.Pass && config.Pass.length > 0) {
            qsAdd("pass", config.Pass);
          }
        }
        if (config.NoAssets) {
          qsAdd("noassets", config.NoAssets);
        }
        if (config.NoFFZ) {
          qsAdd("noffz", config.NoFFZ);
        }
        if (config.NoBTTV) {
          qsAdd("nobttv", config.NoBTTV);
        }
        if (config.HistorySize) {
          qsAdd("hmax", config.HistorySize);
        }
        qsAdd("module1", formatModuleConfig(config.module1));
        qsAdd("module2", formatModuleConfig(config.module2));
        qsAdd("layout", FormatLayout(config.Layout));
        if (config.Transparent) {
          qsAdd("trans", "1");
        }
        if (config.AutoReconnect) {
          qsAdd("reconnect", "1");
        }
        {
          var font_size = Util.CSS.GetProperty("--body-font-size");
          if (font_size != Util.CSS.GetProperty("--body-font-size-default")) {
            qsAdd("size", font_size.replace(/[^0-9]/g, ""));
          }
        }
        if (config.Plugins) {
          qsAdd("plugins", "1");
        }
        if (config.MaxMessages != TwitchClient.DEFAULT_MAX_MESSAGES) {
          qsAdd("max", "" + config.MaxMessages);
        }
        if (config.Font) {
          qsAdd("font", config.Font);
        }
        if (config.Scroll) {
          qsAdd("scroll", "1");
        }
        if (config.ShowClips) {
          qsAdd("clips", "1");
        }
        /* Format QS object */
        if (tokens[tokens.length - 1] === "text") {
          url += "?" + qs.join("&");
        } else {
          url += "?base64=" + encodeURIComponent(btoa(qs.join("&")));
        }
        Content.addHelp(client.get("HTMLGen").url(url));
      } else if (config.hasOwnProperty(tokens[0])) {
        Content.addHelpLine(tokens[0], JSON.stringify(config[tokens[0]]));
      } else {
        Content.addError("Unknown config key &quot;" + tokens[0] + "&quot;", true);
      }
    } else {
      var wincfgs = [];
      var _iteratorNormalCompletion9 = true;
      var _didIteratorError9 = false;
      var _iteratorError9 = undefined;

      try {
        for (var _iterator9 = Object.entries(config)[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
          var _ref3 = _step9.value;

          var _ref4 = _slicedToArray(_ref3, 2);

          var k = _ref4[0];
          var v = _ref4[1];

          if (k === "Layout") {
            Content.addHelpLine(k, FormatLayout(v));
          } else if ((typeof v === "undefined" ? "undefined" : _typeof(v)) == "object" && v.Name && v.Name.length > 1) {
            /* It's a window configuration */
            wincfgs.push([k, v]);
          } else if (k == "ClientID" || k == "Pass") {
            Content.addHelpLine(k, "Omitted for security; use //config " + k.toLowerCase() + " to show");
          } else {
            Content.addHelpLine(k, v);
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

      Content.addHelp("Window Configurations:");
      var _iteratorNormalCompletion10 = true;
      var _didIteratorError10 = false;
      var _iteratorError10 = undefined;

      try {
        for (var _iterator10 = wincfgs[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
          var _ref5 = _step10.value;

          var _ref6 = _slicedToArray(_ref5, 2);

          var _k = _ref6[0];
          var _v = _ref6[1];

          Content.addHelp("Module <span class=\"arg\">" + _k + "</span>: &quot;" + _v.Name + "&quot;:");
          var _iteratorNormalCompletion11 = true;
          var _didIteratorError11 = false;
          var _iteratorError11 = undefined;

          try {
            for (var _iterator11 = Object.entries(_v)[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
              var _ref7 = _step11.value;

              var _ref8 = _slicedToArray(_ref7, 2);

              var cfgk = _ref8[0];
              var cfgv = _ref8[1];

              if (cfgk === "Name") continue;
              Content.addHelpLine(cfgk, "&quot;" + cfgv + "&quot;");
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
    }
  } else {
    return false;
  }
  return true;
}

/* Populate and show the username context window */
function showContextWindow(client, cw, line) {
  var $cw = $(cw);
  var $l = $(line);
  $(cw).html(""); /* Clear everything from the last time */

  /* Attributes of the host line */
  var id = $l.attr("data-id");
  var user = $l.attr("data-user");
  var name = $l.find(".username").text();
  var userid = $l.attr("data-user-id");
  var channel = "#" + $l.attr("data-channel");
  var chid = $l.attr("data-channelid");
  var sub = $l.attr("data-subscriber") === "1";
  var mod = $l.attr("data-mod") === "1";
  var vip = $l.attr("data-vip") === "1";
  var caster = $l.attr("data-caster") === "1";
  var timestamp = Number.parseInt($l.attr("data-sent-ts"));
  var time = new Date(timestamp);

  /* Set the attributes for the context window */
  $cw.attr("data-id", id);
  $cw.attr("data-user", user);
  $cw.attr("data-user-id", userid);
  $cw.attr("data-channel", channel);
  $cw.attr("data-chid", chid);
  $cw.attr("data-sub", sub);
  $cw.attr("data-mod", mod);
  $cw.attr("data-vip", vip);
  $cw.attr("data-caster", caster);
  $cw.attr("data-id", id);

  /* Define functions for building elements */
  var $Line = function $Line(s) {
    return $("<div class=\"item\">" + s + "</div>");
  };
  var Link = function Link(i, text) {
    return client.get("HTMLGen").url(null, text, "cw-link", i);
  };
  var Em = function Em(t) {
    return "<span class=\"em\">" + t + "</span>";
  };
  var $EmItem = function $EmItem(s) {
    return $(Em(s)).css("margin-left", "0.5em");
  };

  /* Add user"s display name */
  var $username = $l.find(".username");
  var classes = $username.attr("class");
  var css = $username.attr("style");
  var e_name = "<span class=\"" + classes + "\" style=\"" + css + "\">" + name + "</span>";
  $cw.append($Line(e_name + " in " + Em(channel)));

  /* Add link to timeout user */
  if (client.IsMod(channel)) {
    var $tl = $("<div class=\"cw-timeout\">Timeout:</div>");
    var _iteratorNormalCompletion12 = true;
    var _didIteratorError12 = false;
    var _iteratorError12 = undefined;

    try {
      for (var _iterator12 = "1s 10s 60s 10m 30m 1h 12h 24h".split(" ")[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
        var dur = _step12.value;

        var $ta = $(Link("cw-timeout-" + user + "-" + dur, dur));
        $ta.addClass("cw-timeout-dur");
        $ta.attr("data-channel", channel);
        $ta.attr("data-user", user);
        $ta.attr("data-duration", dur);
        $ta.click(function () {
          var ch = $(this).attr("data-channel");
          var u = $(this).attr("data-user");
          var d = $(this).attr("data-duration");
          client.Timeout(ch, u, d);
          Util.Log("Timed out user", u, "from", ch, "for", d);
          $(cw).fadeOut();
        });
        $tl.append($ta);
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

    $cw.append($tl);
  }

  /* Add link which places "/ban <user>" into the chat textbox */
  if (client.IsMod(channel)) {
    var $ba = $(Link("cw-ban-" + user, "Ban"));
    $ba.attr("data-channel", channel);
    $ba.attr("data-user", user);
    $ba.click(function () {
      $("#txtChat").val("/ban " + $(this).attr("data-user"));
    });
    $cw.append($ba);
  }

  /* Add other information */
  var sent_ts = Util.FormatDate(time);
  var ago_ts = Util.FormatInterval((Date.now() - timestamp) / 1000);
  $cw.append($Line("Sent: " + sent_ts + " (" + ago_ts + " ago)"));
  $cw.append($Line("UserID: " + userid));
  $cw.append($Line("MsgUID: " + id));

  /* Add roles (and ability to remove roles, for the caster) */
  if (mod || vip || sub || caster) {
    var $roles = $Line("User Role:");
    if (mod) {
      $roles.append($EmItem("Mod"));$roles.append(",");
    }
    if (vip) {
      $roles.append($EmItem("VIP"));$roles.append(",");
    }
    if (sub) {
      $roles.append($EmItem("Sub"));$roles.append(",");
    }
    if (caster) {
      $roles.append($EmItem("Host"));$roles.append(",");
    }
    /* Remove the last comma */
    $roles[0].removeChild($roles[0].lastChild);
    $cw.append($roles);
    if (client.IsCaster(channel) && !client.IsUIDSelf(userid)) {
      if (mod) {
        $cw.append($Line(Link("cw-unmod", "Remove Mod")));
      }
      if (vip) {
        $cw.append($Line(Link("cw-unvip", "Remove VIP")));
      }
    }
  }

  /* Add the ability to add roles (for the caster) */
  if (client.IsCaster(channel) && !client.IsUIDSelf(userid)) {
    if (!mod) {
      $cw.append($Line(Link("cw-make-mod", "Make Mod")));
    }
    if (!vip) {
      $cw.append($Line(Link("cw-make-vip", "Make VIP")));
    }
  }

  var l_off = $l.offset();
  var offset = { top: l_off.top + $l.outerHeight() + 2, left: l_off.left };
  if (offset.top + $cw.outerHeight() + 2 > window.innerHeight) {
    offset.top = window.innerHeight - $cw.outerHeight() - 2;
  }
  if (offset.left + $cw.outerWidth() + 2 > window.innerWidth) {
    offset.left = window.innerWidth - $cw.outerWidth() - 2;
  }
  $cw.fadeIn().offset(offset);
}

/* Set or unset transparency */
function updateTransparency(transparent) {
  var props = [];
  try {
    var ss = Util.CSS.GetSheet("main.css");
    var rule = Util.CSS.GetRule(ss, ":root");
    /* Find the prop="--<name>-color" rules */
    var _iteratorNormalCompletion13 = true;
    var _didIteratorError13 = false;
    var _iteratorError13 = undefined;

    try {
      for (var _iterator13 = Util.CSS.GetPropertyNames(rule)[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
        var prop = _step13.value;

        if (prop.match(/^--[a-z-]+-color$/)) {
          props.push(prop);
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
    /* Unable to enumerate properties; use hard-coded ones */
    Util.Error("Failed getting main.css :root", e);
    props = ["--body-color", "--header-color", "--menudiv-color", "--module-color", "--odd-line-color", "--sub-color", "--chat-color", "--textarea-color"];
  }
  var _iteratorNormalCompletion14 = true;
  var _didIteratorError14 = false;
  var _iteratorError14 = undefined;

  try {
    for (var _iterator14 = props[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
      var _prop = _step14.value;

      if (transparent) {
        /* Set them all to transparent */
        Util.CSS.SetProperty(_prop, "transparent");
        $(".module").addClass("transparent");
        $("body").addClass("transparent");
      } else {
        /* Set them all to default */
        Util.CSS.SetProperty(_prop, "var(" + _prop + "-default)");
        $(".module").removeClass("transparent");
        $("body").removeClass("transparent");
      }
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

/* Called once when the document loads */
function client_main(layout) {
  /* exported client_main */
  var client = void 0;
  var ConfigCommon = {};

  /* Hook Logger messages */
  Util.Logger.add_hook(function (sev, with_stack) {
    var _Util$Logger;

    for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }

    var msg = (_Util$Logger = Util.Logger).stringify.apply(_Util$Logger, args);
    if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
      Content.addError("ERROR: " + msg.escape());
    }
  }, "ERROR");
  Util.Logger.add_hook(function (sev, with_stack) {
    var _Util$Logger2;

    for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
      args[_key2 - 2] = arguments[_key2];
    }

    var msg = (_Util$Logger2 = Util.Logger).stringify.apply(_Util$Logger2, args);
    if (args.length == 1 && args[0] instanceof TwitchEvent) {
      if (Util.DebugLevel >= Util.LEVEL_TRACE) {
        Content.addNotice("WARNING: " + args[0].repr());
      }
    } else if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
      Content.addNotice("WARNING: " + msg.escape());
    }
  }, "WARN");
  Util.Logger.add_hook(function (sev, with_stack) {
    var _Util$Logger3;

    for (var _len3 = arguments.length, args = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
      args[_key3 - 2] = arguments[_key3];
    }

    var msg = (_Util$Logger3 = Util.Logger).stringify.apply(_Util$Logger3, args);
    if (Util.DebugLevel >= Util.LEVEL_TRACE) {
      Content.addHTML("DEBUG: " + msg.escape());
    }
  }, "DEBUG");
  Util.Logger.add_hook(function (sev, with_stack) {
    var _Util$Logger4;

    for (var _len4 = arguments.length, args = Array(_len4 > 2 ? _len4 - 2 : 0), _key4 = 2; _key4 < _len4; _key4++) {
      args[_key4 - 2] = arguments[_key4];
    }

    var msg = (_Util$Logger4 = Util.Logger).stringify.apply(_Util$Logger4, args);
    if (Util.DebugLevel >= Util.LEVEL_TRACE) {
      Content.addHTML("TRACE: " + msg.escape());
    }
  }, "TRACE");

  /* Obtain configuration, construct client */
  (function _configure_construct_client() {
    var config = getConfigObject();
    client = new TwitchClient(config);
    Util.DebugLevel = config.Debug;

    /* Change the document title to show our authentication state */
    document.title += " -";
    if (config.Pass && config.Pass.length > 0) {
      document.title += " Authenticated";
    } else {
      document.title += " Read-Only";
      if (config.Layout.Chat) {
        /* Change the chat placeholder and border to reflect read-only */
        $("#txtChat").attr("placeholder", "Authentication needed to send messages");
        Util.CSS.SetProperty("--chat-border", "#cd143c");
      }
    }

    /* Simulate clicking cbTransparent if config.Transparent is set */
    if (config.Transparent) {
      updateTransparency(true);
    }

    /* Set the text size if given */
    if (config.Size) {
      Util.CSS.SetProperty("--body-font-size", config.Size);
    }

    /* Set the font if given */
    if (config.Font) {
      Util.CSS.SetProperty("--body-font", config.Font);
    }

    /* If scrollbars are configured, enable them */
    if (config.Scroll) {
      $(".module .content").css("overflow-y", "scroll");
      $("#cbScroll").attr("checked", "checked");
    } else {
      $("#cbScroll").removeAttr("checked");
    }

    /* After all that, sync the final settings up with the html */
    $(".module").each(function () {
      setModuleSettings(this, config[$(this).attr("id")]);
    });

    /* Set values we'll want to use later */
    ConfigCommon = Util.JSONClone(config);
    delete ConfigCommon["Pass"];
    delete ConfigCommon["ClientID"];
    ConfigCommon.Plugins = config.Plugins ? true : false;
    ConfigCommon.MaxMessages = config.MaxMessages || 100;

    /* If no channels are configured, show the settings panel */
    if (config.Channels.length == 0) {
      $("#settings").fadeIn();
    }

    /* Apply the show-clips config to the settings div */
    if (config.ShowClips) {
      $("#cbClips").attr("checked", "checked");
    } else {
      $("#cbClips").removeAttr("checked");
    }
  })();

  /* Construct the HTML Generator and tell it and the client about each other */
  client.set("HTMLGen", new HTMLGenerator(client, ConfigCommon));

  /* Call to sync configuration to HTMLGen */
  function updateHTMLGenConfig() {
    var config = Util.JSONClone(getConfigObject());
    delete config["Pass"];
    delete config["ClientID"];
    config.Plugins = Boolean(config.Plugins);
    var _iteratorNormalCompletion15 = true;
    var _didIteratorError15 = false;
    var _iteratorError15 = undefined;

    try {
      for (var _iterator15 = Object.entries(config)[Symbol.iterator](), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
        var _ref9 = _step15.value;

        var _ref10 = _slicedToArray(_ref9, 2);

        var k = _ref10[0];
        var v = _ref10[1];

        client.get("HTMLGen").setValue(k, v);
      }
    } catch (err) {
      _didIteratorError15 = true;
      _iteratorError15 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion15 && _iterator15.return) {
          _iterator15.return();
        }
      } finally {
        if (_didIteratorError15) {
          throw _iteratorError15;
        }
      }
    }
  }

  /* Construct the plugins */
  if (ConfigCommon.Plugins) {
    try {
      Plugins.LoadAll(client);
    } catch (e) {
      if (e.name !== "ReferenceError") {
        throw e;
      } else {
        Util.Warn("Plugins object not present");
      }
    }
  }

  /* Allow JS access if debugging is enabled */
  if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
    window.client = client;
  }

  /* Add documentation for the moderator chat commands */
  ChatCommands.addHelp("Moderator commands:", { literal: true });
  ChatCommands.addHelp("!tfc reload: Force reload of this page", { literal: true, command: true });
  ChatCommands.addHelp("!tfc force-reload: Force reload of this page, discarding cache", { literal: true, command: true });
  ChatCommands.addHelp("!tfc nuke: Clear the chat", { literal: true, command: true });
  ChatCommands.addHelp("!tfc nuke <user>: Remove all messages sent by <user>", { command: true });

  /* Bind all of the page assets {{{0 */

  /* Sending a chat message */
  $("#txtChat").keydown(function (e) {
    var isUp = e.keyCode === Util.Key.UP;
    var isDown = e.keyCode === Util.Key.DOWN;
    if (e.keyCode == Util.Key.RETURN) {
      if (e.target.value.trim().length > 0) {
        if (!handleCommand(e.target.value, client)) {
          client.SendMessageToAll(e.target.value);
        }
        client.AddHistory(e.target.value);
        $(e.target).attr("hist-index", "-1");
        e.target.value = "";
      }
      /* Prevent bubbling */
      e.preventDefault();
      return false;
    } else if (isUp || isDown) {
      /* Handle traversing message history */
      var i = Number.parseInt($(e.target).attr("hist-index"));
      var l = client.GetHistoryLength();
      if (isUp) {
        i = i + 1 >= l - 1 ? l - 1 : i + 1;
      } else if (isDown) {
        i = i - 1 < 0 ? -1 : i - 1;
      }
      e.target.value = i > -1 ? client.GetHistoryItem(i) : "";
      $(e.target).attr("hist-index", "" + i);
      /* Delay moving the cursor until after the text is updated */
      requestAnimationFrame(function () {
        e.target.selectionStart = e.target.value.length;
        e.target.selectionEnd = e.target.value.length;
      });
    }
  });

  /* Pressing enter while on the settings box */
  $("#settings").keyup(function (e) {
    if (e.keyCode == Util.Key.RETURN) {
      updateModuleConfig();
      $("#btnSettings").click();
    }
  });

  /* Clicking the settings button */
  $("#btnSettings").click(function () {
    if ($("#settings").is(":visible")) {
      $("#settings").fadeOut();
    } else {
      var config = getConfigObject();
      $("#txtChannel").val(config.Channels.join(","));
      $("#txtNick").val(config.Name ? config.Name : AUTOGEN_VALUE);
      if (config.Pass && config.Pass.length > 0) {
        $("#txtPass").attr("disabled", "disabled").hide();
        $("#txtPassDummy").show();
      }
      $("#selDebug").val("" + config.Debug);
      $("#settings").fadeIn();
    }
  });

  /* Clicking on a "Clear" link */
  $(".clear-chat-link").click(function () {
    $("#" + $(this).attr("data-for") + " .content").find(".line-wrapper").remove();
  });

  /* Pressing enter on the "Channels" text box */
  $("#txtChannel").keyup(function (e) {
    if (e.keyCode == Util.Key.RETURN) {
      setChannels(client, $(this).val().split(","));
      var cfg = getConfigObject();
      cfg.Channels = client.GetJoinedChannels();
      Util.SetWebStorage(cfg);
    }
  });

  /* Leaving the "Channels" text box */
  $("#txtChannel").blur(function () /*e*/{
    setChannels(client, $(this).val().split(","));
    var cfg = getConfigObject();
    cfg.Channels = client.GetJoinedChannels();
    Util.SetWebStorage(cfg);
  });

  /* Changing the "Scrollbars" checkbox */
  $("#cbScroll").change(function () {
    var cfg = getConfigObject();
    cfg.Scroll = $(this).is(":checked");
    Util.SetWebStorage(cfg);
    if (cfg.Scroll) {
      $(".module .content").css("overflow-y", "scroll");
    } else {
      $(".module .content").css("overflow-y", "hidden");
    }
  });

  /* Changing the "stream is transparent" checkbox */
  $("#cbTransparent").change(function () {
    var val = $(this).is(":checked");
    updateTransparency(val);
    updateHTMLGenConfig();
  });

  /* Changing the value for "background image" */
  $("#txtBGStyle").keyup(function (e) {
    if (e.keyCode == Util.Key.RETURN) {
      $(".module").css("background-image", $(this).val());
    }
  });

  /* Changing the "Show Clips" checkbox */
  $("#cbClips").change(function () {
    var val = Boolean($(this).is(":checked"));
    var cfg = getConfigObject();
    cfg.ShowClips = val;
    Util.SetWebStorage(cfg);
    updateHTMLGenConfig();
  });

  /* Changing the debug level */
  $("#selDebug").change(function () {
    var v = parseInt($(this).val());
    var old = client.GetDebug();
    Util.Log("Changing debug level from " + Util.DebugLevel + " (" + old + ") to " + v);
    client.SetDebug(v);
  });

  /* Clicking on the reconnect link in the settings box */
  $("#reconnect").click(function () {
    client.Connect();
  });

  /* Opening one of the module menus */
  $(".menu").click(function () {
    var $settings = $(this).parent().children(".settings");
    var $lbl = $(this).parent().children("label.name");
    var $tb = $(this).parent().children("input.name");
    if ($settings.is(":visible")) {
      /* Update module configurations on close */
      updateModuleConfig();
      $tb.hide();
      $lbl.html($tb.val()).show();
    } else {
      $lbl.hide();
      $tb.val($lbl.html()).show();
    }
    $settings.fadeToggle();
  });

  /* Pressing enter on the module's name text box */
  $(".module .header input.name").on("keyup", function (e) {
    if (e.keyCode == Util.Key.RETURN) {
      var $settings = $(this).parent().children(".settings");
      var $lbl = $(this).parent().children("label.name");
      var $tb = $(this).parent().children("input.name");
      updateModuleConfig();
      $tb.hide();
      $lbl.html($tb.val()).show();
      $settings.fadeToggle();
    }
  });

  /* Pressing enter on one of the module menu text boxes */
  $(".module .settings input[type=\"text\"]").on("keyup", function (e) {
    var v = $(this).val();
    if (v.length > 0) {
      if (e.keyCode == Util.Key.RETURN) {
        var $cli = $(this).closest("li");
        var cls = $cli.attr("class").replace("textbox", "").trim();
        var cb = client.get("HTMLGen").checkbox(v, null, cls, true);
        var val = $cli.find("label").html();
        var $li = $("<li><label>" + cb + val + " " + v + "</label></li>");
        $cli.before($li);
        $(this).val("");
        updateModuleConfig();
      }
    }
  });

  /* Clicking anywhere else on the document: reconnect, username context window */
  $(document).click(function (e) {
    var $t = $(e.target);
    var $cw = $("#userContext");
    var $m1s = $("#module1 .settings");
    var $m2s = $("#module2 .settings");
    /* Clicking off of module1 settings: hide it */
    if ($m1s.length > 0 && $m1s.is(":visible")) {
      if (!Util.PointIsOn(e.clientX, e.clientY, $m1s[0]) && !Util.PointIsOn(e.clientX, e.clientY, $("#module1 .header")[0])) {
        updateModuleConfig();
        var $tb = $m1s.siblings("input.name").hide();
        $m1s.siblings("label.name").html($tb.val()).show();
        $m1s.fadeOut();
      }
    }
    /* Clicking off of module2 settings: hide it */
    if ($m2s.length > 0 && $m2s.is(":visible")) {
      if (!Util.PointIsOn(e.clientX, e.clientY, $m2s[0]) && !Util.PointIsOn(e.clientX, e.clientY, $("#module2 .header")[0])) {
        updateModuleConfig();
        var _$tb = $m2s.siblings("input.name").hide();
        $m2s.siblings("label.name").html(_$tb.val()).show();
        $m2s.fadeOut();
      }
    }
    /* Clicking on the username context window */
    if (Util.PointIsOn(e.clientX, e.clientY, $cw[0])) {
      var ch = $cw.attr("data-channel");
      var user = $cw.attr("data-user");
      var userid = $cw.attr("data-user-id");
      if (!client.IsUIDSelf(userid)) {
        if ($t.attr("id") === "cw-unmod") {
          /* Clicked on the "unmod" link */
          Util.Log("Unmodding", user, "in", ch);
          client.SendMessage(ch, "/unmod " + user);
        } else if ($t.attr("id") === "cw-unvip") {
          /* Clicked on the "unvip" link */
          Util.Log("Removing VIP for", user, "in", ch);
          client.SendMessage(ch, "/unvip " + user);
        } else if ($t.attr("id") === "cw-make-mod") {
          /* Clicked on the "mod" link */
          Util.Log("Modding", user, "in", ch);
          client.SendMessage(ch, "/mod " + user);
        } else if ($t.attr("id") === "cw-make-vip") {
          /* Clicked on the "vip" link */
          Util.Log("VIPing", user, "in", ch);
          client.SendMessage(ch, "/vip " + user);
        }
      }
    } else if ($t.attr("data-username") == "1") {
      /* Clicked on a username; show context window */
      var $l = $t.parent();
      if ($cw.is(":visible") && $cw.attr("data-user-id") == $l.attr("data-user-id")) {
        $cw.fadeOut();
      } else {
        showContextWindow(client, $cw, $l);
      }
    } else if ($cw.is(":visible")) {
      /* Clicked somewhere else: close context window */
      $cw.fadeOut();
    }
    /* Clicking on a "Reconnect" link */
    if ($t.attr("data-reconnect") == "1") {
      /* Clicked on a reconnect link */
      Content.addNotice("Reconnecting...");
      client.Connect();
    }
  });

  /* End of the DOM event binding 0}}} */

  /* Bind to numerous TwitchEvent events {{{0 */

  /* WebSocket opened */
  client.bind("twitch-open", function _on_twitch_open() /*e*/{
    $(".loading").remove();
    $("#debug").hide();
    if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
      var notes = [];
      if (client.IsAuthed()) {
        notes.push("(authenticated)");
      } else {
        notes.push("(unauthenticated)");
      }
      Content.addInfo("Connected " + notes.join(" "));
    }
    if (getConfigObject().Channels.length == 0) {
      Content.addInfo("No channels configured; type //join &lt;channel&gt; to join one!");
    }
  });

  /* WebSocket closed */
  client.bind("twitch-close", function _on_twitch_close(e) {
    var code = e.raw_line.code;
    var reason = e.raw_line.reason;
    var msg = "Connection closed";
    if (reason) {
      msg = msg + " (code " + code + ": " + reason + ")";
    } else {
      msg = msg + " (code " + code + ")";
    }
    if (getConfigObject().AutoReconnect) {
      Content.addError(msg);
      client.Connect();
    } else {
      Content.addError(msg + "<span class=\"reconnect\" data-reconnect=\"1\">Reconnect</span>");
    }
  });

  /* Received reconnect command from Twitch */
  client.bind("twitch-reconnect", function _on_twitch_reconnect() /*e*/{
    client.Connect();
  });

  /* User joined (any user) */
  client.bind("twitch-join", function _on_twitch_join(e) {
    if (!Util.Browser.IsOBS && !layout.Slim) {
      if (e.user == client.GetName().toLowerCase()) {
        Content.addInfo("Joined " + e.channel.channel);
      }
    }
  });

  /* User left (any user) */
  client.bind("twitch-part", function _on_twitch_part(e) {
    if (!Util.Browser.IsOBS && !layout.Slim) {
      if (e.user == client.GetName().toLowerCase()) {
        Content.addInfo("Left " + e.channel.channel);
      }
    }
  });

  /* Notice (or warning) from Twitch */
  client.bind("twitch-notice", function _on_twitch_notice(e) {
    /* Some notices are benign */
    switch (e.notice_msgid) {
      case "host_on":
        break;
      case "host_target_went_offline":
        break;
      case "cmds_available":
        Content.addInfo("Use //help to see Twitch Filtered Chat commands");
        break;
      default:
        Util.Warn(e);
    }
    var channel = Twitch.FormatChannel(e.channel);
    var message = e.message.escape();
    Content.addNotice(channel + ": " + message);
  });

  /* Error from Twitch or Twitch Client API */
  client.bind("twitch-error", function _on_twitch_error(e) {
    Util.Error(e);
    var user = e.user;
    var command = e.values.command;
    var message = e.message.escape();
    Content.addError("Error for " + user + ": " + command + ": " + message);
  });

  /* Message received from Twitch */
  client.bind("twitch-message", function _on_twitch_message(e) {
    if (Util.DebugLevel >= Util.LEVEL_TRACE) {
      Content.addPre(e.repr());
    }
    /* Avoid flooding the DOM with stale chat messages */
    var max = getConfigObject().MaxMessages || 100;
    var _iteratorNormalCompletion16 = true;
    var _didIteratorError16 = false;
    var _iteratorError16 = undefined;

    try {
      for (var _iterator16 = $(".content")[Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
        var c = _step16.value;

        while ($(c).find(".line-wrapper").length > max) {
          $(c).find(".line-wrapper").first().remove();
        }
      }
    } catch (err) {
      _didIteratorError16 = true;
      _iteratorError16 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion16 && _iterator16.return) {
          _iterator16.return();
        }
      } finally {
        if (_didIteratorError16) {
          throw _iteratorError16;
        }
      }
    }
  });

  /* Received streamer info */
  client.bind("twitch-streaminfo", function _on_twitch_streaminfo(e) {
    var cinfo = client.GetChannelInfo(e.channel.channel);
    if (!cinfo.online) {
      if (ConfigCommon.Layout && !ConfigCommon.Layout.Slim) {
        Content.addNotice(e.channel.channel + " is not currently streaming");
      }
    }
  });

  /* Received chat message */
  client.bind("twitch-chat", function _on_twitch_chat(event) {
    if (event instanceof TwitchChatEvent) {
      var m = typeof event.message === "string" ? event.message : "";
      if (event.flags && event.flags.mod && m.indexOf(" ") > -1) {
        var tokens = m.split(" ");
        if (tokens[0] === "!tfc") {
          if (tokens[1] === "reload") {
            location.reload();
          } else if (tokens[1] === "force-reload") {
            location.reload(true);
          } else if (tokens[1] === "clear") {
            $(".content").children().remove();
          } else if (tokens[1] === "removeuser" || tokens[1] === "clearuser" || tokens[1] === "remove-user" || tokens[1] === "clear-user") {
            if (tokens[2] && tokens[2].length > 1) {
              $("[data-user=\"" + tokens[2].toLowerCase() + "\"]").parent().remove();
            }
          } else if (tokens[1] == "nuke") {
            if (tokens[2] && tokens[2].length > 1) {
              $("[data-user=\"" + tokens[2].toLowerCase() + "\"]").parent().remove();
            } else {
              $(".content").children().remove();
            }
            return;
          }
        }
      }
    }
    $(".module").each(function () {
      if (!shouldFilter($(this), event)) {
        var $w = $("<div class=\"line line-wrapper\"></div>");
        $w.html(client.get("HTMLGen").gen(event));
        var $c = $(this).find(".content");
        $c.append($w);
        $c.scrollTop(Math.pow(2, 31) - 1);
      }
    });
  });

  /* Received CLEARCHAT event */
  client.bind("twitch-clearchat", function _on_twitch_clearchat(e) {
    if (e.has_flag("target-user-id")) {
      /* Moderator timed out a user */
      var r = e.flags["room-id"];
      var u = e.flags["target-user-id"];
      $(".chat-line[data-channel-id=\"" + r + "\"][data-user-id=\"" + u + "\"]").parent().remove();
    } else {
      /* Moderator cleared the chat */
      $("div.content").find(".line-wrapper").remove();
    }
  });

  /* Received CLEARMSG event */
  client.bind("twitch-clearmsg", function _on_twitch_clearmsg(e) {
    Util.StorageAppend("debug-msg-log", e);
    Util.Warn("Unhandled CLEARMSG:", e);
  });

  /* User subscribed */
  client.bind("twitch-sub", function _on_twitch_sub(e) {
    Util.StorageAppend("debug-msg-log", e);
    Content.addHTML(client.get("HTMLGen").sub(e));
  });

  /* User resubscribed */
  client.bind("twitch-resub", function _on_twitch_resub(e) {
    Util.StorageAppend("debug-msg-log", e);
    Content.addHTML(client.get("HTMLGen").resub(e));
  });

  /* User gifted a subscription */
  client.bind("twitch-giftsub", function _on_twitch_giftsub(e) {
    Util.StorageAppend("debug-msg-log", e);
    Content.addHTML(client.get("HTMLGen").giftsub(e));
  });

  /* Anonymous user gifted a subscription */
  client.bind("twitch-anongiftsub", function _on_twitch_anongiftsub(e) {
    Util.StorageAppend("debug-msg-log", e);
    Content.addHTML(client.get("HTMLGen").anongiftsub(e));
  });

  /* Bind the rest of the events and warn about unbound events */
  client.bind("twitch-userstate", function () {});
  client.bind("twitch-roomstate", function () {});
  client.bind("twitch-globaluserstate", function () {});
  client.bind("twitch-usernotice", function () {});
  client.bind("twitch-ack", function () {});
  client.bind("twitch-ping", function () {});
  client.bind("twitch-names", function () {});
  client.bind("twitch-topic", function () {});
  client.bind("twitch-privmsg", function () {});
  client.bind("twitch-whisper", function () {});
  client.bind("twitch-hosttarget", function () {});
  client.bind("twitch-mode", function () {});
  client.bind("twitch-other", function () {});
  client.bindDefault(function _on_default(e) {
    Util.Warn("Unbound event:", e);
  });

  /* End of all the binding 0}}} */

  /* Finally, connect */
  client.Connect();
}