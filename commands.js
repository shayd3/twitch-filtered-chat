/* Twitch Filtered Chat Commands */

class TFCChatCommandStore {
  constructor() {
    this._commands = {};
    this._aliases = {};
    this._help_text = [];
    this.add("help", this.command_help.bind(this),
             "Obtain help for a specific command or all commands");
    this.addAlias("?", "help");
    this.addAlias("", "help");
    this.addUsage("help", null, "Obtain help for all commands");
    this.addUsage("help", "command", "Obtain the usage information for <command>");
  }

  add(command, func, desc, ...args) {
    if (!command.match(/^[a-z0-9_-]+$/)) {
      Util.Error(`Invalid command "${command.escape()}"`);
    } else {
      let c = {};
      c.name = command;
      c.func = func;
      c.desc = desc;
      c.dflt_args = args.length > 0 ? args : null;
      this._commands[command] = c;
    }
  }

  addAlias(command, referred_command) {
    this._aliases[command] = referred_command;
  }

  addUsage(command, argstr, usagestr, opts=null) {
    if (this.has_command(command, true)) {
      let c = this.get_command(command);
      if (!c.usage) c.usage = [];
      c.usage.push({args: argstr, usage: usagestr, opts: opts || {}});
    } else {
      Util.Error(`Invalid command: ${command}`);
    }
  }

  addHelp(text, opts=null) {
    let o = opts || {};
    let t = text;
    if (!o.literal) t = this.formatArgs(t);
    if (o.indent) t = "&nbsp;&nbsp;" + t;
    if (o.command) {
      let cmd = t.substr(0, t.indexOf(':'));
      let msg = t.substr(t.indexOf(':')+1);
      t = this.helpLine(cmd, msg);
    }
    this._help_text.push(t);
  }

