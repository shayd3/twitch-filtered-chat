/* Twitch Filtered Chat (v2) Main Module */

/* Objects:
 *
 *  div#wrapper
 *    div.column
 *      div.module.tl#p1
 *        div.header
 *          input.name
 *        div.settings
 *        div.content
 *      div.module.bl#p2
 *        div.header
 *          input.name
 *        div.settings
 *        div.content
 *    div.column
 *      div.module.right.full#p3
 *        div.header
 *          input.name
 *        div.settings
 *        div.content
 *        div.chat
 *          textarea#txtChat
 *  div#settings
 *    ul
 *      li
 *        input#txtChannel
 *      li
 *        input#txtNick
 *      li
 *        input#txtPass
 *    img#settings_button
 */

const CACHED_VALUE = "Cached";
const AUTOGEN_VALUE = "Auto-Generated";
var HTMLGen = {};
HTMLGen._dflt_colors = {};

HTMLGen.getColorFor = function _HTMLGen_getColorFor(username) {
  if (!HTMLGen._dflt_colors.hasOwnProperty(username)) {
    var ci = Math.floor(Math.random() * default_colors.length);
    HTMLGen._dflt_colors[username] = default_colors[ci];
  }
  return HTMLGen._dflt_colors[username];
}

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

  /* Items to remove from the query string */
  var query_remove = [];

  /* Parse localStorage config */
  let config_str = localStorage.getItem('config');
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

  /* Let the user know what settings we've decided to use */
  $("#txtChannel").val(config.Channels.join(","));
  $("#txtNick").val(!!config.Name ? config.Name : AUTOGEN_VALUE);
  if (config.ClientID.length == 30) {
    $("#txtClientID").attr("disabled", "disabled").val(CACHED_VALUE);
  }
  if (config.Pass.length > 0) {
    $("#txtPass").attr("disabled", "disabled").val(CACHED_VALUE);
  }
  if (config.Debug >= 0) {
    $("#selDebug").val(`${config.Debug}`);
  }

  if (query_remove.length > 0) {
    /* The query string contains sensitive information; remove it */
    localStorage.setItem("config", JSON.stringify(config));
    var old_qs = window.location.search;
    var old_query = Util.ParseQueryString(old_qs.substr(1));
    for (var e of query_remove) {
      delete old_query[e];
    }
    var new_qs = Util.FormatQueryString(old_query);
    console.log(`Setting qs to ${new_qs}`);
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
  localStorage.setItem('config', JSON.stringify(config));
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
  $(".module").each(function _module_add_html() {
    if (event instanceof TwitchEvent && !check_filtered($(this), event)) {
      /* Filtered out */
      return;
    }
    let html = (event instanceof TwitchEvent) ? HTMLGen.gen(event) : event;
    let $c = $(this).find('.content');
    let $p = document.createElement('p');
    $p.setAttribute('class', 'line');
    $p.innerHTML = html;
    $c.append($p);
    $c.scrollTop(2**31-1);
  });
}

/* Generate the message HTML for the given event */
function chat_message_html(event, client) {
  var message = event.message.escape();
  /* TODO: URL formatting */
  /* TODO: @user highlighting */
  /* TODO: emotes */
  /* TODO: cheers */
  /* TODO: cheer effects */
  return message;
}

