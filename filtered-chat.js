/* Twitch Filtered Chat Main Module */

"use strict";

/* FIXME:
 * HTMLGen @user transform broken
 * HTMLGen shows Tier 1 subs as "1000"
 * HTMLGen shows Tier 2+ subs as "1000" (unconfirmed)
 * Configuration is lost if &module configuration is present
 *  getConfigObject overrides changes with query string
 * Subscribe messages aren't shown with subscribe alerts
 */

/* TODO:
 * Add to #settings help link
 * Add to #settings config link
 * Finish badge information on hover
 * Add clip information on hover
 * Add emote information on hover
 * Add layout selection box to #settings (reloads page on change)
 * Hide getConfigObject() within client_main()
 * Fix cssmarquee: .line::-webkit-scrollbar { display: none; } or something
 */

/* IDEAS:
 * Allow for a configurable number of columns?
 * Add re-include (post-exclude) filtering options?
 */

/* NOTES:
 * Filtering ws "recv>" messages (to console):
 *   Util.Logger.add_filter(((m) => !`${m}`.startsWith("recv> ")), "DEBUG")
 * Filtering ws PRIVMSG messages (to console):
 *   Util.Logger.add_filter(((m) => `${m}`.indexOf(" PRIVMSG ") === -1, "DEBUG")
 */

const CACHED_VALUE = "Cached";
const AUTOGEN_VALUE = "Auto-Generated";
const CFGKEY_DEFAULT = "tfc-config";

/* Document writing functions {{{0 */

class Content { /* exported Content */
  static addHTML(content, container=null, callbacks=null) {
    let $Line = $(`<div class="line line-wrapper"></div>`);
    let $Container = container ? $(container) : $(".module").find(".content");
    let $Content = $(content);
    if (callbacks) {
      for (let cb of callbacks) {
        cb($Content);
      }
    }
    $Line.append($Content);
    $Container.append($Line);
    $Container.scrollTop(Math.pow(2, 31) - 1);
  }
  static addPre(content) {
    Content.addHTML($(`<div class="pre"></div>`).html(content));
  }
  static addInfo(content, pre=false) {
    let e = $(`<div class="info"></div>`).html(content);
    if (pre) e.addClass("pre");
    Content.addHTML(e);
  }
  static addNotice(content, pre=false) {
    let e = $(`<div class="notice"></div>`).html(content);
    if (pre) e.addClass("pre");
    Content.addHTML(e);
  }
  static addError(content, pre=false) {
    let e = $(`<div class="error"></div>`).html(content);
    if (pre) e.addClass("pre");
    Content.addHTML(e);
  }
  static addHelp(s) {
    Content.addPre($(`<div class="help pre">${s}</div>`));
  }
  static addHelpLine(c, s) {
    Content.addPre(ChatCommands.helpLine(c, s));
  }
}

/* End document writing functions 0}}} */

/* Begin configuration section {{{0 */

