/* Twitch Filtered Chat Main Module */

"use strict";

/* TODO:
 * Implement "light" and "dark" colorschemes
 * Fade-out username context window when clicking the same name again
 * Implement TwitchSubEvent
 *   (Verify HTMLGen.sub and HTMLGen.anonsubgift)
 * Hide get_config_object() within client_main()
 */

/* NOTES:
 * Filtering ws "recv>" messages:
 *   Util.Logger.add_filter(((m) => !`${m}`.startsWith('recv> ')), 'DEBUG');
 * Filtering ws PRIVMSG messages:
 *   Util.Logger.add_filter(((m) => `${m}`.indexOf(' PRIVMSG ') == -1, 'DEBUG');
 */

const CACHED_VALUE = "Cached";
const AUTOGEN_VALUE = "Auto-Generated";

/* Functions to sanitize configuration */
function verify_string(val) { return (typeof(val) == "string" ? val : ""); }
function verify_number(val) { return (typeof(val) == "number" ? val : ""); }
function verify_boolean(val) { return (typeof(val) == "boolean" ? val : ""); }
function verify_array(val) { return Util.IsArray(val) ? val : []; }

/* Begin configuration section {{{0 */

/* Parse a query string into the config object given and return removals */
function parse_query_string(config, qs=null) {
  let qs_data;
  if (qs === null) {
    qs = window.location.search;
    qs_data = Util.ParseQueryString(qs);
  } else if (typeof(qs) === "string") {
    qs_data = Util.ParseQueryString(qs);
  } else if (typeof(qs) === "object") {
    qs_data = qs;
  }

  if (qs_data.debug === undefined) qs_data.debug = false;
  if (qs_data.channels !== undefined) {
    if (typeof(qs_data.channels) != "string") {
      qs_data.channels = "";
    }
  }

  let query_remove = [];
  for (let [k, v] of Object.entries(qs_data)) {
    let key = k; /* config key */
    let val = v; /* config val */
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
      val = v.split(',').map((c) => Twitch.FormatChannel(c));
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
      val = typeof(v) === "number" ? v : TwitchClient.DEFAULT_HISTORY_SIZE;
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
      Util.CSS.SetProperty('--body-font-size', `${v}pt`);
    } else if (k == "plugins") {
      key = "Plugins";
      val = !!v;
    } else if (k == "disable") {
      for (let e of `${v}`.split(',')) {
        if (CSSCheerStyles[e]) {
          CSSCheerStyles[e]._disabled = true;
        }
      }
    } else if (k == "max") {
      key = "MaxMessages";
      val = typeof(v) === "number" ? v : TwitchClient.DEFAULT_MAX_MESSAGES;
    }
    config[key] = val;
  }
  if (!config.hasOwnProperty('Layout')) {
    config.Layout = ParseLayout("double:chat");
  }
  return query_remove;
}

