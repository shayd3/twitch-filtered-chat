/* Twitch Filtered Chat Main Module */

"use strict";

/* FIXME:
 * (client.js) Channel sub badges only display first month badge
 *   1) Use Twitch.API.ChannelBadges over Twitch.API.Badges
 *   2) Remove Twitch.API.Badges
 *   3) Rename Twitch.API.ChannelBadges to Twitch.API.Badges
 * dwangoAC's Caster badge doesn't show
 * Configuration problems:
 *   cbTransparent is still selected after refresh
 *     Select -> refresh -> still selected
 *   Should config.Scroll set cbScroll or the other way around?
 *     See getConfigObject below txtPass
 *   Should config.ShowClips set cbClips or the other way around?
 *     See getConfigObject below txtPass
 */

/* TODO (in approximate decreasing priority):
 * Add to #settings help link and #settings config link
 * Finish clip information generation
 * Add emote information on hover
 * Allow plugins to define custom filtering
 * Create a README.md file for the plugins directory
 * Merge twapi into tfc; unify the modules
 * Detect getConfigObject() caller for omitting ClientID, Pass
 * Auto-complete commands (wip), command arguments, and @user names
 */

/* IDEAS:
 * Add layout selection box to #settings (reloads page on change)?
 * Allow for a configurable number of columns?
 * Add re-include (post-exclude) filtering options for Mods, Bits, Subs, etc?
 */

/* Filtering out JOIN/PART or PRIVMSG logged messages
 *   Util.Logger.add_filter(/^ws recv.*\b(JOIN|PART)\b/)
 *   Util.Logger.add_filter(/^ws recv.*\bPRIVMSG\b/)
 */

const CFGKEY_DEFAULT = "tfc-config";
const GIT_URL = "https://kaedenn.github.io/twitch-filtered-chat/index.html";
const CUR_URL = ((l) => `${l.protocol}//${l.hostname}${l.pathname}`)(window.location);

/* Document writing functions {{{0 */

class Content { /* exported Content */
  static addHTML(content, container=null, callbacks=null) {
    let $container = container ? $(container) : $(".module .content");
    let $content = $(content);
    if (callbacks) {
      for (let cb of callbacks) {
        cb($content);
      }
    }
    let $line = $(`<div class="line line-wrapper"></div>`).append($content);
    $container.append($line);
    if (!$container.attr("data-no-scroll")) {
      $container.scrollTop(Math.pow(2, 31) - 1);
    }
  }
  static addPre(content) { /* does not escape */
    Content.addHTML($(`<div class="pre"></div>`).html(content));
  }
  static addInfo(content, pre=false) { /* does not escape */
    let e = $(`<div class="info"></div>`).html(content);
    if (pre) e.addClass("pre");
    Content.addHTML(e);
  }
  static addNotice(content, pre=false) { /* does not escape */
    let e = $(`<div class="notice"></div>`).html(content);
    if (pre) e.addClass("pre");
    Content.addHTML(e);
  }
  static addError(content, pre=false) { /* does not escape */
    let e = $(`<div class="error"></div>`).html(content);
    if (pre) e.addClass("pre");
    Content.addHTML(e);
  }
  static addHelp(s) { /* does not escape */
    Content.addPre($(`<div class="help pre">${s}</div>`));
  }
  static addHelpLine(c, s) { /* escapes */
    Content.addPre(ChatCommands.helpLine(c, s));
  }
}

/* End document writing functions 0}}} */

/* Begin configuration section {{{0 */

/* Merge the query string into the config object given and return removals */
function parseQueryString(config, qs=null) {
  let qs_data = {};
  /* Figure out what was passed */
  let qs_obj = qs || window.location.search;
  if (typeof(qs_obj) === "string") {
    qs_data = Util.ParseQueryString(qs_obj);
  } else if (typeof(qs_obj) === "object") {
    qs_data = qs_obj;
  } else {
    Util.Error("Refusing to parse strange query string object", qs_obj);
    /* Fall-through will generate a sane default configuration */
  }

  let query_remove = [];
  for (let [k, v] of Object.entries(qs_data)) {
    let key = k; /* config key */
    let val = v; /* config val */
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
      val = v.split(",").map((c) => Twitch.FormatChannel(c));
    } else if (k === "debug") {
      key = "Debug";
      if (v === "debug") {
        val = Util.LEVEL_DEBUG;
      } else if (v === "trace") {
        val = Util.LEVEL_TRACE;
      } else if (typeof(v) === "number") {
        val = Math.clamp(v, Util.LEVEL_MIN, Util.LEVEL_MAX);
      } else {
        val = Number(Boolean(v));
      }
    } else if (k === "noassets") {
      key = "NoAssets";
      val = Boolean(v);
    } else if (k === "noffz") {
      key = "NoFFZ";
      val = Boolean(v);
    } else if (k === "nobttv") {
      key = "NoBTTV";
      val = Boolean(v);
    } else if (k === "hmax") {
      key = "HistorySize";
      if (v === "inf") {
        val = Infinity;
      } else if (typeof(v) === "number") {
        val = v;
      } else {
        val = TwitchClient.DEFAULT_HISTORY_SIZE;
      }
    } else if (k.match(/^module[\d]*?$/)) {
      if (k === "module") {
        key = "module1";
      } else {
        key = k;
      }
      val = parseModuleConfig(v);
    } else if (k === "trans" || k === "transparent") {
      key = "Transparent";
      val = 1;
    } else if (k === "layout") {
      key = "Layout";
      val = ParseLayout(v);
    } else if (k === "reconnect") {
      key = "AutoReconnect";
      val = true;
    } else if (k === "size") {
      key = "Size";
      val = `${v}pt`;
    } else if (k === "plugins") {
      key = "Plugins";
      val = Boolean(v);
    } else if (k === "disable") {
      key = "DisableEffects";
      val = v.split(",");
    } else if (k === "enable") {
      key = "EnableEffects";
      val = v.split(",");
    } else if (k === "max") {
      key = "MaxMessages";
      if (v === "inf" || v === -1) {
        val = Infinity;
      } else if (typeof(v) === "number") {
        val = v;
      } else {
        val = TwitchClient.DEFAULT_MAX_MESSAGES;
      }
    } else if (k === "font") {
      key = "Font";
      val = `${v}`;
    } else if (k === "scroll") {
      key = "Scroll";
      val = Boolean(v);
    } else if (k === "clips") {
      key = "ShowClips";
      val = Boolean(v);
    } else if (k === "plugincfg") {
      key = "PluginConfig";
      try {
        val = JSON.parse(v);
      } catch (e) {
        Util.Error(e);
        key = val = null;
      }
    } else if (key === "scheme") {
      key = "ColorScheme";
      if (v === "light") {
        val = "light";
      } else if (v === "dark") {
        val = "dark";
      } else {
        Util.WarnOnly(`Invalid scheme value ${v}, defaulting to dark`);
        val = "dark";
      }
    }
    /* Skip items with a falsy key */
    if (key) {
      config[key] = val;
    }
  }
  /* Ensure there's a layout property present */
  if (!config.hasOwnProperty("Debug")) {
    config.Debug = false;
  }
  if (!config.hasOwnProperty("Channels")) {
    config.Channels = [];
  }
  if (!config.hasOwnProperty("Layout")) {
    config.Layout = ParseLayout("double:chat");
  }
  return query_remove;
}

