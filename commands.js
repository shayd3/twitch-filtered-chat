/* Twitch Filtered Chat Commands */

"use strict";

/** Chat Commands
 *
 ** Adding a chat command:
 *
 * ChatCommands.add(command, function, description, args...)
 *   command      (string) chat command to add, executed via //command
 *   function     a function taking the following arguments
 *     cmd        the command being executed (value of command parameter)
 *     tokens     the arguments passed to the command when ran
 *     client     a reference to the TwitchClient object
 *     args...    extra arguments passed to ChatCommands.add, as-is
 *   description  (string) a description of the command to be printed in //help
 *   args         (optional) extra arguments to pass to the function
 *
 ** Example:
 *
 * Run the following JavaScript:
 *   ChatCommands.add("mycommand", mycommandfunc, "My new command", 1, 2)
 * Type the following into chat:
 *   "//mycommand value1 value2"
 * This results in the following call:
 *   mycommandfunc("mycommand", ["value1", "value2"], client, 1, 2)
 */

var ChatCommands = null; /* exported ChatCommands */

class ChatCommandManager {
  constructor() {
    this._command_list = [];
    this._commands = {};
    this._aliases = {};
    this._help_text = [];
    this.add("help", this.onCommandHelp.bind(this),
             "Show help for a specific command or all commands");
    this.addAlias("?", "help");
    this.addUsage("help", null, "Show help for all commands");
    this.addUsage("help", "command", "Show usage information for <command>");
  }

