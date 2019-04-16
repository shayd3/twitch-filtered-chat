/* Twitch Filtered Chat (v2) Main Module */

"use strict";

/* TODO:
 * TOP PRIORITY: single-panel and double-panel configurability
 * Implement subs HTMLGen
 * Implement host/raid HTMLGen
 * Implement cheers
 * Implement cheer effects
 * Implement FFZ emotes
 * Implement BTTV emotes
 * Populate context window with more things
 *
 * FIXME:
 * Fix formatting for "@Kaedenn_" (for me)
 * Fix URL formatting with emotes (URLs in emotes are formatted)
 * Fix emotes with escaping before the emote (escape sequences alter emote positions)
 *
 * FIXME SECURITY:
 * Anyone can call get_config_object()
 * Anyone can read localStorage.config
 * Anyone who can execute JS can grab both authid and clientid
 */

/* TODO: REMOVE */
function inject_message(msg) {
  var e = new Event('message');
  e.data = msg;
  client.OnWebsocketMessage(e);
}
/* END TODO: REMOVE */

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

/* Ensure a channel starts with "#" */
function sanitize_channel(ch) {
  if (!ch.startsWith('#')) {
    return `#${ch}`;
  } else {
    return ch;
  }
}

/* Obtain configuration:
 *  1) values from localStorage
 *  2) values from settings elements (overrides (1))
 *  3) values from query string (overrides (2))
 * Obtain per-module configuration
 */
