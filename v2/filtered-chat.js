/* Twitch Filtered Chat (v2) Main Module */

"use strict";

/* Notes:
 *
 * Adding to the query string parser:
 *  Add to both get_config_object *and* //config url
 */

/* TODO:
 * Implement border/background for username contrast
 * Implement HTMLGen.sub, HTMLGen.anonsubgift, and calling code
 * Implement HTMLGen.host, HTMLGen.raid, and calling code
 * Implement FFZ emotes
 * Implement BTTV emotes
 * Rewrite index.html using promises
 * Add "Channels" dropdown to the module filtering (default: all)
 *
 * FIXME:
 * Fix formatting for "@user" (user @ highlights)
 * Fix URL formatting with emotes (URLs in emotes are formatted)
 */

/* TODO: REMOVE {{{0 */
const TEST_MESSAGES = {
  'PRIVMSG': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;color=#0262C1;display-name=Kaedenn_;emotes=25:14-18/3:29-30/153556:41-48;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :test cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test\r\n",
  'PRIVMSG2': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;color=#0262C1;display-name=Kaedenn_;emotes=25:14-18/3:29-30/153556:41-48;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :&&&& cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test\r\n",
  'CHEER0': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;bits=1;color=#0262C1;display-name=Kaedenn_;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :cheer1\r\n",
  'CHEER': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;bits=400;color=#0262C1;display-name=Kaedenn_;emotes=25:14-18/3:29-30/153556:41-48;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :test cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test\r\n",
  'CHEER2': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;bits=400;color=#0262C1;display-name=Kaedenn_;emotes=25:14-18/3:29-30/153556:41-48;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :&&&& cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test\r\n",
  'EFFECT': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;bits=100;color=#0262C1;display-name=Kaedenn_;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :cheer100 rainbow bold marquee Hi!\r\n",
  'RESUB': "@badge-info=;badges=staff/1,broadcaster/1,turbo/1;color=#008000;display-name=ronni;emotes=;id=db25007f-7a18-43eb-9379-80131e44d633;login=ronni;mod=0;msg-id=resub;msg-param-cumulative-months=6;msg-param-streak-months=2;msg-param-should-share-streak=1;msg-param-sub-plan=Prime;msg-param-sub-plan-name=Prime;room-id=70067886;subscriber=1;system-msg=ronni\\shas\\ssubscribed\\sfor\\s6\\smonths!;tmi-sent-ts=1507246572675;turbo=1;user-id=1337;user-type=staff :tmi.twitch.tv USERNOTICE #dwangoac :Great stream -- keep it up!\r\n",
  'GIFTSUB': ""
};

function inject_message(msg) {
  let e = new Event('message');
  e.data = msg;
  client.OnWebsocketMessage(e);
}
/* END TODO: REMOVE 0}}} */

const CLIENT_ID = [49,101,52,55,97,98,108,48,115,103,52,50,105,110,116,104,
                   53,48,119,106,101,114,98,122,120,104,57,109,98,115];
const CACHED_VALUE = "Cached";
const AUTOGEN_VALUE = "Auto-Generated";
let HTMLGen = {};
HTMLGen._dflt_colors = {};

/* Generate a random color for the given user */
HTMLGen.getColorFor = function _HTMLGen_getColorFor(username) {
  if (!HTMLGen._dflt_colors.hasOwnProperty(username)) {
    let ci = Math.floor(Math.random() * default_colors.length);
    HTMLGen._dflt_colors[username] = default_colors[ci];
  }
  return HTMLGen._dflt_colors[username];
}

/* Format a Twitch-specific emote */
HTMLGen.emote = function _HTMLGen_emote(emote) {
  if (emote.id !== null) {
    let $e = $(`<img class="emote twitch-emote" />`);
    $e.attr('tw-emote-id', emote.id);
    $e.attr('src', Twitch.URL.Emote(emote.id));
    let html = $e[0].outerHTML;
    emote.final_length = html.length;
    return html;
  }
  return null;
}

/* Format a cheer */
HTMLGen.cheer = function _HTMLGen_cheer(cheer, bits) {
  /* Use the highest tier that doesn't exceed the cheered bits */
  let t = cheer.tiers.filter((t) => bits >= t.min_bits).max((t) => t.min_bits);
  let color = t.color;
  /* Use the smallest scale available */
  let url = t.images.dark.animated[cheer.scales.min((s) => +s)];
  let $w = $(`<span class="cheer cheermote"></span>`);
  $w.css('color', t.color);
  let $img = $(`<img class="cheer-image" />`);
  $img.attr('alt', cheer.prefix).attr('title', cheer.prefix);
  $img.attr('src', url);
  $w.append($img);
  $w.append(bits);
  return $w[0].outerHTML;
}

/* Begin configuration section {{{0 */

/* Functions to sanitize configuration */
function verify_string(val) { return (typeof(val) == "string" ? val : ""); }
function verify_number(val) { return (typeof(val) == "number" ? val : ""); }
function verify_boolean(val) { return (typeof(val) == "boolean" ? val : ""); }
function verify_array(val) { return Util.IsArray(val) ? val : []; }