/* Obtain configuration key */
function get_config_key() {
  let config_key = 'tfc-config';
  let qs = Util.ParseQueryString();
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
  let config_key = get_config_key();

  /* Query String object, parsed */
  let qs = Util.ParseQueryString();
  Util.SetWebStorageKey(config_key);
  if (config_key !== "tfc-config") {
    Util.Log(`Using custom config key "${Util.GetWebStorageKey()}"`);
  }
  /* Items to remove from the query string */
  let query_remove = [];

  /* Parse localStorage config */
  let config = Util.GetWebStorage();
  if (!config) config = {};

  /* Ensure certain keys are present and have expected values */
  if (!config.hasOwnProperty("Channels") || !Util.IsArray(config.Channels)) {
    config.Channels = [];
  }
  if (typeof(config.Name) != "string") config.Name = "";
  if (typeof(config.ClientID) != "string") config.ClientID = "";
  if (typeof(config.Pass) != "string") config.Pass = "";

  /* Persist the config key */
  config.key = Util.GetWebStorageKey();

  /* Certain unwanted items may be preserved in localStorage */
  if (config.hasOwnProperty('NoAssets')) delete config["NoAssets"];
  if (config.hasOwnProperty('Debug')) delete config["Debug"];
  if (config.hasOwnProperty('AutoReconnect')) delete config["AutoReconnect"];
  if (config.hasOwnProperty('Layout')) delete config['Layout'];
  if (!config.hasOwnProperty("MaxMessages")) {
    config.MaxMessages = TwitchClient.DEFAULT_MAX_MESSAGES;
  }

  /* Parse the query string */
  query_remove = parse_query_string(config, qs);

  /* Parse div#settings config */
  let txtChannel = $('input#txtChannel')[0];
  let txtNick = $('input#txtNick')[0];
  let txtClientID = $('input#txtClientID')[0];
  let txtPass = $('input#txtPass')[0];
  if (txtChannel.value) {
    for (let ch of txtChannel.value.split(',')) {
      let channel = Twitch.FormatChannel(ch.toLowerCase());
      if (config.Channels.indexOf(channel) == -1) {
        config.Channels.push(channel);
      }
    }
  }
  if (txtNick.value && txtNick.value != AUTOGEN_VALUE) {
    config.Name = txtNick.value;
  }
  if (txtClientID.value && txtClientID.value != CACHED_VALUE) {
    config.ClientID = txtClientID.value;
  }
  if (txtPass.value && txtPass.value != CACHED_VALUE) {
    config.Pass = txtPass.value;
  }

  /* Populate configs for each module */
  $('.module').each(function() {
    let id = $(this).attr('id');
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
    let old_qs = window.location.search;
    let old_query = Util.ParseQueryString(old_qs.substr(1));
    let is_base64 = false;
    if (old_query.base64 && old_query.base64.length > 0) {
      is_base64 = true;
      old_query = Util.ParseQueryString(atob(old_query.base64));
    }
    for (let e of query_remove) {
      delete old_query[e];
    }
    let new_qs = Util.FormatQueryString(old_query);
    if (is_base64) {
      new_qs = "?base64=" + encodeURIComponent(btoa(new_qs));
    }
    window.location.search = new_qs;
  }

  /* Default ClientID */
  config.ClientID = [
    78,26,75,72,30,29,19,79,12,24,75,77,22,17,11,
    23,74,79, 8,21,26,13,29, 5, 7,23,70,18,29,12
  ].map((n) => Util.ASCII[n^127]).join("");

  return config;
}

/* Module configuration {{{1 */

/* Set the module's settings to the values given */
function set_module_settings(module, mod_config) {
  let config = mod_config;
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
      for (let val of values) {
        let $li = $(`<li></li>`);
        let isel = `input.${cls}[value="${val}"]`;
        if ($(module).find(isel).length == 0) {
          let $l = $(`<label></label>`).val(label);
          let $cb = $(`<input type="checkbox" value=${val.escape()} checked />`);
          $cb.addClass(cls);
          $cb.click(update_module_config);
          $l.append($cb);
          $l.html($l.html() + label + val.escape());
          $li.append($l);
          $(module).find(`li.${cls}`).before($li);
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
  let config = get_config_object();
  $(".module").each(function() {
    config[$(this).attr('id')] = get_module_settings($(this));
  });
  Util.SetWebStorage(config);
}

/* Obtain the settings from the module's settings html */
function get_module_settings(module) {
  module = $(module);
  let s = {
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

  module.find('input.include_user:checked').each(function() {
    s.IncludeUser.push($(this).val());
  });
  module.find('input.include_keyword:checked').each(function() {
    s.IncludeKeyword.push($(this).val());
  });
  module.find('input.exclude_user:checked').each(function() {
    s.ExcludeUser.push($(this).val());
  });
  module.find('input.exclude_startswith:checked').each(function() {
    s.ExcludeStartsWith.push($(this).val());
  });
  module.find('input.from_channel:checked').each(function() {
    s.FromChannel.push($(this).val());
  });

  return s;
}

/* Parse the module configuration from a query string component */
function parse_module_config(value) {
  let Decode = (vals) => vals.map((v) => decodeURIComponent(v));
  let parts = Decode(value.split(/,/g));
  while (parts.length < 7) parts.push("");
  let config = {};
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
  let B = (b) => !!b ? "1" : "0";
  let Encode = (vals) => vals.map((v) => encodeURIComponent(v));
  let bits = [cfg.Pleb, cfg.Sub, cfg.VIP, cfg.Mod, cfg.Event, cfg.Bits];
  let values = [
    cfg.Name,
    bits.map((b) => B(b)).join(""),
    Encode(cfg.IncludeKeyword).join(","),
    Encode(cfg.IncludeUser).join(","),
    Encode(cfg.ExcludeUser).join(","),
    Encode(cfg.ExcludeStartsWith).join(","),
    Encode(cfg.FromChannel).join(",")
  ];
  return Encode(values).join(",");
}

/* End module configuration 1}}} */

/* Join a channel and save it in the configuration */
function join_channel(client, channel) {
  client.JoinChannel(channel);
  let cfg = get_config_object();
  cfg.Channels = client.GetJoinedChannels();
  Util.SetWebStorage(cfg);
}

/* Leave a channel and save it in the configuration */
function leave_channel(client, channel) {
  client.LeaveChannel(channel);
  let cfg = get_config_object();
  cfg.Channels = client.GetJoinedChannels();
  Util.SetWebStorage(cfg);
}

/* End configuration section 0}}} */

/* Return true if the event should be displayed on the module given */
function check_filtered(module, event) {
  let rules = get_module_settings(module);
  let role = "pleb";
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
    for (let s of rules.IncludeUser) {
      if (s.toLowerCase() == event.user.toLowerCase()) {
        return true;
      }
    }
    for (let s of rules.IncludeKeyword) {
      if (event.message.toLowerCase().indexOf(s.toLowerCase()) > -1) {
        return true;
      }
    }
    for (let s of rules.ExcludeUser) {
      if (s.toLowerCase() == event.user.toLowerCase()) {
        return false;
      }
    }
    for (let s of rules.ExcludeStartsWith) {
      if (event.message.startsWith(s)) {
        return false;
      }
    }
    if (rules.FromChannel.length > 0) {
      for (let s of rules.FromChannel) {
        let c = s.indexOf('#') == -1 ? '#' + s : s;
        if (event.channel && event.channel.channel) {
          if (event.channel.channel.toLowerCase() != c.toLowerCase()) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

/* Add direct HTML to all modules */
function add_html(content) {
  let line = `<div class="line line-wrapper"></div>`;
  let $Content = $(".module").find($(".content"));
  $Content.append($(line).append(content));
  $Content.scrollTop(Math.pow(2, 31) - 1);
}

/* Shortcut for adding a <div class="pre"> element */
function add_pre(content) {
  add_html($(`<div class="pre"></div>`).html(content));
}

/* Shortcut for adding a <div class="notice"> element */
function add_notice(content, pre=false) {
  let e = $(`<div class="notice"></div>`).html(content);
  if (pre) e.addClass("pre");
  add_html(e);
}

/* Shortcut for adding a <div class="error"> element */
function add_error(content, pre=false) {
  let e = $(`<div class="error"></div>`).html(content);
  if (pre) e.addClass("pre");
  add_html(e);
}

/* Handle a chat command */
function handle_command(value, client) {
  let tokens = value.split(" ");
  let command = tokens.shift();
  let config = get_config_object();

  /* Clear empty tokens at the end (\r\n related) */
  while (tokens.length > 0 && tokens[tokens.length-1].length == 0) {
    tokens.pop();
  }

  /* Shortcuts for usages/help messages */
  let arg = (s) => `<span class="arg">${s.escape()}</span>`;
  let helpcmd = (k) => `<span class="help helpcmd">${k}</span>`;
  let helpmsg = (k) => `<span class="help helpmsg">${k}</span>`;
  let helpline = (k, v) => `<div class="helpline">${helpcmd(k)}${helpmsg(v)}</div>`;
  let help = (s) => `<div class="help">${s}</div>`;
  let add_helpline = (k, v) => add_pre(helpline(k, v));
  let add_help = (s) => add_pre(help(s));

  /* Handle each of the commands */
  if (command == "//log" || command == "//logs") {
    let logs = Util.GetWebStorage("debug-msg-log") || [];
    add_help(`Debug message log length: ${logs.length}`);
    if (tokens.length > 0) {
      if (tokens[0] == "show") {
        if (tokens.length > 1) {
          let idx = Number.parseInt(tokens[1]);
          add_help(`${idx}: ${JSON.stringify(logs[idx]).escape()}`);
        } else {
          for (let [i, l] of Object.entries(logs)) {
            add_help(`${i}: ${JSON.stringify(l).escape()}`);
          }
        }
      } else if (tokens[0] == "summary") {
        let lines = [];
        let line = [];
        for (let [i, l] of Object.entries(logs)) {
          let desc = '';
          if (l._cmd) {
            desc = l._cmd;
          } else {
            desc = JSON.stringify(l).substr(0, 10);
          }
          line.push(desc);
          if (line.length >= 10) {
            lines.push(line);
            line = [];
          }
        }
        if (line.length > 0) lines.push(line);
        let lidx = 0;
        for (let [i, l] of Object.entries(lines)) {
          add_help(`${lidx}-${lidx+l.length}: ${JSON.stringify(l)}`);
          lidx += l.length;
        }
      } else if (tokens[0] == "shift") {
        logs.shift();
        add_help(`New logs length: ${logs.length}`);
        Util.SetWebStorage(logs, "debug-msg-log");
      } else if (tokens[0] == "pop") {
        logs.pop();
        add_help(`New logs length: ${logs.length}`);
        Util.SetWebStorage(logs, "debug-msg-log");
      } else {
        add_help(`Unknown argument "${tokens[0]}"`);
      }
    } else {
      add_help(`Use //log summary to view a summary`);
      add_help(`Use //log show to view them all`);
      add_help(`Use //log show &lt;N&gt; to show item &lt;N&gt;`);
      add_help(`Use //log shift to remove one entry from the start`);
      add_help(`Use //log pop to remove one entry from the end`);
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
        add_notice(`Purged storage "${Util.GetWebStorageKey()}"`);
      } else if (tokens[0] == "url") {
        let url = location.protocol + '//' + location.hostname + location.pathname;
        if (tokens.length > 1) {
          if (tokens[1].startsWith('git')) {
            url = "https://kaedenn.github.io/twitch-filtered-chat/index.html";
          }
        }
        let qs = [];
        let qs_push = (k, v) => (qs.push(`${k}=${encodeURIComponent(v)}`));
        if (config.Debug > 0) { qs_push('debug', config.Debug); }
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
        if (config.NoAssets) { qs_push('noassets', config.NoAssets); }
        if (config.NoFFZ) { qs_push('noffz', config.NoFFZ); }
        if (config.NoBTTV) { qs_push('nobttv', config.NoBTTV); }
        if (config.HistorySize) { qs_push('hmax', config.HistorySize); }
        qs_push("module1", format_module_config(config.module1));
        qs_push("module2", format_module_config(config.module2));
        qs_push("layout", FormatLayout(config.Layout));
        if (config.Transparent) { qs_push("trans", "1"); }
        if (config.AutoReconnect) { qs_push("reconnect", "1"); }
        {
          let font_size = Util.CSS.GetProperty("--body-font-size");
          let font_size_default = Util.CSS.GetProperty("--body-font-size-default");
          if (font_size != font_size_default) {
            qs_push("size", font_size.replace(/[^0-9]/g, ''));
          }
        }
        if (config.Plugins) { qs_push("plugins", "1"); }
        if (config.MaxMessages != TwitchClient.DEFAULT_MAX_MESSAGES) {
          qs_push("max", `${config.MaxMessages}`);
        }
        if (tokens[tokens.length-1] === "text") {
          url += "?" + qs.join("&");
        } else {
          url += "?base64=" + encodeURIComponent(btoa(qs.join("&")));
        }
        add_help(client.get('HTMLGen').url(url));
      } else if (config.hasOwnProperty(tokens[0])) {
        add_helpline(tokens[0], JSON.stringify(config[tokens[0]]));
      } else {
        add_error(`Unknown config key &quot;${tokens[0]}&quot;`, true);
      }
    } else {
      let wincfgs = [];
      for (let [k, v] of Object.entries(config)) {
        if (typeof(v) == "object" && v.Name && v.Name.length > 1) {
          /* It's a window configuration */
          wincfgs.push([k, v]);
        } else if (k == "ClientID" || k == "Pass") {
          add_helpline(k, `Omitted for security; use //config ${k.toLowerCase()} to show`);
        } else {
          add_helpline(k, v);
        }
      }
      add_help(`Window Configurations:`);
      for (let [k, v] of wincfgs) {
        add_help(`Module <span class="arg">${k}</span>: &quot;${v.Name}&quot;:`);
        for (let [cfgk, cfgv] of Object.entries(v)) {
          if (cfgk === "Name") continue;
          add_helpline(cfgk, `&quot;${cfgv}&quot;`);
        }
      }
    }
  } else if (command == "//join") {
    if (tokens.length > 0) {
      let ch = Twitch.FormatChannel(tokens[0]);
      if (!client.IsInChannel(ch)) {
        join_channel(client, ch);
      } else {
        add_pre(`Already in channel ${ch}`);
      }
    } else {
      add_pre(`Usage: //join &lt;${arg('channel')}&gt;`);
    }
  } else if (command == "//part" || command == "//leave") {
    if (tokens.length > 0) {
      let ch = Twitch.FormatChannel(tokens[0]);
      if (client.IsInChannel(ch)) {
        leave_channel(client, ch);
      } else {
        add_pre(`Not in channel ${ch}`);
      }
    } else {
      add_pre(`Usage: //leave &lt;${arg("channel")}&gt;`);
    }
  } else if (command == "//badges") {
    let all_badges = [];
    for (let [bname, badge] of Object.entries(client.GetGlobalBadges())) {
      for (let [bv, bdef] of Object.entries(badge.versions)) {
        let u = bdef.image_url_2x;
        let s = 36;
        if (tokens.indexOf("small") > -1) {
          u = bdef.image_url_1x;
          s = 18;
        } else if (tokens.indexOf("large") > -1) {
          u = bdef.image_url_4x;
          s = 72;
        }
        all_badges.push(`<img src="${u}" width="${s}" height="${s}" title="${bname}" />`);
      }
    }
    add_notice(all_badges.join(''));
  } else if (command == "//help") {
    if (tokens.length > 0 && tokens[0].startsWith('//')) {
      tokens[0] = tokens[0].substr(2);
    }
    if (tokens.length == 0) {
      let lines = [];
      lines.push([`clear`, `clears all chat windows of their contents`]);
      lines.push([`config`, `display configuration`]);
      lines.push([`config purge`, `purge localStorage of active configuration`]);
      lines.push([`config [${arg('key')}]`, `display configuration for ${arg('key')}`]);
      lines.push([`join &lt;${arg('ch')}&gt;`, `join channel &lt;${arg('ch')}&gt;`]);
      lines.push([`part &lt;${arg('ch')}&gt;`, `leave channel &lt;${arg('ch')}&gt;`]);
      lines.push([`leave &lt;${arg('ch')}&gt;`, `leave channel &lt;${arg('ch')}&gt;`]);
      lines.push([`badges`, `show the global badges`]);
      lines.push([`help`, `this message`]);
      lines.push([`help &lt;${arg('command')}&gt;`, `help for a specific command`]);
      add_help(`Commands:`);
      for (let [c, m] of lines) {
        add_helpline(`//${c}`, m);
      }
    } else if (tokens[0] == "clear") {
      add_help(`//clear: Clears all chats`);
    } else if (tokens[0] == "config") {
      add_help(`//config: Display current configuration. Both ClientID and OAuth token are omitted for security reasons`);
      add_help(`//config clientid: Display current ClientID`);
      add_help(`//config oauth: Display current OAuth token`);
      add_help(`//config purge: Purge the current key from localStorage`);
      add_help(`//config url: Generate a URL from the current configuration (CONTAINS AUTHID)`);
      add_help(`//config url git: As above, but target https://kaedenn.github.io`);
      add_help(`//config url file: As above, but target file:///home/kaedenn`);
      add_help(`//config url [git|file] text: Prevent base64 encoding URL`);
      add_help(`//config &lt;${arg("key")}&gt;: Display configuration item &lt;${arg("key")}&gt;`);
    } else if (tokens[0] == "join") {
      add_help(`//join &lt;${arg("ch")}&gt;: Join the specified channel. Channel may or may not include leading #`);
    } else if (tokens[0] == "part" || tokens[0] == "leave") {
      add_help(`//part &lt;${arg("ch")}&gt;: Disconnect from the specified channel. Channel may or may not include leading #`);
      add_help(`//leave &lt;${arg("ch")}&gt;: Disconnect from the specified channel. Channel may or may not include leading #`);
    } else if (tokens[0] == "help") {
      add_help(`//help: Displays a list of recognized commands and their usage`);
      add_help(`//help &lt;${arg("command")}&gt;: Displays help for a specific command`);
    } else {
      add_help(`//help: No such command "${tokens[0].escape()}"`);
    }
  } else if (command === "//plugins") {
    for (let [n, p] of Object.entries(Plugins.plugins)) {
      let msg = `${n}: ${p.file} @ ${p.order}`;
      if (p._error) {
        add_error(`${msg}: Failed: ${JSON.stringify(p._error_obj)}`);
      } else if (p._loaded) {
        msg = `${msg}: Loaded`;
        if (p.commands) {
          msg = `${msg}: Commands: ${p.commands.join(" ")}`;
        }
        add_pre(msg);
      }
    }
  } else if (CHAT_COMMANDS.hasOwnProperty(command)) {
    for (let cmd of CHAT_COMMANDS[command]) {
      cmd({line: value, command: command, tokens: tokens});
    }
  } else if (command.startsWith('//')) {
    add_error(`Unknown command "${command.escape()}"`, true);
  } else {
    return false;
  }
  return true;
}

/* Populate and show the username context window */
function show_context_window(client, cw, line) {
  let $cw = $(cw);
  let $l = $(line);
  $(cw).html(""); /* Clear everything from the last time */

  /* Attributes of the host line */
  let id = $l.attr("data-id");
  let user = $l.attr("data-user");
  let userid = $l.attr("data-user-id");
  let channel = `#${$l.attr("data-channel")}`;
  let chid = $l.attr("data-channelid");
  let sub = $l.attr("data-subscriber") === "1";
  let mod = $l.attr("data-mod") === "1";
  let vip = $l.attr("data-vip") === "1";
  let caster = $l.attr("data-caster") === "1";
  let timestamp = Number.parseInt($l.attr("data-sent-ts"));
  let time = new Date(timestamp);

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
  let $Line = (s) => $(`<div class="item">${s}</div>`);
  let Link = (id, text) => client.get('HTMLGen').url(null, text, "cw-link", id);
  let Em = (t) => `<span class="em">${t}</span>`;
  let $EmItem = (s) => $(Em(s)).css('margin-left', '0.5em');

  /* Add general user information */
  let $username = $l.find('.username');
  let color = `color: ${$username.css("color")}`;
  let classes = $username.attr("class");
  $cw.append($Line(`<span class="${classes}" style="${color}">${user}</span> in ${Em(channel)}`));

  /* Add link to timeout user */
  if (client.IsMod(channel)) {
    let $tl = $(`<div class="cw-timeout">Timeout:</div>`);
    for (let dur of "1s 10s 60s 10m 30m 1h 12h 24h".split(" ")) {
      let $ta = $(Link(`cw-timeout-${user}-${dur}`, dur));
      $ta.addClass("cw-timeout-dur");
      $ta.attr("data-channel", channel);
      $ta.attr("data-user", user);
      $ta.attr("data-duration", dur);
      $ta.click(function() {
        let ch = $(this).attr('data-channel');
        let u = $(this).attr('data-user');
        let dur = $(this).attr('data-duration');
        client.Timeout(ch, u, dur);
        Util.Log('Timed out user', u, 'from', ch, 'for', dur);
        $(cw).fadeOut();
      });
      $tl.append($ta);
    }
    $cw.append($tl);
  }

  /* Add link which places "/ban <user>" into the chat textbox */
  if (client.IsMod(channel)) {
    let $ba = $(Link(`cw-ban-${user}`, "Ban"));
    $ba.attr("data-channel", channel);
    $ba.attr("data-user", user);
    $ba.click(function() {
      $("#txtChat").val(`/ban ${$(this).attr('data-user')}`);
    });
    $cw.append($ba);
  }

  /* Add other information */
  let sent_ts = Util.FormatDate(time);
  let ago_ts = Util.FormatInterval((Date.now() - timestamp) / 1000);
  $cw.append($Line(`Sent: ${sent_ts} (${ago_ts} ago)`));
  $cw.append($Line(`UserID: ${userid}`));
  $cw.append($Line(`MsgUID: ${id}`));

  /* Add roles (and ability to remove roles, for the caster) */
  if (mod || vip || sub || caster) {
    let $roles = $Line(`User Role:`);
    if (mod) { $roles.append($EmItem('Mod')); $roles.append(","); }
    if (vip) { $roles.append($EmItem('VIP')); $roles.append(","); }
    if (sub) { $roles.append($EmItem('Sub')); $roles.append(","); }
    if (caster) { $roles.append($EmItem('Host')); $roles.append(","); }
    /* Remove the last comma */
    $roles[0].removeChild($roles[0].lastChild);
    $cw.append($roles);
    if (client.IsCaster(channel) && !client.IsUIDSelf(user_id)) {
      if (mod) { $cw.append($Line(Link('cw-unmod', 'Remove Mod'))); }
      if (vip) { $cw.append($Line(Link('cw-unvip', 'Remove VIP'))); }
    }
  }

  /* Add the ability to add roles (for the caster) */
  if (client.IsCaster(channel) && !client.IsUIDSelf(user_id)) {
    if (!mod) { $cw.append($Line(Link('cw-make-mod', 'Make Mod'))); }
    if (!vip) { $cw.append($Line(Link('cw-make-vip', 'Make VIP'))); }
  }

  let l_off = $l.offset();
  let offset = {top: l_off.top + $l.outerHeight() + 2, left: l_off.left};
  $cw.fadeIn().offset(offset);
};

/* Set or unset transparency */
function update_transparency(transparent) {
  let ss = Util.CSS.GetSheet("main.css");
  if (!ss) { Util.Error("Can't find main.css object"); return; }
  let rule = Util.CSS.GetRule(ss, ":root");
  if (!rule) { Util.Error("Can't find main.css :root rule"); return; }
  let props = [];
  /* Find the prop="--<name>-color" rules */
  for (let prop of Util.CSS.GetPropertyNames(rule)) {
    if (prop.match(/^--[a-z-]+-color$/)) {
      props.push(prop);
    }
  }
  for (let prop of props) {
    if (transparent) {
      /* Set them all to transparent */
      Util.CSS.SetProperty(prop, 'transparent');
      $(".module").addClass("transparent");
      $("body").addClass("transparent");
    } else {
      /* Set them all to default */
      Util.CSS.SetProperty(prop, `var(${prop}-default)`);
      $(".module").removeClass("transparent");
      $("body").removeClass("transparent");
    }
  }
}

/* Called once when the document loads */
function client_main(layout) {
  /* Hook Logger messages */
  Util.Logger.add_hook(function(sev, with_stack, ...args) {
    if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
      add_html("ERROR: " + JSON.stringify(args.length == 1 ? args[0] : args).escape());
    }
  }, "ERROR");
  Util.Logger.add_hook(function(sev, with_stack, ...args) {
    if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
      add_html("WARN: " + JSON.stringify(args.length == 1 ? args[0] : args).escape());
    }
  }, "WARN");
  Util.Logger.add_hook(function(sev, with_stack, ...args) {
    if (Util.DebugLevel >= Util.LEVEL_TRACE) {
      add_html("DEBUG: " + JSON.stringify(args.length == 1 ? args[0] : args).escape());
    }
  }, "DEBUG");
  Util.Logger.add_hook(function(sev, with_stack, ...args) {
    if (Util.DebugLevel >= Util.LEVEL_TRACE) {
      add_html("TRACE: " + JSON.stringify(args.length == 1 ? args[0] : args).escape());
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
  let client;
  let ConfigCommon = {};
  (function() {
    let config = get_config_object();
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
        Util.CSS.SetProperty('--chat-border-color', '#cd143c');
      }
    }

    /* Simulate clicking cbTransparent if config.Transparent is set */
    if (config.Transparent) {
      update_transparency(true);
    }

    /* After all that, sync the final settings up with the html */
    $(".module").each(function() {
      set_module_settings(this, config[$(this).attr('id')]);
    });

    /* Set values we'll want to use later */
    ConfigCommon.Plugins = !!config.Plugins;
    ConfigCommon.Layout = config.Layout;
    ConfigCommon.Transparent = config.Transparent;
    ConfigCommon.MaxMessages = config.MaxMessages || 100;
  })();

  /* Construct the HTML Generator and tell it and the client about each other */
  client.set('HTMLGen', new HTMLGenerator(client, ConfigCommon));

  /* Construct the plugins */
  if (ConfigCommon.Plugins) {
    Plugins.LoadAll(client);
  }

  /* Allow JS access if debugging is enabled */
  if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
    window.client = client;
  }

  let is_up = (k) => (k == KeyEvent.DOM_VK_UP);
  let is_down = (k) => (k == KeyEvent.DOM_VK_DOWN);

  /* Sending a chat message */
  $("#txtChat").keydown(function(e) {
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
    } else if (is_up(e.keyCode) || is_down(e.keyCode)) {
      /* Handle traversing message history */
      let i = Number.parseInt($(e.target).attr("hist-index"));
      let l = client.GetHistoryLength();
      if (is_up(e.keyCode)) {
        /* Going up */
        i = (i + 1 >= l - 1 ? l - 1 : i + 1);
      } else if (is_down(e.keyCode)) {
        /* Going down */
        i = (i - 1 < 0 ? -1 : i - 1);
      }
      e.target.value = (i > -1 ? client.GetHistoryItem(i) : "");
      $(e.target).attr("hist-index", `${i}`);
      /* Delay moving the cursor until after the text is updated */
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.value.length;
        e.target.selectionEnd = e.target.value.length;
      });
    }
  });

  /* Pressing enter while on the settings box */
  $("#settings").keyup(function(e) {
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      update_module_config();
      $("#settings_button").click();
    }
  });

  /* Clicking the settings button */
  $("#settings_button").click(function() {
    if ($("#settings").is(':visible')) {
      $('#settings').fadeOut();
    } else {
      let config = get_config_object();
      $("#txtChannel").val(config.Channels.join(","));
      $("#txtNick").attr("disabled", "disabled")
        .val(!!config.Name ? config.Name : AUTOGEN_VALUE);
      if (config.ClientID && config.ClientID.length == 30) {
        $("#txtClientID").attr("disabled", "disabled").val(CACHED_VALUE);
      }
      if (config.Pass && config.Pass.length > 0) {
        $("#txtPass").attr("disabled", "disabled").hide();
        $("#txtPassDummy").show();
      }
      $("#selDebug").val(`${config.Debug}`);
      $('#settings').fadeIn();
    }
  });

  /* Clicking on a "Clear" link */
  $(".clear-chat-link").click(function() {
    let id = $(this).parent().parent().parent().attr("id");
    $(`#${id} .content`).find(".line-wrapper").remove();
  });

  /* Pressing enter on the "Channels" text box */
  $("#txtChannel").keyup(function(e) {
    let fmt_ch = (ch) => Twitch.FormatChannel(Twitch.ParseChannel(ch));
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      let new_chs = $(this).val().split(",").map(fmt_ch);
      let old_chs = client.GetJoinedChannels().map(fmt_ch);
      let to_join = new_chs.filter((c) => old_chs.indexOf(c) == -1);
      let to_part = old_chs.filter((c) => new_chs.indexOf(c) == -1);
      /* Join all the channels added */
      for (let ch of to_join) {
        join_channel(client, ch);
        add_notice(`Joining ${ch}`);
      }
      /* Leave all the channels removed */
      for (let ch of to_part) {
        leave_channel(client, ch);
        client.LeaveChannel(ch);
        add_notice(`Leaving ${ch}`);
      }
      /* Save the new configuration */
      let current_cfg = get_config_object();
      current_cfg.Channels = client.GetJoinedChannels().map(fmt_ch);
      Util.SetWebStorage(current_cfg);
    }
  });

  /* Changing the "stream is transparent" checkbox */
  $("#cbTransparent").change(function() {
    return update_transparency($(this).is(":checked"));
  });

  /* Changing the value for "background image" */
  $("#txtBGImage").keyup(function(e) {
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      $(".module").css("background-image", $(this).val());
    }
  });

  /* Changing the debug level */
  $("#selDebug").change(function() {
    let v = parseInt($(this).val());
    let old = client.GetDebug();
    Util.Log(`Changing debug level from ${Util.DebugLevel} (${old}) to ${v}`);
    client.SetDebug(v);
  });

  /* Reconnect */
  $("#reconnect").click(function() {
    client.Connect();
  });

  /* Opening one of the module menus */
  $(".menu").click(function() {
    let $settings = $(this).parent().children(".settings");
    let $lbl = $(this).parent().children('label.name');
    let $tb = $(this).parent().children('input.name');
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
  $('.module .header input.name').on('keyup', function(e) {
    let $settings = $(this).parent().children(".settings");
    let $lbl = $(this).parent().children('label.name');
    let $tb = $(this).parent().children('input.name');
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      update_module_config();
      $tb.hide();
      $lbl.html($tb.val()).show();
      $settings.fadeToggle();
    }
  });

  /* Pressing enter on one of the module menu text boxes */
  $('.module .settings input[type="text"]').on('keyup', function(e) {
    let v = $(this).val();
    if (v.length > 0) {
      if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
        let $cli = $(this).closest('li');
        let cls = $cli.attr('class').replace('textbox', '').trim();
        let cb = client.get('HTMLGen').checkbox(v, null, cls, true);
        let val = $cli.find('label').html();
        let $li = $(`<li><label>${cb}${val} ${v}</label></li>`);
        $cli.before($li);
        $(this).val('');
        update_module_config();
      }
    }
  });

  /* Clicking anywhere else on the document: reconnect, username context window */
  $(document).click(function(e) {
    let $t = $(e.target);
    /* Clicking on a reconnect link */
    if ($t.attr("data-reconnect") == '1') {
      add_notice(`Reconnecting...`);
      client.Connect();
    }
    let $cw = $("#username_context");
    if ($t.attr('data-username') == '1') {
      /* Clicked on a username; show context window */
      show_context_window(client, $cw, $t.parent());
    } else if (Util.PointIsOn(e.clientX, e.clientY, $cw[0])) {
      /* Clicked on the context window */
      let ch = $cw.attr("data-channel");
      let user = $cw.attr("data-user");
      let userid = $cw.attr("data-userid");
      if (!client.IsUIDSelf(userid)) {
        if ($t.attr("id") === "cw-unmod") {
          /* Clicked on the "unmod" link */
          Util.Log("Unmodding", user, "in", ch);
          client.SendMessage(ch, `/unmod ${user}`);
        } else if ($t.attr("id") === "cw-unvip") {
          /* Clicked on the "unvip" link */
          Util.Log("Removing VIP for", user, "in", ch);
          client.SendMessage(ch, `/unvip ${user}`);
        } else if ($t.attr("id") === "cw-make-mod") {
          /* Clicked on the "mod" link */
          Util.Log("Modding", user, "in", ch);
          client.SendMessage(ch, `/mod ${user}`);
        } else if ($t.attr("id") === "cw-make-vip") {
          /* Clicked on the "vip" link */
          Util.Log("VIPing", user, "in", ch);
          client.SendMessage(ch, `/vip ${user}`);
        }
      }
    } else {
      /* Clicked somewhere else: close context window */
      $cw.fadeOut();
    }
  });

  /* Bind to numerous TwitchEvent events {{{0 */

  /* WebSocket opened */
  client.bind('twitch-open', function _on_twitch_open(e) {
    $(".loading").remove();
    $("#debug").hide();
    if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
      let notes = [];
      if (client.IsAuthed()) {
        notes.push("(authenticated)");
      } else {
        notes.push("(unauthenticated)");
      }
      add_notice(`Connected ${notes.join(" ")}`);
    }
  });

  /* WebSocket closed */
  client.bind('twitch-close', function _on_twitch_close(e) {
    let code = e.raw_line.code;
    let reason = e.raw_line.reason;
    let msg = "Connection closed";
    if (reason) {
      msg = `${msg} (code ${code}: ${reason})`;
    } else {
      msg = `${msg} (code ${code})`;
    }
    if (get_config_object().AutoReconnect) {
      add_error(msg);
      client.Connect();
    } else {
      add_error(`${msg}<span class="reconnect" data-reconnect="1">Reconnect</span>`);
    }
  });

  /* User joined (any user) */
  client.bind('twitch-join', function _on_twitch_join(e) {
    if (!Util.Browser.IsOBS && !layout.Slim) {
      if (e.user == client.GetName().toLowerCase()) {
        add_notice(`Joined ${e.channel.channel}`);
      }
    }
  });

  /* User left (any user) */
  client.bind('twitch-part', function _on_twitch_part(e) {
    if (!Util.Browser.IsOBS && !layout.Slim) {
      if (e.user == client.GetName().toLowerCase()) {
        add_notice(`Left ${e.channel.channel}`);
      }
    }
  });

  /* Notice (or warning) from Twitch */
  client.bind('twitch-notice', function _on_twitch_notice(e) {
    /* Some notices are benign */
    if (e.flags['msg-id'] == 'host_on') { }
    else {
      Util.Warn(e);
    }
    let channel = Twitch.FormatChannel(e.channel);
    let message = e.message.escape();
    add_notice(`Notice from ${channel}: ${message}`);
  });

  /* Error from Twitch or Twitch Client API */
  client.bind('twitch-error', function _on_twitch_error(e) {
    Util.Error(e);
    let user = e.user;
    let command = e.values.command;
    let message = e.message.escape();
    add_error(`Error for ${user}: ${command}: ${message}`);
  });

  /* Message received from Twitch */
  client.bind('twitch-message', function _on_twitch_message(e) {
    if (Util.DebugLevel >= Util.LEVEL_TRACE) {
      add_html(`<span class="pre">${e.repr()}</span>`);
    }
    /* Avoid flooding the DOM with stale chat messages */
    let max = client.get('HTMLGen').getValue("MaxMessages") || 100;
    for (let c of $(".content")) {
      while ($(c).find(".line-wrapper").length > max) {
        $(c).find(".line-wrapper").first().remove();
      }
    }
  });

  /* Received streamer info */
  client.bind('twitch-streaminfo', function _on_twitch_streaminfo(e) {
    let cinfo = client.GetChannelInfo(e.channel.channel);
    if (!cinfo.online) {
      if (ConfigCommon.Layout && !ConfigCommon.Layout.Slim) {
        add_notice(`${e.channel.channel} is not currently streaming`);
      }
    }
  });

  /* Received chat message */
  client.bind('twitch-chat', function _on_twitch_chat(event) {
    if (event instanceof TwitchChatEvent) {
      let m = verify_string(event.message);
      if (event.flags && event.flags.mod && m.indexOf(' ') > -1) {
        let user = event.user.escape();
        let tokens = m.split(' ');
        if (tokens[0] === '!tfc') {
          if (tokens[1] === "reload") {
            location.reload();
          } else if (tokens[1] === "force-reload") {
            location.reload(true);
          } else if (tokens[1] === "clear") {
            $(".content").children().remove();
          } else if (tokens[1] === "removeuser"
                     || tokens[1] === "clearuser"
                     || tokens[1] === "remove-user"
                     || tokens[1] === "clear-user") {
            if (tokens[2] && tokens[2].length > 1) {
              $(`[data-user="${tokens[2].toLowerCase()}"]`).parent().remove();
            }
          } else if (tokens[1] == "nuke") {
            if (tokens[2] && tokens[2].length > 1) {
              $(`[data-user="${tokens[2].toLowerCase()}"]`).parent().remove();
            } else {
              $(".content").children().remove();
            }
            return;
          }
        }
      }
    }
    $(".module").each(function() {
      if (!check_filtered($(this), event)) {
        /* Filtered out */
        return;
      }
      let $w = $(`<div class="line line-wrapper"></div>`);
      $w.html(client.get('HTMLGen').gen(event));
      let $c = $(this).find('.content');
      $c.append($w);
      $c.scrollTop(Math.pow(2, 31) - 1);
    });
  });

  /* Received clearchat event */
  client.bind('twitch-clearchat', function _on_twitch_clearchat(e) {
    if (e.has_flag("target-user-id")) {
      /* Moderator timed out a user */
      let r = e.flags["room-id"];
      let u = e.flags["target-user-id"];
      $(`.chat-line[data-channel-id="${r}"][data-user-id="${u}"]`).parent().remove();
    } else {
      /* Moderator cleared the chat */
      $("div.content").find(".line-wrapper").remove();
    }
  });

  /* Received clearmsg event */
  client.bind('twitch-clearmsg', function _on_twitch_clearmsg(e) {
    Util.StorageAppend("debug-msg-log", e);
    Util.Warn("Unhandled CLEARMSG:", e);
  });

  /* Subscribe */
  client.bind('twitch-sub', function _on_twitch_sub(e) {
    Util.StorageAppend("debug-msg-log", e);
    add_html(client.get('HTMLGen').sub(e));
  });

  /* Resubscribe */
  client.bind('twitch-resub', function _on_twitch_resub(e) {
    Util.StorageAppend("debug-msg-log", e);
    add_html(client.get('HTMLGen').resub(e));
  });

  /* Gift subscription */
  client.bind('twitch-giftsub', function _on_twitch_giftsub(e) {
    Util.StorageAppend("debug-msg-log", e);
    add_html(client.get('HTMLGen').giftsub(e));
  });

  /* Anonymous gift subscription */
  client.bind('twitch-anongiftsub', function _on_twitch_anongiftsub(e) {
    Util.StorageAppend("debug-msg-log", e);
    add_html(client.get('HTMLGen').anongiftsub(e));
  });

  /* End of all the binding 0}}} */

  /* Finally, connect */
  client.Connect();
}