function get_config_object() {
  let config = {};
  let config_key = 'config';

  /* Query String object, parsed */
  let qs = Util.ParseQueryString();
  console.log(qs);
  if (qs.hasOwnProperty('wskey')) {
    config_key = config_key + '-' + qs.wskey.replace(/[^a-z]/g, '');
  }
  Util.SetWebStorageKey(config_key);
  console.log(`Using config key "${Util.GetWebStorageKey()}"`);
  config.key = config_key;

  /* Items to remove from the query string */
  var query_remove = [];

  /* Parse localStorage config */
  let config_str = localStorage.getItem(config_key);
  if (config_str) {
    config = JSON.parse(config_str);
    config_str = null;
  }
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
      var channel = sanitize_channel(ch);
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
    if (k == "clientid") { key = "ClientID"; query_remove.push(k); }
    if (k == "user") { key = "Name"; }
    if (k == "pass") { key = "Pass"; query_remove.push(k); }
    if (k == "channels") {
      key = "Channels";
      val = v.split(',').map(sanitize_channel);
    }
    if (k == "debug") {
      key = "Debug";
      if (!val) { val = 0; }
      if (val == "true") { val = 1; }
      if (val == "false") { val = 0; }
      if (val == "debug") { val = 1; }
      if (val == "trace") { val = 2; }
    }
    if (k == "noassets") {
      key = "NoAssets";
      val = !!v;
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
  $(".module").each(function() {
    if (event instanceof TwitchEvent && !check_filtered($(this), event)) {
      /* Filtered out */
      return;
    }
    let html = (event instanceof TwitchEvent) ? HTMLGen.gen(event) : event;
    let $c = $(this).find('.content');
    let $p = document.createElement('p');
    $p.setAttribute('class', 'line line-wrapper');
    $p.innerHTML = html;
    $c.append($p);
    $c.scrollTop(2**31-1);
  });
}

/* Shortcut for adding a <div class="pre"> element */
function add_pre(content) {
  add_html(`<div class="pre">${content}</div>`);
}

/* Place an emote in the message and return the result */
function place_emote(message, emote_def) {
  var msg_start = message.substr(0, emote_def.start);
  var msg_end = message.substr(emote_def.end+1);
  var emote_str = "";
  if (emote_def.name !== null) {
    if (message.substring(emote_def.start, emote_def.end+1) !== emote_def.name) {
      console.error("Emote name and message mismatch");
      console.error(`"${message}"`, emote_def);
      console.error(message.substring(emote_def.start, emote_def.end+1), "!==", emote_def.name);
    }
  }
  if (emote_def.id !== null) {
    /* It's a Twitch emote */
    var e = document.createElement('img');
    $(e).addClass("emote")
      .addClass("twitch-emote")
      .attr("tw-emote-id", emote_def.id)
      .attr("src", Twitch.URL.Emote(emote_def.id));
    emote_str = e.outerHTML;
  }
  /* TODO: remove */
  if (emote_str.length == 0) {
    console.warn(`Failed to place emote`, emote_def, `in "${message}"`)
    emote_str = JSON.stringify(emote_def);
  }
  return `${msg_start}${emote_str}${msg_end}`;
}

/* Handle a chat command */
function handle_command(e, client, config) {
  var tokens = e.target.value.split(" ");
  var cmd = tokens.shift();
  if (cmd == '//clear') {
    for (var e of $("div.content")) {
      e.html("");
    }
  } else if (cmd == "//config") {
    /* TODO: nicer output, setting config values */
    add_pre(`${JSON.stringify(config).escape()}`);
  } else if (cmd == "//join") {
    if (tokens.length > 0) {
      var ch = sanitize_channel(tokens[0]);
      if (!client.IsInChannel(ch)) {
        client.JoinChannel(ch);
        add_pre(`Joined ${ch}`);
      } else {
        add_pre(`Already in channel ${ch}`);
      }
    } else {
      add_pre(`Usage: //join &lt;channel&gt;`);
    }
  } else if (cmd == "//part" || cmd == "//leave") {
    if (tokens.length > 0) {
      var ch = sanitize_channel(tokens[0]);
      if (client.IsInChannel(ch)) {
        client.LeaveChannel(ch);
        add_pre(`Left ${ch}`);
      } else {
        add_pre(`Not in channel ${ch}`);
      }
    } else {
      add_pre(`Usage: //leave &lt;channel&gt;`);
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
      lines.push(["clear", "clears all chat windows of their contents"]);
      lines.push(["config", "display current configuration, less ClientID and OAuth token"]);
      lines.push(["join <ch>", "join channel <ch>"]);
      lines.push(["part <ch>", "leave channel <ch>"]);
      lines.push(["leave <ch>", "leave channel <ch>"]);
      lines.push(["badges", "show the global badges"]);
      lines.push(["help", "this message"]);
      lines.push(["help <cmd>", "help for a specific command"]);
      add_pre(`<div class="help">Commands:</div>`);
      for (var [c, m] of lines) {
        add_pre(`<div class="helpline"><span class="help helpcmd">//${c.escape()}</span><span class="help helpmsg">${m.escape()}</span></div>`);
      }
    } else if (tokens[0] == "clear") {
      add_pre(`<div class="help">//clear: Clears all chats</div>`);
    } else if (tokens[0] == "config") {
      add_pre(`<div class="help">//config: Display current configuration. Both ClientID and OAuth token are omitted for security reasons</div>`);
    } else if (tokens[0] == "join") {
      add_pre(`<div class="help">//join &lt;ch&gt;: Join the specified channel. Channel may or may not include leading #</div>`);
    } else if (tokens[0] == "part" || tokens[0] == "leave") {
      add_pre(`<div class="help">//part &lt;ch&gt;: Disconnect from the specified channel. Channel may or may not include leading #</div>`);
      add_pre(`<div class="help">//leave &lt;ch&gt;: Disconnect from the specified channel. Channel may or may not include leading #</div>`);
    } else if (tokens[0] == "help") {
      add_pre(`<div class="help">//help: Displays a list of recognized commands and their usage</div>`);
      add_pre(`<div class="help">//help &lt;cmd&gt;: Displays help for a specific command</div>`);
    } else {
      add_pre(`<div class="help">//help: No such command "${tokens[0].escape()}"</div>`);
    }
  } else if (cmd.startsWith('//')) {
    add_html(`<div class="pre error">Unknown command "${cmd.escape()}"</div>`);
  } else {
    return false;
  }
  return true;
}

function format_date(date) {
  let [y, m, d] = [date.getFullYear(), date.getMonth(), date.getDay()];
  let [h, mi, s] = [date.getHours(), date.getMinutes(), date.getSeconds()];
  let ms = date.getMilliseconds();
  let p = [y, Util.Pad(m, 2), Util.Pad(d, 2),
           Util.Pad(h, 2), Util.Pad(mi, 2), Util.Pad(s, 2),
           Util.Pad(ms, 3)];
  return `${p[0]}-${p[1]}-${p[2]} ${p[3]}:${p[4]}:${p[5]}.${p[6]}`;
}

function populate_username_context_window(client, cw, line) {
  let $cw = $(cw);
  let $l = $(line);
  $(cw).html(""); /* Clear everything from the last time */
  let d = {};
  d.id = $l.attr("data-id");
  d.user = $l.attr("data-user");
  d.userid = $l.attr("data-user-id");
  d.channel = `#${$l.attr("data-channel")}`;
  d.chid = $l.attr("data-channelid");
  d.sub = $l.attr("data-subscriber") === "1";
  d.mod = $l.attr("data-mod") === "1";
  d.vip = $l.attr("data-vip") === "1";
  d.time = new Date(Number.parseInt($l.attr("data-sent-ts")));
  /* Add link to timeout user */
  let $tl = $(`<div class="cw-timeout">Timeout</div>`);
  for (let dur of "1s 10s 60s 10m 30m 1h 12h 24h".split(" ")) {
    let $ta = $(`<a class="cw-timeout-dur" id="cw-timeout-${d.user}-${dur}" href="javascript:void(0)" data-channel="${d.channel}" data-user="${d.user}" data-duration="${dur}">${dur}</a>`);
    $ta.click(function() {
      client.Timeout($(this).attr('data-channel'), $(this).attr('data-user'), $(this).attr('data-duration'));
      console.log('Timeout user', $(this).attr('data-user'), 'from', $(this).attr('data-channel'), 'for', $(this).attr('data-duration'));
      $(cw).fadeOut();
    });
    $tl.append($ta);
  }
  $cw.append($tl);
  /* Add timestamp of when the message was sent */
  $cw.append($(`<span class="timestamp">${format_date(d.time)}</span>`));
  /*
<div class="chat-line"
     data-id="2839621c-0f3c-4d46-947a-891297fcf68c"
     data-user="kaedenn_"
     data-user-id="175437030"
     data-channel="dwangoac"
     data-channelid="70067886"
     data-subscriber="1"
     data-mod="1"
     data-vip="0"
     data-sent-ts="1555205340901">
 <span class="badges"
       data-badges="1"
       style="overflow: hidden; width: 54px; max-width: 54px">
  <img data-badge="1"
       src="https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1"
       tw-badge-scope="global"
       alt="Moderator"
       class="badge"
       tw-badge-cause="[&quot;moderator&quot;,&quot;1&quot;]"
       width="18px">
  <img data-badge="1"
       src="https://static-cdn.jtvnw.net/badges/v1/b809b308-dffd-42e7-8f19-65aa26193303/1"
       tw-badge="{&quot;image&quot;:&quot;https://static-cdn.jtvnw.net/badges/v1/b809b308-dffd-42e7-8f19-65aa26193303/1&quot;}"
       tw-badge-scope="channel"
       tw-badge-channel="dwangoac"
       class="badge"
       tw-badge-cause="[&quot;subscriber&quot;,&quot;12&quot;]"
       width="18px">
  <img data-badge="1"
       src="https://static-cdn.jtvnw.net/badges/v1/0d85a29e-79ad-4c63-a285-3acd2c66f2ba/1"
       tw-badge-scope="global"
       alt="cheer 1000"
       class="badge"
       tw-badge-cause="[&quot;bits&quot;,&quot;1000&quot;]"
       width="18px">
 </span>
 <span class="username"
       data-username="1"
       style="color: #0262C1">Kaedenn_</span>
 :&nbsp;
 <span class="message"i
       data-message="1">test</span>
</div>
*/
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

  /* Sending a chat message */
  $("#txtChat").keydown(function(e) {
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      if (!handle_command(e, client, config)) {
        client.SendMessageToAll(e.target.value);
      }
      e.target.value = "";
      e.preventDefault(); /* prevent bubbling */
      return false; /* prevent bubbling */
    }
  });

  /* Pressing enter while on the settings box */
  $("#settings").keyup(function(e) {
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      update_settings();
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
  $(".clch_link").click(function() {
    var id = $(this).parent().parent().parent().attr("id");
    $(`#${id} .content`).html("");
  });

  /* Pressing enter on the "Channels" text box */
  $("#txtChannel").keyup(function() {
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      /* TODO: join/part channels as needed */
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
    var $lbl = $(this).parent().children("label");
    var $tb = $(this).parent().children("input");
    if ($(this).parent().hasClass('open')) {
      $(this).parent().removeClass('open');
      $lbl.html($tb.val());
      update_module_config();
    } else {
      $(this).parent().addClass('open');
      $tb.val($lbl.html());
    }
  });

  /* Pressing enter on one of the module menu text boxes */
  $('.module .settings input[type="text"]').on('keyup', function(e) {
    if ($(this).val().length > 0) {
      if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
        var cls = $(this).closest('li').attr('class').replace('textbox', '').trim();
        var $li = $(`<li><label><input type="checkbox" value="${$(this).val()}" class="${cls}" checked />${$(this).closest('li').find('label').html()} ${$(this).val()}</label></li>`);
        $(this).closest('li').before($li);
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
    let pos = {top: e.clientY, left: e.clientX};
    /* Clicking on a reconnect link */
    if ($t.attr("data-reconnect") == '1') {
      add_html(`<div class="notice">Reconnecting...</div>`);
      client.Connect();
    }
    /* Clicking on a username: context window */
    let cw = document.getElementById("username_context");
    var $cw = $(cw);
    if ($t.attr('data-username') == '1') {
      /* Clicked on a username; open context window */
      populate_username_context_window(client, $cw, $t.parent());
    } else if (Util.PointIsOn(e.clientX, e.clientY, cw)) {
      /* Clicked on the context window */
    } else {
      /* Clicked somewhere else: close context window */
      $cw.fadeOut();
    }
  });

  /* Bind to the various Twitch events we're interested in */

  client.bind('twitch-open', function _on_twitch_open(e) {
    let notes = [];
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
    add_html(`<div class="error">${msg}<span class="reconnect"><a href="javascript:void(0)" class="reconnectLink" data-reconnect="1">Reconnect</a></span></div>`);
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
  HTMLGen.gen = function _HTMLGen_gen(e) {
    let e_cont = document.createElement('div');
    if (client.IsSelf(e.flags["user-id"])) {
      e_cont.setAttribute('class', 'chat-line client');
    } else {
      e_cont.setAttribute('class', 'chat-line');
    }
    e_cont.setAttribute("data-id", e.flags.id);
    e_cont.setAttribute("data-user", e.user);
    e_cont.setAttribute("data-user-id", e.flags["user-id"]);
    e_cont.setAttribute("data-channel", e.channel.channel.lstrip('#'));
    if (!!e.channel.room)
      e_cont.setAttribute("data-room", e.channel.room);
    if (!!e.channel.roomuid)
      e_cont.setAttribute("data-roomuid", e.channel.roomuid);
    e_cont.setAttribute("data-channelid", e.flags["room-id"]);
    e_cont.setAttribute("data-subscriber", e.flags.subscriber);
    e_cont.setAttribute("data-mod", e.flags.mod);
    e_cont.setAttribute("data-vip", e.isvip ? "1" : "0");
    e_cont.setAttribute("data-sent-ts", e.flags["tmi-sent-ts"]);
    e_cont.setAttribute("data-recv-ts", Date.now());
    e_cont.appendChild(HTMLGen.genBadges(e));
    e_cont.appendChild(HTMLGen.genName(e));
    e_cont.innerHTML += ":&nbsp";
    e_cont.appendChild(HTMLGen.genMsg(e));
    return e_cont.outerHTML;
  };

  /* Generate HTML for a user's name */
  HTMLGen.genName = function _HTMLGen_genName(e) {
    let user = e.flag("display-name");
    if (!user) user = e.user;
    let e_name = document.createElement('span');
    e_name.setAttribute('class', 'username');
    e_name.setAttribute('data-username', '1');
    if (!!e.flags.color) {
      e_name.setAttribute("style", `color: ${e.flags.color}`);
    } else {
      e_name.setAttribute("style", `color: ${HTMLGen.getColorFor(user)}`);
    }
    e_name.innerHTML = user.escape();
    return e_name;
  };

  /* Generate HTML for the message content (see chat_message_html above) */
  HTMLGen.genMsg = function _HTMLGen_genMsg(e) {
    let e_msg = $(document.createElement('span'));
    e_msg.addClass('message');
    e_msg.attr('data-message', '1');
    var [message, map] = Util.EscapeWithMap(event.message);
    /* emotes */
    if (event.flag('emotes')) {
      let emotes = $.map(event.flags.emotes, function(e) {
        return {'id': e.id, 'name': e.name, 'start': map[e.start], 'end': map[e.end]};
      });
      emotes.sort((a, b) => a.start - b.start);
      while (emotes.length > 0) {
        var emote = emotes.pop();
        message = place_emote(message, emote);
      }
    }
    /* cheers, cheer effects */
    if (event.flag('bits') && event.flag("bits") > 0) {
      let bits_left = event.flags.bits;
      for (var word of message.split(" ")) {
        if (client.IsCheer(e.channel.channel, word)) {
          /* TODO */
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
    return e_msg[0];
  };

  /* Generate HTML for the user's badges */
  HTMLGen.genBadges = function _HTMLGen_genBadges(e) {
    let e_badges = document.createElement('span');
    e_badges.setAttribute('class', 'badges');
    e_badges.setAttribute('data-badges', '1');
    if (e.flags.badges) {
      let total_width = 18 * e.flags.badges.length;
      if (e.flags['ffz-badges']) {
        total_width += 18 * e.flags['ffz-badges'].length;
      }
      e_badges.setAttribute("style", `overflow: hidden; width: ${total_width}px; max-width: ${total_width}px`);
      for (let [badge_name, badge_num] of e.flags.badges) {
        let e_badge = document.createElement('img');
        e_badge.setAttribute('width', '18');
        e_badge.setAttribute('height', '18');
        e_badge.setAttribute('data-badge', '1');
        if (client.IsGlobalBadge(badge_name, badge_num)) {
          let badge_info = client.GetGlobalBadge(badge_name, badge_num);
          e_badge.setAttribute('src', badge_info.image_url_1x);
          e_badge.setAttribute('tw-badge-scope', 'global');
          e_badge.setAttribute('alt', badge_info.title);
        } else if (client.IsChannelBadge(e.channel, badge_name)) {
          let badge_info = client.GetChannelBadge(e.channel, badge_name);
          let badge_src = !!badge_info.alpha ? badge_info.alpha : badge_info.image;
          e_badge.setAttribute('src', badge_src);
          e_badge.setAttribute('tw-badge', JSON.stringify(badge_info));
          if (!!e.channel) {
            e_badge.setAttribute('tw-badge-scope', 'channel');
            e_badge.setAttribute('tw-badge-channel', e.channel.channel.lstrip('#'));
          }
        } else {
          console.warn('Unknown badge', badge_name, badge_num, 'for', e);
          continue;
        }
        e_badge.setAttribute('width', '18px');
        e_badge.setAttribute('class', 'badge');
        e_badge.setAttribute('tw-badge-cause', JSON.stringify([badge_name, badge_num]));
        e_badges.appendChild(e_badge);
      }
    }
    /* Add FFZ badges */
    if (e.flags['ffz-badges']) {
      for (let badge of Object.values(e.flags['ffz-badges'])) {
        let e_badge = $(document.createElement('img'));
        e_badge.attr('width', '18');
        e_badge.attr('height', '18');
        e_badge.attr('data-badge', '1');
        e_badge.attr('data-ffz-badge', '1');
        e_badge.attr('src', Util.URL(badge.image));
        e_badge.attr('alt', badge.name);
        e_badge.attr('title', badge.title);
        e_badges.appendChild(e_badge[0]);
      }
    }
    /* TODO: add BTTV badges */

    return e_badges;
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

  /* Finally, connect */
  client.Connect();
}