/* Parse a module configuration from a query string key and value */
function decode_module_config(key, value) {
  let parts = value.split(',');
  let UnEscComma = (s) => (s.replace(/%2c/g, ','));
  let ParseSet = (p) => (p.split(',').map((e) => UnEscComma(e)).filter((e) => e.length > 0));
  if (parts.length < 6) {
    Util.Error("Failed to decode module config: not enough parts", value);
    return null;
  }
  if (parts[1].length < 6) {
    Util.Error("Module flags not long enough", part[1], value);
  }
  let config = {};
  config[key] = {};
  config[key].Name = UnEscComma(parts[0]);
  config[key].Pleb = parts[1][0] == "1";
  config[key].Sub = parts[1][1] == "1";
  config[key].VIP = parts[1][2] == "1";
  config[key].Mod = parts[1][3] == "1";
  config[key].Event = parts[1][4] == "1";
  config[key].Bits = parts[1][5] == "1";
  config[key].IncludeKeyword = ParseSet(parts[2]);
  config[key].IncludeUser = ParseSet(parts[3]);
  config[key].ExcludeUser = ParseSet(parts[4]);
  config[key].ExcludeStartsWith = ParseSet(parts[5]);
  return config;
}

/* Encode a module configuration into a query string "key=value" */
function encode_module_config(name, config) {
  let cfg = config[name];
  let parts = [];
  let EscComma = (s) => (s.replace(/,/g, '%2c'));
  let B = (b) => (b ? "1" : "0");
  parts.push(EscComma(cfg.Name));
  parts.push(B(cfg.Pleb) + B(cfg.Sub) + B(cfg.VIP) + B(cfg.Mod) + B(cfg.Event) + B(cfg.Bits));
  parts.push(cfg.IncludeKeyword.map((e) => EscComma(e)).join(","));
  parts.push(cfg.IncludeUser.map((e) => EscComma(e)).join(","));
  parts.push(cfg.ExcludeUser.map((e) => EscComma(e)).join(","));
  parts.push(cfg.ExcludeStartsWith.map((e) => EscComma(e)).join(","));
  return `${name}=${encodeURIComponent(parts.join(","))}`;
}

/* 1) Obtain configuration
 *  a) values from localStorage
 *  b) values from settings elements (overrides (a))
 *  c) values from query string (overrides (b))
 * 2) Store module configuration in each modules' settings window
 * 3) Remove sensitive values from the query string, if present
 */
function get_config_object() {
  let config_key = 'tfc-config';

  /* Query String object, parsed */
  let qs = Util.ParseQueryString();
  if (qs.hasOwnProperty('config_key')) {
    config_key = config_key + '-' + qs.config_key.replace(/[^a-z]/g, '');
  }
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
  if (typeof(config.Debug) != "number") config.Debug = 0;

  /* Persist the config key */
  config.key = Util.GetWebStorageKey();

  /* Certain unwanted items may be preserved */
  if (config.hasOwnProperty('NoAssets')) delete config["NoAssets"];
  if (config.hasOwnProperty('Debug')) delete config["Debug"];

  /* Parse div#settings config */
  let txtChannel = $('input#txtChannel')[0];
  let txtNick = $('input#txtNick')[0];
  let txtClientID = $('input#txtClientID')[0];
  let txtPass = $('input#txtPass')[0];
  let selDebug = $('select#selDebug')[0];
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
  if (selDebug.value) {
    if (selDebug.value == "0") {
      config.Debug = 0;
    } else if (selDebug.value == "1") {
      config.Debug = 1;
    } else if (selDebug.value == "2") {
      config.Debug = 2;
    }
  }

  let qs_data = Util.ParseQueryString();
  if (qs_data.base64 && qs_data.base64.length > 0) {
    qs_data = Util.ParseQueryString(atob(qs_data.base64));
  }

  /* Parse query string config */
  for (let [k, v] of Object.entries(qs_data)) {
    let key = k; /* config key */
    let val = v; /* config value */
    if (k == "clientid") {
      key = "ClientID";
      query_remove.push(k);
    } else if (k == "user") {
      key = "Name";
    } else if (k == "pass") {
      key = "Pass";
      query_remove.push(k);
    } else if (k == "channels") {
      key = "Channels";
      if (typeof(v) === "string") {
        val = v.split(',').map((c) => Twitch.FormatChannel(c));
      } else {
        val = [];
      }
    } else if (k == "debug") {
      key = "Debug";
      if (!val) { val = 0; }
      if (val == "true") { val = 1; }
      if (val == "false") { val = 0; }
      if (val == "debug") { val = 1; }
      if (val == "trace") { val = 2; }
    } else if (k == "noassets") {
      key = "NoAssets";
      val = !!v;
    } else if (k == "noffz") {
      key = "NoFFZ";
    } else if (k == "nobttv") {
      key = "NoBTTV";
    } else if (k == "hmax") {
      key = "HistorySize";
    } else if (k == "module1") {
      val = decode_module_config(k, v).module1;
      set_module_settings($("#" + k), val);
    } else if (k == "module2") {
      val = decode_module_config(k, v).module2;
      set_module_settings($("#" + k), val);
    } else if (k == "trans") {
      key = "Transparent";
      val = 1;
    }
    config[key] = val;
  }

  /* Populate configs for each module */
  $('.module').each(function() {
    let id = $(this).attr('id');
    if (!config[id]) {
      config[id] = get_module_settings(this);
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
  });

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

  if (!config.ClientID) {
    config.ClientID = CLIENT_ID.map((n) => Util.ASCII[n]).join("");
  }

  return config;
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
    ExcludeStartsWith: []
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

  return s;
}

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
      let $li = $(`<li></li`);
      let $l = $(`<label></label>`).val(label);
      for (let val of values) {
        let isel = `input.${cls}[value="${val}"]`;
        if ($(module).find(isel).length == 0) {
          let $cb = $(`<input type="checkbox" value=${val.escape()} checked />`);
          $cb.addClass(cls);
          $l.append($cb);
          $li.append($l);
          $(module).find(`li.${cls}`).before($li);
          $(module).find(isel).click(update_module_config);
        }
      }
    }
  }
  add_input("include_user", "From user: ", config.IncludeUser);
  add_input("include_keyword", "Contains: ", config.IncludeKeyword);
  add_input("exclude_user", "From user: ", config.ExcludeUser);
  add_input("exclude_startswith", "Starts with: ", config.ExcludeStartsWith);
  /*
  if (config.IncludeUser && config.IncludeUser.length > 0) {
    let cls = 'include_user';
    for (let s of config.IncludeUser) {
      if ($(module).find(`input.${cls}[value="${s}"]`).length == 0) {
        let li = `<li><label><input type="checkbox" value="${s}" class="${cls}" checked />From user: ${s}</label></li>`;
        $(module).find('li.include_user').before(li);
        $(module).find(`input.${cls}[value="${s}"]`).click(update_module_config);
      }
    }
  }
  if (config.IncludeKeyword && config.IncludeKeyword.length > 0) {
    let cls = 'include_keyword';
    for (let s of config.InclueKeyword) {
      if ($(module).find(`input.${cls}[value="${s}"]`).length == 0) {
        let li = `<li><label><input type="checkbox" value="${s}" class="${cls}" checked />Contains: ${s}</label></li>`
        $(module).find('li.include_keyword').before(li);
        $(module).find(`input.${cls}[value="${s}"]`).click(update_module_config);
      }
    }
  }
  if (config.ExcludeUser && config.ExcludeUser.length > 0) {
    let cls = 'exclude_user';
    for (let s of config.ExcludeUser) {
      if ($(module).find(`input.${cls}[value="${s}"]`).length == 0) {
        let li = `<li><label><input type="checkbox" value="${s}" class="${cls}" checked />From user: ${s}</label></li>`
        $(module).find('li.exclude_user').before(li);
        $(module).find(`input.${cls}[value="${s}"]`).click(update_module_config);
      }
    }
  }
  if (config.ExcludeStartsWith && config.ExcludeStartsWith.length > 0) {
    let cls = 'exclude_startswith';
    for (let s of config.ExcludeStartsWith) {
      if ($(module).find(`input.${cls}[value="${s}"]`).length == 0) {
        let li = `<li><label><input type="checkbox" value="${s}" class="${cls}" checked />Starts with: ${s}</label></li>`
        $(module).find('li.exclude_startswith').before(li);
        $(module).find(`input.${cls}[value="${s}"]`).click(update_module_config);
      }
    }
  }*/
}

