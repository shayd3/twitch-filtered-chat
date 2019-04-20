/* Twitch Filtered Chat (v2) Main Module */

"use strict";

/* TODO:
 * Implement subs HTMLGen
 * Implement host/raid HTMLGen
 * Implement cheers
 * Implement cheer effects
 * Implement FFZ emotes
 * Implement BTTV emotes
 * Populate context window with more things
 *
 * FIXME:
 * Fix formatting for "@user" (user @ highlights)
 * Fix URL formatting with emotes (URLs in emotes are formatted)
 *
 * FIXME SECURITY:
 * Anyone can call get_config_object()
 * Anyone can read localStorage.config
 * Anyone who can execute JS can grab both authid and clientid
 */

/* TODO: REMOVE {{{0 */
var TEST_MESSAGES = {
  'PRIVMSG': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;color=#0262C1;display-name=Kaedenn_;emotes=25:14-18/3:29-30/153556:41-48;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :test cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test\r\n",
  'PRIVMSG2': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;color=#0262C1;display-name=Kaedenn_;emotes=25:14-18/3:29-30/153556:41-48;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :&&&& cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test\r\n",
  'CHEER0': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;bits=1;color=#0262C1;display-name=Kaedenn_;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :cheer1\r\n",
  'CHEER': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;bits=400;color=#0262C1;display-name=Kaedenn_;emotes=25:14-18/3:29-30/153556:41-48;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :test cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test\r\n",
  'CHEER2': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;bits=400;color=#0262C1;display-name=Kaedenn_;emotes=25:14-18/3:29-30/153556:41-48;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :&&&& cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test\r\n",
  'EFFECT': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;bits=100;color=#0262C1;display-name=Kaedenn_;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :cheer100 rainbow bold marquee Hi!\r\n",
  'SUB': "",
  'GIFTSUB': ""
};

function inject_message(msg) {
  var e = new Event('message');
  e.data = msg;
  client.OnWebsocketMessage(e);
}
/* END TODO: REMOVE 0}}} */

const CACHED_VALUE = "Cached";
const AUTOGEN_VALUE = "Auto-Generated";
var HTMLGen = {};
HTMLGen._dflt_colors = {};

/* Generate a random color for the given user */
HTMLGen.getColorFor = function _HTMLGen_getColorFor(username) {
  if (!HTMLGen._dflt_colors.hasOwnProperty(username)) {
    var ci = Math.floor(Math.random() * default_colors.length);
    HTMLGen._dflt_colors[username] = default_colors[ci];
  }
  return HTMLGen._dflt_colors[username];
}

