/* Twitch Filtered Chat Commands */

class ChatCommandManager {
  constructor() {
    this._command_list = [];
    this._commands = {};
    this._aliases = {};
    this._help_text = [];
    this.add("help", this.command_help.bind(this),
             "Show help for a specific command or all commands");
    this.addAlias("?", "help");
    this.addAlias("", "help");
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
    if (o.command) {
      let cmd = t.substr(0, t.indexOf(":"));
      let msg = t.substr(t.indexOf(":")+1);
      t = this.helpLine(cmd, msg);
    }
    this._help_text.push(t);
  }

  complete(complete_args) {
    /* TODO: Complete command arguments, fix //<tab> */
    let text = complete_args.orig_text;
    let pos = complete_args.orig_pos;
    let idx = complete_args.index;
    /* Gather completions */
    if (this.isCommandStr(text)) {
      let word = this._trim(text.substr(0, pos));
      let prefix = word.length === 0 ? text : text.substr(0, text.indexOf(word));
      let matches = [];
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
      if (this.hasCommand(cmd)) {
        let tokens = msg.replace(/[\s]*$/, "").split(" ").slice(1);
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

  command_help(cmd, tokens, client) {
    if (tokens.length === 0) {
      Content.addHelp("Commands:");
      for (let c of Object.values(this._command_list)) {
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

function command_log(cmd, tokens, client) {
  let t0 = tokens.length > 0 ? tokens[0] : "";
  let logs = Util.GetWebStorage("debug-msg-log") || [];
  Content.addHelp(`Debug message log length: ${logs.length}`);
  if (tokens.length > 0) {
    if (t0 === "help") {
      this.printHelp();
      this.printUsage();
    } else if (t0 === "show") {
      for (let [i, l] of Object.entries(logs)) {
        Content.addHelp(`${i}: ${JSON.stringify(l).escape()}`);
      }
    } else if (t0 === "export") {
      let width = window.innerWidth * 0.75;
      let w = Util.Open("assets/log-export.html",
                        "TFCLogExportWindow",
                        {"menubar": "no",
                         "location": "no",
                         "resizable": "no",
                         "status": "no",
                         "scrollbars": "yes",
                         "dependent": "yes",
                         "width": `${Math.floor(width)}`});
      if (w) {
        w.onload = function() {
          this.addEntries(logs);
        };
      }
    } else if (t0 === "summary") {
      let lines = [];
      let line = [];
      for (let l of Object.values(logs)) {
        line.push(l._cmd || JSON.stringify(l).substr(0, 10));
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
        Content.addHelp(`${lnum}-${lnum+l.length-1}: ${JSON.stringify(l)}`);
        lnum += l.length;
      }
    } else if (["search", "filter", "filter-out"].indexOf(t0) > -1) {
      if (tokens.length > 1) {
        let needle = tokens.slice(1).join(" ");
        let unmatched = [];
        let matched = [];
        for (let [i, l] of Object.entries(logs)) {
          let cond = JSON.stringify(l).includes(needle);
          if (t0 === "filter-out") {
            cond = !cond;
          }
          if (cond) {
            matched.push([i, l]);
          } else {
            unmatched.push([i, l]);
          }
        }
        let pl = `${matched.length} item` + (matched.length === 1 ? "" : "s");
        Content.addHelp(`Found ${pl} containing "${needle}"`.escape());
        if (t0 === "search") {
          for (let [i, l] of matched) {
            Content.addHelp(`${i}: ${l._cmd || JSON.stringify(l).substr(0, 10)}`);
          }
        } else {
          Content.addHelp(`Removing ${unmatched.length} of ${logs.length} items`);
          Content.addHelp(`New logs length: ${matched.length}`);
          Util.SetWebStorage("debug-msg-log", matched.map((i) => i[1]));
        }
      } else {
        Content.addHelp(`Usage: //log ${t0} &lt;string&gt;`);
      }
    } else if (t0 === "remove") {
      let n = tokens.slice(1)
        .map((e) => Number.parseInt(e))
        .filter((e) => !Number.isNaN(e));
      if (n.length > 0) {
        Content.addHelp(`Removing ${n.length} item` + (n.length === 1 ? "" : "s"));
        let result = [];
        for (let i = 0; i < logs.length; ++i) {
          if (n.indexOf(i) === -1) {
            result.push(logs[i]);
          }
        }
        Content.addHelp(`New logs length: ${result.length}`);
        Util.SetWebStorage("debug-msg-log", result);
      } else {
        Content.addHelp("No items to remove");
      }
    } else if (t0 === "shift") {
      logs.shift();
      Content.addHelp(`New logs length: ${logs.length}`);
      Util.SetWebStorage("debug-msg-log", logs);
    } else if (t0 === "pop") {
      logs.pop();
      Content.addHelp(`New logs length: ${logs.length}`);
      Util.SetWebStorage("debug-msg-log", logs);
    } else if (t0 === "size") {
      let b = JSON.stringify(logs).length;
      Content.addHelp(`Logged bytes: ${b} (${b/1024.0} KB)`);
    } else if (t0 === "clear") {
      Util.SetWebStorage("debug-msg-log", []);
      Content.addHelp("Log cleared");
    } else if (!Number.isNaN(Number.parseInt(t0))) {
      let idx = Number(t0);
      Content.addHelp(JSON.stringify(logs[idx]).escape());
    } else {
      Content.addHelp(`Unknown argument ${t0.escape()}`);
    }
  } else {
    this.printUsage();
  }
}

function command_clear(cmd, tokens, client) {
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

function command_join(cmd, tokens, client) {
  if (tokens.length > 0) {
    client.JoinChannel(tokens[0]);
  } else {
    this.printUsage();
  }
}

function command_part(cmd, tokens, client) {
  if (tokens.length > 0) {
    client.LeaveChannel(tokens[0]);
  } else {
    this.printUsage();
  }
}

function command_badges(cmd, tokens, client) {
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
    for (let [bname, badge] of Object.entries(client.GetChannelBadges(ch))) {
      let url = badge.image || badge.svg || badge.alpha;
      let size = "width=\"36\" height=\"36\"";
      badges.push(`<img src="${url}" ${size} title="${bname}" alt="${bname}" />`);
    }
    /* Print channel badges */
    Content.addNotice(Twitch.FormatChannel(ch) + ": " + badges.join(""));
  }
}

function command_emotes(cmd, tokens, client) {
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
      bttv_imgs.push(`<img src="${v.url}" title="${k.escape()}" alt="${k.escape()}" />`);
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

function command_plugins(cmd, tokens, client) {
  try {
    for (let [n, p] of Object.entries(Plugins.plugins)) {
      let msg = `${n}: ${p.file} @ ${p.order}`.escape();
      if (p._error) {
        Content.addError(`${msg}: Failed: ${JSON.stringify(p._error_obj).escape()}`);
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

function command_client(cmd, tokens, client) {
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
        if (ui.color) { Content.addHelpLine("Color", ui.color); }
        if (ui.badges) { Content.addHelpLine("Badges", JSON.stringify(ui.badges)); }
        Content.addHelpLine("Name", `${ui["display-name"]}`);
      }
    }
    Content.addHelpLine("User ID", `${us.userid}`);
  } else {
    this.printUsage();
  }
}

function command_raw(cmd, tokens, client) {
  client.SendRaw(tokens.join(" "));
}

function command_to(cmd, tokens, client) {
  if (tokens.length >= 2) {
    let ch = Twitch.ParseChannel(tokens[0]);
    let msg = tokens.slice(2).join(" ");
    client.SendMessge(ch, msg);
  } else {
    this.printUsage();
  }
}

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
    func: command_log,
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
      ["clear", "Clears the entire log (cannot be undone!)"]
    ]
  },
  "clear": {
    func: command_clear,
    desc: "Clears all text from either all modules or the specified module",
    alias: ["nuke"],
    usage: [
      [null, "Clears all text from all visible modules"],
      ["<module>", "Clears all text from <module> (module1, module2)"]
    ]
  },
  "join": {
    func: command_join,
    desc: "Join a channel",
    alias: ["j"],
    usage: [
      ["<channel>", "Connect to <channel>; leading # is optional"]
    ]
  },
  "part": {
    func: command_part,
    desc: "Leave a channel",
    alias: ["p", "leave"],
    usage: [
      ["<channel>", "Disconnect from <channel>; leading # is optional"]
    ]
  },
  "badges": {
    func: command_badges,
    desc: "Display all known badges"
  },
  "emotes": {
    func: command_emotes,
    desc: "Display the requested emotes",
    usage: [
      ["<kinds>", "Display emotes; <kinds> can be one or more of: global, channel, bttv"]
    ],
  },
  "plugins": {
    func: command_plugins,
    desc: "Display plugin information, if plugins are enabled"
  },
  "client": {
    func: command_client,
    desc: "Display numerous things about the client",
    usage: [
      [null, "Show general information about the client"],
      ["status", "Show current connection information"]
    ]
  },
  "raw": {
    func: command_raw,
    desc: "Send a raw message to Twitch (for advanced users only!)",
    usage: [
      ["<message>", "Send <message> to Twitch servers (for advanced users only!)"]
    ]
  },
  "to": {
    func: command_to,
    desc: "Send a command to a specific joined channel",
    usage: [
      ["<channel> <message>", "Send <message> to <channel>"]
    ]
  }
};

var ChatCommands = null;

function InitChatCommands() { /* exported InitChatCommands */
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

/* vim: set ts=2 sts=2 sw=2 et: */