  _trim(msg) {
    return msg.replace(/^\/\//, "").replace(/^\./, "");
  }

  add(command, func, desc, ...args) {
    if (!command.match(/^[a-z0-9_-]+$/)) {
      Util.Error(`Invalid command "${command.escape()}"`);
    } else {
      let c = {};
      c.name = command;
      c.func = func;
      c.desc = desc;
      c.aliases = [];
      c.dflt_args = args.length > 0 ? args : null;
      this._command_list.push(command);
      this._commands[command] = c;
    }
  }

  addAlias(command, referred_command) {
    if (this.hasCommand(referred_command, true)) {
      this._aliases[command] = referred_command;
      this._commands[referred_command].aliases.push(command);
    } else {
      Util.Error(`Invalid command: ${referred_command}`);
    }
  }

  addUsage(command, argstr, usagestr, opts=null) {
    if (this.hasCommand(command, true)) {
      let c = this.getCommand(command);
      if (!c.usage) c.usage = [];
      c.usage.push({args: argstr, usage: usagestr, opts: opts || {}});
    } else {
      Util.Error(`Invalid command: ${command}`);
    }
  }

  addHelp(text, opts=null) {
    let o = opts || {};
    let t = text;
    if (o.indent) t = "&nbsp;&nbsp;" + t;
    if (o.literal) t = t.escape();
    if (o.args) t = this.formatArgs(t);
    if (o.command) {
      let cmd = t.substr(0, t.indexOf(":"));
      let msg = t.substr(t.indexOf(":")+1);
      t = this.helpLine(cmd, msg);
    }
    this._help_text.push(t);
  }

  complete(client, complete_args) {
    let text = complete_args.orig_text;
    let pos = complete_args.orig_pos;
    let idx = complete_args.index;
    /* "test te<tab>" -> "test te" */
    let text_before = text.substr(0, pos);
    /* "test te<tab>" -> "te" */
    let curr_word = text_before;
    let word_pos = text_before.search(/\W[\w]*$/);
    if (word_pos > -1) {
      curr_word = text_before.substr(word_pos).trimStart();
    }
    if (curr_word.startsWith("@")) {
      /* Complete @<user> sequences */
      let prefix = curr_word.substr(1);
      let matches = [];
      for (let c of client.GetJoinedChannels()) {
        let cinfo = client.GetChannelInfo(c);
        if (cinfo.users) {
          for (let user of cinfo.users) {
            if (prefix.length === 0 || user.startsWith(prefix)) {
              matches.push(user);
            }
          }
        }
      }
      if (idx < matches.length) {
        text = text.substr(0, word_pos) + "@" + matches[idx];
      }
      idx += 1;
      if (idx >= matches.length) {
        idx = 0;
      }
    } else if (this.isCommandStr(text)) {
      /* Complete commands */
      let word = this._trim(text.substr(0, pos));
      let prefix = text;
      let matches = [];
      if (word.length > 0) {
        prefix = text.substr(0, text.indexOf(word));
      }
      for (let k of Object.keys(this._commands).sort()) {
        if (word.length === 0 || k.startsWith(word)) {
          matches.push(k);
        }
      }
      if (idx < matches.length) {
        text = prefix + matches[idx];
        /* TODO: adjust curr_pos */
      }
      idx += 1;
      if (idx >= matches.length) {
        idx = 0;
      }
    }
    return {
      orig_text: complete_args.orig_text,
      orig_pos: complete_args.orig_pos,
      curr_text: text,
      curr_pos: pos,
      index: idx
    };
  }

  isCommandStr(msg) {
    return msg.match(/^\/\//) || msg.match(/^\./);
  }

  hasCommand(msg, native_only=false) {
    let cmd = this._trim(msg);
    if (this._commands.hasOwnProperty(cmd)) {
      return true;
    } else if (!native_only && this._aliases.hasOwnProperty(cmd)) {
      return true;
    }
    return false;
  }

  execute(msg, client) {
    if (this.isCommandStr(msg)) {
      let cmd = this._trim(msg.split(" ")[0]);
      let tokens = msg.replace(/[\s]*$/, "").split(" ").slice(1);
      if (this._trim(msg).length === 0) {
        cmd = "help";
        tokens = [];
      }
      if (this.hasCommand(cmd)) {
        try {
          let c = this.getCommand(cmd);
          let obj = Object.create(this);
          obj.formatUsage = this.formatUsage.bind(this, c);
          obj.printUsage = this.printUsage.bind(this, c);
          obj.formatHelp = this.formatHelp.bind(this, c);
          obj.printHelp = this.printHelp.bind(this, c);
          obj.command = cmd;
          obj.cmd_func = c.func;
          obj.cmd_desc = c.desc;
          if (c.dflt_args) {
            c.func.bind(obj)(cmd, tokens, client, ...c.dflt_args);
          } else {
            c.func.bind(obj)(cmd, tokens, client);
          }
        }
        catch (e) {
          Content.addError(`${cmd}: ${e.name}: ${e.message}`);
          Util.Error(e);
        }
      } else {
        Content.addError(`${cmd}: unknown command`);
      }
    } else {
      Content.addError(`${JSON.stringify(msg)}: not a command string`);
    }
  }

  getCommands() {
    return Object.keys(this._commands);
  }

  getCommand(cmd, native_only=false) {
    let cname = this._trim(cmd);
    let c = this._commands[cname];
    if (!c && !native_only && this._commands[this._aliases[cname]]) {
      c = this._commands[this._aliases[cname]];
    }
    return c;
  }

  formatHelp(cmd) {
    return this.helpLine(`//${cmd.name}`, cmd.desc, true);
  }

  formatUsage(cmd) {
    let usages = [];
    if (cmd.usage) {
      for (let entry of cmd.usage) {
        let usagestr = this.formatArgs(entry.usage);
        if (entry.args) {
          let argstr = this.formatArgs(entry.args);
          usages.push(this.helpLine(`//${cmd.name} ${argstr}`, usagestr));
        } else {
          usages.push(this.helpLine(`//${cmd.name}`, usagestr));
        }
      }
    } else {
      usages.push(this.helpLine(`//${cmd.name}`, this.formatArgs(cmd.desc)));
    }
    for (let a of cmd.aliases) {
      usages.push(this.helpLine(`//${a}`, `Alias for command //${cmd.name}`));
    }
    return usages;
  }

  arg(s) {
    return `<span class="arg">${s.escape()}</span>`;
  }

  helpLine(k, v, esc=false) {
    let d1 = `<div>${esc ? k.escape() : k}</div>`;
    let d2 = `<div>${esc ? v.escape() : v}</div>`;
    return `<div class="helpline">${d1}${d2}</div>`;
  }

  formatArgs(s) {
    return s.replace(/<([^>]+)>/g, (m, g) => "&lt;" + this.arg(g) + "&gt;");
  }

  printUsage(cmdobj) {
    Content.addHelp("Usage:");
    for (let line of this.formatUsage(cmdobj)) {
      Content.addHelp(line);
    }
  }

  printHelp(cmdobj) {
    Content.addHelp(this.formatHelp(cmdobj));
  }

  onCommandHelp(cmd, tokens, client) {
    if (tokens.length === 0) {
      Content.addHelp("Commands:");
      for (let c of this._command_list) {
        Content.addHelp(this.formatHelp(this._commands[c]));
      }
      Content.addHelp(this.formatArgs("Enter //help <command> for help on <command>"));
      for (let line of this._help_text) {
        Content.addHelp(line);
      }
    } else if (this.hasCommand(tokens[0])) {
      Content.addHelp("Commands:");
      let obj = this.getCommand(tokens[0]);
      for (let line of this.formatUsage(obj)) {
        Content.addHelp(line);
      }
    } else {
      Content.addError(`Invalid command ${tokens[0].escape()}`);
    }
  }
}

function onCommandLog(cmd, tokens, client) {
  let t0 = tokens.length > 0 ? tokens[0] : "";
  let logs = Util.GetWebStorage(LOG_KEY) || [];
  let plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  Content.addHelp(`Debug message log length: ${logs.length}`);
  /* JSON-encode an object, inserting spaces around items */
  function toJSONString(obj) {
    return JSON.stringify(obj, null, 1)
      .replace(/\[[ \n]*/g, "[")
      .replace(/[\n ]*\]/g, "]")
      .replace(/[ ]*\n[ ]*/g, ' ');
  }
  /* Format a log message for printing */
  function formatLogEntry(log, escape=true) {
    let result = toJSONString(log);
    if (log && log._cmd && log._raw && log._parsed) {
      /* Smells like a TwitchEvent */
      let lines = [
        "TwitchEvent",
        log._cmd,
        toJSONString(log._raw),
        toJSONString(log._parsed)
      ];
      if (log._stacktrace) {
        lines.push(toJSONString(logs._stacktrace));
      }
      result = lines.join(" ");
    }
    return escape ? result.escape() : result;
  }
  if (tokens.length > 0) {
    if (t0 === "help") {
      this.printHelp();
      this.printUsage();
    } else if (t0 === "show") {
      for (let [i, l] of Object.entries(logs)) {
        Content.addHelp(`${i}: ${formatLogEntry(l)}`);
      }
    } else if (t0 === "export") {
      Util.Open("assets/log-export.html", "_blank", {});
    } else if (t0 === "summary") {
      let lines = [];
      let line = [];
      for (let l of Object.values(logs)) {
        line.push(l._cmd || toJSONString(l).substr(0, 10));
        if (line.length >= 10) {
          lines.push(line);
          line = [];
        }
      }
      if (line.length > 0) {
        lines.push(line);
      }
      let lnum = 0;
      for (let lidx = 0; lidx < lines.length; ++lidx) {
        let l = lines[lidx];
        Content.addHelp(`${lnum}-${lnum+l.length-1}: ${formatLogEntry(l, false)}`);
        lnum += l.length;
      }
    } else if (["search", "filter", "filter-out"].indexOf(t0) > -1) {
      if (tokens.length > 1) {
        let needle = tokens.slice(1).join(" ");
        let unmatched = [];
        let matched = [];
        for (let [i, l] of Object.entries(logs)) {
          let cond = toJSONString(l).includes(needle);
          if (t0 === "filter-out") {
            cond = !cond;
          }
          if (cond) {
            matched.push([i, l]);
          } else {
            unmatched.push([i, l]);
          }
        }
        let pl = plural(matched.length, "item");
        Content.addHelp(`Found ${pl} containing "${needle}"`.escape());
        if (t0 === "search") {
          for (let [i, l] of matched) {
            let desc = l._cmd || toJSONString(l).substr(0, 10);
            Content.addHelp(`${i}: ${desc}`);
          }
        } else {
          Content.addHelp(`Removing ${unmatched.length}/${logs.length} items`);
          Content.addHelp(`New logs length: ${matched.length}`);
          Util.SetWebStorage(LOG_KEY, matched.map((i) => i[1]));
        }
      } else {
        Content.addHelp(`Usage: //log ${t0} &lt;string&gt;`);
      }
    } else if (t0 === "remove") {
      let n = tokens.slice(1)
        .map((e) => Util.ParseNumber(e))
        .filter((e) => !Number.isNaN(e));
      if (n.length > 0) {
        Content.addHelp(`Removing ${plural(n.length, "item")}`);
        let result = [];
        for (let i = 0; i < logs.length; ++i) {
          if (n.indexOf(i) === -1) {
            result.push(logs[i]);
          }
        }
        Content.addHelp(`New logs length: ${result.length}`);
        Util.SetWebStorage(LOG_KEY, result);
      } else {
        Content.addHelp("No items to remove");
      }
    } else if (t0 === "shift") {
      let num = 1;
      if (tokens.length > 1 && Util.IsNumber(tokens[1])) {
        num = Util.ParseNumber(tokens[1]);
      }
      for (let i = 0; i < num && logs.length > 0; ++i) {
        logs.shift();
      }
      Content.addHelp(`New logs length: ${logs.length}`);
      Util.SetWebStorage(LOG_KEY, logs);
    } else if (t0 === "pop") {
      let num = 1;
      if (tokens.length > 1 && Util.IsNumber(tokens[1])) {
        num = Util.ParseNumber(tokens[1]);
      }
      for (let i = 0; i < num && logs.length > 0; ++i) {
        logs.pop();
      }
      Content.addHelp(`New logs length: ${logs.length}`);
      Util.SetWebStorage(LOG_KEY, logs);
    } else if (t0 === "size") {
      let b = toJSONString(logs).length;
      Content.addHelp(`Logged bytes: ${b} (${b/1024.0} KB)`);
    } else if (t0 === "clear") {
      Util.SetWebStorage(LOG_KEY, []);
      Content.addHelp("Log cleared");
    } else if (t0 === "replay") {
      if (tokens.length > 1) {
        let replay = [];
        let idx = Util.ParseNumber(tokens[1]);
        if (tokens[1] === "all") {
          for (let line of logs) {
            if (line && line._cmd && line._raw) {
              replay.push(line._raw);
            }
          }
        } else if (idx >= 0 && idx < logs.length) {
          let line = logs[idx];
          if (line && line._cmd && line._raw) {
            replay.push(line._raw);
          } else {
            let l = `${line}`.escape();
            Content.addError(`Item ${l} doesn't seem to be a chat message`);
          }
        } else {
          Content.addError(`Index ${idx} not between 0 and ${logs.length}`);
        }
        for (let line of replay) {
          Content.addHelp(`Replaying ${line.escape()}`);
          client._onWebsocketMessage({data: line});
        }
      } else {
        Content.addHelp(`Usage: //log ${t0} &lt;number&gt;`);
      }
    } else if (Util.IsNumber(t0)) {
      let idx = Util.ParseNumber(t0);
      Content.addHelp(formatLogEntry(logs[idx]));
    } else {
      Content.addHelp(`Unknown argument ${t0.escape()}`);
    }
  } else {
    this.printUsage();
  }
}

function onCommandClear(cmd, tokens, client) {
  if (tokens.length === 0) {
    $(".content").find(".line-wrapper").remove();
  } else if (tokens[0].match(/module[\d]+/)) {
    let e = document.getElementById(tokens[0]);
    if (e) {
      $(e).find(".line-wrapper").remove();
    } else {
      Content.addHelp(`Unknown module ${tokens[0]}`);
    }
  } else {
    this.printUsage();
  }
}

function onCommandJoin(cmd, tokens, client) {
  if (tokens.length > 0) {
    let cdef = Twitch.ParseChannel(tokens[0]);
    let cinfo = client.GetChannelInfo(cdef.channel);
    let toJoin = null;
    if (Twitch.IsRoom(cdef)) {
      /* It's a well-formed room specification; join it */
      toJoin = tokens[0];
    } else if (!cdef.room && !cdef.roomuid) {
      /* Normal channel; join it */
      toJoin = tokens[0];
    } else {
      /* Join cdef.channel, room named cdef.room */
      let cname = cdef.channel;
      let rname = cdef.room;
      if (cinfo.rooms && cinfo.rooms[rname]) {
        let cid = cinfo.rooms[rname].owner_id;
        let rid = cinfo.rooms[rname]._id;
        toJoin = Twitch.FormatRoom(cid, rid);
      } else {
        Content.addError(`No such room ${cname} ${rname}`);
        Util.LogOnlyOnce(cname, rname, cdef, cinfo);
      }
    }
    if (!toJoin.match(/^#/)) { toJoin = `#${toJoin}`; }
    if (toJoin !== null) {
      if (!client.IsInChannel(toJoin)) {
        client.JoinChannel(toJoin);
      } else {
        Content.addNotice(`Failed joining ${toJoin}: already in channel`);
      }
    }
  } else {
    this.printUsage();
  }
}

function onCommandPart(cmd, tokens, client) {
  if (tokens.length > 0) {
    let cdef = Twitch.ParseChannel(tokens[0]);
    let cinfo = client.GetChannelInfo(cdef.channel);
    let toPart = null;
    if (Twitch.IsRoom(cdef)) {
      /* It's a well-formed room specification; part it */
      toPart = tokens[0];
    } else if (!cdef.room && !cdef.roomuid) {
      /* Normal channel; part it */
      toPart = tokens[0];
    } else {
      /* Leave cdef.channel, room named cdef.room */
      let cname = cdef.channel;
      let rname = cdef.room;
      if (cinfo.rooms && cinfo.rooms[rname]) {
        let cid = cinfo.rooms[rname].owner_id;
        let rid = cinfo.rooms[rname]._id;
        toPart = Twitch.FormatRoom(cid, rid);
      } else {
        Content.addError(`No such room ${cname} ${rname}`);
        Util.LogOnlyOnce(cname, rname, cdef, cinfo);
      }
    }
    if (!toPart.match(/^#/)) { toPart = `#${toPart}`; }
    if (toPart !== null) {
      if (client.IsInChannel(toPart)) {
        client.LeaveChannel(toPart);
      } else {
        Content.addNotice(`Failed leaving ${toPart}: not in channel`);
      }
    }
  } else {
    this.printUsage();
  }
}

function onCommandBadges(cmd, tokens, client) {
  let badges = [];
  /* Obtain global badges */
  for (let [bname, badge] of Object.entries(client.GetGlobalBadges())) {
    for (let bdef of Object.values(badge.versions)) {
      let url = bdef.image_url_2x;
      let size = 36;
      if (tokens.indexOf("small") > -1) {
        url = bdef.image_url_1x;
        size = 18;
      } else if (tokens.indexOf("large") > -1) {
        url = bdef.image_url_4x;
        size = 72;
      }
      let attr = `width="${size}" height="${size}" title="${bname}"`;
      badges.push(`<img src="${url}" ${attr} alt="${bname}" />`);
    }
  }
  /* Print global badges */
  Content.addNotice(badges.join(""));
  /* Obtain channel badges */
  for (let ch of client.GetJoinedChannels()) {
    badges = [];
    for (let [bn, b] of Object.entries(client.GetChannelBadges(ch))) {
      for (let [months, bdef] of Object.entries(b)) {
        let url = bdef.image_url_4x || bdef.image_url_2x || bdef.image_url_1x;
        let size = "width=\"36\" height=\"36\"";
        let text = `${bn} ${months} ${bdef.description} ${bdef.title}`;
        badges.push(`<img src="${url}" ${size} title="${text}" alt="${text}" />`);
      }
    }
    /* Print channel badges */
    Content.addNotice(Twitch.FormatChannel(ch) + ": " + badges.join(""));
  }
}

function onCommandEmotes(cmd, tokens, client) {
  let client_emotes = client.GetEmotes();
  let g_emotes = [];
  let ch_emotes = [];
  let to_display = [];
  for (let [k, v] of Object.entries(client_emotes)) {
    let e = `<img src="${v}" title="${k.escape()}" alt="${k.escape()}" />`;
    if (k.match(/^[a-z]/)) {
      ch_emotes.push(e);
    } else {
      g_emotes.push(e);
    }
  }
  if (tokens.indexOf("global") > -1) {
    to_display.push(`Global: ${g_emotes.join("")}`);
  }
  if (tokens.indexOf("channel") > -1) {
    to_display.push(`Channel: ${ch_emotes.join("")}`);
  }
  if (tokens.indexOf("bttv") > -1) {
    let bttv_emotes = client.GetGlobalBTTVEmotes();
    let bttv_imgs = [];
    for (let [k, v] of Object.entries(bttv_emotes)) {
      let kstr = k.escape();
      bttv_imgs.push(`<img src="${v.url}" title="${kstr}" alt="${kstr}" />`);
    }
    to_display.push(`BTTV: ${bttv_imgs.join("")}`);
  }
  if (to_display.length === 0) {
    this.printHelp();
    this.printUsage();
  } else {
    for (let msg of to_display) {
      Content.addNotice(msg);
    }
  }
}

function onCommandPlugins(cmd, tokens, client) {
  try {
    for (let [n, p] of Object.entries(Plugins.plugins)) {
      let msg = `${n}: ${p.file} @ ${p.order}`.escape();
      if (p._error) {
        let estr = JSON.stringify(p._error_obj).escape();
        Content.addError(`${msg}: Failed: ${estr}`);
      } else if (p._loaded) {
        msg = `${msg}: Loaded`;
        if (p.commands) {
          msg = `${msg}: Commands: ${p.commands.join(" ")}`;
        }
        Content.addPre(msg);
      }
    }
  }
  catch (e) {
    if (e.name === "ReferenceError") {
      Content.addError("Plugin information unavailable");
    } else {
      throw e;
    }
  }
}

function onCommandClient(cmd, tokens, client) {
  if (tokens.length === 0 || tokens[0] === "status") {
    let cstatus = client.ConnectionStatus();
    let channels = client.GetJoinedChannels();
    let us = client.SelfUserState() || {};
    Content.addHelp("Client information:");
    Content.addHelpLine("Socket:", cstatus.open ? "Open" : "Closed");
    Content.addHelpLine("Status:", cstatus.connected ? "Connected" : "Not connected");
    Content.addHelpLine("Identified:", cstatus.identified ? "Yes" : "No");
    Content.addHelpLine("Authenticated:", cstatus.authed ? "Yes" : "No");
    Content.addHelpLine("Name:", client.GetName());
    Content.addHelpLine("FFZ:", client.FFZEnabled() ? "Enabled" : "Disabled");
    Content.addHelpLine("BTTV:", client.BTTVEnabled() ? "Enabled" : "Disabled");
    if (channels && channels.length > 0) {
      Content.addHelp(`&gt; Channels connected to: ${channels.length}`);
      for (let c of channels) {
        let ui = us[c];
        let ci = client.GetChannelInfo(c);
        let nusers = (ci && ci.users ? ci.users.length : 0);
        let rooms = ci.rooms || {};
        let status = (ci.online ? "" : "not ") + "online";
        Content.addHelpLine(c, `Status: ${status}; id=${ci.id}`);
        Content.addHelpLine("&nbsp;", `Active users: ${nusers}`);
        Content.addHelpLine("&nbsp;", `Rooms: ${Object.keys(rooms)}`);
        Content.addHelp("User information for " + c + ":");
        if (ui.color) {
          Content.addHelpLine("Color", ui.color);
        }
        if (ui.badges) {
          Content.addHelpLine("Badges", JSON.stringify(ui.badges));
        }
        Content.addHelpLine("Name", `${ui["display-name"]}`);
      }
    }
    Content.addHelpLine("User ID", `${us.userid}`);
  } else {
    this.printUsage();
  }
}

function onCommandRaw(cmd, tokens, client) {
  client.SendRaw(tokens.join(" "));
}

function onCommandTo(cmd, tokens, client) {
  if (tokens.length >= 2) {
    let ch = Twitch.ParseChannel(tokens[0]);
    let msg = tokens.slice(2).join(" ");
    client.SendMessge(ch, msg);
  } else {
    this.printUsage();
  }
}

function onCommandChannels(cmd, tokens, client) {
  Content.addHelp("Active channels:");
  for (let channel of client.GetJoinedChannels()) {
    let cinfo = client.GetChannelInfo(channel);
    if (channel.startsWith("#chatrooms:")) {
      let cobj = Twitch.ParseChannel(channel);
      cinfo = client.GetChannelById(Util.ParseNumber(cobj.room));
      for (let [room_name, room_def] of Object.entries(cinfo.rooms)) {
        if (cobj.roomuid === room_def._id) {
          Content.addHelp(`${cinfo.cname} ${room_name} ${room_def._id}`);
        }
      }
    } else {
      Content.addHelp(`${channel} ${cinfo.id}`);
    }
  }
}

function onCommandRooms(cmd, tokens, client) {
  for (let channel of client.GetJoinedChannels()) {
    let cinfo = client.GetChannelInfo(channel);
    if (cinfo.rooms) {
      for (let [room_name, room_info] of Object.entries(cinfo.rooms)) {
        let cid = room_info.owner_id;
        let rid = room_info._id;
        let join_cmd = `//join ${Twitch.FormatRoom(cid, rid)}`;
        Content.addHelp(`${channel}: ${cid}: ${room_name}: ${rid}`);
        Content.addHelp(`To join, enter: ${join_cmd}`);
      }
    }
  }
}

function InitChatCommands() { /* exported InitChatCommands */
  /* Default command definition
   * Structure:
   *  <name>: {
   *    func: <function>,
   *    desc: description of the command (used by //help)
   *    alias: array of command aliases (optional)
   *    usage: array of usage objects:
   *      [0]: string, array, or null: parameter name(s)
   *      [1]: description
   *      [2]: formatting options (optional)
   *  }
   */
  const DefaultCommands = {
    "log": {
      func: onCommandLog,
      desc: "Display or manipulate logged messages",
      alias: ["logs"],
      usage: [
        [null, "Display log command usage"],
        ["<number>", "Display the message numbered <number>"],
        ["show", "Display all logged messages (can be a lot of text!)"],
        ["summary", "Display a summary of the logged messages"],
        ["search <string>", "Show logs containing <string>"],
        ["remove <index...>", "Remove items with the given indexes"],
        ["filter <string>", "Remove items that don't contain <string>"],
        ["filter-out <string>", "Remove items containing <string>"],
        ["shift", "Remove the first logged message"],
        ["pop", "Remove the last logged message"],
        ["export", "Open a new window with all the logged items"],
        ["size", "Display the number of bytes used by the log"],
        ["clear", "Clears the entire log (cannot be undone!)"],
        ["replay <index>", "Re-inject logged message <index>"]
      ]
    },
    "clear": {
      func: onCommandClear,
      desc: "Clears all text from either all modules or the specified module",
      alias: ["nuke"],
      usage: [
        [null, "Clears all text from all visible modules"],
        ["<module>", "Clears all text from <module> (module1, module2)"]
      ]
    },
    "join": {
      func: onCommandJoin,
      desc: "Join a channel",
      alias: ["j"],
      usage: [
        ["<channel>", "Connect to <channel>; leading # is optional"]
      ]
    },
    "part": {
      func: onCommandPart,
      desc: "Leave a channel",
      alias: ["p", "leave"],
      usage: [
        ["<channel>", "Disconnect from <channel>; leading # is optional"]
      ]
    },
    "badges": {
      func: onCommandBadges,
      desc: "Display all known badges"
    },
    "emotes": {
      func: onCommandEmotes,
      desc: "Display the requested emotes",
      usage: [
        ["<kinds>", "Display emotes; <kinds> can be one or more of: global, channel, bttv"]
      ],
    },
    "plugins": {
      func: onCommandPlugins,
      desc: "Display plugin information, if plugins are enabled"
    },
    "client": {
      func: onCommandClient,
      desc: "Display numerous things about the client",
      usage: [
        [null, "Show general information about the client"],
        ["status", "Show current connection information"]
      ]
    },
    "raw": {
      func: onCommandRaw,
      desc: "Send a raw message to Twitch (for advanced users only!)",
      usage: [
        ["<message>", "Send <message> to Twitch servers (for advanced users only!)"]
      ]
    },
    "to": {
      func: onCommandTo,
      desc: "Send a command to a specific joined channel",
      usage: [
        ["<channel> <message>", "Send <message> to <channel>"]
      ]
    },
    "channels": {
      func: onCommandChannels,
      desc: "List connected channels",
      alias: ["channels", "ch", "joined"]
    },
    "rooms": {
      func: onCommandRooms,
      desc: "List available rooms"
    }
  };

  ChatCommands = new ChatCommandManager();
  for (let [cname, cobj] of Object.entries(DefaultCommands)) {
    ChatCommands.add(cname, cobj.func, cobj.desc);
    if (cobj.usage) {
      for (let uobj of cobj.usage) {
        ChatCommands.addUsage(cname, uobj[0], uobj[1], uobj[2]);
      }
    }
    if (cobj.alias) {
      for (let aname of cobj.alias) {
        ChatCommands.addAlias(aname, cname);
      }
    }
  }
}

/* globals LOG_KEY */

/* vim: set ts=2 sts=2 sw=2 et: */