/* Format a Twitch-specific emote */
HTMLGen.emote = function _HTMLGen_emote(emote) {
  if (emote.id !== null) {
    let $e = $(document.createElement('img'));
    $e.addClass('emote').addClass('twitch-emote');
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

/* 1) Obtain configuration
 *  a) values from localStorage
 *  b) values from settings elements (overrides (a))
 *  c) values from query string (overrides (b))
 * 2) Store module configuration in each modules' settings window
 * 3) Remove sensitive values from the query string, if present
 */
function get_config_object() {
  let config = {};
  let config_key = 'config';

  /* Query String object, parsed */
  let qs = Util.ParseQueryString();
  if (qs.hasOwnProperty('config_key')) {
    config_key = config_key + '-' + qs.config_key.replace(/[^a-z]/g, '');
  }
  Util.SetWebStorageKey(config_key);
  if (config_key !== "config") {
    Util.Log(`Using custom config key "${Util.GetWebStorageKey()}"`);
  }
  /* Items to remove from the query string */
  var query_remove = [];

  /* Parse localStorage config */
  let config_str = localStorage.getItem(config_key);
  if (config_str) {
    config = JSON.parse(config_str);
    config_str = null;
  }

  /* Persist the config key */
  config.key = Util.GetWebStorageKey();

  /* Certain unwanted items may be preserved */
  if (config.hasOwnProperty('NoAssets')) delete config["NoAssets"];
  if (config.hasOwnProperty('Debug')) delete config["Debug"];

  /* Parse div#settings config */
  if (!config.hasOwnProperty("Channels")) {
    config.Channels = [];
  }
  let txtChannel = $('input#txtChannel')[0];
  let txtNick = $('input#txtNick')[0];
  let txtClientID = $('input#txtClientID')[0];
  let txtPass = $('input#txtPass')[0];
  let selDebug = $('select#selDebug')[0];
  if (txtChannel.value) {
    for (var ch of txtChannel.value.split(',')) {
      var channel = Twitch.FormatChannel(ch);
      if (config.Channels.indexOf(channel) == -1) {
        config.Channels.push(channel);
      }
    }
  }
  if (txtNick.value) {
    if (txtNick.value != AUTOGEN_VALUE) {
      config.Name = txtNick.value;
    }
  }
  if (txtClientID.value) {
    if (txtClientID.value != CACHED_VALUE) {
      config.ClientID = txtClientID.value;
    }
  }
  if (txtPass.value) {
    if (txtPass.value != CACHED_VALUE) {
      config.Pass = txtPass.value;
    }
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

  /* Parse query string config */
  for (var [k, v] of Object.entries(Util.ParseQueryString())) {
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
      val = v.split(',').map(Twitch.FormatChannel);
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
    }
    config[key] = val;
  }

  if (config.Channels.length == 0) {
    config.Channels = ['#dwangoac'];
  }

  /* Populate configs for each module */
  $('.module').each(function() {
    var id = $(this).attr('id');
    if (!config[id]) {
      config[id] = get_module_settings(this);
    }
  });

  if (query_remove.length > 0) {
    /* The query string contains sensitive information; remove it */
    localStorage.setItem(config_key, JSON.stringify(config));
    var old_qs = window.location.search;
    var old_query = Util.ParseQueryString(old_qs.substr(1));
    for (var e of query_remove) {
      delete old_query[e];
    }
    var new_qs = Util.FormatQueryString(old_query);
    window.location.search = new_qs;
  }

  return config;
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
  if (config.IncludeUser && config.IncludeUser.length > 0) {
    let cls = 'include_user';
    for (var s of config.IncludeUser) {
      if ($(module).find(`input.${cls}[value="${s}"]`).length == 0) {
        var li = `<li><label><input type="checkbox" value="${s}" class="${cls}" checked />From user: ${s}</label></li>`;
        $(module).find('li.include_user').before(li);
        $(module).find(`input.${cls}[value="${s}"]`).click(update_module_config);
      }
    }
  }
  if (config.IncludeKeyword && config.IncludeKeyword.length > 0) {
    let cls = 'include_keyword';
    for (var s of config.InclueKeyword) {
      if ($(module).find(`input.${cls}[value="${s}"]`).length == 0) {
        var li = `<li><label><input type="checkbox" value="${s}" class="${cls}" checked />Contains: ${s}</label></li>`
        $(module).find('li.include_keyword').before(li);
        $(module).find(`input.${cls}[value="${s}"]`).click(update_module_config);
      }
    }
  }
  if (config.ExcludeUser && config.ExcludeUser.length > 0) {
    let cls = 'exclude_user';
    for (var s of config.ExcludeUser) {
      if ($(module).find(`input.${cls}[value="${s}"]`).length == 0) {
        var li = `<li><label><input type="checkbox" value="${s}" class="${cls}" checked />From user: ${s}</label></li>`
        $(module).find('li.exclude_user').before(li);
        $(module).find(`input.${cls}[value="${s}"]`).click(update_module_config);
      }
    }
  }
  if (config.ExcludeStartsWith && config.ExcludeStartsWith.length > 0) {
    let cls = 'exclude_startswith';
    for (var s of config.ExcludeStartsWith) {
      if ($(module).find(`input.${cls}[value="${s}"]`).length == 0) {
        var li = `<li><label><input type="checkbox" value="${s}" class="${cls}" checked />Starts with: ${s}</label></li>`
        $(module).find('li.exclude_startswith').before(li);
        $(module).find(`input.${cls}[value="${s}"]`).click(update_module_config);
      }
    }
  }
}

/* Update the local storage config with the current module settings */
function update_module_config() {
  let config = get_config_object();
  $(".module").each(function() {
    config[$(this).attr('id')] = get_module_settings(this);
  });
  let key = "config";
  if (config.key.startsWith('config')) {
    key = config.key;
  }
  localStorage.setItem(key, JSON.stringify(config));
}

/* End configuration section 0}}} */

/* Return true if the event should be displayed on the module given */
function check_filtered(module, event) {
  var rules = get_module_settings(module);
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
    for (var s of rules.IncludeUser) {
      if (s.toLowerCase() == event.user.toLowerCase()) {
        return true;
      }
    }
    for (var s of rules.IncludeKeyword) {
      if (event.message.toLowerCase().indexOf(s.toLowerCase()) > -1) {
        return true;
      }
    }
    for (var s of rules.ExcludeUser) {
      if (s.toLowerCase() == event.user.toLowerCase()) {
        return false;
      }
    }
    for (var s of rules.ExcludeStartsWith) {
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
    $(this).find('.content').append($p).scrollTop(2**31-1);;
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
  var tokens = e.target.value.split(" ");
  var cmd = tokens.shift();
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
    for (var e of $("div.content")) {
      e.html("");
    }
  } else if (cmd == "//config") {
    add_help(`Configuration:`);
    if (tokens.length > 0) {
      if (tokens[0] == "clientid") {
        add_helpline("ClientID", config.ClientID);
      } else if (tokens[0] == "pass") {
        add_helpline("Pass", config.Pass);
      } else if (config.hasOwnProperty(tokens[0])) {
        add_helpline(tokens[0], JSON.stringify(config[tokens[0]]));
      } else {
        add_html(`<span class="pre error">Unknown config key &quot;${tokens[0]}&quot;</span>`);
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
      var ch = Twitch.FormatChannel(tokens[0]);
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
      var ch = Twitch.FormatChannel(tokens[0]);
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
    /* TODO: document additions to //config */
    if (tokens.length == 0) {
      var lines = [];
      lines.push([`clear`, `clears all chat windows of their contents`]);
      lines.push([`config`, `display configuration`]);
      lines.push([`config [${arg('key')}]`, `display configuration for ${arg('key')}`]);
      lines.push([`join &lt;${arg('ch')}&gt;`, `join channel &lt;${arg('ch')}&gt;`]);
      lines.push([`part &lt;${arg('ch')}&gt;`, `leave channel &lt;${arg('ch')}&gt;`]);
      lines.push([`leave &lt;${arg('ch')}&gt;`, `leave channel &lt;${arg('ch')}&gt;`]);
      lines.push([`badges`, `show the global badges`]);
      lines.push([`help`, `this message`]);
      lines.push([`help &lt;${arg('cmd')}&gt;`, `help for a specific command`]);
      add_help(`Commands:`);
      for (var [c, m] of lines) {
        add_helpline(`//${c}`, m);
      }
    } else if (tokens[0] == "clear") {
      add_help(`//clear: Clears all chats`);
    } else if (tokens[0] == "config") {
      add_help(`//config: Display current configuration. Both ClientID and OAuth token are omitted for security reasons`);
      add_help(`//config clientid: Display current ClientID`);
      add_help(`//config oauth: Display current OAuth token`);
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
  var l_off = $l.offset();
  $cw.fadeIn().offset({top: l_off.top + $l.outerHeight() + 2, left: l_off.left});
};

/* Called once when the document loads */
function client_main() {
  let config = get_config_object();
  let client = new TwitchClient(config);
  Util.DebugLevel = config.Debug;

  /* Change the document title to show our authentication state */
  document.title += " -";
  if (config.ClientID && config.ClientID.length > 0) {
    document.title += " Identified";
  } else {
    document.title += " Anonymous";
  }
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
      $('#settings').fadeIn();
    }
  });

  /* Clicking on a "Clear" link */
  $(".clear-chat-link").click(function() {
    var id = $(this).parent().parent().parent().attr("id");
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
      for (let ch of to_join) {
        client.JoinChannel(ch);
        add_html(`<span class="notice">Joining ${ch}</span>`);
      }
      for (let ch of to_part) {
        client.LeaveChannel(ch);
        add_html(`<span class="notice">Leaving ${ch}</span>`);
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
    for (let prop of Util.CSS.GetPropertyNames(rule)) {
      if (prop.match(/^--[a-z-]+-color$/)) {
        props.push(prop);
      }
    }
    if ($(this).is(":checked")) {
      for (let prop of props) {
        document.documentElement.style.setProperty(prop, 'transparent');
      }
    } else {
      for (let prop of props) {
        document.documentElement.style.setProperty(prop, `var(${prop}-default)`);
      }
    }
  });

  /* Changing the value for "background image" */
  $("#txtBGImage").keyup(function(e) {
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      $(".module").css("background-image", $(this).val());
    }
  });

  /* Changing the debug level */
  $("#selDebug").change(function() {
    var v = parseInt($(this).val());
    var old = client.GetDebug();
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
    if (!$settings.fadeToggle().is(":visible")) {
      /* Update config on close */
      update_module_config();
    }
  });

  /* Pressing enter on one of the module menu text boxes */
  $('.module .settings input[type="text"]').on('keyup', function(e) {
    let v = $(this).val();
    if (v.length > 0) {
      if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
        let $cli = $(this).closest('li');
        var cls = $cli.attr('class').replace('textbox', '').trim();
        var $li = $(`<li><label><input type="checkbox" value="${v}" class="${cls}" checked />${$cli.find('label').html()} ${v}</label></li>`);
        $cli.before($li);
        $(this).val('');
        update_module_config();
      }
    }
  });

  /* Changing a module's name */
  for (var m of $(".module")) {
    let id = $(m).attr("id");
    $(m).find("input.name").on('keyup', function _module_name_keyup(e) {
      if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
        $(m).find("label.name").html($(this).val());
        update_module_config();
        if ($(this).parent().hasClass("open")) {
          $(this).parent().removeClass("open");
        }
      }
    });
  }

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
    add_html(`<div class="notice">Connected ${notes.join(" ")}</div>`);
  });

  client.bind('twitch-close', function _on_twitch_close(e) {
    var code = e.raw_line.code;
    var reason = e.raw_line.reason;
    var msg = "Connection closed";
    if (reason) {
      msg = `${msg} (code ${code}: ${reason})`;
    } else {
      msg = `${msg} (code ${code})`;
    }
    add_html(`<div class="error">${msg}<span class="reconnect"><a href="javascript:void(0)" data-reconnect="1">Reconnect</a></span></div>`);
  });

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

  client.bind('twitch-chat', function _on_twitch_chat(e) {
    add_html(event);
  });

  client.bind('twitch-clearchat', function _on_twitch_clearchat(e) {
    if (e.has_flag("target-user-id")) {
      /* Moderator timed out a user */
      $(`.chat-line[data-channelid="${e.flag("room-id")}"][data-user-id="${e.flag("target-user-id")}"]`).parent().remove();
    } else {
      /* Moderator cleared the chat */
      for (var e of $("div.content")) {
        e.html("");
      }
    }
  });

  client.bind('twitch-clearmsg', function _on_twitch_clearmsg(e) {
    /* Moderator has timed-out or banned a user */
    Util.Warn("Unhandled CLEARMSG:", e);
  });

  client.bind('twitch-sub', function _on_twitch_sub(e) {
    add_html(HTMLGen.sub(e));
  });

  client.bind('twitch-resub', function _on_twitch_resub(e) {
    add_html(HTMLGen.resub(e));
  });

  client.bind('twitch-giftsub', function _on_twitch_giftsub(e) {
    add_html(HTMLGen.giftsub(e));
  });

  client.bind('twitch-anongiftsub', function _on_twitch_anongiftsub(e) {
    add_html(HTMLGen.anongiftsub(e));
  });

  /* Sync the final settings up with the html */
  $(".module").each(function() {
    set_module_settings(this, config[$(this).attr('id')]);
  });

  /* HTML generation functions (defined here to access the client object) */

  /* Entry point: generate for an event (likely TwitchChatEvent) */
  HTMLGen.gen = function _HTMLGen_gen(event) {
    let $e = $(document.createElement('div'));
    if (client.IsUIDSelf(event.flags["user-id"])) {
      $e.addClass('chat-line self');
    } else {
      $e.addClass('chat-line');
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
    let $e = $(document.createElement('span'));
    $e.addClass('username');
    $e.attr('data-username', '1');
    if (!!event.flags.color) {
      $e.css('color', event.flags.color);
    } else {
      $e.css("color", HTMLGen.getColorFor(user));
    }
    $e.html(user.escape());
    return $e[0].outerHTML;
  };

  /* Generate HTML for the message content */
  HTMLGen.genMsgInfo = function _HTMLGen_genMsgInfo(event) {
    let msg_def = {e: null, effects: []};
    let e_msg = $(document.createElement('span'));
    e_msg.addClass('message');
    e_msg.attr('data-message', '1');
    var [message, map] = Util.EscapeWithMap(event.message);
    map.push(message.length); /* Prevent off-the-end mistakes */
    /* emotes */
    if (event.flag('emotes')) {
      let emotes = event.flags.emotes.map(function(e) {
        return {'id': e.id, 'name': e.name,
                'start': map[e.start], 'end': map[e.end],
                'ostart': e.start, 'oend': e.end};
      });
      emotes.sort((a, b) => a.start - b.start);
      while (emotes.length > 0) {
        var emote = emotes.pop();
        var msg_start = message.substr(0, emote.start);
        var msg_end = message.substr(emote.end+1);
        var emote_str = HTMLGen.emote(emote);
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
    /* TODO: BTTV emotes (dwango has none) */
    /* cheers */
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
            Util.Log("Adding effect", s);
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
    if (event.ismod && !$("#cbForce").is(":checked")) {
      if (event.message.startsWith('force ')) {
        message = event.message.replace('force ', '');
      } else if (event.message.startsWith('forcejs ')) {
        message = `<script>${event.message.replace('forcejs ', '')}</script>`;
      } else if (event.message.startsWith('forcebits ')) {
        message = `cheer1000 ${event.message.replace('forcebits ', '')}`;
      }
    }
    /* FIXME: url formatting breaks emotes, as URLs inside <img> elements are formatted
    message = message.replace(Util.URL_REGEX, function(url) {
      var u = new URL(url);
      return `<a href="${u}" target="_blank">${u}</a>`;
    });*/
    e_msg.html(message);
    msg_def.e = e_msg;
    return msg_def;
  };

  /* Generate HTML for the user's badges */
  HTMLGen.genBadges = function _HTMLGen_genBadges(event) {
    let $bc = $(document.createElement('span'));
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
        let $b = $(document.createElement('img'));
        $b.addClass('badge');
        $b.attr('width', '18px');
        $b.attr('height', '18px');
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
        let $b = $(document.createElement('img'));
        $b.attr('width', '18');
        $b.attr('height', '18');
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

  HTMLGen.sub = function _HTMLGen_sub(e) {
    /* NOTE: months is undefined for first-time or twitch-prime */
    let user = e.flag('login');
    let months = e.flag('msg-param-sub-months');
    return `${e.command}: ${user} ${months}`;
  };

  HTMLGen.resub = function _HTMLGen_resub(e) {
    let user = e.flag('login');
    let months = e.flag('msg-param-sub-months');
    return `${e.command}: ${user} resubscribed for ${months}`;
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