/* Update the local storage config with the current module settings */
function update_module_config() {
  let config = get_config_object();
  $(".module").each(function() {
    config[$(this).attr('id')] = get_module_settings(this);
  });
  Util.SetWebStorage(config);
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
    if (!rules.Bits && event.flag('bits')) return false;
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
  }
  return true;
}

/* Add either an event or direct HTML to all modules */
function add_html(event) {
  /* Generate HTML if it's a TwitchEvent */
  let html = (event instanceof TwitchEvent) ? HTMLGen.gen(event) : event;
  /* Add the html to each module */
  $(".module").each(function() {
    /* Check the filters to see if this event should be displayed */
    if (event instanceof TwitchEvent && !check_filtered($(this), event)) {
      /* Filtered out */
      return;
    }
    /* Build the content element */
    let $p = $(document.createElement('p')).addClass('line line-wrapper');
    $p.html(html);
    /* Append the content to the page */
    /* FIXME: Scroll to element, not to max */
    $(this).find('.content').append($p).scrollTop(Math.pow(2, 31)-1);;
  });
}

/* Shortcut for adding a <div class="pre"> element */
function add_pre(content) {
  add_html(`<div class="pre">${content}</div>`);
}

/* Place an emote in the message and return the result.
 * Places the final length of the inserted emote into emote_def.final_length */
function place_emote(message, emote_def) {
}

