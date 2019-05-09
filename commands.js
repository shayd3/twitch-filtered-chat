/* Twitch Filtered Chat Commands */

/* TODO:
 * command_config
 * command_badges
 */

class TFCChatCommandStore {
  constructor() {
    this._commands = {};
    this._aliases = {};
    this.add("help",
             this.command_help.bind(this),
             "Obtain help for a specific command or all commands");
    this.add_alias("?", "help");
    this.add_usage("help", null, "Obtain help for all commands");
    this.add_usage("help", "command", "Obtain the usage information for <command>");
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

  add_alias(command, referred_command) {
    this._aliases[command] = referred_command;
  }

  add_usage(command, argstr, usagestr) {
    if (this.has_command(command, true)) {
      let c = this.get_command(command);
      if (!c.usage) c.usage = [];
      c.usage.push({args: argstr, usage: usagestr});
    } else {
      Util.Error(`Invalid command: ${command}`);
    }
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
          add_error(`${cmd}: ${e.name}: ${e.message}`);
          Util.Error(e);
        }
      } else {
        add_error(`${cmd}: unknown command`);
      }
    } else {
      add_error(`${JSON.stringify(msg)}: not a command string`);
    }
  }

  _do_execute(cmd, tokens, client) {
    let c = this.get_command(cmd);
    let obj = Object.create(this);
    obj.format_usage = this.format_usage.bind(this, c);
    obj.print_usage = this.print_usage.bind(this, c);
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
    return this.helpline("//" + cmd.name.escape(), cmd.desc.escape());
  }

  format_usage(cmd) {
    let usages = [];
    if (cmd.usage) {
      for (let entry of cmd.usage) {
        let argstr = "";
        let usagestr = this.format_args(entry.usage);
        if (Util.IsArray(entry.args)) {
          argstr = entry.args.map((a) => this.arg(a)).join(" ");
          usages.push(this.helpline(`//${cmd.name} ${argstr}`, usagestr));
        } else if (entry.args) {
          argstr = this.arg(entry.args);
          usages.push(this.helpline(`//${cmd.name} ${argstr}`, usagestr));
        } else {
          usages.push(this.helpline(`//${cmd.name}`, usagestr));
        }
      }
    } else {
      usages.push(this.helpline(`//${cmd.name}`, this.format_args(cmd.desc)));
    }
    return usages;
  }

  /* Built-in //help command */
  command_help(cmd, tokens/*, client*/) {
    if (tokens.length == 0) {
      this.print_help("Commands:");
      for (let obj of Object.values(this._commands)) {
        this.print_help(this.format_help(obj));
      }
      try {
        let lines = [];
        for (let [n, p] of Object.entries(Plugins.plugins)) {
          if (p._loaded && p.commands) {
            for (let plugin_cmd of p.commands) {
              lines.push(this.helpline(plugin_cmd, "Command added by plugin " + n));
            }
          }
        }
        if (lines.length > 0) {
          this.print_help("Plugin commands:");
          for (let l of lines) {
            this.print_help(l);
          }
        }
      }
      catch (e) {
        if (e.name !== "ReferenceError") throw e;
      }
    } else if (this.has_command(tokens[0])) {
      let obj = this.get_command(tokens[0]);
      for (let line of this.format_usage(obj)) {
        this.print_help(line);
      }
    } else {
      add_error(`Invalid command ${tokens[0].escape()}`);
    }
  }

  /* Specific formatters */
  arg(s) { return `<span class="arg">${s.escape()}</span>`; }
  helpcmd(s) { return `<span class="help helpcmd">${s}</span>`; }
  helpmsg(s) { return `<span class="help helpmsg">${s}</span>`; }
  helpline(k, v) { return `<div class="helpline">${this.helpcmd(k)}${this.helpmsg(v)}</div>`; }

  format_args(s) {
    return s.replace(/<([^>]+)>/g, (m, g) => this.arg(g));
  }

  /* Display functions */
  print_helpline(k, v) { add_pre(this.helpline(k, v)); }
  print_help(s) { add_pre(`<div class="help">${s}</div>`); }

  print_usage(cmdobj) {
    for (let line of this.format_usage(cmdobj)) {
      this.print_help(line);
    }
  }

}