/* Merge the query string into the config object given and return removals */
function parseQueryString(config, qs=null) {
  let qs_data;
  if (qs === null) {
    qs = window.location.search;
    qs_data = Util.ParseQueryString(qs);
  } else if (typeof(qs) === "string") {
    qs_data = Util.ParseQueryString(qs);
  } else if (typeof(qs) === "object") {
    qs_data = qs;
  }

  /* Ensure debug and channels attributes exist, at the very least */
  if (!qs_data.hasOwnProperty("debug")) qs_data.debug = false;
  if (typeof(qs_data.channels) !== "string") qs_data.channels = "";

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
      if (v === "debug") val = Util.LEVEL_DEBUG;
      else if (v === "trace") val = Util.LEVEL_TRACE;
      else if (typeof(v) === "number") val = v;
      else val = Number(Boolean(v));
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
      val = typeof(v) === "number" ? v : TwitchClient.DEFAULT_HISTORY_SIZE;
    } else if (k.match(/^module[12]?$/)) {
      key = k === "module" ? "module1" : k;
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
      val = v ? true : false;
    } else if (k === "disable") {
      for (let e of `${v}`.split(",")) {
        if (CSSCheerStyles[e]) {
          CSSCheerStyles[e]._disabled = true;
        }
      }
    } else if (k === "enable") {
      for (let e of `${v}`.split(",")) {
        if (CSSCheerStyles[e]) {
          CSSCheerStyles[e]._disabled = false;
        }
      }
    } else if (k === "max") {
      key = "MaxMessages";
      if (typeof(v) === "number") {
        val = v;
      } else {
        val = TwitchClient.DEFAULT_MAX_MESSAGES;
      }
    } else if (k === "font") {
      key = "Font";
      val = `${v}`;
    } else if (k === "scroll") {
      key = "Scroll";
      val = v ? true : false;
    } else if (k === "clips") {
      key = "ShowClips";
      val = v ? true : false;
    }
    config[key] = val;
  }
  /* Ensure there's a layout property present */
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
      Util.LogOnly(`Using custom config key "${Util.GetWebStorageKey()}"`);
    }
    config = Util.GetWebStorage() || {};
    config.key = config_key;
  }

  /* Items to remove from the query string */
  let query_remove = [];

  /* Certain unwanted items may be preserved in localStorage */
  if (config.hasOwnProperty("NoAssets")) delete config["NoAssets"];
  if (config.hasOwnProperty("Debug")) delete config["Debug"];
  if (config.hasOwnProperty("AutoReconnect")) delete config["AutoReconnect"];
  if (config.hasOwnProperty("Layout")) delete config["Layout"];
  if (config.hasOwnProperty("Plugins")) delete config["Plugins"];
  if (config.hasOwnProperty("nols")) delete config["nols"];
  if (config.hasOwnProperty("enable")) delete config["enable"];
  if (config.hasOwnProperty("disable")) delete config["disable"];

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
  if (txtNick.value && txtNick.value !== AUTOGEN_VALUE) {
    config.Name = txtNick.value;
  }
  if (txtPass.value && txtPass.value !== CACHED_VALUE) {
    config.Pass = txtPass.value;
  }

  if (typeof(config.Scroll) !== "boolean") {
    config.Scroll = $("#cbScroll").is(":checked");
  }

  if (typeof(config.ShowClips) !== "boolean") {
    config.ShowClips = $("#cbClips").is(":checked");
  }

  function toArray(val) { return Util.IsArray(val) ? val : []; }

  /* Populate configs for each module */
  $(".module").each(function() {
    let id = $(this).attr("id");
    if (!config[id]) { config[id] = getModuleSettings($(this)); }
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
    window.location.search = new_qs;
  }

  /* Default ClientID */
  config.ClientID = [
     19, 86, 67,115, 22, 38,198,  3, 55,118, 67, 35,150,230, 71,
    134, 83,  3,119,166, 86, 39, 38,167,135,134,147,214, 38, 55
  ].map((i) => Util.ASCII[((i&15)*16+(i&240)/16)]).join("");

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
}

/* Module configuration {{{1 */

/* Apply configuration to the module's settings HTML */
function setModuleSettings(module, config) {
  if (config.Name) {
    $(module).find("label.name").html(config.Name);
    $(module).find("input.name").val(config.Name);
  }
  function check(sel) { $(module).find(sel).attr("checked", "checked"); }
  function uncheck(sel) { $(module).find(sel).removeAttr("checked"); }
  if (config.Pleb) { check("input.pleb"); } else { uncheck("input.pleb"); }
  if (config.Sub) { check("input.sub"); } else { uncheck("input.sub"); }
  if (config.VIP) { check("input.vip"); } else { uncheck("input.vip"); }
  if (config.Mod) { check("input.mod"); } else { uncheck("input.mod"); }
  if (config.Event) { check("input.event"); } else { uncheck("input.event"); }
  if (config.Bits) { check("input.bits"); } else { uncheck("input.bits"); }
  if (config.Me) { check("input.me"); } else { uncheck("input.me"); }
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
  addInput("include_user", "From user: ", config.IncludeUser);
  addInput("include_keyword", "Contains: ", config.IncludeKeyword);
  addInput("exclude_user", "From user: ", config.ExcludeUser);
  addInput("exclude_startswith", "Starts with: ", config.ExcludeStartsWith);
  addInput("from_channel", "Channel:", config.FromChannel);
}