/* Handle a chat command */
function handle_command(e, client, config) {
  let tokens = e.target.value.split(" ");
  let cmd = tokens.shift();
  /* Clear empty tokens at the end (\r\n related) */
  while (tokens.length > 0 && tokens[tokens.length-1].length == 0) {
    tokens.pop();
  }

  /* Shortcuts for usages/help messages */
  let arg = (s) => `<span class="arg">${s.escape()}</span>`;
  let helpline = (k, v) => `<div class="helpline"><span class="help helpcmd">${k}</span><span class="help helpmsg">${v}</span></div>`;
  let help = (s) => `<div class="help">${s}</div>`;
  let add_helpline = (k, v) => add_pre(helpline(k, v));
  let add_help = (s) => add_pre(help(s));

  /* Handle each of the commands */
  if (cmd == '//clear') {
    for (let e of $("div.content")) {
      e.html("");
    }
  } else if (cmd == "//config") {
    if (tokens.length > 0) {
      if (tokens[0] == "clientid") {
        add_helpline("ClientID", config.ClientID);
      } else if (tokens[0] == "pass") {
        add_helpline("Pass", config.Pass);
      } else if (tokens[0] == "purge") {
        Util.SetWebStorage({});
        add_html(`<div class="notice">Purged storage"${Util.GetWebStorageKey()}"</div>`);
      } else if (tokens[0] == "url") {
        let url = location.protocol + '//' + location.hostname + location.pathname;
        if (tokens.length > 1) {
          if (tokens[1].startsWith('git')) {
            url = "https://kaedenn.github.io/twitch-filtered-chat/v2/index.html";
          } else if (tokens[1].startsWith('file')) {
            url = "file:///home/kaedenn/Programming/twitch-filtered-chat/v2/index.html";
          }
        }
        let qs = [];
        let qs_push = (k, v) => (qs.push(`${k}=${encodeURIComponent(v)}`));
        if (config.Debug > 0) { qs_push('debug', config.Debug); }
        if (config.ClientID && config.ClientID.length == 30) { qs_push('clientid', config.ClientID); }
        if (config.Channels.length > 0) { qs_push('channels', config.Channels.join(",")); }
        if (config.Name && config.Name.length > 0) { qs_push('user', config.Name); }
        if (config.Pass && config.Pass.length > 0) { qs_push('pass', config.Pass); }
        if (config.NoAssets) { qs_push('noassets', config.NoAssets); }
        if (config.NoFFZ) { qs_push('noffz', config.NoFFZ); }
        if (config.NoBTTV) { qs_push('nobttv', config.NoBTTV); }
        if (config.HistorySize) { qs_push('hmax', config.HistorySize); }
        qs.push(encode_module_config('module1', config));
        qs.push(encode_module_config('module2', config));
        let layout = [config.Layout.Cols, "chat"];
        if (config.Layout.Cols == "double") layout[0] = "double";
        if (config.Layout.Chat == false) layout[1] = "nochat";
        if (config.Layout.Slim == true) layout[1] = "slim";
        qs_push("layout", layout[0] + ":" + layout[1]);
        if (config.Transparent) { qs_push("trans", "1"); }
        if (tokens[tokens.length-1] === "text") {
          url += "?" + qs.join("&");
        } else {
          url += "?base64=" + encodeURIComponent(btoa(qs.join("&")));
        }
        add_help(`<a href="${url}" target="_blank">${url.escape()}</a>`);
      } else if (config.hasOwnProperty(tokens[0])) {
        add_helpline(tokens[0], JSON.stringify(config[tokens[0]]));
      } else {
        add_html(`<div class="pre error">Unknown config key &quot;${tokens[0]}&quot;</div>`);
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
  } else if (cmd == "//join") {
    if (tokens.length > 0) {
      let ch = Twitch.FormatChannel(tokens[0]);
      if (!client.IsInChannel(ch)) {
        client.JoinChannel(ch);
        add_pre(`Joined ${ch}`);
      } else {
        add_pre(`Already in channel ${ch}`);
      }
    } else {
      add_pre(`Usage: //join &lt;${arg('channel')}&gt;`);
    }
  } else if (cmd == "//part" || cmd == "//leave") {
    if (tokens.length > 0) {
      let ch = Twitch.FormatChannel(tokens[0]);
      if (client.IsInChannel(ch)) {
        client.LeaveChannel(ch);
        add_pre(`Left ${ch}`);
      } else {
        add_pre(`Not in channel ${ch}`);
      }
    } else {
      add_pre(`Usage: //leave &lt;${arg("channel")}&gt;`);
    }
  } else if (cmd == "//badges") {
    let all_badges = [];
    for (let [bname, badge] of Object.entries(client.GetGlobalBadges())) {
      for (let [bv, bdef] of Object.entries(badge.versions)) {
        all_badges.push(`<img src="${bdef.image_url_2x}" width="36" height="36" title="${bname}" />`);
      }
    }
    add_html(`<div class="notice allbadges">${all_badges.join('&nbsp;')}</div>`);
  } else if (cmd == "//help") {
    if (tokens.length > 0 && tokens[0].startsWith('//')) tokens[0] = tokens[0].substr(2);
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
      lines.push([`help &lt;${arg('cmd')}&gt;`, `help for a specific command`]);
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
      add_help(`//help &lt;${arg("cmd")}&gt;: Displays help for a specific command`);
    } else {
      add_help(`//help: No such command "${tokens[0].escape()}"`);
    }
  } else if (cmd.startsWith('//')) {
    add_html(`<div class="pre error">Unknown command "${cmd.escape()}"</div>`);
  } else {
    return false;
  }
  return true;
}

/* Format a date object to "%Y-%m-%d %H:%M:%S.<ms>" */
function format_date(date) {
  let [y, m, d] = [date.getFullYear(), date.getMonth(), date.getDay()];
  let [h, mi, s] = [date.getHours(), date.getMinutes(), date.getSeconds()];
  let ms = date.getMilliseconds();
  let p = [y, Util.Pad(m, 2), Util.Pad(d, 2),
           Util.Pad(h, 2), Util.Pad(mi, 2), Util.Pad(s, 2),
           Util.Pad(ms, 3)];
  return `${p[0]}-${p[1]}-${p[2]} ${p[3]}:${p[4]}:${p[5]}.${p[6]}`;
}

/* Format an interval in seconds to "Xh Ym Zs" */
function format_interval(time) {
  let parts = [];
  time = Math.round(time);
  if (time < 0) {
    parts.push('-');
    time *= -1;
  }
  if (time % 60 != 0) { parts.unshift(`${time % 60}s`); }
  time = Math.floor(time / 60);
  if (time > 0) {
    if (time % 60 != 0) { parts.unshift(`${time % 60}m`); }
    time = Math.floor(time / 60);
  }
  if (time > 0) {
    parts.unshift(`${time}h`);
  }
  return parts.join(" ");
}

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
  /* Define line and link templates */
  let Line = (s) => $(`<div class="item">${s}</div>`);
  let Link = (id, text) => `<a id="${id}" class="cw-link" href="javascript:void(0)">${text.escape()}</a>`;
  let Em = (t) => `<span class="em">${t}</span>`;
  /* Add general user information */
  $cw.append(Line(`${Em(user)} in ${Em(channel)}`));
  /* Add link to timeout user */
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
  /* Add link which populates "/ban <user>" into the chat */
  let $ba = $(Link(`cw-ban-${user}`, "Ban"));
  $ba.attr("data-channel", channel);
  $ba.attr("data-user", user);
  $ba.click(function() {
    $("#txtChat").val(`/ban ${$(this).attr('data-user')}`);
  });
  $cw.append($ba);
  /* Add other information */
  let sent_ts = format_date(time);
  let ago_ts = format_interval((Date.now() - timestamp) / 1000);
  $cw.append(Line(`Sent: ${sent_ts} (${ago_ts} ago)`));
  $cw.append(Line(`UserID: ${userid}`));
  $cw.append(Line(`MsgUID: ${id}`));
  /* Add roles (and ability to remove roles, for the caster) */
  if (mod || vip || sub) {
    let $role_line = Line(`User Role:`);
    let EmItem = (s) => $(Em(s)).css('margin-left', '0.5em');
    if (mod) { $role_line.append(EmItem('Mod')); }
    if (vip) { $role_line.append(EmItem('VIP')); }
    if (sub) { $role_line.append(EmItem('Sub')); }
    $cw.append($role_line);
    if (client.IsCaster(channel) && !client.IsUIDSelf(user_id)) {
      if (mod) { $cw.append(Line(Link('cw-unmod', 'Remove Mod'))); }
      if (vip) { $cw.append(Line(Link('cw-unvip', 'Remove VIP'))); }
    }
  }
  /* Add the ability to add roles (for the caster) */
  if (client.IsCaster(channel) && !client.IsUIDSelf(user_id)) {
    if (!mod) { $cw.append(Line(Link('cw-make-mod', 'Make Mod'))); }
    if (!vip) { $cw.append(Line(Link('cw-make-vip', 'Make VIP'))); }
  }
  let l_off = $l.offset();
  $cw.fadeIn().offset({top: l_off.top + $l.outerHeight() + 2, left: l_off.left});
};