  is_command_str(msg) {
    return !!msg.match(/^\/\//);
  }

  has_command(msg, native_only=false) {
    let cmd = msg.replace(/^\/\//, "");
    if (this._commands.hasOwnProperty(cmd)) {
      return true;
    } else if (!native_only && this._aliases.hasOwnProperty(cmd)) {
      return true;
    }
    return false;
  }

  execute(msg, client) {
    if (this.is_command_str(msg)) {
      let cmd = msg.split(" ")[0].replace(/^\/\//, "");
      if (this.has_command(cmd)) {
        let tokens = msg.replace(/[\s]*$/, "").split(" ").slice(1);
        try {
          this._do_execute(cmd, tokens, client);
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

  _do_execute(cmd, tokens, client) {
    let c = this.get_command(cmd);
    let obj = Object.create(this);
    obj.format_usage = this.format_usage.bind(this, c);
    obj.printUsage = this.printUsage.bind(this, c);
    obj.command = cmd;
    obj.cmd_func = c.func;
    obj.cmd_desc = c.desc;
    if (c.dflt_args) {
      c.func.bind(obj)(cmd, tokens, client, ...c.dflt_args);
    } else {
      c.func.bind(obj)(cmd, tokens, client);
    }
  }

  get_commands() {
    return Object.keys(this._commands);
  }

  get_command(cmd, native_only=false) {
    let cname = cmd.replace(/^\/\//, "");
    let c = this._commands[cname];
    if (!c && !native_only && this._commands[this._aliases[cname]]) {
      c = this._commands[this._aliases[cname]];
    }
    return c;
  }

  format_help(cmd) {
    return this.helpLine("//" + cmd.name.escape(), cmd.desc.escape());
  }

  format_usage(cmd) {
    let usages = [];
    if (cmd.usage) {
      for (let entry of cmd.usage) {
        let fmtArg = (a) => this.arg(a);
        if (entry.opts.literal) fmtArg = (a) => a;
        let argstr = "";
        let usagestr = this.formatArgs(entry.usage);
        if (Util.IsArray(entry.args)) {
          argstr = entry.args.map((a) => fmtArg(a)).join(" ");
          usages.push(this.helpLine(`//${cmd.name} ${argstr}`, usagestr));
        } else if (entry.args) {
          argstr = fmtArg(entry.args);
          usages.push(this.helpLine(`//${cmd.name} ${argstr}`, usagestr));
        } else {
          usages.push(this.helpLine(`//${cmd.name}`, usagestr));
        }
      }
    } else {
      usages.push(this.helpLine(`//${cmd.name}`, this.formatArgs(cmd.desc)));
    }
    return usages;
  }

  /* Built-in //help command */
  command_help(cmd, tokens/*, client*/) {
    if (tokens.length == 0) {
      this.printHelp("Commands:");
      for (let obj of Object.values(this._commands)) {
        this.printHelp(this.format_help(obj));
      }
      for (let line of this._help_text) {
        this.printHelp(line);
      }
    } else if (this.has_command(tokens[0])) {
      this.printHelp("Commands:");
      let obj = this.get_command(tokens[0]);
      for (let line of this.format_usage(obj)) {
        this.printHelp(line);
      }
    } else {
      Content.addError(`Invalid command ${tokens[0].escape()}`);
    }
  }

  /* Specific formatters */

  arg(s) {
    return `<span class="arg">${s.escape()}</span>`;
  }

  helpcmd(s) {
    return `<span class="help helpcmd">${s}</span>`;
  }

  helpmsg(s) {
    return `<span class="help helpmsg">${s}</span>`;
  }

  helpLine(k, v) {
    return `<div class="help_line">${this.helpcmd(k)}${this.helpmsg(v)}</div>`;
  }

  formatArgs(s) {
    return s.replace(/<([^>]+)>/g, (m, g) => '&lt;' + this.arg(g) + '&gt;');
  }

  /* Display functions */

  printHelpLine(k, v) {
    Content.addPre(this.helpLine(k, v));
  }

  printHelp(s) {
    Content.addHTML($(`<div class="help pre">${s}</div>`));
  }

  printUsage(cmdobj) {
    this.printHelp("Usage:");
    for (let line of this.format_usage(cmdobj)) {
      this.printHelp(line);
    }
  }
}

function command_log(cmd, tokens/*, client*/) {
  let logs = Util.GetWebStorage("debug-msg-log") || [];
  this.printHelp(`Debug message log length: ${logs.length}`);
  if (tokens.length > 0) {
    if (tokens[0] == "show") {
      if (tokens.length > 1) {
        let idx = Number.parseInt(tokens[1]);
        this.printHelp(`${idx}: ${JSON.stringify(logs[idx]).escape()}`);
      } else {
        for (let [i, l] of Object.entries(logs)) {
          this.printHelp(`${i}: ${JSON.stringify(l).escape()}`);
        }
      }
    } else if (tokens[0] == "export") {
      let w = window.open(
        "assets/log-export.html",
        "TFCLogExportWindow",
        "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes"
      );
      if (w) {
        w.onload = function() {
          for (let [i, l] of Object.entries(logs)) {
            this.addEntry(i, l);
          }
        }
      }
    } else if (tokens[0] == "summary") {
      let lines = [];
      let line = [];
      for (let l of Object.values(logs)) {
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
      for (let l of Object.values(lines)) {
        this.printHelp(`${lidx}-${lidx+l.length}: ${JSON.stringify(l)}`);
        lidx += l.length;
      }
    } else if (tokens[0] == "shift") {
      logs.shift();
      this.printHelp(`New logs length: ${logs.length}`);
      Util.SetWebStorage(logs, "debug-msg-log");
    } else if (tokens[0] == "pop") {
      logs.pop();
      this.printHelp(`New logs length: ${logs.length}`);
      Util.SetWebStorage(logs, "debug-msg-log");
    } else {
      this.printHelp(`Unknown argument ${tokens[0]}`);
    }
  } else {
    this.printHelp(`Use //log summary to view a summary`);
    this.printHelp(`Use //log show to view them all`);
    this.printHelp(this.formatArgs(`Use //log show <N> to show item <N>`));
    this.printHelp(`Use //log shift to remove one entry from the start`);
    this.printHelp(`Use //log pop to remove one entry from the end`);
    this.printHelp(`Use //log export to open a new window with the logged items`);
  }
}

function command_clear(cmd, tokens/*, client*/) {
  if (tokens.length == 0) {
    $(".content").find(".line-wrapper").remove();
  } else if (tokens[0] == "module1") {
    $("#module1").find(".line-wrapper").remove();
  } else if (tokens[0] == "module2") {
    $("#module2").find(".line-wrapper").remove();
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
  let all_badges = [];
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
      all_badges.push(`<img src="${url}" ${attr} alt="${bname}" />`);
    }
  }
  Content.addNotice(all_badges.join(''));
}

function command_plugins(/*cmd, tokens, client*/) {
  try {
    for (let [n, p] of Object.entries(Plugins.plugins)) {
      let msg = `${n}: ${p.file} @ ${p.order}`;
      if (p._error) {
        Content.addError(`${msg}: Failed: ${JSON.stringify(p._error_obj)}`);
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
  if (tokens.length === 0 || tokens[0] == "status") {
    this.printHelp("Client information:");
    let cstatus = client.ConnectionStatus();
    this.printHelpLine("Socket:", cstatus.open ? "Open" : "Closed");
    this.printHelpLine("Status:", cstatus.connected ? "Connected" : "Not connected");
    this.printHelpLine("Identified:", cstatus.identified ? "Yes" : "No");
    this.printHelpLine("Authenticated:", cstatus.authed ? "Yes" : "No");
    this.printHelpLine("Name:", client.GetName());
    this.printHelpLine("FFZ:", client.FFZEnabled() ? "Enabled" : "Disabled");
    this.printHelpLine("BTTV:", client.BTTVEnabled() ? "Enabled" : "Disabled");
    let channels = client.GetJoinedChannels();
    let us = client.SelfUserState() || {};
    if (channels && channels.length > 0) {
      this.printHelp(`&gt; Channels connected to: ${channels.length}`);
      for (let c of channels) {
        let ci = client.GetChannelInfo(c);
        let nusers = (ci && ci.users ? ci.users.length : 0);
        let rooms = ci.rooms || {};
        let status = (ci.online ? "" : "not ") + "online";
        this.printHelpLine(c, "Status: " + status + `; id=${ci.id}`);
        this.printHelpLine("&nbsp;", `Active users: ${nusers}`);
        this.printHelpLine("&nbsp;", `Rooms: ${Object.keys(rooms)}`);
        let ui = us[c];
        this.printHelp("User information for " + c + ":");
        if (ui.color) { this.printHelpLine("Color", ui.color); }
        if (ui.badges) { this.printHelpLine("Badges", JSON.stringify(ui.badges)); }
        this.printHelpLine("Name", `${ui["display-name"]}`);
      }
    }
    this.printHelpLine("User ID", `${us.userid}`);
  } else {
    this.printUsage();
  }
}

var ChatCommands = new TFCChatCommandStore();

ChatCommands.add("log", command_log,
                 "Display logged messages");
ChatCommands.addAlias("logs", "log");
ChatCommands.addUsage("log", null,
                       "Obtain all logged messages");
ChatCommands.addUsage("log", "number",
                      "Display the message numbered <number>");
ChatCommands.addUsage("log", "summary",
                      "Display a summary of the logged messages",
                      {literal: true});
ChatCommands.addUsage("log", "shift",
                      "Remove the first logged message",
                      {literal: true});
ChatCommands.addUsage("log", "pop",
                      "Remove the last logged message",
                      {literal: true});
ChatCommands.addUsage("log", "export",
                      "Open a new window with all of the logged items",
                      {literal: true});

ChatCommands.add("clear", command_clear,
                 "Clears all text from all visible modules");
ChatCommands.addUsage("clear", null,
                      "Clears all text from all visible modules");
ChatCommands.addUsage("clear", "module1",
                      "Clears all text from module1",
                      {literal: true});
ChatCommands.addUsage("clear", "module2",
                      "Clears all text from module2",
                      {literal: true});

ChatCommands.add("join", command_join,
                 "Join a channel");
ChatCommands.addUsage("join", "channel",
                      "Connect to <channel>; leading # is optional");

ChatCommands.add("part", command_part,
                 "Leave a channel");
ChatCommands.addAlias("leave", "part");
ChatCommands.addUsage("part", "channel",
                      "Disconnect from <channel>; leading # is optional");

ChatCommands.add("badges", command_badges,
                 "Display all known badges");

ChatCommands.add("plugins", command_plugins,
                 "Display plugin information, if plugins are enabled");

ChatCommands.add("client", command_client,
                 "Display numerous things about the client; use //help client for info");
ChatCommands.addUsage("client", null,
                      "Show general information about the client");
ChatCommands.addUsage("client", "status",
                      "Show current connection information",
                      {literal: true});