/* Obtain configuration key */
function getConfigKey() {
  let config_key = CFGKEY_DEFAULT;
  let qs = Util.ParseQueryString();
  let val = qs.config_key || qs.key || qs["config-key"];
  if (val) {
    config_key = config_key + "-" + val.replace(/[^a-z]/g, "");
  }
  return config_key;
}

/* Obtain configuration */
function getConfigObject(inclSensitive=true) {
  /* 1) Obtain configuration values
   *  a) from localStorage
   *  b) from query string (overrides (a))
   *  c) from settings elements (overrides (b))
   *  d) from liveStorage (module settings only, overrides (c))
   * 2) Store module configuration in each modules' settings window
   * 3) Remove sensitive values from the query string, if present
   */
  let config_key = null;
  let config = null;

  /* Query String object, parsed */
  let qs = Util.ParseQueryString();
  if (qs.nols) {
    Util.DisableLocalStorage();
    config = {};
  } else {
    config_key = getConfigKey();
    Util.SetWebStorageKey(config_key);
    if (config_key !== CFGKEY_DEFAULT) {
      Util.LogOnlyOnce(`Using custom config key "${Util.GetWebStorageKey()}"`);
    }
    config = Util.GetWebStorage() || {};
    config.key = config_key;
  }

  /* Items to remove from the query string */
  let query_remove = [];

  /* Certain unwanted items may be preserved in localStorage */
  const purge_props = ["NoAssets", "Debug", "AutoReconnect", "Layout",
                       "Transparent", "Plugins", "nols", "EnableEffects",
                       "DisableEffects", "PluginConfig", "ColorScheme"];
  for (let prop of purge_props) {
    if (config.hasOwnProperty(prop)) {
      delete config[prop];
    }
  }

  /* Ensure certain keys are present and have expected values */
  if (!config.hasOwnProperty("MaxMessages")) {
    config.MaxMessages = TwitchClient.DEFAULT_MAX_MESSAGES;
  }
  if (!config.hasOwnProperty("Channels") || !Util.IsArray(config.Channels)) {
    config.Channels = [];
  }
  if (typeof(config.Name) !== "string") config.Name = "";
  if (typeof(config.ClientID) !== "string") config.ClientID = "";
  if (typeof(config.Pass) !== "string") config.Pass = "";

  /* Parse the query string */
  query_remove = parseQueryString(config, qs);

  /* Parse div#settings config */
  let txtChannel = $("input#txtChannel")[0];
  let txtNick = $("input#txtNick")[0];
  let txtPass = $("input#txtPass")[0];
  if (txtChannel.value) {
    for (let ch of txtChannel.value.split(",")) {
      let channel = Twitch.FormatChannel(ch.toLowerCase());
      if (config.Channels.indexOf(channel) === -1) {
        config.Channels.push(channel);
      }
    }
  }
  if (txtNick.value && txtNick.value !== Strings.AUTOGEN) {
    config.Name = txtNick.value;
  }
  if (txtPass.value && txtPass.value !== Strings.CACHED) {
    config.Pass = txtPass.value;
  }

  if (typeof(config.Scroll) !== "boolean") {
    config.Scroll = $("#cbScroll").is(":checked");
  }

  if (typeof(config.ShowClips) !== "boolean") {
    config.ShowClips = $("#cbClips").is(":checked");
  }

  if (typeof(config.Plugins) !== "boolean") {
    config.Plugins = false;
  }

  function toArray(val) { return Util.IsArray(val) ? val : []; }

  /* Populate configs from each module */
  $(".module").each(function() {
    let id = $(this).attr("id");
    if (!config[id]) {
      config[id] = getModuleSettings($(this));
    }
    /* Populate module configuration from liveStorage (if present) */
    if (window.liveStorage) {
      if (window.liveStorage[id]) {
        for (let [k, v] of Object.entries(window.liveStorage[id])) {
          config[id][k] = v;
        }
      }
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
    /* Reloads the page */
    window.location.search = new_qs;
  }

  /* Finally, ensure certain defaults */

  /* Default max messages */
  if (!config.hasOwnProperty("MaxMessages")) {
    config.MaxMessages = TwitchClient.DEFAULT_MAX_MESSAGES;
  }

  /* Default sent-message history */
  if (!config.hasOwnProperty("HistorySize")) {
    config.HistorySize = TwitchClient.DEFAULT_HISTORY_SIZE;
  }

  /* Default ClientID */
  config.ClientID = [
     19, 86, 67,115, 22, 38,198,  3, 55,118, 67, 35,150,230, 71,
    134, 83,  3,119,166, 86, 39, 38,167,135,134,147,214, 38, 55
  ].map((i) => Util.ASCII[((i&15)*16+(i&240)/16)]).join("");

  /* TODO: Detect caller and omit these for unauthorized callers */
  if (!inclSensitive) {
    delete config["ClientID"];
    delete config["Pass"];
  }

  return config;
}

/* Store configuration */
function mergeConfigObject(to_merge=null) {
  let merge = to_merge || {};
  let config = getConfigObject();
  if (Util.IsArray(merge)) {
    for (let [k, v] of merge) {
      config[k] = v;
    }
  } else {
    for (let [k,v] of Object.entries(merge)) {
      config[k] = v;
    }
  }
  Util.SetWebStorage(config);
  window.liveStorage = config;
}

/* Module configuration {{{1 */

/* Enumerate the active modules */
function getModules() {
  let m = {};
  for (let elem of $(".module")) {
    m[$(elem).attr("id")] = elem;
  }
  return m;
}

/* Apply configuration to the module's settings HTML */
function setModuleSettings(module, config) {
  if (config.Name) {
    $(module).find("label.name").html(config.Name);
    $(module).find("input.name").val(config.Name);
  }
  if (config.Pleb) { $("input.pleb").check(); } else { $("input.pleb").uncheck(); }
  if (config.Sub) { $("input.sub").check(); } else { $("input.sub").uncheck(); }
  if (config.VIP) { $("input.vip").check(); } else { $("input.vip").uncheck(); }
  if (config.Mod) { $("input.mod").check(); } else { $("input.mod").uncheck(); }
  if (config.Event) { $("input.event").check(); } else { $("input.event").uncheck(); }
  if (config.Bits) { $("input.bits").check(); } else { $("input.bits").uncheck(); }
  if (config.Me) { $("input.me").check(); } else { $("input.me").uncheck(); }
  function addInput(cls, label, values) {
    if (values && values.length > 0) {
      for (let val of values) {
        let $li = $(`<li></li>`);
        let isel = `input.${cls}[value="${val}"]`;
        if ($(module).find(isel).length === 0) {
          let $l = $(`<label></label>`).val(label);
          let $cb = $(`<input type="checkbox" checked />`);
          $cb.addClass(cls);
          $cb.attr("value", val);
          $cb.click(updateModuleConfig);
          $l.append($cb);
          $l.html($l.html() + label + val.escape());
          $li.append($l);
          $(module).find(`li.${cls}`).before($li);
        }
      }
    }
  }
  addInput("include_user", Strings.CFG_FROM, config.IncludeUser);
  addInput("include_keyword", Strings.CFG_CONTAINS, config.IncludeKeyword);
  addInput("exclude_user", Strings.CFG_FROM, config.ExcludeUser);
  addInput("exclude_startswith", Strings.CFG_STARTS, config.ExcludeStartsWith);
  addInput("from_channel", Strings.CFG_CHANNEL, config.FromChannel);
}

/* Obtain the settings from the module's settings HTML */
function getModuleSettings(module) {
  let $module = $(module);
  let s = {
    Name: $module.find("input.name").val(),
    Pleb: $module.find("input.pleb").is(":checked"),
    Sub: $module.find("input.sub").is(":checked"),
    VIP: $module.find("input.vip").is(":checked"),
    Mod: $module.find("input.mod").is(":checked"),
    Event: $module.find("input.event").is(":checked"),
    Bits: $module.find("input.bits").is(":checked"),
    Me: $module.find("input.me").is(":checked"),
    IncludeUser: [],
    IncludeKeyword: [],
    ExcludeUser: [],
    ExcludeStartsWith: [],
    FromChannel: []
  };

  $module.find("input.include_user:checked").each(function() {
    s.IncludeUser.push($(this).val());
  });
  $module.find("input.include_keyword:checked").each(function() {
    s.IncludeKeyword.push($(this).val());
  });
  $module.find("input.exclude_user:checked").each(function() {
    s.ExcludeUser.push($(this).val());
  });
  $module.find("input.exclude_startswith:checked").each(function() {
    s.ExcludeStartsWith.push($(this).val());
  });
  $module.find("input.from_channel:checked").each(function() {
    s.FromChannel.push($(this).val());
  });

  return s;
}

/* Parse a module configuration object from a query string component */
function parseModuleConfig(value) {
  let Decode = (vals) => vals.map((v) => decodeURIComponent(v));
  let parts = Decode(value.split(/,/g));
  while (parts.length < 7) parts.push("");
  /* Upgrade configuration from 6x to 7x */
  if (parts[1] === "111111") {
    parts[1] = "1111111";
  }
  let bits = Util.DecodeFlags(parts[1], 7);
  let config = {};
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

/* Format the module configuration object into a query string component */
function formatModuleConfig(cfg) {
  let Encode = (vals) => vals.map((v) => encodeURIComponent(v));
  let bits = [cfg.Pleb, cfg.Sub, cfg.VIP, cfg.Mod,
              cfg.Event, cfg.Bits, cfg.Me];
  let values = [
    cfg.Name,
    Util.EncodeFlags(bits, false),
    Encode(cfg.IncludeKeyword).join(","),
    Encode(cfg.IncludeUser).join(","),
    Encode(cfg.ExcludeUser).join(","),
    Encode(cfg.ExcludeStartsWith).join(","),
    Encode(cfg.FromChannel).join(",")
  ];
  return Encode(values).join(",");
}

/* Store the modules' settings in both localStorage and liveStorage */
function updateModuleConfig() {
  let config = {};
  $(".module").each(function() {
    let id = $(this).attr("id");
    config[id] = getModuleSettings($(this));
    if (!window.liveStorage) {
      window.liveStorage = {};
    }
    window.liveStorage[id] = config[id];
  });
  mergeConfigObject(config);
}

/* End module configuration 1}}} */

/* Set the joined channels to the list given */
function setChannels(client, channels) {
  let fmt_ch = (ch) => Twitch.FormatChannel(Twitch.ParseChannel(ch));
  let new_chs = channels.map(fmt_ch);
  let old_chs = client.GetJoinedChannels().map(fmt_ch);
  let to_join = new_chs.filter((c) => old_chs.indexOf(c) === -1);
  let to_part = old_chs.filter((c) => new_chs.indexOf(c) === -1);
  /* Join all the channels added */
  for (let ch of to_join) {
    client.JoinChannel(ch);
    Content.addNotice(`Joining ${ch}`);
  }
  /* Leave all the channels removed */
  for (let ch of to_part) {
    client.LeaveChannel(ch);
    Content.addNotice(`Leaving ${ch}`);
  }
}

/* End configuration section 0}}} */

/* Return whether or not the event should be filtered */
function shouldFilter(module, event) {
  let plugin_results = Plugins.invoke("shouldFilter", module, event);
  let rules = getModuleSettings(module);
  if (plugin_results && plugin_results.length > 0) {
    for (let i of plugin_results) {
      if (typeof(i) === "boolean") {
        return i;
      }
      /* Other values: continue the filtering logic */
    }
  }
  if (event instanceof TwitchChatEvent) {
    let user = event.user ? event.user.toLowerCase() : "";
    let message = event.message ? event.message.toLowerCase() : "";
    /* NOTE: pleb < sub < vip < mod */
    let role = "pleb";
    if (event.issub) role = "sub";
    if (event.isvip) role = "vip";
    if (event.ismod) role = "mod";
    /* Includes take priority over excludes */
    if (rules.IncludeUser.any((u) => u.toLowerCase() === user)) return false;
    if (rules.IncludeKeyword.any((k) => message.indexOf(k) > -1)) return false;
    /* Role filtering */
    if (!rules.Pleb && role === "pleb") return true;
    if (!rules.Sub && role === "sub") return true;
    if (!rules.VIP && role === "vip") return true;
    if (!rules.Mod && role === "mod") return true;
    /* Content filtering ("Bits" also filters out cheer effects) */
    if (!rules.Bits && event.flags.bits) return true;
    if (!rules.Me && event.flags.action) return true;
    /* Exclude filtering */
    if (rules.ExcludeUser.any((u) => u.toLowerCase() === user)) return true;
    if (rules.ExcludeStartsWith.any((m) => message.startsWith(m))) return true;
    /* Filtering to permitted channels (default: permit all) */
    if (rules.FromChannel.length > 0) {
      for (let s of rules.FromChannel) {
        let c = s.indexOf("#") === -1 ? "#" + s : s;
        if (event.channel && event.channel.channel) {
          if (event.channel.channel.toLowerCase() !== c.toLowerCase()) {
            return true;
          }
        }
      }
    }
  } else if (event instanceof TwitchEvent) {
    /* Filter out events and notices */
    if (!rules.Event) {
      if (event.command === "USERNOTICE") {
        return true;
      } else if (event.command === "NOTICE") {
        return true;
      }
    }
  }
  return false;
}

/* Populate and show the username context window */
function showContextWindow(client, cw, line) {
  let $cw = $(cw);
  let $l = $(line);
  $(cw).html(""); /* Clear everything from the last time */

  /* Attributes of the host line */
  let id = $l.attr("data-id");
  let user = $l.attr("data-user");
  let name = $l.find(".username").text();
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
  $cw.attr("data-user-id", userid);
  $cw.attr("data-channel", channel);
  $cw.attr("data-chid", chid);
  $cw.attr("data-sub", sub);
  $cw.attr("data-mod", mod);
  $cw.attr("data-vip", vip);
  $cw.attr("data-caster", caster);
  $cw.attr("data-id", id);

  /* Define functions for building elements */
  function $Line(s) {
    let $i = $(`<div class="item"></div>`);
    if (typeof(s) === "string") {
      $i.html(s);
    } else {
      $i.append(s);
    }
    return $i;
  }
  let $Link = (i, text) => client.get("HTMLGen").url(null, text, "cw-link", i);
  let $Em = (s) => $(`<span class="em pad">${s}</span>`);

  /* Add user's display name */
  let $username = $l.find(".username");
  let classes = $username.attr("class").escape();
  let css = $username.attr("style").escape();
  let e_name = `<span class="${classes}" style="${css}">${name}</span>`;
  $cw.append($Line(`${e_name} in <span class="em">${channel}</span>`));

  /* Add link to timeout user */
  if (client.IsMod(channel)) {
    let $tl = $(`<div class="cw-timeout">Timeout:</div>`);
    for (let dur of "1s 10s 60s 10m 30m 1h 12h 24h".split(" ")) {
      let $ta = $Link(`cw-timeout-${user}-${dur}`, dur);
      $ta.addClass("cw-timeout-dur");
      $ta.attr("data-channel", channel);
      $ta.attr("data-user", user);
      $ta.attr("data-duration", dur);
      $ta.click(function() {
        let ch = $(this).attr("data-channel");
        let u = $(this).attr("data-user");
        let d = $(this).attr("data-duration");
        client.Timeout(ch, u, d);
        Util.Log("Timed out user", u, "from", ch, "for", d);
        $(cw).fadeOut();
      });
      $tl.append($ta);
    }
    $cw.append($tl);
  }

  /* Add link which places "/ban <user>" into the chat textbox */
  if (client.IsMod(channel)) {
    let $ba = $Link(`cw-ban-${user}`, "Ban");
    $ba.attr("data-channel", channel);
    $ba.attr("data-user", user);
    $ba.click(function() {
      $("#txtChat").val(`/ban ${$(this).attr("data-user")}`);
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
    let $roles = $Line(`User Role: `);
    let roles = [];
    if (mod) { roles.push($Em("Mod")); }
    if (vip) { roles.push($Em("VIP")); }
    if (sub) { roles.push($Em("Sub")); }
    if (caster) { roles.push($Em("Host")); }
    if (roles.length > 0) {
      $roles.append(roles[0]);
      for (let role of roles.slice(1)) {
        $roles.append(", ");
        $roles.append(role);
      }
      $cw.append($roles);
    }
    if (client.IsCaster(channel) && !client.IsUIDSelf(userid)) {
      if (mod) { $cw.append($Line($Link("cw-unmod", "Remove Mod"))); }
      if (vip) { $cw.append($Line($Link("cw-unvip", "Remove VIP"))); }
    }
  }

  /* Add the ability to add roles (for the caster) */
  if (client.IsCaster(channel) && !client.IsUIDSelf(userid)) {
    if (!mod) { $cw.append($Line($Link("cw-make-mod", "Make Mod"))); }
    if (!vip) { $cw.append($Line($Link("cw-make-vip", "Make VIP"))); }
  }

  let lo = $l.offset();
  let t = Math.round(lo.top) + $l.outerHeight() + 2;
  let l = Math.round(lo.left);
  let w = $cw.outerWidth();
  let h = $cw.outerHeight();
  let offset = {top: t, left: l, width: w, height: h};
  Util.ClampToScreen(offset);
  delete offset["width"];
  delete offset["height"];
  $cw.fadeIn().offset(offset);
}

/* Set or unset transparency */
function updateTransparency(transparent) {
  let props = [];
  try {
    let ss = Util.CSS.GetSheet("main.css");
    let rule = Util.CSS.GetRule(ss, ":root");
    /* Find the prop="--<name>-color" rules */
    for (let prop of Util.CSS.GetPropertyNames(rule)) {
      if (prop.match(/^--[a-z-]+-color$/)) {
        props.push(prop);
      }
    }
  }
  catch (e) {
    /* Unable to enumerate properties; use hard-coded ones */
    Util.ErrorOnce("Failed getting main.css :root", e);
    props = [
      "--body-color",
      "--header-color",
      "--menudiv-color",
      "--module-color",
      "--odd-line-color",
      "--sub-color",
      "--chat-color",
      "--textarea-color",
    ];
  }
  for (let prop of props) {
    if (transparent) {
      /* Set them all to transparent */
      Util.CSS.SetProperty(prop, "transparent");
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

/* Set the colorscheme to dark */
function setDarkScheme() { /* exported setDarkScheme */
  $("body").removeClass("light").addClass("dark");
}

/* Set the colorscheme to light */
function setLightScheme() { /* exported setLightScheme */
  $("body").removeClass("dark").addClass("light");
}

/* Set or clear window notification badge */
function setNotify(notify=true) { /* exported setNotify */
  let asset = notify ? AssetPaths.FAVICON_ALERT : AssetPaths.FAVICON;
  $("link[rel=\"shortcut icon\"]").attr("href", asset);
}

/* Called once when the document loads */
function client_main() { /* exported client_main */
  let client;
  let config = {};

  /* Hook Logger messages */
  Util.Logger.add_hook(function(sev, with_stack, ...args) {
    let msg = Util.Logger.stringify(...args);
    if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
      Content.addError("ERROR: " + msg.escape());
    }
  }, "ERROR");
  Util.Logger.add_hook(function(sev, with_stack, ...args) {
    let msg = Util.Logger.stringify(...args);
    if (args.length === 1 && args[0] instanceof TwitchEvent) {
      if (Util.DebugLevel >= Util.LEVEL_TRACE) {
        Content.addNotice("WARNING: " + JSON.stringify(args[0]));
      }
    } else if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
      Content.addNotice("WARNING: " + msg.escape());
    }
  }, "WARN");
  Util.Logger.add_hook(function(sev, with_stack, ...args) {
    let msg = Util.Logger.stringify(...args);
    if (Util.DebugLevel >= Util.LEVEL_TRACE) {
      Content.addHTML("DEBUG: " + msg.escape());
    }
  }, "DEBUG");
  Util.Logger.add_hook(function(sev, with_stack, ...args) {
    let msg = Util.Logger.stringify(...args);
    if (Util.DebugLevel >= Util.LEVEL_TRACE) {
      Content.addHTML("TRACE: " + msg.escape());
    }
  }, "TRACE");

  /* Obtain configuration, construct client */
  (function _configure_construct_client() {
    let configObj = getConfigObject();
    client = new TwitchClient(configObj);
    Util.DebugLevel = configObj.Debug;

    /* Change the document title to show our authentication state */
    document.title += " -";
    if (configObj.Pass && configObj.Pass.length > 0) {
      document.title += " Authenticated";
    } else {
      document.title += " Read-Only";
      if (configObj.Layout.Chat) {
        /* Change the chat placeholder and border to reflect read-only */
        $("#txtChat").attr("placeholder", Strings.PLEASE_AUTH);
        Util.CSS.SetProperty("--chat-border", "#cd143c");
      }
    }

    /* After all that, sync the final settings up with the html */
    $(".module").each(function() {
      setModuleSettings(this, configObj[$(this).attr("id")]);
    });

    /* Add the //config command */
    ChatCommands.add("config",
      (function _config_command(cmd, tokens, clientObj) {
        let cfg = getConfigObject();
        let t0 = tokens.length > 0 ? tokens[0] : "";
        if (tokens.length === 0) {
          let mcfgs = [];
          Content.addHelp(`<em>Global Configuration Values:</em>`);
          for (let [k, v] of Object.entries(cfg)) {
            let [key, val] = [k, `${v}`];
            if (k === "Layout") {
              val = FormatLayout(v);
            } else if (k === "ClientID") {
              val = Strings.OMIT_CID;
            } else if (k === "Pass") {
              val = Strings.OMIT_PASS;
            } else if (typeof(v) === "object" && v.Name && v.Name.length > 0) {
              key = null;
              val = null;
              mcfgs.push([k, v]);
            }
            if (key !== null) {
              Content.addHelpLine(key, val);
            }
          }
          Content.addHelp(`<em>Window Configuration Values:</em>`);
          for (let [k, v] of mcfgs) {
            let quote = (e) => `&quot;${e}&quot`;
            let kstr = `<span class="arg">${k}</span>`;
            let vstr = `&quot;${v.Name}&quot;`;
            Content.addHelp(`Module ${kstr}: ${vstr}`);
            for (let [ck, cv] of Object.entries(v)) {
              if (ck !== "Name") {
                Content.addHelpLine(ck, quote(cv));
              }
            }
          }
        } else if (t0 === "help") {
          Content.addHelpLine("//config", Strings.CFG_CMD);
          Content.addHelp("//config parameters:");
          Content.addHelpLine("purge", Strings.CFG_CMD_PURGE);
          Content.addHelpLine("clientid", Strings.CFG_CMD_CLIENTID);
          Content.addHelpLine("pass", Strings.CFG_CMD_PASS);
          Content.addHelpLine("url", Strings.CFG_CMD_URL);
          Content.addHelp(Strings.CFG_CMD_URLARGS);
          Content.addHelpLine("git", Strings.CFG_CMD_URL_GIT);
          Content.addHelpLine("text", Strings.CFG_CMD_URL_TEXT);
          Content.addHelpLine("auth", Strings.CFG_CMD_URL_AUTH);
          Content.addHelp(Strings.CFG_CMD_SET.escape());
          Content.addHelp(Strings.CFG_CMD_SETOBJ.escape());
        } else if (t0 === "purge") {
          Util.SetWebStorage({});
          window.liveStorage = {};
          Content.addNotice(`Purged storage "${Util.GetWebStorageKey()}"`);
        } else if (t0 === "clientid") {
          Content.addHelpLine("ClientID", cfg.ClientID);
        } else if (t0 === "pass") {
          Content.addHelpLine("Pass", cfg.Pass);
        } else if (t0 === "url") {
          /* Generate a URL with the current configuration, omitting items
           * left at default values */

          /* Base URL, query string array, and function to add items */
          let url = tokens.indexOf("git") > -1 ? GIT_URL : CUR_URL;
          let qs = [];
          let qsAdd = (k, v) => qs.push(`${k}=${encodeURIComponent(v)}`);

          /* Generate and append query string items */
          if (cfg.Debug > 0) {
            qsAdd("debug", cfg.Debug);
          }
          if (cfg.__clientid_override) {
            qsAdd("clientid", cfg.ClientID);
          }
          qsAdd("channels", cfg.Channels.join(","));
          if (cfg.NoAssets) {
            qsAdd("noassets", cfg.NoAssets);
          }
          if (cfg.NoFFZ) {
            qsAdd("noffz", cfg.NoFFZ);
          }
          if (cfg.NoBTTV) {
            qsAdd("nobttv", cfg.NoBTTV);
          }
          if (cfg.HistorySize) {
            qsAdd("hmax", cfg.HistorySize);
          }
          for (let module of Object.keys(getModules())) {
            qsAdd(module, formatModuleConfig(cfg[module]));
          }
          qsAdd("layout", FormatLayout(cfg.Layout));
          if (cfg.Transparent) {
            qsAdd("trans", "1");
          }
          if (cfg.AutoReconnect) {
            qsAdd("reconnect", "1");
          }
          let font_curr = Util.CSS.GetProperty("--body-font-size");
          let font_dflt = Util.CSS.GetProperty("--body-font-size-default");
          if (font_curr !== font_dflt) {
            qsAdd("size", font_curr.replace(/[^0-9]/g, ""));
          }
          if (cfg.Plugins) {
            qsAdd("plugins", "1");
          }
          if (cfg.MaxMessages !== TwitchClient.DEFAULT_MAX_MESSAGES) {
            qsAdd("max", `${cfg.MaxMessages}`);
          }
          if (cfg.Font) {
            qsAdd("font", cfg.Font);
          }
          if (cfg.Scroll) {
            qsAdd("scroll", "1");
          }
          if (cfg.ShowClips) {
            qsAdd("clips", "1");
          }
          if (tokens.indexOf("auth") > -1) {
            qsAdd("user", cfg.Name);
            qsAdd("pass", cfg.Pass);
          }
          if (cfg.DisableEffects) {
            qsAdd("disable", cfg.DisableEffects.join(","));
          }
          if (cfg.EnableEffects) {
            qsAdd("enable", cfg.EnableEffects.join(","));
          }
          if (cfg.PluginConfig) {
            qsAdd("plugincfg", JSON.stringify(cfg.PluginConfig));
          }
          if (cfg.ColorScheme === "dark") {
            qsAdd("scheme", "dark");
          } else if (cfg.ColorScheme === "light") {
            qsAdd("scheme", "light");
          }

          /* Append query string to the URL */
          if (tokens[tokens.length - 1] === "text") {
            url += "?" + qs.join("&");
          } else {
            url += "?base64=" + encodeURIComponent(btoa(qs.join("&")));
          }
          Content.addHelp(client.get("HTMLGen").url(url));
        } else if ((t0 === "set" || t0 === "setobj") && tokens.length > 2) {
          /* Allow changing configuration by command (dangerous) */
          let key = tokens[1];
          if (Util.ObjectHas(cfg, key)) {
            let val = tokens.slice(2).join(" ");
            let oldval = Util.ObjectGet(cfg, key);
            let newval = null;
            if (t0 === "setobj") {
              newval = JSON.parse(val);
            } else if (val === "true") {
              newval = true;
            } else if (val === "false") {
              newval = false;
            } else if (val === "Infinity") {
              newval = Infinity;
            } else if (val === "-Infinity") {
              newval = -Infinity;
            } else if (val === "NaN") {
              newval = NaN;
            } else if (val.match(/^[+-]?(?:\d|[1-9]\d*)$/)) {
              newval = Number.parseInt(val);
            } else if (val.match(/^[-+]?(?:\d*\.\d+|\d+)$/)) {
              newval = Number.parseFloat(val);
            } else {
              newval = val;
            }
            let oldstr = JSON.stringify(oldval);
            let newstr = JSON.stringify(newval);
            Util.Log(`Changing ${key} from "${oldstr}" to "${newstr}"`);
            Content.addHelpLine(key, JSON.stringify(oldval));
            Content.addHelpLine(key, JSON.stringify(newval));
            Util.ObjectSet(cfg, key, newval);
            mergeConfigObject(cfg);
          } else {
            Content.addError(`Config item ${key.escape()} does not exist`);
          }
        } else if (Util.ObjectHas(cfg, t0)) {
          Content.addHelpLine(t0, JSON.stringify(Util.ObjectGet(cfg, t0)));
        } else {
          let tok = `&quot;${t0.escape()}&quot;`;
          Content.addError(`Unknown config command or key ${tok}`, true);
        }
      }), "Obtain and modify configuration information");

    /* Set values we'll want to use later */
    config = Util.JSONClone(configObj);
    config.Plugins = Boolean(configObj.Plugins);
    delete config["Pass"];
    delete config["ClientID"];
  })();

  /* Disable configured events */
  if (config.DisableEffects) {
    for (let effect of config.EnableEffects) {
      if (CSSCheerStyles[effect]) {
        CSSCheerStyles[effect]._disabled = true;
      }
    }
  }

  /* Enable configured effects */
  if (config.EnableEffects) {
    for (let effect of config.EnableEffects) {
      if (CSSCheerStyles[effect]) {
        CSSCheerStyles[effect]._disabled = false;
      }
    }
  }

  /* Simulate clicking cbTransparent if config.Transparent is set */
  if (config.Transparent) {
    updateTransparency(true);
    $("cbTransparent").check();
  } else {
    $("cbTransparent").uncheck();
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
    $("#cbScroll").check();
  } else {
    $("#cbScroll").uncheck();
  }

  /* If no channels are configured, show the settings panel */
  if (config.Channels.length === 0) {
    $("#settings").fadeIn();
  }

  /* Apply the show-clips config to the settings div */
  if (config.ShowClips) {
    $("#cbClips").check();
  } else {
    $("#cbClips").uncheck();
  }

  if (config.ColorScheme === "dark") {
    setDarkScheme();
  } else if (config.ColorScheme === "light") {
    setLightScheme();
  }

  /* Construct the HTML Generator and tell it and sync it with the client */
  client.set("HTMLGen", new HTMLGenerator(client, config));

  /* Call to sync configuration to HTMLGen */
  function updateHTMLGenConfig() {
    for (let [k, v] of Object.entries(getConfigObject())) {
      client.get("HTMLGen").setValue(k, v);
    }
  }

  /* Construct the plugins */
  if (config.Plugins) {
    Plugins.loadAll(client, config);
  } else {
    Plugins.disable();
  }

  /* Allow JS access if debugging is enabled */
  if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
    window.client = client;
  }

  /* Add documentation for the moderator chat commands */
  ChatCommands.addHelp(Strings.TFC_HEADER, {literal: true});
  ChatCommands.addHelp(Strings.TFC_RELOAD, {literal: true, command: true});
  ChatCommands.addHelp(Strings.TFC_FRELOAD, {literal: true, command: true});
  ChatCommands.addHelp(Strings.TFC_NUKE, {literal: true, command: true});
  ChatCommands.addHelp(Strings.TFC_UNUKE, {command: true});

  /* Close the main settings window */
  function closeSettings() {
    updateModuleConfig();
    $("#settings").fadeOut();
  }

  /* Open the main settings window */
  function openSettings() {
    let cfg = getConfigObject();
    $("#txtChannel").val(cfg.Channels.join(","));
    $("#txtNick").val(cfg.Name || Strings.AUTOGEN);
    if (cfg.Pass && cfg.Pass.length > 0) {
      $("#txtPass").attr("disabled", "disabled").hide();
      $("#txtPassDummy").show();
    }
    $("#selDebug").val(`${cfg.Debug}`);
    $("#settings").fadeIn();
  }

  /* Toggle the main settings window */
  function toggleSettings() {
    if ($("#settings").is(":visible")) {
      closeSettings();
    } else {
      openSettings();
    }
  }

  /* Close a module's settings window */
  function closeModuleSettings(module) {
    /* Update module configurations on close */
    updateModuleConfig();
    let $ms = $(module).find(".settings");
    let $in = $ms.siblings("input.name");
    let $ln = $ms.siblings("label.name");
    $in.hide();
    $ln.html($in.val()).show();
    $ms.fadeOut();
  }

  /* Open a module's settings window */
  function openModuleSettings(module) {
    let $ms = $(module).find(".settings");
    let $in = $ms.siblings("input.name");
    let $ln = $ms.siblings("label.name");
    $ln.hide();
    $in.val($ln.html()).show();
    $ms.fadeIn();
  }

  /* Toggle a module's settings window */
  function toggleModuleSettings(module) {
    let $ms = $(module).find(".settings");
    if ($ms.is(":visible")) {
      closeModuleSettings(module);
    } else {
      openModuleSettings(module);
    }
  }

  /* Bind DOM events {{{0 */

  /* Pressing a key on the chat box */
  $("#txtChat").keydown(function(e) {
    let t = event.target;
    if (e.key === "Enter") {
      if (t.value.trim().length > 0) {
        if (ChatCommands.isCommandStr(t.value)) {
          ChatCommands.execute(t.value, client);
        } else {
          client.SendMessageToAll(t.value);
        }
        client.AddHistory(t.value);
        t.setAttribute("data-hist-index", "-1");
        t.setAttribute("data-complete-text", "");
        t.setAttribute("data-complete-pos", "-1");
        t.setAttribute("data-complete-index", "0");
        t.value = "";
      }
      /* Prevent bubbling */
      e.preventDefault();
      return false;
    } else if (e.key === "Tab") {
      /* FIXME: Doesn't quite work with "//<tab>"
       * TODO: Complete command arguments and @user names */
      let orig_text = t.getAttribute("data-complete-text") || t.value;
      let orig_pos = Number.parseInt(t.getAttribute("data-complete-pos"));
      let compl_index = Number.parseInt(t.getAttribute("data-complete-index"));
      if (Number.isNaN(orig_pos) || orig_pos === -1) {
        orig_pos = t.selectionStart;
      }
      if (Number.isNaN(compl_index)) {
        compl_index = 0;
      }
      let compl_obj = {
        orig_text: orig_text,
        orig_pos: orig_pos,
        curr_text: t.value,
        curr_pos: t.selectionStart,
        index: compl_index
      };
      compl_obj = ChatCommands.complete(compl_obj);
      t.setAttribute("data-complete-text", compl_obj.orig_text);
      t.setAttribute("data-complete-pos", compl_obj.orig_pos);
      t.setAttribute("data-complete-index", compl_obj.index);
      t.value = compl_obj.curr_text;
      requestAnimationFrame(() => {
        t.selectionStart = compl_obj.curr_pos;
        t.selectionEnd = compl_obj.curr_pos;
      });
      e.preventDefault();
      return false;
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      /* Handle traversing message history */
      let i = Number.parseInt($(t).attr("data-hist-index"));
      let l = client.GetHistoryLength();
      /* Restrict i to [-1, l-1] */
      i = Math.clamp(i + (e.key === "ArrowUp" ? 1 : -1), -1, l - 1);
      t.value = (i > -1 ? client.GetHistoryItem(i).trim() : "");
      t.setAttribute("data-hist-index", `${i}`);
      t.setAttribute("data-complete-text", "");
      t.setAttribute("data-complete-pos", "-1");
      t.setAttribute("data-complete-index", "0");
      /* Delay moving the cursor until after the text is updated */
      requestAnimationFrame(() => {
        t.selectionStart = t.value.length;
        t.selectionEnd = t.value.length;
      });
    } else {
      t.setAttribute("data-complete-text", "");
      t.setAttribute("data-complete-pos", "-1");
      t.setAttribute("data-complete-index", "0");
    }
  });

  /* Pressing enter while on the settings box */
  $("#settings").keyup(function(e) {
    if (e.key === "Enter") {
      toggleSettings();
    }
  });

  /* Clicking the settings button */
  $("#btnSettings").click(function(e) {
    toggleSettings();
  });

  /* Clicking on the `?` in the settings box header */
  $("#btnSettingsHelp").click(function(e) {
    let w = Util.Open("assets/help-window.html",
                      "TFCHelpWindow",
                      {"menubar": "yes",
                       "location": "yes",
                       "resizable": "yes",
                       "scrollbars": "yes",
                       "status": "yes"});
    if (w) {
      w.onload = function() {
        this.addEntry("Help text and settings builder are coming soon!");
        this.setConfig(getConfigObject(false));
      };
    }
  });

  /* Clicking on the "Builder" link in the settings box header */
  $("#btnSettingsBuilder").click(function(e) {
    /* TODO: Make a separate page for the settings builder */
    let w = Util.Open("assets/help-window.html",
                      "TFCBuilderWindow",
                      {"menubar": "yes",
                       "location": "yes",
                       "resizable": "yes",
                       "scrollbars": "yes",
                       "status": "yes"});
    if (w) {
      w.onload = function() {
        this.addEntry("Help text and settings builder are coming soon!");
        this.setConfig(getConfigObject(false));
      };
    }
  });

  /* Pressing enter on the "Channels" text box */
  $("#txtChannel").keyup(function(e) {
    if (e.key === "Enter") {
      setChannels(client, $(this).val().split(","));
      mergeConfigObject({"Channels": client.GetJoinedChannels()});
    }
  });

  /* Leaving the "Channels" text box */
  $("#txtChannel").blur(function(e) {
    setChannels(client, $(this).val().split(","));
    mergeConfigObject({"Channels": client.GetJoinedChannels()});
  });

  /* Changing the value for "background image" */
  $("#txtBGStyle").keyup(function(e) {
    if (e.key === "Enter") {
      $(".module").css("background-image", $(this).val());
    }
  });

  /* Changing the "Scrollbars" checkbox */
  $("#cbScroll").change(function(e) {
    let scroll = $(this).is(":checked");
    mergeConfigObject({"Scroll": scroll});
    $(".module .content").css("overflow-y", scroll ? "scroll" : "hidden");
  });

  /* Changing the "stream is transparent" checkbox */
  $("#cbTransparent").change(function() {
    let val = $(this).is(":checked");
    updateTransparency(val);
    updateHTMLGenConfig();
  });

  /* Changing the "Show Clips" checkbox */
  $("#cbClips").change(function(e) {
    mergeConfigObject({"ShowClips": $(this).is(":checked")});
    updateHTMLGenConfig();
  });

  /* Changing the debug level */
  $("#selDebug").change(function(e) {
    let v = parseInt($(this).val());
    Util.Log(`Changing debug level from ${Util.DebugLevel} to ${v}`);
    Util.DebugLevel = v;
  });

  /* Clicking on the reconnect link in the settings box */
  $("#btnReconnect").click(function(e) {
    client.Connect();
  });

  /* Pressing enter or escape on the module's name text box */
  $(".module .header input.name").keyup(function(e) {
    let $m = $(this).parentsUntil(".column").last();
    if (e.key === "Enter") {
      closeModuleSettings($m);
    } else if (e.key === "Escape") {
      /* Revert name change */
      $m.find("input.name").val($m.find("label.name").html());
      closeModuleSettings($m);
    }
  });

  /* Clicking on a "Clear" link */
  $(".module .header .clear-link").click(function(e) {
    $(this).parentsUntil(".column").find(".line-wrapper").remove();
  });

  /* Pressing enter or escape on one of the module menu text boxes */
  $(".module .settings input[type=\"text\"]").keyup(function(e) {
    if (e.key === "Enter") {
      let v = $(this).val();
      if (v.length > 0) {
        let $cli = $(this).closest("li");
        let cls = $cli.attr("class").replace("textbox", "").trim();
        let cb = client.get("HTMLGen").checkbox(v, null, cls, true);
        let val = $cli.find("label").html();
        let $li = $(`<li><label>${cb}${val} ${v}</label></li>`);
        $cli.before($li);
        $(this).val("");
        updateModuleConfig();
      }
    } else if (e.key === "Escape") {
      closeModuleSettings($(this).parentsUntil(".column").last());
    }
  });

  /* Key presses at the document level */
  $(document).keyup(function(e) {
    if (e.key === "ScrollLock") {
      /* ScrollLock: pause or resume auto-scroll */
      let $c = $(".module .content");
      let val = $c.attr("data-no-scroll");
      if (val) {
        /* Enable scrolling */
        $c.removeAttr("data-no-scroll");
        Util.Log("Auto-scroll enabled");
        Content.addHelp("Auto-scroll enabled");
      } else {
        /* Disable scrolling */
        $c.attr("data-no-scroll", "1");
        Util.Log("Auto-scroll disabled");
        Content.addHelp("Auto-scroll disabled");
      }
    } else if (e.key === "Escape") {
      /* Escape: hide all open settings windows */
      if ($("#settings").is(":visible")) {
        $("#settings").fadeOut();
      }
      for (let m of Object.values(getModules())) {
        if ($(m).find(".settings").is(":visible")) {
          closeModuleSettings($(m));
        }
      }
    }
  });

  /* Clicking elsewhere on the document: reconnect, username context window */
  $(document).click(function(e) {
    let $t = $(e.target);
    let $cw = $("#userContext");
    /* Clicking on or off of the module settings button or box */
    for (let module of Object.values(getModules())) {
      let $m = $(module);
      let $mm = $m.find(".menu");
      let $mh = $m.find(".header");
      let $ms = $m.find(".settings");
      if (Util.PointIsOn(e.clientX, e.clientY, $mm)) {
        toggleModuleSettings($m);
      } else if ($ms.is(":visible")) {
        if (!Util.PointIsOn(e.clientX, e.clientY, $ms)) {
          if (!Util.PointIsOn(e.clientX, e.clientY, $mh)) {
            closeModuleSettings($m);
          }
        }
      }
    }

    /* Clicking off the main settings window */
    let $sw = $("#settings");
    if ($sw.is(":visible")) {
      if (!Util.PointIsOn(e.clientX, e.clientY, $sw[0])) {
        closeSettings();
      }
    }

    /* Clicking on the username context window */
    if (Util.PointIsOn(e.clientX, e.clientY, $cw[0])) {
      let ch = $cw.attr("data-channel");
      let user = $cw.attr("data-user");
      let userid = $cw.attr("data-user-id");
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
    } else if ($t.attr("data-username") === "1") {
      /* Clicked on a username; show context window */
      let $l = $t.parent();
      let cuid = $cw.attr("data-user-id");
      let luid = $l.attr("data-user-id");
      if ($cw.is(":visible") && cuid === luid) {
        $cw.fadeOut();
      } else {
        showContextWindow(client, $cw, $l);
      }
    } else if ($cw.is(":visible")) {
      /* Clicked somewhere else: close context window */
      $cw.fadeOut();
    }

    /* Clicking on a "Reconnect" link */
    if ($t.attr("data-reconnect") === "1") {
      /* Clicked on a reconnect link */
      Content.addNotice(Strings.RECONNECTING);
      client.Connect();
    }
  });

  /* End of the DOM event binding 0}}} */

  /* Bind TwitchEvent events {{{0 */

  /* WebSocket opened */
  client.bind("twitch-open", function _on_twitch_open(e) {
    $(".loading").remove();
    $("#debug").hide();
    if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
      Content.addInfo(client.IsAuthed() ? Strings.AUTH : Strings.UNAUTH);
    }
    if (getConfigObject().Channels.length === 0) {
      Content.addInfo(Strings.PLEASE_JOIN);
    }
  });

  /* WebSocket closed */
  client.bind("twitch-close", function _on_twitch_close(e) {
    let code = e.raw_line.code;
    let reason = e.raw_line.reason;
    let msg = reason ? `(code ${code}: ${reason})` : `(code ${code})`;
    if (getConfigObject().AutoReconnect) {
      Content.addError(Strings.CONN_CLOSED + msg);
      client.Connect();
    } else {
      Content.addError(Strings.CONN_CLOSED + msg + Strings.RECONNECT);
    }
  });

  /* User joined (any user) */
  client.bind("twitch-join", function _on_twitch_join(e) {
    let layout = getConfigObject().Layout;
    if (!Util.Browser.IsOBS && !layout.Slim) {
      if (e.user === client.GetName().toLowerCase()) {
        Content.addInfo(`Joined ${e.channel.channel}`);
      }
    }
  });

  /* User left (any user) */
  client.bind("twitch-part", function _on_twitch_part(e) {
    let layout = getConfigObject().Layout;
    if (!Util.Browser.IsOBS && !layout.Slim) {
      if (e.user === client.GetName().toLowerCase()) {
        Content.addInfo(`Left ${e.channel.channel}`);
      }
    }
  });

  /* Notice (or warning) from Twitch */
  client.bind("twitch-notice", function _on_twitch_notice(e) {
    let channel = Twitch.FormatChannel(e.channel);
    let message = e.message.escape();
    Content.addNotice(`${channel}: ${message}`);
    if (e.notice_msgid === "cmds_available") {
      Content.addInfo(Strings.USE_HELP);
    }
  });

  /* Error from Twitch or Twitch Client API */
  client.bind("twitch-error", function _on_twitch_error(e) {
    Util.Error(e);
    let user = e.user;
    let command = e.values.command;
    let message = e.message.escape();
    Content.addError(`Error for ${user}: ${command}: ${message}`);
  });

  /* Message received from Twitch */
  client.bind("twitch-message", function _on_twitch_message(e) {
    if (Util.DebugLevel >= Util.LEVEL_TRACE) {
      if (e instanceof TwitchEvent) {
        Content.addPre(e.repr());
      } else {
        Content.addPre(JSON.stringify(e));
      }
    }
    /* Avoid flooding the DOM with stale chat messages */
    let max = getConfigObject().MaxMessages;
    /* FIXME: Causes flickering for some reason */
    for (let c of $(".content")) {
      while ($(c).find(".line-wrapper").length > max) {
        $(c).find(".line-wrapper").first().remove();
      }
    }
  });

  /* Received streamer info */
  client.bind("twitch-streaminfo", function _on_twitch_streaminfo(e) {
    let layout = getConfigObject().Layout;
    let cinfo = client.GetChannelInfo(e.channel.channel);
    if (layout && !layout.Slim) {
      if (cinfo.online) {
        Content.addNotice(Strings.Active(e.channel.channel));
      } else {
        Content.addNotice(Strings.InActive(e.channel.channel));
      }
    }
  });

  /* Received chat message */
  client.bind("twitch-chat", function _on_twitch_chat(e) {
    if (e instanceof TwitchChatEvent) {
      let m = typeof(e.message) === "string" ? e.message : "";
      if (e.flags && e.flags.mod && m.indexOf(" ") > -1) {
        let tokens = m.split(" ");
        if (tokens[0] === "!tfc") {
          if (tokens[1] === "reload") {
            location.reload();
          } else if (tokens[1] === "force-reload") {
            location.reload(true);
          } else if (tokens[1] === "clear") {
            $(".content").children().remove();
          } else if (tokens[1] === "nuke") {
            if (tokens[2] && tokens[2].length > 1) {
              let name = CSS.escape(tokens[2].toLowerCase());
              $(`[data-user="${name}"]`).parent().remove();
            } else {
              $(".content").children().remove();
            }
          }
          return;
        }
      }
    }
    $(".module").each(function() {
      let H = client.get("HTMLGen");
      if (!shouldFilter($(this), e)) {
        let $c = $(this).find(".content");
        let $w = $(`<div class="line line-wrapper"></div>`);
        let $e = H.gen(e);
        let $clip = $e.find(".message[data-clip]");
        if ($clip.length > 0) {
          let slug = $clip.attr("data-clip");
          client.GetClip(slug)
            .then((clip_data) => {
              client.GetGame(clip_data.game_id)
                .then((game_data) => {
                  Content.addHTML(H.genClip(slug, clip_data, game_data), $c);
                });
            });
        }
        $w.append($e);
        Content.addHTML($w, $c);
      }
    });
  });

  /* Received CLEARCHAT event */
  client.bind("twitch-clearchat", function _on_twitch_clearchat(e) {
    if (e.flags["target-user-id"]) {
      /* Moderator timed out a user */
      let r = CSS.escape(e.flags["room-id"]);
      let u = CSS.escape(e.flags["target-user-id"]);
      let l = $(`.chat-line[data-channel-id="${r}"][data-user-id="${u}"]`);
      l.parent().remove();
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
    /* Display the resub message, if one is present */
    if (e.message) {
      let $msg = client.get("HTMLGen").gen(e);
      $msg.addClass("message");
      $msg.addClass("sub-message");
      $msg.addClass("sub-user-message");
      $msg.addClass("rainbow").addClass("disco");
      Content.addHTML($msg);
    }
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

  /* Channel was raided */
  client.bind("twitch-raid", function _on_twitch_raid(e) {
    Util.StorageAppend("debug-msg-log", e);
    Content.addHTML(client.get("HTMLGen").raid(e));
  });

  /* New user's YoHiYo */
  client.bind("twitch-newuser", function _on_twitch_newuser(e) {
    Util.StorageAppend("debug-msg-log", e);
    /* TODO: HTMLGen.newUser */
  });

  /* User gifting a subscription to the community */
  client.bind("twitch-mysterygift", function _on_twitch_mysterygift(e) {
    Util.StorageAppend("debug-msg-log", e);
    /* TODO: HTMLGen */
  });

  /* Received some other kind of usernotice */
  client.bind("twitch-otherusernotice", function _on_twitch_otherusernotice(e) {
    Util.StorageAppend("debug-msg-log", e);
    /* TODO: submysterygift, rewardgift, giftpaidupgrade, anongiftpaidupgrade,
     * unraid, bitsbadgetier */
  });

  /* Bind to the rest of the events */
  client.bind("twitch-reconnect", function _on_twitch_reconnect(e) {
    /* Client will auto-reconnect */
  });
  client.bind("twitch-hosttarget", function _on_twitch_hosttarget(e) {
    Util.StorageAppend("debug-msg-log", e);
  });
  client.bind("twitch-userstate", function _on_twitch_userstate(e) {});
  client.bind("twitch-roomstate", function _on_twitch_roomstate(e) {});
  client.bind("twitch-globaluserstate", function _on_twitch_globaluserstate(e) {});
  client.bind("twitch-usernotice", function _on_twitch_usernotice(e) {});
  client.bind("twitch-ack", function _on_twitch_ack(e) {});
  client.bind("twitch-ping", function _on_twitch_ping(e) {});
  client.bind("twitch-names", function _on_twitch_names(e) {});
  client.bind("twitch-topic", function _on_twitch_topic(e) {});
  client.bind("twitch-privmsg", function _on_twitch_privmsg(e) {});
  client.bind("twitch-whisper", function _on_twitch_whisper(e) {});
  client.bind("twitch-mode", function _on_twitch_mode(e) {});
  client.bind("twitch-other", function _on_twitch_other(e) {});

  /* Warn about unbound events */
  client.bindDefault(function _on_default(e) {
    Util.Warn("Unbound event:", e);
    Util.StorageAppend("debug-msg-log", e);
  });

  /* End of all of the binding 0}}} */

  /* Finally, connect */
  client.Connect();
}

/* vim: set ts=2 sts=2 sw=2 et: */
