/* Twitch Filtered Chat Main Module */

"use strict";

/* TODO:
 * Add ?font to query string
 * Add clip information
 * Fade-out username context window when clicking the same name again
 * Hide get_config_object() within client_main()
 */

/* NOTES:
 * Filtering ws "recv>" messages:
 *   Util.Logger.add_filter(((m) => !`${m}`.startsWith('recv> ')), 'DEBUG');
 * Filtering ws PRIVMSG messages:
 *   Util.Logger.add_filter(((m) => `${m}`.indexOf(' PRIVMSG ') == -1, 'DEBUG');
 */

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var CACHED_VALUE = "Cached";
var AUTOGEN_VALUE = "Auto-Generated";

/* Functions to sanitize configuration */
function verify_string(val) {
  return typeof val == "string" ? val : "";
}
function verify_number(val) {
  return typeof val == "number" ? val : "";
}
function verify_boolean(val) {
  return typeof val == "boolean" ? val : "";
}
function verify_array(val) {
  return Util.IsArray(val) ? val : [];
}

/* Begin configuration section {{{0 */

/* Parse a query string into the config object given and return removals */
function parse_query_string(config) {
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
      } else if (k === "user" || k === "name") {
        key = "Name";
      } else if (k === "pass") {
        key = "Pass";
        query_remove.push(k);
      } else if (k === "channel" || k === "channels") {
        key = "Channels";
        val = v.split(',').map(function (c) {
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
            val = !!v ? 1 : 0;
          }
        }
        if (val < Util.LEVEL_MIN) val = Util.LEVEL_MIN;
        if (val > Util.LEVEL_MAX) val = Util.LEVEL_MAX;
      } else if (k === "noassets") {
        key = "NoAssets";
        val = !!v;
      } else if (k === "noffz") {
        key = "NoFFZ";
        val = !!v;
      } else if (k === "nobttv") {
        key = "NoBTTV";
        val = !!v;
      } else if (k === "hmax") {
        key = "HistorySize";
        val = typeof v === "number" ? v : TwitchClient.DEFAULT_HISTORY_SIZE;
      } else if (k.match(/^module[12]?$/)) {
        if (k === "module") k = "module1";
        key = k === "module" ? "module1" : k;
        val = parse_module_config(v);
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
        Util.CSS.SetProperty('--body-font-size', v + "pt");
      } else if (k == "plugins") {
        key = "Plugins";
        val = !!v;
      } else if (k == "disable") {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = ("" + v).split(',')[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
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

  if (!config.hasOwnProperty('Layout')) {
    config.Layout = ParseLayout("double:chat");
  }
  return query_remove;
}

/* Obtain configuration key */
function get_config_key() {
  var config_key = 'tfc-config';
  var qs = Util.ParseQueryString();
  if (qs.hasOwnProperty('config_key')) {
    config_key = config_key + '-' + qs.config_key.replace(/[^a-z]/g, '');
  }
  return config_key;
}

/* Obtain configuration */
function get_config_object() {
  /* 1) Obtain configuration values
   *  a) from localStorage
   *  b) from query string (overrides (a))
   *  c) from settings elements (overrides (b))
   * 2) Store module configuration in each modules' settings window
   * 3) Remove sensitive values from the query string, if present
   */
  var config_key = get_config_key();

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
  if (config.hasOwnProperty('NoAssets')) delete config["NoAssets"];
  if (config.hasOwnProperty('Debug')) delete config["Debug"];
  if (config.hasOwnProperty('AutoReconnect')) delete config["AutoReconnect"];
  if (config.hasOwnProperty('Layout')) delete config['Layout'];
  if (config.hasOwnProperty('Plugins')) delete config['Plugins'];

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
  query_remove = parse_query_string(config, qs);

  /* Parse div#settings config */
  var txtChannel = $('input#txtChannel')[0];
  var txtNick = $('input#txtNick')[0];
  var txtPass = $('input#txtPass')[0];
  if (txtChannel.value) {
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = txtChannel.value.split(',')[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
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

  /* Populate configs for each module */
  $('.module').each(function () {
    var id = $(this).attr('id');
    if (!config[id]) {
      config[id] = get_module_settings($(this));
    }
    config[id].Pleb = verify_boolean(config[id].Pleb);
    config[id].Sub = verify_boolean(config[id].Sub);
    config[id].VIP = verify_boolean(config[id].VIP);
    config[id].Mod = verify_boolean(config[id].Mod);
    config[id].Event = verify_boolean(config[id].Event);
    config[id].Bits = verify_boolean(config[id].Bits);
    config[id].IncludeKeyword = verify_array(config[id].IncludeKeyword);
    config[id].IncludeUser = verify_array(config[id].IncludeUser);
    config[id].ExcludeUser = verify_array(config[id].ExcludeUser);
    config[id].ExcludeStartsWith = verify_array(config[id].ExcludeStartsWith);
    config[id].FromChannel = verify_array(config[id].FromChannel);
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
  config.ClientID = [78, 26, 75, 72, 30, 29, 19, 79, 12, 24, 75, 77, 22, 17, 11, 23, 74, 79, 8, 21, 26, 13, 29, 5, 7, 23, 70, 18, 29, 12].map(function (n) {
    return Util.ASCII[n ^ 127];
  }).join("");

  return config;
}

/* Module configuration {{{1 */

/* Set the module's settings to the values given */
function set_module_settings(module, mod_config) {
  var config = mod_config;
  if (config.Name) {
    $(module).find('label.name').html(config.Name);
    $(module).find('input.name').val(config.Name);
  }
  if (config.Pleb) {
    $(module).find('input.pleb').attr('checked', 'checked');
  } else {
    $(module).find('input.pleb').removeAttr('checked');
  }
  if (config.Sub) {
    $(module).find('input.sub').attr('checked', 'checked');
  } else {
    $(module).find('input.sub').removeAttr('checked');
  }
  if (config.VIP) {
    $(module).find('input.vip').attr('checked', 'checked');
  } else {
    $(module).find('input.vip').removeAttr('checked');
  }
  if (config.Mod) {
    $(module).find('input.mod').attr('checked', 'checked');
  } else {
    $(module).find('input.mod').removeAttr('checked');
  }
  if (config.Event) {
    $(module).find('input.event').attr('checked', 'checked');
  } else {
    $(module).find('input.event').removeAttr('checked');
  }
  if (config.Bits) {
    $(module).find('input.bits').attr('checked', 'checked');
  } else {
    $(module).find('input.bits').removeAttr('checked');
  }
  function add_input(cls, label, values) {
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
            $cb.click(update_module_config);
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
  add_input("include_user", "From user: ", config.IncludeUser);
  add_input("include_keyword", "Contains: ", config.IncludeKeyword);
  add_input("exclude_user", "From user: ", config.ExcludeUser);
  add_input("exclude_startswith", "Starts with: ", config.ExcludeStartsWith);
  add_input("from_channel", "Channel:", config.FromChannel);
}

/* Update the local storage config with the current module settings */
function update_module_config() {
  var config = get_config_object();
  $(".module").each(function () {
    config[$(this).attr('id')] = get_module_settings($(this));
  });
  Util.SetWebStorage(config);
}

/* Obtain the settings from the module's settings html */
function get_module_settings(module) {
  module = $(module);
  var s = {
    Name: module.find('input.name').val(),
    Pleb: module.find('input.pleb').is(':checked'),
    Sub: module.find('input.sub').is(':checked'),
    VIP: module.find('input.vip').is(':checked'),
    Mod: module.find('input.mod').is(':checked'),
    Event: module.find('input.event').is(':checked'),
    Bits: module.find('input.bits').is(':checked'),
    IncludeUser: [],
    IncludeKeyword: [],
    ExcludeUser: [],
    ExcludeStartsWith: [],
    FromChannel: []
  };

  module.find('input.include_user:checked').each(function () {
    s.IncludeUser.push($(this).val());
  });
  module.find('input.include_keyword:checked').each(function () {
    s.IncludeKeyword.push($(this).val());
  });
  module.find('input.exclude_user:checked').each(function () {
    s.ExcludeUser.push($(this).val());
  });
  module.find('input.exclude_startswith:checked').each(function () {
    s.ExcludeStartsWith.push($(this).val());
  });
  module.find('input.from_channel:checked').each(function () {
    s.FromChannel.push($(this).val());
  });

  return s;
}

/* Parse the module configuration from a query string component */
function parse_module_config(value) {
  var Decode = function Decode(vals) {
    return vals.map(function (v) {
      return decodeURIComponent(v);
    });
  };
  var parts = Decode(value.split(/,/g));
  while (parts.length < 7) {
    parts.push("");
  }var config = {};
  config.Name = parts[0];
  config.Pleb = parts[1][0] == "1";
  config.Sub = parts[1][1] == "1";
  config.VIP = parts[1][2] == "1";
  config.Mod = parts[1][3] == "1";
  config.Event = parts[1][4] == "1";
  config.Bits = parts[1][5] == "1";
  config.IncludeKeyword = parts[2] ? Decode(parts[2].split(/,/g)) : [];
  config.IncludeUser = parts[3] ? Decode(parts[3].split(/,/g)) : [];
  config.ExcludeUser = parts[4] ? Decode(parts[4].split(/,/g)) : [];
  config.ExcludeStartsWith = parts[5] ? Decode(parts[5].split(/,/g)) : [];
  config.FromChannel = parts[6] ? Decode(parts[6].split(/,/g)) : [];
  return config;
}

/* Format the module configuration into a query string component */
function format_module_config(cfg) {
  var B = function B(b) {
    return !!b ? "1" : "0";
  };
  var Encode = function Encode(vals) {
    return vals.map(function (v) {
      return encodeURIComponent(v);
    });
  };
  var bits = [cfg.Pleb, cfg.Sub, cfg.VIP, cfg.Mod, cfg.Event, cfg.Bits];
  var values = [cfg.Name, bits.map(function (b) {
    return B(b);
  }).join(""), Encode(cfg.IncludeKeyword).join(","), Encode(cfg.IncludeUser).join(","), Encode(cfg.ExcludeUser).join(","), Encode(cfg.ExcludeStartsWith).join(","), Encode(cfg.FromChannel).join(",")];
  return Encode(values).join(",");
}

/* End module configuration 1}}} */

/* Join a channel and save it in the configuration */
function join_channel(client, channel) {
  client.JoinChannel(channel);
  var cfg = get_config_object();
  cfg.Channels = client.GetJoinedChannels();
  Util.SetWebStorage(cfg);
}

/* Leave a channel and save it in the configuration */
function leave_channel(client, channel) {
  client.LeaveChannel(channel);
  var cfg = get_config_object();
  cfg.Channels = client.GetJoinedChannels();
  Util.SetWebStorage(cfg);
}

/* End configuration section 0}}} */

/* Return true if the event should be displayed on the module given */
function check_filtered(module, event) {
  var rules = get_module_settings(module);
  var role = "pleb";
  if (event instanceof TwitchChatEvent) {
    if (event.issub) role = "sub";
    if (event.isvip) role = "vip";
    if (event.ismod) role = "mod";
    if (!rules.Pleb && role == "pleb") return false;
    if (!rules.Sub && role == "sub") return false;
    if (!rules.VIP && role == "vip") return false;
    if (!rules.Mod && role == "mod") return false;
    /* FIXME: rules.Event is unused */
    if (!rules.Bits && event.flags.bits) return false;
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = rules.IncludeUser[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var s = _step6.value;

        if (s.toLowerCase() == event.user.toLowerCase()) {
          return true;
        }
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

    var _iteratorNormalCompletion7 = true;
    var _didIteratorError7 = false;
    var _iteratorError7 = undefined;

    try {
      for (var _iterator7 = rules.IncludeKeyword[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
        var _s = _step7.value;

        if (event.message.toLowerCase().indexOf(_s.toLowerCase()) > -1) {
          return true;
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

    var _iteratorNormalCompletion8 = true;
    var _didIteratorError8 = false;
    var _iteratorError8 = undefined;

    try {
      for (var _iterator8 = rules.ExcludeUser[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
        var _s2 = _step8.value;

        if (_s2.toLowerCase() == event.user.toLowerCase()) {
          return false;
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

    var _iteratorNormalCompletion9 = true;
    var _didIteratorError9 = false;
    var _iteratorError9 = undefined;

    try {
      for (var _iterator9 = rules.ExcludeStartsWith[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
        var _s3 = _step9.value;

        if (event.message.startsWith(_s3)) {
          return false;
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

    if (rules.FromChannel.length > 0) {
      var _iteratorNormalCompletion10 = true;
      var _didIteratorError10 = false;
      var _iteratorError10 = undefined;

      try {
        for (var _iterator10 = rules.FromChannel[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
          var _s4 = _step10.value;

          var c = _s4.indexOf('#') == -1 ? '#' + _s4 : _s4;
          if (event.channel && event.channel.channel) {
            if (event.channel.channel.toLowerCase() != c.toLowerCase()) {
              return false;
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
  }
  return true;
}

/* Add direct HTML to all modules */
function add_html(content) {
  var line = "<div class=\"line line-wrapper\"></div>";
  var $Content = $(".module").find($(".content"));
  $Content.append($(line).append(content));
  $Content.scrollTop(Math.pow(2, 31) - 1);
}

/* Shortcut for adding a <div class="pre"> element */
function add_pre(content) {
  add_html($("<div class=\"pre\"></div>").html(content));
}

/* Shortcut for adding a <div class="info"> element */
function add_info(content) {
  var pre = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  var e = $("<div class=\"info\"></div>").html(content);
  if (pre) e.addClass("pre");
  add_html(e);
}

/* Shortcut for adding a <div class="notice"> element */
function add_notice(content) {
  var pre = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  var e = $("<div class=\"notice\"></div>").html(content);
  if (pre) e.addClass("pre");
  add_html(e);
}

/* Shortcut for adding a <div class="error"> element */
function add_error(content) {
  var pre = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  var e = $("<div class=\"error\"></div>").html(content);
  if (pre) e.addClass("pre");
  add_html(e);
}

/* Handle a chat command */
function handle_command(value, client) {
  var tokens = value.split(" ");
  var command = tokens.shift();
  var config = get_config_object();
  try {
    CHAT_COMMANDS;
  } catch (e) {
    window.CHAT_COMMANDS = {};
  }

  /* Clear empty tokens at the end (\r\n related) */
  while (tokens.length > 0 && tokens[tokens.length - 1].length == 0) {
    tokens.pop();
  }

  /* Shortcuts for usages/help messages */
  var arg = function arg(s) {
    return "<span class=\"arg\">" + s.escape() + "</span>";
  };
  var barg = function barg(s) {
    return "&lt;" + arg(s) + "&gt;";
  };
  var helpcmd = function helpcmd(k) {
    return "<span class=\"help helpcmd\">" + k + "</span>";
  };
  var helpmsg = function helpmsg(k) {
    return "<span class=\"help helpmsg\">" + k + "</span>";
  };
  var helpline = function helpline(k, v) {
    return "<div class=\"helpline\">" + helpcmd(k) + helpmsg(v) + "</div>";
  };
  var help = function help(s) {
    return "<div class=\"help\">" + s + "</div>";
  };
  var add_helpline = function add_helpline(k, v) {
    return add_pre(helpline(k, v));
  };
  var add_help = function add_help(s) {
    return add_pre(help(s));
  };

  /* Handle each of the commands */
  if (command == "//log" || command == "//logs") {
    var logs = Util.GetWebStorage("debug-msg-log") || [];
    add_help("Debug message log length: " + logs.length);
    if (tokens.length > 0) {
      if (tokens[0] == "show") {
        if (tokens.length > 1) {
          var idx = Number.parseInt(tokens[1]);
          add_help(idx + ": " + JSON.stringify(logs[idx]).escape());
        } else {
          var _iteratorNormalCompletion11 = true;
          var _didIteratorError11 = false;
          var _iteratorError11 = undefined;

          try {
            for (var _iterator11 = Object.entries(logs)[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
              var _ref3 = _step11.value;

              var _ref4 = _slicedToArray(_ref3, 2);

              var i = _ref4[0];
              var l = _ref4[1];

              add_help(i + ": " + JSON.stringify(l).escape());
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
      } else if (tokens[0] == "summary") {
        var lines = [];
        var line = [];
        var _iteratorNormalCompletion12 = true;
        var _didIteratorError12 = false;
        var _iteratorError12 = undefined;

        try {
          for (var _iterator12 = Object.entries(logs)[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
            var _ref5 = _step12.value;

            var _ref6 = _slicedToArray(_ref5, 2);

            var _i = _ref6[0];
            var _l = _ref6[1];

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

        if (line.length > 0) lines.push(line);
        var lidx = 0;
        var _iteratorNormalCompletion13 = true;
        var _didIteratorError13 = false;
        var _iteratorError13 = undefined;

        try {
          for (var _iterator13 = Object.entries(lines)[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
            var _ref7 = _step13.value;

            var _ref8 = _slicedToArray(_ref7, 2);

            var _i2 = _ref8[0];
            var _l2 = _ref8[1];

            add_help(lidx + "-" + (lidx + _l2.length) + ": " + JSON.stringify(_l2));
            lidx += _l2.length;
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
      } else if (tokens[0] == "shift") {
        logs.shift();
        add_help("New logs length: " + logs.length);
        Util.SetWebStorage(logs, "debug-msg-log");
      } else if (tokens[0] == "pop") {
        logs.pop();
        add_help("New logs length: " + logs.length);
        Util.SetWebStorage(logs, "debug-msg-log");
      } else {
        add_help("Unknown argument \"" + tokens[0] + "\"");
      }
    } else {
      add_help("Use //log summary to view a summary");
      add_help("Use //log show to view them all");
      add_help("Use //log show &lt;N&gt; to show item &lt;N&gt;");
      add_help("Use //log shift to remove one entry from the start");
      add_help("Use //log pop to remove one entry from the end");
    }
  } else if (command == '//clear') {
    $(".content").find(".line-wrapper").remove();
  } else if (command == "//config") {
    if (tokens.length > 0) {
      if (tokens[0] == "clientid") {
        add_helpline("ClientID", config.ClientID);
      } else if (tokens[0] == "pass") {
        add_helpline("Pass", config.Pass);
      } else if (tokens[0] == "purge") {
        Util.SetWebStorage({});
        add_notice("Purged storage \"" + Util.GetWebStorageKey() + "\"");
      } else if (tokens[0] == "url") {
        var url = location.protocol + '//' + location.hostname + location.pathname;
        if (tokens.length > 1) {
          if (tokens[1].startsWith('git')) {
            url = "https://kaedenn.github.io/twitch-filtered-chat/index.html";
          }
        }
        var qs = [];
        var qs_push = function qs_push(k, v) {
          return qs.push(k + "=" + encodeURIComponent(v));
        };
        if (config.Debug > 0) {
          qs_push('debug', config.Debug);
        }
        if (config.__clientid_override) {
          if (config.ClientID && config.ClientID.length == 30) {
            qs_push('clientid', config.ClientID);
          }
        }
        if (config.Channels.length > 0) {
          qs_push('channels', config.Channels.join(","));
        }
        if (tokens.indexOf("auth") > -1) {
          if (config.Name && config.Name.length > 0) {
            qs_push('user', config.Name);
          }
          if (config.Pass && config.Pass.length > 0) {
            qs_push('pass', config.Pass);
          }
        }
        if (config.NoAssets) {
          qs_push('noassets', config.NoAssets);
        }
        if (config.NoFFZ) {
          qs_push('noffz', config.NoFFZ);
        }
        if (config.NoBTTV) {
          qs_push('nobttv', config.NoBTTV);
        }
        if (config.HistorySize) {
          qs_push('hmax', config.HistorySize);
        }
        qs_push("module1", format_module_config(config.module1));
        qs_push("module2", format_module_config(config.module2));
        qs_push("layout", FormatLayout(config.Layout));
        if (config.Transparent) {
          qs_push("trans", "1");
        }
        if (config.AutoReconnect) {
          qs_push("reconnect", "1");
        }
        {
          var font_size = Util.CSS.GetProperty("--body-font-size");
          var font_size_default = Util.CSS.GetProperty("--body-font-size-default");
          if (font_size != font_size_default) {
            qs_push("size", font_size.replace(/[^0-9]/g, ''));
          }
        }
        if (config.Plugins) {
          qs_push("plugins", "1");
        }
        if (config.MaxMessages != TwitchClient.DEFAULT_MAX_MESSAGES) {
          qs_push("max", "" + config.MaxMessages);
        }
        if (tokens[tokens.length - 1] === "text") {
          url += "?" + qs.join("&");
        } else {
          url += "?base64=" + encodeURIComponent(btoa(qs.join("&")));
        }
        add_help(client.get('HTMLGen').url(url));
      } else if (config.hasOwnProperty(tokens[0])) {
        add_helpline(tokens[0], JSON.stringify(config[tokens[0]]));
      } else {
        add_error("Unknown config key &quot;" + tokens[0] + "&quot;", true);
      }
    } else {
      var wincfgs = [];
      var _iteratorNormalCompletion14 = true;
      var _didIteratorError14 = false;
      var _iteratorError14 = undefined;

      try {
        for (var _iterator14 = Object.entries(config)[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
          var _ref9 = _step14.value;

          var _ref10 = _slicedToArray(_ref9, 2);

          var k = _ref10[0];
          var v = _ref10[1];

          if ((typeof v === "undefined" ? "undefined" : _typeof(v)) == "object" && v.Name && v.Name.length > 1) {
            /* It's a window configuration */
            wincfgs.push([k, v]);
          } else if (k == "ClientID" || k == "Pass") {
            add_helpline(k, "Omitted for security; use //config " + k.toLowerCase() + " to show");
          } else {
            add_helpline(k, v);
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

      add_help("Window Configurations:");
      var _iteratorNormalCompletion15 = true;
      var _didIteratorError15 = false;
      var _iteratorError15 = undefined;

      try {
        for (var _iterator15 = wincfgs[Symbol.iterator](), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
          var _ref11 = _step15.value;

          var _ref12 = _slicedToArray(_ref11, 2);

          var _k = _ref12[0];
          var _v = _ref12[1];

          add_help("Module <span class=\"arg\">" + _k + "</span>: &quot;" + _v.Name + "&quot;:");
          var _iteratorNormalCompletion16 = true;
          var _didIteratorError16 = false;
          var _iteratorError16 = undefined;

          try {
            for (var _iterator16 = Object.entries(_v)[Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
              var _ref13 = _step16.value;

              var _ref14 = _slicedToArray(_ref13, 2);

              var cfgk = _ref14[0];
              var cfgv = _ref14[1];

              if (cfgk === "Name") continue;
              add_helpline(cfgk, "&quot;" + cfgv + "&quot;");
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
  } else if (command == "//join") {
    if (tokens.length > 0) {
      var ch = Twitch.FormatChannel(tokens[0]);
      if (!client.IsInChannel(ch)) {
        join_channel(client, ch);
      } else {
        add_pre("Already in channel " + ch);
      }
    } else {
      add_pre("Usage: //join " + barg('channel'));
    }
  } else if (command == "//part" || command == "//leave") {
    if (tokens.length > 0) {
      var _ch = Twitch.FormatChannel(tokens[0]);
      if (client.IsInChannel(_ch)) {
        leave_channel(client, _ch);
      } else {
        add_pre("Not in channel " + _ch);
      }
    } else {
      add_pre("Usage: //leave " + barg("channel"));
    }
  } else if (command == "//badges") {
    var all_badges = [];
    var _iteratorNormalCompletion17 = true;
    var _didIteratorError17 = false;
    var _iteratorError17 = undefined;

    try {
      for (var _iterator17 = Object.entries(client.GetGlobalBadges())[Symbol.iterator](), _step17; !(_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done); _iteratorNormalCompletion17 = true) {
        var _ref15 = _step17.value;

        var _ref16 = _slicedToArray(_ref15, 2);

        var bname = _ref16[0];
        var badge = _ref16[1];
        var _iteratorNormalCompletion18 = true;
        var _didIteratorError18 = false;
        var _iteratorError18 = undefined;

        try {
          for (var _iterator18 = Object.entries(badge.versions)[Symbol.iterator](), _step18; !(_iteratorNormalCompletion18 = (_step18 = _iterator18.next()).done); _iteratorNormalCompletion18 = true) {
            var _ref17 = _step18.value;

            var _ref18 = _slicedToArray(_ref17, 2);

            var bv = _ref18[0];
            var bdef = _ref18[1];

            var _url = bdef.image_url_2x;
            var size = 36;
            if (tokens.indexOf("small") > -1) {
              _url = bdef.image_url_1x;
              size = 18;
            } else if (tokens.indexOf("large") > -1) {
              _url = bdef.image_url_4x;
              size = 72;
            }
            var attr = "width=\"" + size + "\" height=\"" + size + "\" title=\"" + bname + "\"";
            all_badges.push("<img src=\"" + _url + "\" " + attr + " alt=\"" + bname + "\" />");
          }
        } catch (err) {
          _didIteratorError18 = true;
          _iteratorError18 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion18 && _iterator18.return) {
              _iterator18.return();
            }
          } finally {
            if (_didIteratorError18) {
              throw _iteratorError18;
            }
          }
        }
      }
    } catch (err) {
      _didIteratorError17 = true;
      _iteratorError17 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion17 && _iterator17.return) {
          _iterator17.return();
        }
      } finally {
        if (_didIteratorError17) {
          throw _iteratorError17;
        }
      }
    }

    add_notice(all_badges.join(''));
  } else if (command == "//help") {
    if (tokens.length > 0 && tokens[0].startsWith('//')) {
      tokens[0] = tokens[0].substr(2);
    }
    if (tokens.length == 0) {
      var _lines = [];
      _lines.push(["clear", "clears all chat windows"]);
      _lines.push(["config", "display configuration"]);
      _lines.push(["config purge", "purge active configuration"]);
      _lines.push(["config [" + arg('key') + "]", "display " + arg('key') + " value"]);
      _lines.push(["join " + barg('ch'), "join " + barg('ch')]);
      _lines.push(["part " + barg('ch'), "leave " + barg('ch')]);
      _lines.push(["leave " + barg('ch'), "leave " + barg('ch')]);
      _lines.push(["badges", "show the global badges"]);
      _lines.push(["help " + barg('command'), "help for " + barg('command')]);
      add_help("Commands:");
      var _iteratorNormalCompletion19 = true;
      var _didIteratorError19 = false;
      var _iteratorError19 = undefined;

      try {
        for (var _iterator19 = _lines[Symbol.iterator](), _step19; !(_iteratorNormalCompletion19 = (_step19 = _iterator19.next()).done); _iteratorNormalCompletion19 = true) {
          var _ref19 = _step19.value;

          var _ref20 = _slicedToArray(_ref19, 2);

          var c = _ref20[0];
          var m = _ref20[1];

          add_helpline("//" + c, m);
        }
      } catch (err) {
        _didIteratorError19 = true;
        _iteratorError19 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion19 && _iterator19.return) {
            _iterator19.return();
          }
        } finally {
          if (_didIteratorError19) {
            throw _iteratorError19;
          }
        }
      }

      try {
        var _iteratorNormalCompletion20 = true;
        var _didIteratorError20 = false;
        var _iteratorError20 = undefined;

        try {
          for (var _iterator20 = Object.entries(Plugins.plugins)[Symbol.iterator](), _step20; !(_iteratorNormalCompletion20 = (_step20 = _iterator20.next()).done); _iteratorNormalCompletion20 = true) {
            var _ref21 = _step20.value;

            var _ref22 = _slicedToArray(_ref21, 2);

            var n = _ref22[0];
            var p = _ref22[1];

            if (p._loaded && p.commands) {
              var _iteratorNormalCompletion21 = true;
              var _didIteratorError21 = false;
              var _iteratorError21 = undefined;

              try {
                for (var _iterator21 = p.commands[Symbol.iterator](), _step21; !(_iteratorNormalCompletion21 = (_step21 = _iterator21.next()).done); _iteratorNormalCompletion21 = true) {
                  var _c = _step21.value;

                  add_helpline(_c, "added by " + n);
                }
              } catch (err) {
                _didIteratorError21 = true;
                _iteratorError21 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion21 && _iterator21.return) {
                    _iterator21.return();
                  }
                } finally {
                  if (_didIteratorError21) {
                    throw _iteratorError21;
                  }
                }
              }
            }
          }
        } catch (err) {
          _didIteratorError20 = true;
          _iteratorError20 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion20 && _iterator20.return) {
              _iterator20.return();
            }
          } finally {
            if (_didIteratorError20) {
              throw _iteratorError20;
            }
          }
        }
      } catch (e) {
        if (e.name !== "ReferenceError") {
          throw e;
        }
      }
    } else if (tokens[0] == "clear") {
      add_help("//clear: Clears all chats");
    } else if (tokens[0] == "config") {
      add_help("//config: Display current configuration, excluding ClientID and OAuth");
      add_help("//config clientid: Display current ClientID");
      add_help("//config oauth: Display current OAuth token");
      add_help("//config purge: Purge the current key from localStorage");
      add_help("//config url: Generate a URL from the current configuration (CONTAINS AUTHID)");
      add_help("//config url git: As above, using https://kaedenn.github.io");
      add_help("//config url git text: Prevent base64 encoding URL");
      add_help("//config " + barg("key") + ": Display configuration item " + barg("key"));
    } else if (tokens[0] == "join") {
      add_help("//join " + barg("ch") + ": Join the specified channel");
    } else if (tokens[0] == "part" || tokens[0] == "leave") {
      add_help("//part " + barg("ch") + ": Disconnect from the specified channel");
      add_help("//leave " + barg("ch") + ": Disconnect from the specified channel");
    } else if (tokens[0] == "help") {
      add_help("//help: Displays a list of recognized commands and their usage");
      add_help("//help " + barg("command") + ": Displays help for a specific command");
    } else {
      add_help("//help: No such command \"" + tokens[0].escape() + "\"");
    }
  } else if (command === "//plugins") {
    try {
      var _iteratorNormalCompletion22 = true;
      var _didIteratorError22 = false;
      var _iteratorError22 = undefined;

      try {
        for (var _iterator22 = Object.entries(Plugins.plugins)[Symbol.iterator](), _step22; !(_iteratorNormalCompletion22 = (_step22 = _iterator22.next()).done); _iteratorNormalCompletion22 = true) {
          var _ref23 = _step22.value;

          var _ref24 = _slicedToArray(_ref23, 2);

          var _n = _ref24[0];
          var _p = _ref24[1];

          var msg = _n + ": " + _p.file + " @ " + _p.order;
          if (_p._error) {
            add_error(msg + ": Failed: " + JSON.stringify(_p._error_obj));
          } else if (_p._loaded) {
            msg = msg + ": Loaded";
            if (_p.commands) {
              msg = msg + ": Commands: " + _p.commands.join(" ");
            }
            add_pre(msg);
          }
        }
      } catch (err) {
        _didIteratorError22 = true;
        _iteratorError22 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion22 && _iterator22.return) {
            _iterator22.return();
          }
        } finally {
          if (_didIteratorError22) {
            throw _iteratorError22;
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
  } else if (CHAT_COMMANDS.hasOwnProperty(command)) {
    var _iteratorNormalCompletion23 = true;
    var _didIteratorError23 = false;
    var _iteratorError23 = undefined;

    try {
      for (var _iterator23 = CHAT_COMMANDS[command][Symbol.iterator](), _step23; !(_iteratorNormalCompletion23 = (_step23 = _iterator23.next()).done); _iteratorNormalCompletion23 = true) {
        var cmd = _step23.value;

        cmd({ line: value, command: command, tokens: tokens });
      }
    } catch (err) {
      _didIteratorError23 = true;
      _iteratorError23 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion23 && _iterator23.return) {
          _iterator23.return();
        }
      } finally {
        if (_didIteratorError23) {
          throw _iteratorError23;
        }
      }
    }
  } else if (command.startsWith('//')) {
    add_error("Unknown command \"" + command.escape() + "\"", true);
  } else {
    return false;
  }
  return true;
}

/* Populate and show the username context window */
function show_context_window(client, cw, line) {
  var $cw = $(cw);
  var $l = $(line);
  $(cw).html(""); /* Clear everything from the last time */

  /* Attributes of the host line */
  var id = $l.attr("data-id");
  var user = $l.attr("data-user");
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
  $cw.attr("data-userid", userid);
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
  var Link = function Link(id, text) {
    return client.get('HTMLGen').url(null, text, "cw-link", id);
  };
  var Em = function Em(t) {
    return "<span class=\"em\">" + t + "</span>";
  };
  var $EmItem = function $EmItem(s) {
    return $(Em(s)).css('margin-left', '0.5em');
  };

  /* Add general user information */
  var $username = $l.find('.username');
  var color = "color: " + $username.css("color");
  var classes = $username.attr("class");
  $cw.append($Line("<span class=\"" + classes + "\" style=\"" + color + "\">" + user + "</span> in " + Em(channel)));

  /* Add link to timeout user */
  if (client.IsMod(channel)) {
    var $tl = $("<div class=\"cw-timeout\">Timeout:</div>");
    var _iteratorNormalCompletion24 = true;
    var _didIteratorError24 = false;
    var _iteratorError24 = undefined;

    try {
      for (var _iterator24 = "1s 10s 60s 10m 30m 1h 12h 24h".split(" ")[Symbol.iterator](), _step24; !(_iteratorNormalCompletion24 = (_step24 = _iterator24.next()).done); _iteratorNormalCompletion24 = true) {
        var dur = _step24.value;

        var $ta = $(Link("cw-timeout-" + user + "-" + dur, dur));
        $ta.addClass("cw-timeout-dur");
        $ta.attr("data-channel", channel);
        $ta.attr("data-user", user);
        $ta.attr("data-duration", dur);
        $ta.click(function () {
          var ch = $(this).attr('data-channel');
          var u = $(this).attr('data-user');
          var dur = $(this).attr('data-duration');
          client.Timeout(ch, u, dur);
          Util.Log('Timed out user', u, 'from', ch, 'for', dur);
          $(cw).fadeOut();
        });
        $tl.append($ta);
      }
    } catch (err) {
      _didIteratorError24 = true;
      _iteratorError24 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion24 && _iterator24.return) {
          _iterator24.return();
        }
      } finally {
        if (_didIteratorError24) {
          throw _iteratorError24;
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
      $("#txtChat").val("/ban " + $(this).attr('data-user'));
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
      $roles.append($EmItem('Mod'));$roles.append(",");
    }
    if (vip) {
      $roles.append($EmItem('VIP'));$roles.append(",");
    }
    if (sub) {
      $roles.append($EmItem('Sub'));$roles.append(",");
    }
    if (caster) {
      $roles.append($EmItem('Host'));$roles.append(",");
    }
    /* Remove the last comma */
    $roles[0].removeChild($roles[0].lastChild);
    $cw.append($roles);
    if (client.IsCaster(channel) && !client.IsUIDSelf(user_id)) {
      if (mod) {
        $cw.append($Line(Link('cw-unmod', 'Remove Mod')));
      }
      if (vip) {
        $cw.append($Line(Link('cw-unvip', 'Remove VIP')));
      }
    }
  }

  /* Add the ability to add roles (for the caster) */
  if (client.IsCaster(channel) && !client.IsUIDSelf(user_id)) {
    if (!mod) {
      $cw.append($Line(Link('cw-make-mod', 'Make Mod')));
    }
    if (!vip) {
      $cw.append($Line(Link('cw-make-vip', 'Make VIP')));
    }
  }

  var l_off = $l.offset();
  var offset = { top: l_off.top + $l.outerHeight() + 2, left: l_off.left };
  $cw.fadeIn().offset(offset);
};

/* Set or unset transparency */
function update_transparency(transparent) {
  var ss = Util.CSS.GetSheet("main.css");
  if (!ss) {
    Util.Error("Can't find main.css object");return;
  }
  var rule = Util.CSS.GetRule(ss, ":root");
  if (!rule) {
    Util.Error("Can't find main.css :root rule");return;
  }
  var props = [];
  /* Find the prop="--<name>-color" rules */
  var _iteratorNormalCompletion25 = true;
  var _didIteratorError25 = false;
  var _iteratorError25 = undefined;

  try {
    for (var _iterator25 = Util.CSS.GetPropertyNames(rule)[Symbol.iterator](), _step25; !(_iteratorNormalCompletion25 = (_step25 = _iterator25.next()).done); _iteratorNormalCompletion25 = true) {
      var prop = _step25.value;

      if (prop.match(/^--[a-z-]+-color$/)) {
        props.push(prop);
      }
    }
  } catch (err) {
    _didIteratorError25 = true;
    _iteratorError25 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion25 && _iterator25.return) {
        _iterator25.return();
      }
    } finally {
      if (_didIteratorError25) {
        throw _iteratorError25;
      }
    }
  }

  var _iteratorNormalCompletion26 = true;
  var _didIteratorError26 = false;
  var _iteratorError26 = undefined;

  try {
    for (var _iterator26 = props[Symbol.iterator](), _step26; !(_iteratorNormalCompletion26 = (_step26 = _iterator26.next()).done); _iteratorNormalCompletion26 = true) {
      var _prop = _step26.value;

      if (transparent) {
        /* Set them all to transparent */
        Util.CSS.SetProperty(_prop, 'transparent');
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
    _didIteratorError26 = true;
    _iteratorError26 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion26 && _iterator26.return) {
        _iterator26.return();
      }
    } finally {
      if (_didIteratorError26) {
        throw _iteratorError26;
      }
    }
  }
}

/* Called once when the document loads */
function client_main(layout) {
  /* Hook Logger messages */
  Util.Logger.add_hook(function (sev, with_stack) {
    for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }

    var msg = JSON.stringify(args.length == 1 ? args[0] : args);
    if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
      add_error("ERROR: " + msg.escape());
    }
  }, "ERROR");
  Util.Logger.add_hook(function (sev, with_stack) {
    for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
      args[_key2 - 2] = arguments[_key2];
    }

    var msg = JSON.stringify(args.length == 1 ? args[0] : args);
    if (args.length == 1 && args[0] instanceof TwitchEvent) {
      if (Util.DebugLevel >= Util.LEVEL_TRACE) {
        add_notice("WARNING: " + args[0].repr());
      }
    } else if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
      add_notice("WARNING: " + msg.escape());
    }
  }, "WARN");
  Util.Logger.add_hook(function (sev, with_stack) {
    for (var _len3 = arguments.length, args = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
      args[_key3 - 2] = arguments[_key3];
    }

    var msg = JSON.stringify(args.length == 1 ? args[0] : args);
    if (Util.DebugLevel >= Util.LEVEL_TRACE) {
      add_html("DEBUG: " + msg.escape());
    }
  }, "DEBUG");
  Util.Logger.add_hook(function (sev, with_stack) {
    for (var _len4 = arguments.length, args = Array(_len4 > 2 ? _len4 - 2 : 0), _key4 = 2; _key4 < _len4; _key4++) {
      args[_key4 - 2] = arguments[_key4];
    }

    var msg = JSON.stringify(args.length == 1 ? args[0] : args);
    if (Util.DebugLevel >= Util.LEVEL_TRACE) {
      add_html("TRACE: " + msg.escape());
    }
  }, "TRACE");

  /*
  let config_obj = new ConfigStore(
    get_config_key(),
    ["NoAssets", "NoFFZ", "NoBTTV", "Transparent", "Layout",
     "AutoReconnect", "Debug"]);
  $(".module").each(function() {
    let id = $(this).attr("id");
    let cfg = config_obj.getValue(id);
    if (cfg) {
      set_module_settings(this, cfg);
    }
  });
  */
  /* Obtain the config and construct the client */
  var client = void 0;
  var ConfigCommon = {};
  (function () {
    var config = get_config_object();
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
        Util.CSS.SetProperty('--chat-border', '#cd143c');
      }
    }

    /* Simulate clicking cbTransparent if config.Transparent is set */
    if (config.Transparent) {
      update_transparency(true);
    }

    /* After all that, sync the final settings up with the html */
    $(".module").each(function () {
      set_module_settings(this, config[$(this).attr('id')]);
    });

    /* Set values we'll want to use later */
    ConfigCommon.Plugins = !!config.Plugins;
    ConfigCommon.Layout = config.Layout;
    ConfigCommon.Transparent = config.Transparent;
    ConfigCommon.MaxMessages = config.MaxMessages || 100;

    /* If no channels are configured, show the settings panel */
    if (config.Channels.length == 0) {
      $("#settings").fadeIn();
    }
  })();

  /* Construct the HTML Generator and tell it and the client about each other */
  client.set('HTMLGen', new HTMLGenerator(client, ConfigCommon));

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

  /* Sending a chat message */
  $("#txtChat").keydown(function (e) {
    var isUp = e.keyCode === KeyEvent.DOM_VK_UP;
    var isDown = e.keyCode === KeyEvent.DOM_VK_DOWN;
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      /* Prevent sending empty messages by mistake */
      if (e.target.value.trim().length > 0) {
        if (!handle_command(e.target.value, client)) {
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
        /* Going up */
        i = i + 1 >= l - 1 ? l - 1 : i + 1;
      } else if (isDown) {
        /* Going down */
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
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      update_module_config();
      $("#settings_button").click();
    }
  });

  /* Clicking the settings button */
  $("#settings_button").click(function () {
    if ($("#settings").is(':visible')) {
      $('#settings').fadeOut();
    } else {
      var config = get_config_object();
      $("#txtChannel").val(config.Channels.join(","));
      $("#txtNick").attr("disabled", "disabled").val(!!config.Name ? config.Name : AUTOGEN_VALUE);
      if (config.Pass && config.Pass.length > 0) {
        $("#txtPass").attr("disabled", "disabled").hide();
        $("#txtPassDummy").show();
      }
      $("#selDebug").val("" + config.Debug);
      $('#settings').fadeIn();
    }
  });

  /* Clicking on a "Clear" link */
  $(".clear-chat-link").click(function () {
    var id = $(this).parent().parent().parent().attr("id");
    $("#" + id + " .content").find(".line-wrapper").remove();
  });

  /* Pressing enter on the "Channels" text box */
  $("#txtChannel").keyup(function (e) {
    var fmt_ch = function fmt_ch(ch) {
      return Twitch.FormatChannel(Twitch.ParseChannel(ch));
    };
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      var new_chs = $(this).val().split(",").map(fmt_ch);
      var old_chs = client.GetJoinedChannels().map(fmt_ch);
      var to_join = new_chs.filter(function (c) {
        return old_chs.indexOf(c) == -1;
      });
      var to_part = old_chs.filter(function (c) {
        return new_chs.indexOf(c) == -1;
      });
      /* Join all the channels added */
      var _iteratorNormalCompletion27 = true;
      var _didIteratorError27 = false;
      var _iteratorError27 = undefined;

      try {
        for (var _iterator27 = to_join[Symbol.iterator](), _step27; !(_iteratorNormalCompletion27 = (_step27 = _iterator27.next()).done); _iteratorNormalCompletion27 = true) {
          var ch = _step27.value;

          join_channel(client, ch);
          add_notice("Joining " + ch);
        }
        /* Leave all the channels removed */
      } catch (err) {
        _didIteratorError27 = true;
        _iteratorError27 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion27 && _iterator27.return) {
            _iterator27.return();
          }
        } finally {
          if (_didIteratorError27) {
            throw _iteratorError27;
          }
        }
      }

      var _iteratorNormalCompletion28 = true;
      var _didIteratorError28 = false;
      var _iteratorError28 = undefined;

      try {
        for (var _iterator28 = to_part[Symbol.iterator](), _step28; !(_iteratorNormalCompletion28 = (_step28 = _iterator28.next()).done); _iteratorNormalCompletion28 = true) {
          var _ch2 = _step28.value;

          leave_channel(client, _ch2);
          client.LeaveChannel(_ch2);
          add_notice("Leaving " + _ch2);
        }
        /* Save the new configuration */
      } catch (err) {
        _didIteratorError28 = true;
        _iteratorError28 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion28 && _iterator28.return) {
            _iterator28.return();
          }
        } finally {
          if (_didIteratorError28) {
            throw _iteratorError28;
          }
        }
      }

      var current_cfg = get_config_object();
      current_cfg.Channels = client.GetJoinedChannels().map(fmt_ch);
      Util.SetWebStorage(current_cfg);
    }
  });

  /* Changing the "stream is transparent" checkbox */
  $("#cbTransparent").change(function () {
    return update_transparency($(this).is(":checked"));
  });

  /* Changing the value for "background image" */
  $("#txtBGImage").keyup(function (e) {
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      $(".module").css("background-image", $(this).val());
    }
  });

  /* Changing the debug level */
  $("#selDebug").change(function () {
    var v = parseInt($(this).val());
    var old = client.GetDebug();
    Util.Log("Changing debug level from " + Util.DebugLevel + " (" + old + ") to " + v);
    client.SetDebug(v);
  });

  /* Reconnect */
  $("#reconnect").click(function () {
    client.Connect();
  });

  /* Opening one of the module menus */
  $(".menu").click(function () {
    var $settings = $(this).parent().children(".settings");
    var $lbl = $(this).parent().children('label.name');
    var $tb = $(this).parent().children('input.name');
    if ($settings.is(":visible")) {
      /* Update module configurations on close */
      update_module_config();
      $tb.hide();
      $lbl.html($tb.val()).show();
    } else {
      $lbl.hide();
      $tb.val($lbl.html()).show();
    }
    $settings.fadeToggle();
  });

  /* Pressing enter on the module's name text box */
  $('.module .header input.name').on('keyup', function (e) {
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      var $settings = $(this).parent().children(".settings");
      var $lbl = $(this).parent().children('label.name');
      var $tb = $(this).parent().children('input.name');
      update_module_config();
      $tb.hide();
      $lbl.html($tb.val()).show();
      $settings.fadeToggle();
    }
  });

  /* Pressing enter on one of the module menu text boxes */
  $('.module .settings input[type="text"]').on('keyup', function (e) {
    var v = $(this).val();
    if (v.length > 0) {
      if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
        var $cli = $(this).closest('li');
        var cls = $cli.attr('class').replace('textbox', '').trim();
        var cb = client.get('HTMLGen').checkbox(v, null, cls, true);
        var val = $cli.find('label').html();
        var $li = $("<li><label>" + cb + val + " " + v + "</label></li>");
        $cli.before($li);
        $(this).val('');
        update_module_config();
      }
    }
  });

  /* Clicking anywhere else on the document: reconnect, username context window */
  $(document).click(function (e) {
    var $t = $(e.target);
    var $cw = $("#username_context");
    var $m1s = $("#module1 .settings");
    var $m2s = $("#module2 .settings");
    /* Clicking off of module1 settings: hide it */
    if ($m1s.length > 0 && $m1s.is(":visible")) {
      if (!Util.PointIsOn(e.clientX, e.clientY, $m1s[0]) && !Util.PointIsOn(e.clientX, e.clientY, $("#module1 .header")[0])) {
        update_module_config();
        var $tb = $m1s.siblings("input.name").hide();
        $m1s.siblings("label.name").html($tb.val()).show();
        $m1s.fadeOut();
      }
    }
    /* Clicking off of module2 settings: hide it */
    if ($m2s.length > 0 && $m2s.is(":visible")) {
      if (!Util.PointIsOn(e.clientX, e.clientY, $m2s[0]) && !Util.PointIsOn(e.clientX, e.clientY, $("#module2 .header")[0])) {
        update_module_config();
        var _$tb = $m2s.siblings("input.name").hide();
        $m2s.siblings("label.name").html(_$tb.val()).show();
        $m2s.fadeOut();
      }
    }
    /* Clicking on the username context window */
    if (Util.PointIsOn(e.clientX, e.clientY, $cw[0])) {
      var ch = $cw.attr("data-channel");
      var user = $cw.attr("data-user");
      var userid = $cw.attr("data-userid");
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
    } else if ($t.attr('data-username') == '1') {
      /* Clicked on a username; show context window */
      /* TODO: if username == cw username and window open, hide window */
      show_context_window(client, $cw, $t.parent());
    } else if ($cw.is(":visible")) {
      /* Clicked somewhere else: close context window */
      $cw.fadeOut();
    }
    /* Clicking on a "Reconnect" link */
    if ($t.attr("data-reconnect") == '1') {
      /* Clicked on a reconnect link */
      add_notice("Reconnecting...");
      client.Connect();
    }
  });

  /* Bind to numerous TwitchEvent events {{{0 */

  /* WebSocket opened */
  client.bind('twitch-open', function _on_twitch_open(e) {
    $(".loading").remove();
    $("#debug").hide();
    if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
      var notes = [];
      if (client.IsAuthed()) {
        notes.push("(authenticated)");
      } else {
        notes.push("(unauthenticated)");
      }
      add_info("Connected " + notes.join(" "));
    }
    if (get_config_object().Channels.length == 0) {
      add_info("No channels configured; type //join &lt;channel&gt; to join one!");
    }
  });

  /* WebSocket closed */
  client.bind('twitch-close', function _on_twitch_close(e) {
    var code = e.raw_line.code;
    var reason = e.raw_line.reason;
    var msg = "Connection closed";
    if (reason) {
      msg = msg + " (code " + code + ": " + reason + ")";
    } else {
      msg = msg + " (code " + code + ")";
    }
    if (get_config_object().AutoReconnect) {
      add_error(msg);
      client.Connect();
    } else {
      add_error(msg + "<span class=\"reconnect\" data-reconnect=\"1\">Reconnect</span>");
    }
  });

  /* User joined (any user) */
  client.bind('twitch-join', function _on_twitch_join(e) {
    if (!Util.Browser.IsOBS && !layout.Slim) {
      if (e.user == client.GetName().toLowerCase()) {
        add_info("Joined " + e.channel.channel);
      }
    }
  });

  /* User left (any user) */
  client.bind('twitch-part', function _on_twitch_part(e) {
    if (!Util.Browser.IsOBS && !layout.Slim) {
      if (e.user == client.GetName().toLowerCase()) {
        add_info("Left " + e.channel.channel);
      }
    }
  });

  /* Notice (or warning) from Twitch */
  client.bind('twitch-notice', function _on_twitch_notice(e) {
    /* Some notices are benign */
    switch (e.usernotice_msgid) {
      case "host_on":
        break;
      case "host_target_went_offline":
        break;
      case "cmds_available":
        add_info("Use //help to see Twitch Filtered Chat commands");
        break;
      default:
        Util.Warn(e);
    }
    var channel = Twitch.FormatChannel(e.channel);
    var message = e.message.escape();
    add_notice("Notice from " + channel + ": " + message);
  });

  /* Error from Twitch or Twitch Client API */
  client.bind('twitch-error', function _on_twitch_error(e) {
    Util.Error(e);
    var user = e.user;
    var command = e.values.command;
    var message = e.message.escape();
    add_error("Error for " + user + ": " + command + ": " + message);
  });

  /* Message received from Twitch */
  client.bind('twitch-message', function _on_twitch_message(e) {
    if (Util.DebugLevel >= Util.LEVEL_TRACE) {
      add_html("<span class=\"pre\">" + e.repr() + "</span>");
    }
    /* Avoid flooding the DOM with stale chat messages */
    var max = client.get('HTMLGen').getValue("MaxMessages") || 100;
    var _iteratorNormalCompletion29 = true;
    var _didIteratorError29 = false;
    var _iteratorError29 = undefined;

    try {
      for (var _iterator29 = $(".content")[Symbol.iterator](), _step29; !(_iteratorNormalCompletion29 = (_step29 = _iterator29.next()).done); _iteratorNormalCompletion29 = true) {
        var c = _step29.value;

        while ($(c).find(".line-wrapper").length > max) {
          $(c).find(".line-wrapper").first().remove();
        }
      }
    } catch (err) {
      _didIteratorError29 = true;
      _iteratorError29 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion29 && _iterator29.return) {
          _iterator29.return();
        }
      } finally {
        if (_didIteratorError29) {
          throw _iteratorError29;
        }
      }
    }
  });

  /* Received streamer info */
  client.bind('twitch-streaminfo', function _on_twitch_streaminfo(e) {
    var cinfo = client.GetChannelInfo(e.channel.channel);
    if (!cinfo.online) {
      if (ConfigCommon.Layout && !ConfigCommon.Layout.Slim) {
        add_notice(e.channel.channel + " is not currently streaming");
      }
    }
  });

  /* Received chat message */
  client.bind('twitch-chat', function _on_twitch_chat(event) {
    if (event instanceof TwitchChatEvent) {
      var m = verify_string(event.message);
      if (event.flags && event.flags.mod && m.indexOf(' ') > -1) {
        var user = event.user.escape();
        var tokens = m.split(' ');
        if (tokens[0] === '!tfc') {
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
      if (!check_filtered($(this), event)) {
        /* Filtered out */
        return;
      }
      var $w = $("<div class=\"line line-wrapper\"></div>");
      $w.html(client.get('HTMLGen').gen(event));
      var $c = $(this).find('.content');
      $c.append($w);
      $c.scrollTop(Math.pow(2, 31) - 1);
    });
  });

  /* Received CLEARCHAT event */
  client.bind('twitch-clearchat', function _on_twitch_clearchat(e) {
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
  client.bind('twitch-clearmsg', function _on_twitch_clearmsg(e) {
    Util.StorageAppend("debug-msg-log", e);
    Util.Warn("Unhandled CLEARMSG:", e);
  });

  /* User subscribed */
  client.bind('twitch-sub', function _on_twitch_sub(e) {
    Util.StorageAppend("debug-msg-log", e);
    add_html(client.get('HTMLGen').sub(e));
  });

  /* User resubscribed */
  client.bind('twitch-resub', function _on_twitch_resub(e) {
    Util.StorageAppend("debug-msg-log", e);
    add_html(client.get('HTMLGen').resub(e));
  });

  /* User gifted a subscription */
  client.bind('twitch-giftsub', function _on_twitch_giftsub(e) {
    Util.StorageAppend("debug-msg-log", e);
    add_html(client.get('HTMLGen').giftsub(e));
  });

  /* Anonymous user gifted a subscription */
  client.bind('twitch-anongiftsub', function _on_twitch_anongiftsub(e) {
    Util.StorageAppend("debug-msg-log", e);
    add_html(client.get('HTMLGen').anongiftsub(e));
  });

  /* End of all the binding 0}}} */

  /* Finally, connect */
  client.Connect();
}