/* Obtain the settings from the module's settings HTML */
function getModuleSettings(module) {
  module = $(module);
  let s = {
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

  module.find("input.include_user:checked").each(function() {
    s.IncludeUser.push($(this).val());
  });
  module.find("input.include_keyword:checked").each(function() {
    s.IncludeKeyword.push($(this).val());
  });
  module.find("input.exclude_user:checked").each(function() {
    s.ExcludeUser.push($(this).val());
  });
  module.find("input.exclude_startswith:checked").each(function() {
    s.ExcludeStartsWith.push($(this).val());
  });
  module.find("input.from_channel:checked").each(function() {
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
  let bits = [cfg.Pleb, cfg.Sub, cfg.VIP, cfg.Mod, cfg.Event, cfg.Bits, cfg.Me];
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

/* Store the modules' settings in the localStorage */
function updateModuleConfig() {
  let config = {};
  $(".module").each(function() {
    config[$(this).attr("id")] = getModuleSettings($(this));
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
  let rules = getModuleSettings(module);
  if (event instanceof TwitchChatEvent) {
    let user = event.user ? event.user.toLowerCase() : "";
    let message = event.message ? event.message.toLowerCase() : "";
    /* sub < vip < mod for classification */
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
  let $Line = (s) => $(`<div class="item">${s}</div>`);
  let Link = (i, text) => client.get("HTMLGen").url(null, text, "cw-link", i);
  let $Em = (s) => $(`<span class="em pad">${s}</span>`);

  /* Add user's display name */
  let $username = $l.find(".username");
  let classes = $username.attr("class");
  let css = $username.attr("style");
  let e_name = `<span class="${classes}" style="${css}">${name}</span>`;
  $cw.append($Line(`${e_name} in <span class="em">${channel}</span>`));

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
    let $ba = $(Link(`cw-ban-${user}`, "Ban"));
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
    let $roles = $Line(`User Role:`);
    if (mod) { $roles.append($Em("Mod")); $roles.append(","); }
    if (vip) { $roles.append($Em("VIP")); $roles.append(","); }
    if (sub) { $roles.append($Em("Sub")); $roles.append(","); }
    if (caster) { $roles.append($Em("Host")); $roles.append(","); }
    /* Remove the last comma */
    $roles[0].removeChild($roles[0].lastChild);
    $cw.append($roles);
    if (client.IsCaster(channel) && !client.IsUIDSelf(userid)) {
      if (mod) { $cw.append($Line(Link("cw-unmod", "Remove Mod"))); }
      if (vip) { $cw.append($Line(Link("cw-unvip", "Remove VIP"))); }
    }
  }

  /* Add the ability to add roles (for the caster) */
  if (client.IsCaster(channel) && !client.IsUIDSelf(userid)) {
    if (!mod) { $cw.append($Line(Link("cw-make-mod", "Make Mod"))); }
    if (!vip) { $cw.append($Line(Link("cw-make-vip", "Make VIP"))); }
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
    Util.Error("Failed getting main.css :root", e);
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

/* Set or clear window notification badge */
function setNotify(notify=true) { /* exported setNotify */
  let asset = notify ? AssetPaths.FAVICON_ALERT : AssetPaths.FAVICON;
  $("link[rel=\"shortcut icon\"]").attr("href", asset);
}

/* Called once when the document loads */
function client_main(layout) { /* exported client_main */
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
          Content.addHelp(`<em>Global Configuration:</em>`);
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
          Content.addHelp(`<em>Window Configurations:</em>`);
          for (let [k, v] of mcfgs) {
            let quote = (e) => `&quot;${e}&quot`;
            Content.addHelp(`Module <span class="arg">${k}</span>: ${quote(v.Name)}`);
            for (let [ck, cv] of Object.entries(v)) {
              if (ck !== "Name") {
                Content.addHelpLine(ck, quote(cv));
              }
            }
          }
        } else if (t0 === "help") {
          Content.addHelpLine("//config", "Show global and module configurations");
          Content.addHelp("//config parameters:");
          Content.addHelpLine("purge", "Clear local storage (cannot be undone!)");
          Content.addHelpLine("clientid", "Displays ClientID");
          Content.addHelpLine("pass", "Displays OAuth token (if specified)");
          Content.addHelpLine("url", "Generate a URL from the current config");
          Content.addHelp("//config url parameters (can be used in any order):");
          Content.addHelpLine("git", "Generate link using github.io");
          Content.addHelpLine("text", "Don't base64-encode the URL");
          Content.addHelpLine("auth", "Include ClientID and OAuth information");
          Content.addHelp("//config set &lt;key&gt; &lt;value&gt;: change &lt;key&gt; to &lt;value&gt; (dangerous)");
        } else if (t0 === "purge") {
          Util.SetWebStorage({});
          Content.addNotice(`Purged storage "${Util.GetWebStorageKey()}"`);
        } else if (t0 === "clientid") {
          Content.addHelpLine("ClientID", cfg.ClientID);
        } else if (t0 === "pass") {
          Content.addHelpLine("Pass", cfg.Pass);
        } else if (t0 === "url") {
          let url = "";
          let qs = [];
          let qsAdd = (k, v) => qs.push(`${k}=${encodeURIComponent(v)}`);
          if (tokens.indexOf("git") > -1) {
            url = "https://kaedenn.github.io/twitch-filtered-chat/index.html";
          } else {
            url = window.location.protocol + "//" +
                  window.location.hostname +
                  window.location.pathname;
          }
          if (cfg.Debug > 0) { qsAdd("debug", cfg.Debug); }
          if (cfg.__clientid_override) { qsAdd("clientid", cfg.ClientID); }
          qsAdd("channels", cfg.Channels.join(","));
          if (cfg.NoAssets) { qsAdd("noassets", cfg.NoAssets); }
          if (cfg.NoFFZ) { qsAdd("noffz", cfg.NoFFZ); }
          if (cfg.NoBTTV) { qsAdd("nobttv", cfg.NoBTTV); }
          if (cfg.HistorySize) { qsAdd("hmax", cfg.HistorySize); }
          /* TODO: Allow for more than 2 modules */
          qsAdd("module1", formatModuleConfig(cfg.module1));
          qsAdd("module2", formatModuleConfig(cfg.module2));
          qsAdd("layout", FormatLayout(cfg.Layout));
          if (cfg.Transparent) { qsAdd("trans", "1"); }
          if (cfg.AutoReconnect) { qsAdd("reconnect", "1"); }
          let font_curr = Util.CSS.GetProperty("--body-font-size");
          let font_dflt = Util.CSS.GetProperty("--body-font-size-default");
          if (font_curr !== font_dflt) {
            qsAdd("size", font_curr.replace(/[^0-9]/g, ""));
          }
          if (cfg.Plugins) { qsAdd("plugins", "1"); }
          if (cfg.MaxMessages !== TwitchClient.DEFAULT_MAX_MESSAGES) {
            qsAdd("max", `${cfg.MaxMessages}`);
          }
          if (cfg.Font) { qsAdd("font", cfg.Font); }
          if (cfg.Scroll) { qsAdd("scroll", "1"); }
          if (cfg.ShowClips) { qsAdd("clips", "1"); }
          if (tokens.indexOf("auth") > -1) {
            qsAdd("user", cfg.Name);
            qsAdd("pass", cfg.Pass);
          }
          if (tokens[tokens.length - 1] === "text") {
            url += "?" + qs.join("&");
          } else {
            url += "?base64=" + encodeURIComponent(btoa(qs.join("&")));
          }
          Content.addHelp(client.get("HTMLGen").url(url));
        } else if (t0 === "set" || t0 === "setobj" && tokens.length > 2) {
          let key = tokens[1];
          let val = tokens.slice(2).join(" ");
          let valobj = null;
          /* TODO: allow //config set module1.Bits true */
          if (t0 === "setobj") {
            valobj = JSON.parse(val);
          } else if (val === "true") {
            valobj = true;
          } else if (val === "false") {
            valobj = false;
          } else if (val.match(/^[+-]?[1-9][0-9]*$/)) {
            valobj = Number.parseInt(val);
          } else if (val.match(/^[-+]?(?:[0-9]*\.[0-9]+|[0-9]+)$/)) {
            valobj = Number.parseFloat(val);
          }
          Util.Log(`Changing ${key} from "${cfg[key]}" to "${JSON.stringify(valobj)}"`);
          Content.addHelpLine(key, JSON.stringify(cfg[key]));
          Content.addHelpLine(key, JSON.stringify(valobj));
          /* TODO */
          Content.addNotice("Not yet implemented");
        } else if (cfg.hasOwnProperty(t0)) {
          Content.addHelpLine(t0, JSON.stringify(cfg[t0]));
        } else {
          Content.addError(`Unknown config key &quot;${tokens[0]}&quot;`, true);
        }
      }), "Obtain and modify configuration information");

    /* Set values we'll want to use later */
    config = Util.JSONClone(configObj);
    delete config["Pass"];
    delete config["ClientID"];
    config.Plugins = configObj.Plugins ? true : false;
    config.MaxMessages = configObj.MaxMessages || 100;
  })();

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

  /* If no channels are configured, show the settings panel */
  if (config.Channels.length === 0) {
    $("#settings").fadeIn();
  }

  /* Apply the show-clips config to the settings div */
  if (config.ShowClips) {
    $("#cbClips").attr("checked", "checked");
  } else {
    $("#cbClips").removeAttr("checked");
  }

  /* Construct the HTML Generator and tell it and the client about each other */
  client.set("HTMLGen", new HTMLGenerator(client, config));

  /* Call to sync configuration to HTMLGen */
  function updateHTMLGenConfig() {
    let configObj = Util.JSONClone(getConfigObject());
    delete configObj["Pass"];
    delete configObj["ClientID"];
    configObj.Plugins = Boolean(configObj.Plugins);
    for (let [k, v] of Object.entries(configObj)) {
      client.get("HTMLGen").setValue(k, v);
    }
  }

  /* Construct the plugins */
  try {
    if (config.Plugins) {
      Plugins.loadAll(client);
    } else {
      Plugins.disable();
    }
  }
  catch (e) {
    if (e.name !== "ReferenceError") {
      throw e;
    } else {
      Util.Warn("Plugins object not present");
    }
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

  /* Bind all of the page assets {{{0 */

  /* Sending a chat message */
  $("#txtChat").keydown(function(e) {
    const isUp = (e.keyCode === Util.Key.UP);
    const isDown = (e.keyCode === Util.Key.DOWN);
    let t = event.target;
    if (e.keyCode === Util.Key.RETURN) {
      if (t.value.trim().length > 0) {
        if (ChatCommands.isCommandStr(t.value)) {
          ChatCommands.execute(t.value, client);
        } else {
          client.SendMessageToAll(t.value);
        }
        client.AddHistory(t.value);
        t.setAttribute("hist-index", "-1");
        t.value = "";
      }
      /* Prevent bubbling */
      e.preventDefault();
      return false;
    } else if (isUp || isDown) {
      /* Handle traversing message history */
      let i = Number.parseInt($(t).attr("hist-index"));
      let l = client.GetHistoryLength();
      if (isUp) {
        i = (i + 1 >= l - 1 ? l - 1 : i + 1);
      } else if (isDown) {
        i = (i - 1 < 0 ? -1 : i - 1);
      }
      t.value = (i > -1 ? client.GetHistoryItem(i).trim() : "");
      $(t).attr("hist-index", `${i}`);
      /* Delay moving the cursor until after the text is updated */
      requestAnimationFrame(() => {
        t.selectionStart = t.value.length;
        t.selectionEnd = t.value.length;
      });
    }
  });

  /* Pressing enter while on the settings box */
  $("#settings").keyup(function(e) {
    if (e.keyCode === Util.Key.RETURN) {
      updateModuleConfig();
      $("#btnSettings").click();
    }
  });

  /* Clicking the settings button */
  $("#btnSettings").click(function() {
    if ($("#settings").is(":visible")) {
      $("#settings").fadeOut();
    } else {
      let configObj = getConfigObject();
      $("#txtChannel").val(configObj.Channels.join(","));
      $("#txtNick").val(configObj.Name || AUTOGEN_VALUE);
      if (configObj.Pass && configObj.Pass.length > 0) {
        $("#txtPass").attr("disabled", "disabled").hide();
        $("#txtPassDummy").show();
      }
      $("#selDebug").val(`${configObj.Debug}`);
      $("#settings").fadeIn();
    }
  });

  /* Clicking on the `?` in the settings box header */
  $("#settings-help").click(function() {
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
      }
    }
  });

  /* Pressing enter on the "Channels" text box */
  $("#txtChannel").keyup(function(e) {
    if (e.keyCode === Util.Key.RETURN) {
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
    if (e.keyCode === Util.Key.RETURN) {
      $(".module").css("background-image", $(this).val());
    }
  });

  /* Changing the "Scrollbars" checkbox */
  $("#cbScroll").change(function() {
    let scroll = $(this).is(":checked");
    mergeConfigObject({"Scroll": scroll});
    if (scroll) {
      $(".module .content").css("overflow-y", "scroll");
    } else {
      $(".module .content").css("overflow-y", "hidden");
    }
  });

  /* Changing the "stream is transparent" checkbox */
  $("#cbTransparent").change(function() {
    let val = $(this).is(":checked");
    updateTransparency(val);
    updateHTMLGenConfig();
  });

  /* Changing the "Show Clips" checkbox */
  $("#cbClips").change(function() {
    mergeConfigObject({"ShowClips": $(this).is(":checked")});
    updateHTMLGenConfig();
  });

  /* Changing the debug level */
  $("#selDebug").change(function() {
    let v = parseInt($(this).val());
    Util.Log(`Changing debug level from ${Util.DebugLevel} to ${v}`);
    Util.DebugLevel = v;
  });

  /* Clicking on the reconnect link in the settings box */
  $("#reconnect").click(function() {
    client.Connect();
  });

  /* Opening one of the module menus */
  $(".menu").click(function() {
    let $settings = $(this).parent().children(".settings");
    let $lbl = $(this).parent().children("label.name");
    let $tb = $(this).parent().children("input.name");
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
  $(".module .header input.name").on("keyup", function(e) {
    if (e.keyCode === Util.Key.RETURN) {
      let $settings = $(this).parent().children(".settings");
      let $lbl = $(this).parent().children("label.name");
      let $tb = $(this).parent().children("input.name");
      $tb.hide();
      $lbl.html($tb.val()).show();
      $settings.fadeToggle();
      updateModuleConfig();
    }
  });

  /* Clicking on a "Clear" link */
  $(".module .header .clear-link").click(function() {
    /* TODO: ESCAPE */
    $(`#${$(this).attr("data-for")} .content`).find(".line-wrapper").remove();
  });

  /* Pressing enter on one of the module menu text boxes */
  $(".module .settings input[type=\"text\"]").on("keyup", function(e) {
    let v = $(this).val();
    if (v.length > 0) {
      if (e.keyCode === Util.Key.RETURN) {
        let $cli = $(this).closest("li");
        let cls = $cli.attr("class").replace("textbox", "").trim();
        let cb = client.get("HTMLGen").checkbox(v, null, cls, true);
        let val = $cli.find("label").html();
        let $li = $(`<li><label>${cb}${val} ${v}</label></li>`);
        $cli.before($li);
        $(this).val("");
        updateModuleConfig();
      }
    }
  });

  /* Clicking elsewhere on the document: reconnect, username context window */
  $(document).click(function(e) {
    let $t = $(e.target);
    let $cw = $("#userContext");
    let $m1s = $("#module1 .settings");
    let $m2s = $("#module2 .settings");
    let $m1h = $("#module1 .header");
    let $m2h = $("#module2 .header");
    /* Clicking off of module1 settings: hide it */
    if ($m1s.length > 0 && $m1s.is(":visible")) {
      if (!Util.PointIsOn(e.clientX, e.clientY, $m1s[0])
          && !Util.PointIsOn(e.clientX, e.clientY, $m1h[0])) {
        updateModuleConfig();
        let $tb = $m1s.siblings("input.name").hide();
        $m1s.siblings("label.name").html($tb.val()).show();
        $m1s.fadeOut();
      }
    }
    /* Clicking off of module2 settings: hide it */
    if ($m2s.length > 0 && $m2s.is(":visible")) {
      if (!Util.PointIsOn(e.clientX, e.clientY, $m2s[0])
          && !Util.PointIsOn(e.clientX, e.clientY, $m2h[0])) {
        updateModuleConfig();
        let $tb = $m2s.siblings("input.name").hide();
        $m2s.siblings("label.name").html($tb.val()).show();
        $m2s.fadeOut();
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
      if ($cw.is(":visible") &&
          $cw.attr("data-user-id") === $l.attr("data-user-id")) {
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
      Content.addNotice(`Reconnecting...`);
      client.Connect();
    }
  });

  /* End of the DOM event binding 0}}} */

  /* Bind to numerous TwitchEvent events {{{0 */

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
      Content.addError("Connection closed " + msg);
      client.Connect();
    } else {
      Content.addError("Connection closed " + msg + Strings.RECONNECT);
    }
  });

  /* Received reconnect command from Twitch */
  client.bind("twitch-reconnect", function _on_twitch_reconnect(e) {
    client.Connect();
  });

  /* User joined (any user) */
  client.bind("twitch-join", function _on_twitch_join(e) {
    if (!Util.Browser.IsOBS && !layout.Slim) {
      if (e.user === client.GetName().toLowerCase()) {
        Content.addInfo(`Joined ${e.channel.channel}`);
      }
    }
  });

  /* User left (any user) */
  client.bind("twitch-part", function _on_twitch_part(e) {
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
    let max = getConfigObject().MaxMessages || 100;
    for (let c of $(".content")) {
      while ($(c).find(".line-wrapper").length > max) {
        $(c).find(".line-wrapper").first().remove();
      }
    }
  });

  /* Received streamer info */
  client.bind("twitch-streaminfo", function _on_twitch_streaminfo(e) {
    let cinfo = client.GetChannelInfo(e.channel.channel);
    if (!cinfo.online) {
      if (config.Layout && !config.Layout.Slim) {
        Content.addNotice(`${e.channel.channel} is not currently streaming`);
      }
    }
  });

  /* Received chat message */
  client.bind("twitch-chat", function _on_twitch_chat(event) {
    if (event instanceof TwitchChatEvent) {
      let m = typeof(event.message) === "string" ? event.message : "";
      if (event.flags && event.flags.mod && m.indexOf(" ") > -1) {
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
              /* TODO: ESCAPE */
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
      if (!shouldFilter($(this), event)) {
        let $c = $(this).find(".content");
        let $w = $(`<div class="line line-wrapper"></div>`);
        $w.html(client.get("HTMLGen").gen(event));
        Content.addHTML($w, $c);
      }
    });
  });

  /* Received CLEARCHAT event */
  client.bind("twitch-clearchat", function _on_twitch_clearchat(e) {
    if (e.has_flag("target-user-id")) {
      /* Moderator timed out a user */
      let r = e.flags["room-id"]; /* TODO: ESCAPE */
      let u = e.flags["target-user-id"]; /* TODO: ESCAPE */
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
    let line = client.get("HTMLGen").sub(e);
    Content.addHTML(line);
  });

  /* User resubscribed */
  client.bind("twitch-resub", function _on_twitch_resub(e) {
    Util.StorageAppend("debug-msg-log", e);
    let line = client.get("HTMLGen").resub(e);
    Content.addHTML(line);
  });

  /* User gifted a subscription */
  client.bind("twitch-giftsub", function _on_twitch_giftsub(e) {
    Util.StorageAppend("debug-msg-log", e);
    let line = client.get("HTMLGen").giftsub(e);
    Content.addHTML(line);
  });

  /* Anonymous user gifted a subscription */
  client.bind("twitch-anongiftsub", function _on_twitch_anongiftsub(e) {
    Util.StorageAppend("debug-msg-log", e);
    let line = client.get("HTMLGen").anongiftsub(e);
    Content.addHTML(line);
  });

  /* Channel was raided */
  client.bind("twitch-raid", function _on_twitch_raid(e) {
    Util.StorageAppend("debug-msg-log", e);
    let line = client.get("HTMLGen").raid(e);
    Content.addHTML(line);
  });

  /* New user's YoHiYo */
  client.bind("twitch-newuser", function _on_twitch_newuser(e) {
    Util.StorageAppend("debug-msg-log", e);
  });

  /* Received some other kind of usernotice */
  client.bind("twitch-otherusernotice", function _on_twitch_otherusernotice(e) {
    Util.StorageAppend("debug-msg-log", e);
    /* TODO: submysterygift, rewardgift, giftpaidupgrade, anongiftpaidupgrade,
     * unraid, bitsbadgetier */
  });

  /* Bind the rest of the events and warn about unbound events */
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
  client.bind("twitch-hosttarget", function _on_twitch_hosttarget(e) {
    Util.StorageAppend("debug-msg-log", e);
  });
  client.bind("twitch-other", function _on_twitch_other(e) {});

  client.bindDefault(function _on_default(e) {
    Util.Warn("Unbound event:", e);
    Util.StorageAppend("debug-msg-log", e);
  });

  /* End of all the binding 0}}} */

  /* Finally, connect */
  client.Connect();
}

/* vim: set ts=2 sts=2 sw=2 et: */