/* Change a variable in main.css */
function set_css_var(varname, value) {
  document.documentElement.style.setProperty(varname, value);
}

/* Obtain a variable from main.css */
function get_css_var(varname) {
  /* TODO: is this possible without parsing
   * $("link[rel=\"stylesheet\"]")[0].sheet.cssRules.item(":root").cssText ? */
}

/* Called once when the document loads */
function client_main(layout) {
  let config = get_config_object();
  let client = new TwitchClient(config);
  config.Layout = layout;
  Util.DebugLevel = config.Debug;

  /* Change the document title to show our authentication state */
  document.title += " -";
  if (config.Pass && config.Pass.length > 0) {
    document.title += " Authenticated";
  } else {
    document.title += " Read-Only";
  }

  /* Allow JS access if debugging is enabled */
  if (Util.DebugLevel > 0) {
    window.client = client;
  }
  if (Util.DebugLevel > 1) {
    window.config = config;
  }

  let is_up = (k) => (k == KeyEvent.DOM_VK_UP);
  let is_down = (k) => (k == KeyEvent.DOM_VK_DOWN);

  /* Sending a chat message */
  $("#txtChat").keydown(function(e) {
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      /* Prevent sending empty messages by mistake */
      if (e.target.value.trim().length > 0) {
        if (!handle_command(e, client, config)) {
          client.SendMessageToAll(e.target.value);
        }
        client.AddHistory(e.target.value);
        $(e.target).attr("histindex", "-1");
        e.target.value = "";
      }
      e.preventDefault(); /* prevent bubbling */
      return false; /* prevent bubbling */
    } else if (is_up(e.keyCode) || is_down(e.keyCode)) {
      /* Handle traversing message history */
      let i = Number.parseInt($(e.target).attr("histindex"));
      let l = client.GetHistoryLength();
      if (is_up(e.keyCode)) {
        /* Going up */
        i = (i + 1 >= l - 1 ? l - 1 : i + 1);
      } else if (is_down(e.keyCode)) {
        /* Going down */
        i = (i - 1 < 0 ? -1 : i - 1);
      }
      e.target.value = (i > -1 ? client.GetHistoryItem(i) : "");
      $(e.target).attr("histindex", `${i}`);
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
    $(`#${id} .content`).html("");
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
        client.JoinChannel(ch);
        add_html(`<div class="notice">Joining ${ch}</div>`);
      }
      /* Leave all the channels removed */
      for (let ch of to_part) {
        client.LeaveChannel(ch);
        add_html(`<div class="notice">Leaving ${ch}</div>`);
      }
    }
  });

  /* Changing the "stream is transparent" checkbox */
  $("#cbTransparent").change(function() {
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
    let is_transparent = $(this).is(":checked");
    for (let prop of props) {
      if (is_transparent) {
        /* Set them all to transparent */
        set_css_var(prop, 'transparent');
        $(".module").addClass("transparent");
      } else {
        /* Set them all to default */
        set_css_var(prop, `var(${prop}-default)`);
        $(".module").removeClass("transparent");
      }
    }
  });

  /* Simulate clicking cbTransparent if config.Transparent is set */
  if (config.Transparent) {
    $("#cbTransparent").click();
  }

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
      /* Update config on close */
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
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      $(this).parent().children(".menu").click();
    }
  });

  /* Pressing enter on one of the module menu text boxes */
  $('.module .settings input[type="text"]').on('keyup', function(e) {
    let v = $(this).val();
    if (v.length > 0) {
      if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
        let $cli = $(this).closest('li');
        let cls = $cli.attr('class').replace('textbox', '').trim();
        let $li = $(`<li><label><input type="checkbox" value="${v}" class="${cls}" checked />${$cli.find('label').html()} ${v}</label></li>`);
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
      add_html(`<div class="notice">Reconnecting...</div>`);
      client.Connect();
    }
    /* Clicking on a username: context window */
    let $cw = $("#username_context");
    if ($t.attr('data-username') == '1') {
      /* Clicked on a username; open context window */
      show_context_window(client, $cw, $t.parent());
    } else if (Util.PointIsOn(e.clientX, e.clientY, $cw[0])) {
      /* Clicked on the context window */
      let ch = $cw.attr("data-channel");
      let user = $cw.attr("data-user");
      let userid = $cw.attr("data-userid");
      if (!client.IsUIDSelf(userid)) {
        if ($t.attr("id") === "cw-unmod") {
          /* Clicked on the "unmod" link */
          Util.Log("Unmodding", user, "in", ch, ($t == $("a#cw-unmod")));
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

  /* Bind to the various Twitch events we're interested in */

  client.bind('twitch-open', function _on_twitch_open(e) {
    let notes = [];
    $(".loading").remove();
    if (e.has_value('has-clientid') && e.value('has-clientid')) {
      notes.push("(with Client-ID)");
    } else {
      notes.push("(without Client-ID)");
    }
    if (client.IsAuthed()) {
      notes.push("(authenticated)");
    } else {
      notes.push("(unauthenticated)");
    }
    if (!Util.Browser.IsOBS && !layout.Slim) {
      add_html(`<div class="notice">Connected ${notes.join(" ")}</div>`);
    }
  });

  client.bind('twitch-close', function _on_twitch_close(e) {
    let code = e.raw_line.code;
    let reason = e.raw_line.reason;
    let msg = "Connection closed";
    if (reason) {
      msg = `${msg} (code ${code}: ${reason})`;
    } else {
      msg = `${msg} (code ${code})`;
    }
    add_html(`<div class="error">${msg}<span class="reconnect"><a href="javascript:void(0)" data-reconnect="1">Reconnect</a></span></div>`);
  });

  if (!Util.Browser.IsOBS && !layout.Slim) {
    client.bind('twitch-join', function _on_twitch_join(e) {
      if (e.user == client.GetName().toLowerCase()) {
        add_html(`<div class="notice">Joined ${e.channel.channel}</div>`);
      }
    });
    client.bind('twitch-part', function _on_twitch_part(e) {
      if (e.user == client.GetName().toLowerCase()) {
        add_html(`<div class="notice">Left ${e.channel.channel}</div>`);
      }
    });
  }

  client.bind('twitch-notice', function _on_twitch_notice(e) {
    /* Some notices are benign */
    if (e.flag('msg-id') == 'host_on') { }
    else {
      Util.Warn(e);
    }
    let channel = Twitch.FormatChannel(e.channel);
    let message = e.message.escape();
    add_html(`<div class="notice">Notice: ${channel}: ${message}</div>`);
  });

  client.bind('twitch-error', function _on_twitch_error(e) {
    Util.Error(e);
    let user = e.user;
    let command = e.values.command;
    let message = e.message.escape();
    add_html(`<div class="error">Error ${user}: ${command}: ${message}</div>`);
  });

  client.bind('twitch-message', function _on_twitch_message(e) {
    if (Util.DebugLevel > 1) {
      add_html(`<span class="pre">${e.values.toSource()}</span>`);
    }
  });

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
          }
        }
      }
    }
    add_html(event);
  });

  client.bind('twitch-clearchat', function _on_twitch_clearchat(e) {
    if (e.has_flag("target-user-id")) {
      /* Moderator timed out a user */
      $(`.chat-line[data-channelid="${e.flag("room-id")}"][data-user-id="${e.flag("target-user-id")}"]`).parent().remove();
    } else {
      /* Moderator cleared the chat */
      for (let e of $("div.content")) {
        e.html("");
      }
    }
  });

  client.bind('twitch-clearmsg', function _on_twitch_clearmsg(e) {
    /* Moderator has timed-out or banned a user */
    Util.Warn("Unhandled CLEARMSG:", e);
  });

  client.bind('twitch-sub', function _on_twitch_sub(e) {
    console.log('sub', e);
    add_html(HTMLGen.sub(e));
  });

  client.bind('twitch-resub', function _on_twitch_resub(e) {
    console.log('resub', e);
    add_html(HTMLGen.resub(e));
  });

  client.bind('twitch-giftsub', function _on_twitch_giftsub(e) {
    console.log('gift', e);
    add_html(HTMLGen.giftsub(e));
  });

  client.bind('twitch-anongiftsub', function _on_twitch_anongiftsub(e) {
    console.log('anon', e);
    add_html(HTMLGen.anongiftsub(e));
  });

  /* Sync the final settings up with the html */
  $(".module").each(function() {
    set_module_settings(this, config[$(this).attr('id')]);
  });

  /* HTML generation functions (defined here to access the client object) */

  /* Entry point: generate for an event (likely TwitchChatEvent) */
  HTMLGen.gen = function _HTMLGen_gen(event) {
    let $e = $(`<div class="chat-line"></div>`);
    if (client.IsUIDSelf(event.flags["user-id"])) {
      $e.addClass('self');
    }
    $e.attr("data-id", event.flags.id);
    $e.attr("data-user", event.user);
    $e.attr("data-user-id", event.flags["user-id"]);
    $e.attr("data-channel", event.channel.channel.lstrip('#'));
    if (!!event.channel.room)
      $e.attr("data-room", event.channel.room);
    if (!!event.channel.roomuid)
      $e.attr("data-roomuid", event.channel.roomuid);
    $e.attr("data-channelid", event.flags["room-id"]);
    $e.attr("data-subscriber", event.flags.subscriber);
    $e.attr("data-mod", event.flags.mod);
    $e.attr("data-vip", event.isvip ? "1" : "0");
    $e.attr("data-caster", event.flags.broadcaster ? "1" : "0");
    $e.attr("data-sent-ts", event.flags["tmi-sent-ts"]);
    $e.attr("data-recv-ts", Date.now());
    let badges_elem = $(HTMLGen.genBadges(event));
    let name_elem = $(HTMLGen.genName(event));
    let msg_def = HTMLGen.genMsgInfo(event);
    $e.append(badges_elem);
    $e.append(name_elem);
    $e.html($e.html() + ":&nbsp");
    let html_pre = [];
    let html_post = [];
    if (msg_def.effects.length > 0) {
      for (let effect of msg_def.effects) {
        if (effect.class) msg_def.e.addClass(effect.class);
        if (effect.style) msg_def.e.attr("style", effect.style);
        if (effect.wclass) $e.addClass(effect.wclass);
        if (effect.wstyle) $e.attr("style", effect.wstyle);
        if (effect.html_pre) html_pre.push(effect.html_pre);
        if (effect.html_post) html_post.unshift(effect.html_post);
      }
    }
    $e.append($(html_pre.join("") + msg_def.e[0].outerHTML + html_post.join("")));
    return $e[0].outerHTML;
  };

  /* Generate HTML for a user's name */
  HTMLGen.genName = function _HTMLGen_genName(event) {
    let user = event.flag("display-name");
    if (!user) user = event.user;
    let $e = $(`<span class="username" data-username="1"></span>`);
    $e.addClass('username');
    $e.attr('data-username', '1');
    let color = !!event.flags.color ? event.flags.color : HTMLGen.getColorFor(user);
    /* Add "low-contrast" for usernames hard to see */
    let c1 = Util.ContrastRatio(color, '#303030')
    let c2 = Util.ContrastRatio(color, '#0e0e0e')
    $e.attr('data-contrast-1', c1);
    $e.attr('data-contrast-2', c2);
    if (c1 < 4 && c2 < 4) { $e.addClass("low-contrast"); }
    $e.css('color', color);
    $e.html(user.escape());
    return $e[0].outerHTML;
  };

  /* Generate HTML for the message content */
  HTMLGen.genMsgInfo = function _HTMLGen_genMsgInfo(event) {
    let msg_def = {e: null, effects: []};
    let e_msg = $(`<span class="message" data-message="1"></span>`);
    /* Escape the message, keeping track of how characters move */
    let [message, map] = Util.EscapeWithMap(event.message);
    map.push(message.length); /* Prevent off-the-end mistakes */
    /* Handle early mod-only antics */
    if (!$("#cbForce").is(":checked") && event.ismod) {
      let word0 = event.message.split(" ")[0];
      if (word0 == "force") {
        event.flags.force = true;
      } else if (word0 == "forcejs") {
        event.flags.force = true;
      } else if (word0 == "forcebits" || word0 == "forcecheer") {
        /* Modify both message and event.message, as they're both used below */
        if (word0.length == 9) {
          event.values.message = "cheer1000" + event.message.substr(9);
          message = "cheer1000" + message.substr(9);
        } else if (word0.length == 10) {
          event.values.message = "cheer1000" + event.message.substr(10);
          message = "cheer1000 " + message.substr(10);
        }
        event.flags.bits = 1000;
        event.flags.force = true;
      }
    }
    /* Handle emotes */
    if (event.flag('emotes')) {
      let emotes = event.flags.emotes.map(function(e) {
        return {'id': e.id, 'name': e.name,
                'start': map[e.start], 'end': map[e.end],
                'ostart': e.start, 'oend': e.end};
      });
      emotes.sort((a, b) => a.start - b.start);
      while (emotes.length > 0) {
        let emote = emotes.pop();
        let msg_start = message.substr(0, emote.start);
        let msg_end = message.substr(emote.end+1);
        let emote_str = HTMLGen.emote(emote);
        message = `${msg_start}${emote_str}${msg_end}`;
        /* Shift the entire map to keep track */
        for (let idx = emote.ostart; idx < map.length; ++idx) {
          if (map[idx] < emote.end) {
            /* All characters within the emote point to the emote's end */
            map[idx] = emote.final_length;
          } else {
            /* All characters after are shifted by the change in length */
            map[idx] += emote.final_length - (emote.end - emote.start) - 1;
          }
        }
      }
    }
    /* TODO: FFZ emotes (dwango has none) */
    let ffz_emotes = client.GetFFZEmotes(event.channel.channel);
    /* TODO: BTTV emotes (dwango has none) */
    /* Handle cheers */
    if (event.flag('bits') && event.flag('bits') > 0) {
      let bits_left = event.flag('bits');
      let matches = client.FindCheers(event.channel.channel, event.message);
      matches.sort((a, b) => a.start - b.start);
      while (matches.length > 0) {
        let match = matches.pop();
        let cheer = match.cheer;
        let bits = match.bits;
        let start = map[match.start];
        let end = map[match.end];
        let chtml = HTMLGen.cheer(cheer, bits);
        /* Place the cheer HTML in the proper spot */
        let msg_start = message.substr(0, start);
        let msg_end = message.substr(end);
        message = msg_start + chtml + msg_end;
        /* TODO: update the map */
        let end_words = msg_end.trimStart().split(" ");
        /* Scan words after the cheer for effects */
        while (end_words.length > 0) {
          let s = null;
          /* css_styles and ColorNames have our valid styles */
          if (css_styles.hasOwnProperty(end_words[0])) {
            s = css_styles[end_words[0]];
          } else if (ColorNames.hasOwnProperty(end_words[0])) {
            s = css_color_style(ColorNames[end_words[0]]);
          }
          if (s == null) break;
          if (!s._disabled) {
            if (bits_left < s.cost) break;
            msg_def.effects.push(s);
            bits_left -= s.cost;
          }
          end_words.shift();
        }
      }
    }
    /* @user highlighting */
    message = message.replace(/(^|\b\s*)(@\w+)(\s*\b|$)/g, function(m, p1, p2, p3) {
      if (p2.substr(1).toLowerCase() == client.GetName().toLowerCase()) {
        e_msg.addClass("highlight");
      }
      return `${p1}<em>${p2}</em>${p3}`;
    });
    /* Handle mod-only antics */
    if (event.ismod && !$("#cbForce").is(":checked") && event.flags.force) {
      if (event.message.startsWith('force ')) {
        /* Force: undo everything above and put the message, unescaped, as-is */
        message = event.message.replace('force ', '');
      } else if (event.message.startsWith('forcejs ')) {
        /* Forcejs: undo everything above and wrap unescaped message in script tags */
        message = `<script>${event.message.replace('forcejs ', '')}</script>`;
      }
    }
    /* FIXME: url formatting breaks emotes, as URLs inside <img> elements are formatted
    message = message.replace(Util.URL_REGEX, function(url) {
      let u = new URL(url);
      return `<a href="${u}" target="_blank">${u}</a>`;
    });*/
    e_msg.html(message);
    msg_def.e = e_msg;
    return msg_def;
  };

  /* Generate HTML for the user's badges */
  HTMLGen.genBadges = function _HTMLGen_genBadges(event) {
    let $bc = $(`<span class="badges" data-badges="1"></span>`);
    $bc.addClass('badges');
    $bc.attr('data-badges', '1');
    if (event.flags.badges) {
      let total_width = 18 * event.flags.badges.length;
      if (event.flags['ffz-badges']) {
        total_width += 18 * event.flags['ffz-badges'].length;
      }
      $bc.css("overflow", `hidden`);
      $bc.css("width", `${total_width}px`);
      $bc.css("max-width", `${total_width}px`);
      for (let [badge_name, badge_num] of event.flags.badges) {
        let $b = $(`<img class="badge" width="18px" height="18px" />`);
        $b.attr('tw-badge-cause', JSON.stringify([badge_name, badge_num]));
        $b.attr('data-badge', '1');
        $b.attr('data-badge-name', badge_name);
        $b.attr('data-badge-num', badge_num);
        if (client.IsGlobalBadge(badge_name, badge_num)) {
          let badge_info = client.GetGlobalBadge(badge_name, badge_num);
          $b.attr('src', badge_info.image_url_1x);
          $b.attr('tw-badge-scope', 'global');
          $b.attr('alt', badge_info.title);
        } else if (client.IsChannelBadge(event.channel, badge_name)) {
          let badge_info = client.GetChannelBadge(event.channel, badge_name);
          let badge_src = !!badge_info.alpha ? badge_info.alpha : badge_info.image;
          $b.attr('src', badge_src);
          $b.attr('tw-badge', JSON.stringify(badge_info));
          if (!!event.channel) {
            $b.attr('tw-badge-scope', 'channel');
            $b.attr('tw-badge-channel', event.channel.channel.lstrip('#'));
          }
        } else {
          console.warn('Unknown badge', badge_name, badge_num, 'for', event);
          continue;
        }
        $bc.append($b);
      }
    }
    /* Add FFZ badges */
    if (event.flags['ffz-badges']) {
      for (let badge of Object.values(event.flags['ffz-badges'])) {
        let $b = $(`<img class="badge ffz-badge" width="18px" height="18px" />`);
        $b.attr('data-badge', '1');
        $b.attr('data-ffz-badge', '1');
        $b.attr('src', Util.URL(badge.image));
        $b.attr('alt', badge.name);
        $b.attr('title', badge.title);
        $bc.append($b);
      }
    }
    /* TODO: add BTTV badges */

    return $bc;
  };

  HTMLGen.subWrapper = function _HTMLGen_subWrapper(e) {
    let $e = $(`<div></div>`);
    $e.addClass("chat-line").addClass("sub").addClass("notice");
    $e.append($(HTMLGen.genBadges(e)));
    $e.append($(HTMLGen.genName(e)));
    $e.html($e.html() + "&nbsp;");
    return $e;
  };

  HTMLGen.sub = function _HTMLGen_sub(e) {
    let $w = HTMLGen.subWrapper(e);
    $w.append($(`<span class="message sub-message">subscribed using ${e.value('sub_plan').escape()}!</span>`));
    return $w[0].outerHTML;
  };

  HTMLGen.resub = function _HTMLGen_resub(e) {
    let $w = HTMLGen.subWrapper(e);
    if (e.value('sub_streak_months')) {
      $w.append($(`<span class="message sub-message">resubscribed for ${e.value('sub_months')} months, a streak of ${e.value('sub_streak_months')} months!</span>`));
    } else {
      $w.append($(`<span class="message sub-message">resubscribed for ${e.value('sub_months')} months!</span>`));
    }
    return $w[0].outerHTML;
  };

  HTMLGen.giftsub = function _HTMLGen_giftsub(e) {
    let user = e.flag('msg-param-recipient-user-name');
    let gifter = e.flag('login');
    let months = e.flag('msg-param-sub-months');
    return `${e.command}: ${gifter} gifted to ${user} ${months}`;
  };

  HTMLGen.anongiftsub = function _HTMLGen_anongiftsub(e) {
    let user = e.flag('msg-param-recipient-user-name');
    let gifter = e.flag('login');
    let months = e.flag('msg-param-sub-months');
    return `${e.command}: ${gifter} gifted to ${user} ${months}`;
  };

  HTMLGen.badgeImage = function(badge_name, badge_num) {
    let $i = $(`<img />`);
    $i.attr("src", client.GetGlobalBadge(badge_name, badge_num).image_url_1x);
    return $i;
  };

  /* Finally, connect */
  client.Connect();
}