var ChatCommands = new TFCChatCommandStore();

function command_log(cmd, tokens/*, client*/) {
  let logs = Util.GetWebStorage("debug-msg-log") || [];
  this.print_help(`Debug message log length: ${logs.length}`);
  if (tokens.length > 0) {
    if (tokens[0] == "show") {
      if (tokens.length > 1) {
        let idx = Number.parseInt(tokens[1]);
        this.print_help(`${idx}: ${JSON.stringify(logs[idx]).escape()}`);
      } else {
        for (let [i, l] of Object.entries(logs)) {
          this.print_help(`${i}: ${JSON.stringify(l).escape()}`);
        }
      }
    } else if (tokens[1] == "summary") {
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
        this.print_help(`${lidx}-${lidx+l.length}: ${JSON.stringify(l)}`);
        lidx += l.length;
      }
    } else if (tokens[1] == "shift") {
      logs.shift();
      this.print_help(`New logs length: ${logs.length}`);
      Util.SetWebStorage(logs, "debug-msg-log");
    } else if (tokens[1] == "pop") {
      logs.pop();
      this.print_help(`New logs length: ${logs.length}`);
      Util.SetWebStorage(logs, "debug-msg-log");
    } else {
      this.print_help(`Unknown argument ${tokens[0]}`);
    }
  } else {
    this.print_help(`Use //log summary to view a summary`);
    this.print_help(`Use //log show to view them all`);
    this.print_help(this.format_args(`Use //log show <N> to show item <N>`));
    this.print_help(`Use //log shift to remove one entry from the start`);
    this.print_help(`Use //log pop to remove one entry from the end`);
  }
}

function command_clear(/*cmd, tokens, client*/) {
  $(".content").find(".line-wrapper").remove();
}

function command_join(cmd, tokens, client) {
  if (tokens.length > 0) {
    join_channel(client, tokens[0]);
  } else {
    this.print_usage();
  }
}

function command_part(cmd, tokens, client) {
  if (tokens.length > 0) {
    leave_channel(client, tokens[0]);
  } else {
    this.print_usage();
  }
}

function command_badges(/*cmd, tokens, client*/) {
  /* TODO */
}

function command_plugins(/*cmd, tokens, client*/) {
  try {
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
  }
  catch (e) {
    if (e.name === "ReferenceError") {
      add_error("Plugin information unavailable");
    } else {
      throw e;
    }
  }
}

ChatCommands.add("log", command_log, "Display logged messages");
ChatCommands.add_alias("logs", "log");
ChatCommands.add_usage("log", null, "Obtain all logged messages");
ChatCommands.add_usage("log", "number", "Obtain logged message <number>");
ChatCommands.add_usage("log", "shift", "Remove the first logged message");
ChatCommands.add_usage("log", "pop", "Remove the last logged message");

ChatCommands.add("clear", command_clear, "Clears all text from all visible modules");
ChatCommands.add_usage("clear", null, "Clears all text from all visible modules");
ChatCommands.add_usage("clear", "module", "Clears all text from <module> (either &quot;module1&quot; or &quot;module2&quot;)");

ChatCommands.add("join", command_join, "Join a channel");
ChatCommands.add_usage("join", "channel", "Connect to <channel>; leading # is optional");

ChatCommands.add("part", command_part, "Leave a channel");
ChatCommands.add_alias("leave", "part");
ChatCommands.add_usage("part", "channel", "Disconnect from <channel>; leading # is optional");

ChatCommands.add("badges", command_badges, "Display all known badges");

ChatCommands.add("plugins", command_plugins, "Display plugin information, if plugins are enabled");