/* Called once when the document loads */
function client_main() {
  let config = get_config_object();
  let client = new TwitchClient(config);
  config.Name = config.ClientID = config.Pass = undefined;
  Util.DebugLevel = config.Debug;

  $("#txtChat").keyup(function _txtChat_enter(e) {
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      for (let ch of config.Channels) {
        client.SendMessage(ch, e.target.value);
      }
      e.target.value = "";
      return false; /* prevent bubbling */
    }
  });

  $("#settings").keyup(function _settings_enter(e) {
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      update_settings();
      update_module_config();
      $("#settings_button").click();
    }
  });

  $("#settings_button").click(function _settings_button_keyup() {
    if ($("#settings").is(':visible')) {
      $('#settings').fadeOut();
    } else {
      let config = get_config_object();
      $("#txtChannel").val(config.Channels.join(","));
      $("#txtNick").attr("disabled", "disabled")
        .val(!!config.Name ? config.Name : AUTOGEN_VALUE);
      if (config.ClientID.length == 30) {
        $("#txtClientID").attr("disabled", "disabled").val(CACHED_VALUE);
      }
      if (config.Pass.length > 0) {
        $("#txtPass").attr("disabled", "disabled").val(CACHED_VALUE);
      }
      $('#settings').fadeIn();
    }
  });

  $("#txtChannel").keyup(function _cfg_channel_enter() {
    if (e.keyCode == KeyEvent.DOM_VK_RETURN) {
      /* TODO: join/part channels as needed */
    }
  });

  $("#selDebug").change(function _cfg_debug_change() {
    var v = parseInt($(this).val());
    var old = client.GetDebug();
    Util.Log(`Changing debug level from ${Util.DebugLevel} (${old}) to ${v}`);
    client.SetDebug(v);
  });

  $(".menu").click(function _on_menu_click() {
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

  $('.module .settings input[type="text"]').on('keyup', function _settings_input_keyup(e) {
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

  client.bind('twitch-open', function _on_twitch_open(e) {
    add_html('<p class="line">Connected</p>');
  });
  client.bind('twitch-notice', function _on_twitch_notice(e) {
    /* Some notices are benign */
    if (e.flag('msg-id') == 'host_on') { }
    else {
      Util.Warn(e);
    }
    let channel = Twitch.FormatChannel(e.channel);
    let message = e.message.escape();
    add_html(`<span class="notice">Notice: ${channel}: ${message}</span>`);
  });
  client.bind('twitch-error', function _on_twitch_error(e) {
    Util.Error(e);
    let user = e.user;
    let command = e.values.command;
    let message = e.message.escape();
    add_html(`<span class="error">Error ${user}: ${command}: ${message}</span>`);
  });
  client.bind('twitch-message', function _on_twitch_message(e) {
    if (Util.DebugLevel > 0) {
      add_html(`<span class="pre">${e.values.toSource()}</span>`);
    }
  });
  client.bind('twitch-chat', function _on_twitch_chat(e) {
    add_html(event);
  });

  /* Sync the final settings up with the html */
  $(".module").each(function() {
    set_module_settings(this, config[$(this).attr('id')]);
  });

  HTMLGen.gen = function _HTMLGen_gen(e) {
    /* TODO:
     *  emotes
     *  force
     *  forcejs
     *  forcebits
     *  cheer effects
     */
    let e_cont = document.createElement('div');
    e_cont.setAttribute('class', 'chat-line');
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
    e_cont.appendChild(HTMLGen.genBadges(e));
    e_cont.appendChild(HTMLGen.genName(e));
    e_cont.innerHTML += ":&nbsp";
    e_cont.appendChild(HTMLGen.genMsg(e));
    return e_cont.outerHTML;
  };
  HTMLGen.genName = function _HTMLGen_genName(e) {
    let user = e.flag("display-name");
    if (!user) user = e.user;
    let e_name = document.createElement('span');
    e_name.setAttribute('class', 'username');
    if (!!e.flags.color) {
      e_name.setAttribute("style", `color: ${e.flags.color}`);
    } else {
      e_name.setAttribute("style", `color: ${HTMLGen.getColorFor(user)}`);
    }
    e_name.innerHTML = user.escape();
    return e_name;
  };
  HTMLGen.genMsg = function _HTMLGen_genMsg(e) {
    let e_msg = document.createElement('span');
    e_msg.setAttribute('class', 'message');
    e_msg.innerHTML = chat_message_html(e, client);
    return e_msg;
  };
  HTMLGen.genBadges = function _HTMLGen_genBadges(e) {
    let e_badges = document.createElement('span');
    e_badges.setAttribute('class', 'badges');
    if (e.flags.badges) {
      for (let [badge_name, badge_num] of e.flags.badges) {
        let e_badge = document.createElement('img');
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
        e_badge.setAttribute('class', 'badge');
        e_badge.setAttribute('tw-badge-cause', JSON.stringify([badge_name, badge_num]));
        e_badges.appendChild(e_badge);
      }
    }
    return e_badges;
  };

  client.Connect();
}
