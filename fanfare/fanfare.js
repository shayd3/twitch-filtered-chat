/** Fanfare
 *
 * Commands:
 *   //ff on:       Enables fanfare
 *   //ff off:      Disables fanfare
 *   //ff:          Displays //ff usage and whether or not fanfare is enabled
 *
 * Configuration (key: "fanfare") keys:
 *   enabled        If present and non-falsy, enable this by default
 *   particles      Number of particles to display (default: 25)
 *
 */

"use strict";

/** Particle configuration
 *
 * Particles have the following attributes:
 *  x         Horizontal offset from the left side of the canvas
 *  y         Vertical offset from the top of the canvas
 *  dx        Horizontal starting velocity
 *  dy        Vertical starting velocity
 *  xforce    Horizontal deceleration (i.e. gravity/drag) factor
 *  yforce    Vertical deceleration (i.e. gravity/drag) factor
 *  force     Directionless force (i.e. drag) coefficient
 *  a         Opacity: decrements every tick and particles "die" at 0
 *  image     Image instance (via document.createElement("img"))
 *  width     Image width
 *  height    Image height
 *
 * Every "tick", "living" particles are animated according to the following:
 *  p.a -= 0.01
 *  p.x += p.dx
 *  p.y += p.dy
 *  p.dx += p.xforce (if p.xforce is given)
 *  p.dy += p.yforce (if p.yforce is given)
 *  If p.force is given:
 *    p.dx = p.force * Math.hypot(p.x, p.y) * Math.cos(Math.atan2(p.y, p.x))
 *    p.dy = p.force * Math.hypot(p.x, p.y) * Math.sin(Math.atan2(p.y, p.x))
 *
 * Particles "die" if any of the following are true:
 *  p.a <= 0
 *  p.x + p.width < 0
 *  p.y + p.height < 0
 *  p.x > canvas width
 *  p.y > canvas height
 * Particles are "alive" if their opacity is greater than 0.
 */

class Fanfare { /* exported Fanfare */
  static get DEFAULT_NUM_PARTICLES() { return 25; }
  static get DEFAULT_TPS() { return 30; }

  constructor(client, config) {
    /* Grab configuration */
    this._client = client;
    this._config = config.Fanfare || {enable: false};
    this._on = this._config.enable;
    this._tick = this._config.tick || Fanfare.DEFAULT_TPS;

    /* Running effects */
    this._running = [];

    /* Timer ID used with setInterval */
    this._timer = null;

    /* Create canvas */
    this._canvas = this.elem("canvas", "ff-canvas", {
      id: "ff-canvas",
      style: [
        "pointer-events: none;",
        "position: absolute;",
        "top: 0;",
        "left: 0;",
        "z-index: 100;"
      ].join(" ")
    });
    this._cWidth = window.innerWidth;
    this._cHeight = window.innerHeight;
    this._canvas.width = this._cWidth;
    this._canvas.height = this._cHeight;
    this._context = this._canvas.getContext("2d");
    document.body.appendChild(this._canvas);

    /* Create chat commands */
    ChatCommands.add("fanfare", this._onCmd, "Enable or disable fanfare", this);
    ChatCommands.addUsage("fanfare", null, "Show fanfare status and help");
    ChatCommands.addUsage("fanfare", "help", "Show fanfare help");
    ChatCommands.addUsage("fanfare", "on", "Enable fanfare");
    ChatCommands.addUsage("fanfare", "off", "Disable fanfare");
    ChatCommands.addUsage("fanfare", "demo", "Demonstrate fanfare");
    ChatCommands.addUsage("fanfare", "cheerdemo", "Demonstrate cheer fanfare");
    ChatCommands.addUsage("fanfare", "subdemo", "Demonstrate sub fanfare");
    ChatCommands.addAlias("ff", "fanfare");

    /* Bind to the relevant client events */
    client.bind("twitch-chat", this._onChatEvent.bind(this, client));
    client.bind("twitch-sub", this._onSubEvent.bind(this, client));
    client.bind("twitch-resub", this._onSubEvent.bind(this, client));
    client.bind("twitch-giftsub", this._onSubEvent.bind(this, client));
    client.bind("twitch-anongiftsub", this._onSubEvent.bind(this, client));
  }

  get enable() { return this._on; }
  set enable(e) { this._on = e; }
  get tps() { return this._tick; }
  set tps(tps) { this._tick = tps; }
  set tickTime(rate) { this._tick = rate * 1000; }

  /* Canvas attributes */
  get canvas() { return this._canvas; }
  get context() { return this._context; }
  get width() { return this._canvas.width; }
  get height() { return this._canvas.height; }

  /* Create an element with some default attributes */
  elem(type, classes, ...attrs) {
    let e = document.createElement(type);
    let cls = `ff ${classes}`.trim();
    let setAttr = (k, v) => {
      if (k === "innerHTML") e.innerHTML = v;
      else if (k === "innerText") e.innerText = v;
      else e.setAttribute(k, v);
    };
    setAttr("class", cls);
    setAttr("data-from", "fanfare");
    for (let aobj of attrs) {
      if (Util.IsArray(aobj) && aobj.length === 2) {
        let [k, v] = aobj;
        setAttr(k, v);
      } else {
        for (let [k, v] of Object.entries(aobj)) {
          setAttr(k, v);
        }
      }
    }
    return e;
  }

  /* Construct an img element */
  image(url, opts=null) {
    let o = opts ? Util.JSONClone(opts) : {};
    o.src = url;
    return this.elem("img", "ff-image ff-emote", o);
  }

  /* Construct an img element of a Twitch emote */
  twitchEmote(id, opts=null) {
    return this.image(this._client.GetEmote(id), opts);
  }

  /* Clears the canvas */
  clearCanvas() {
    this._context.clearRect(0, 0, this.width, this.height);
  }

  /* Start a new animation */
  addEffect(effect) {
    effect.load().then(() => {
      Util.LogOnly("Loaded effect, starting...", effect);
      this._running.push(effect);
      this.startAnimation();
    }).catch((ev) => {
      Util.Error("Failed to load effect", ev);
    });
  }

  /* Begin animating */
  startAnimation() {
    if (this._timer === null) {
      let fn = this._animate.bind(this);
      let rate = 1000 / this._tick;
      this._timer = window.setInterval(fn, rate);
      Util.LogOnly(`Fanfare: starting animations with id ${this._timer}`);
    }
  }

  /* Animation function */
  _animate() {
    let stillRunning = [];
    this.clearCanvas();
    for (let effect of this._running) {
      if (effect.tick()) {
        effect.draw(this._context);
        stillRunning.push(effect);
      }
    }
    this._running = stillRunning;
    if (this._running.length === 0) {
      this.stopAnimation();
    }
  }

  /* Terminate animations */
  stopAnimation() {
    if (this._timer !== null) {
      Util.LogOnly(`Fanfare: stopping antimations with id ${this._timer}`);
      window.clearInterval(this._timer);
      this._timer = null;
      this._running = [];
    }
  }

  /* Handle //fanfare (or //ff) command */
  _onCmd(cmd, tokens, client, self) {
    /* Note: called as a command; `this` refers to a command object */
    let t0 = tokens.length === 0 ? null : tokens[0];
    if (t0 === null || t0 === "help") {
      if (t0 === null) {
        Content.addHelpText(`Fanfare is ${self._on ? "en" : "dis"}abled`);
      }
      this.printUsage();
      Content.addHelp("Add a number to cheerdemo to simulate that number of bits");
      Content.addHelp("Available arguments for subdemo:");
      for (let kind of TwitchSubEvent.KINDS) {
        Content.addHelpLine(kind, `Demonstrate the ${kind} type of subscription`);
      }
      for (let plan of TwitchSubEvent.PLANS) {
        let name = TwitchSubEvent.PlanName(plan);
        Content.addHelpLine(plan, `Demonstrate a ${name} subscription`);
      }
      Content.addHelp(`Default kind: ${TwitchSubEvent.SUB}`);
      Content.addHelp(`Default plan: ${TwitchSubEvent.PLAN_TIER1}`);
    } else if (t0 === "on") {
      self._on = true;
      Content.addInfo("Fanfare is now enabled");
    } else if (t0 === "off") {
      self._on = false;
      Content.addInfo("Fanfare is now disabled");
    } else if (t0 === "demo") {
      self._onChatEvent(self._client, {bits: 1000}, true);
      self._onSubEvent(self._client, {
        kind: TwitchSubEvent.SUB,
        plan: TwitchSubEvent.PLAN_TIER1
      }, true);
    } else if (t0 === "cheerdemo") {
      let bits = 1000;
      if (tokens.length === 2 && Util.IsNumber(tokens[1])) {
        bits = Util.ParseNumber(tokens[1]);
      }
      self._onChatEvent(self._client, {bits: bits}, true);
    } else if (t0 === "subdemo") {
      let kind = TwitchSubEvent.SUB;
      let plan = TwitchSubEvent.PLAN_TIER1;
      if (tokens.length > 1) {
        for (let k of TwitchSubEvent.KINDS) {
          if (tokens.includes(k)) {
            kind = k;
          }
        }
        for (let p of TwitchSubEvent.PLANS) {
          if (tokens.includes(p)) {
            plan = p;
          }
        }
      }
      self._onSubEvent(self._client, {kind: kind, plan: plan}, true);
    } else {
      Content.addError(`Fanfare: unknown argument ${t0.escape()}`);
      this.printUsage();
    }
  }

  /* Received a message from the client */
  _onChatEvent(client, event, override=false) {
    if (this._on || override) {
      if (event.bits > 0) {
        this.addEffect(new FanfareCheerEffect(this, this._config, event));
      }
    }
  }

  /* Received a subscription event from the client */
  _onSubEvent(client, event, override=false) {
    if (this._on || override) {
      this.addEffect(new FanfareSubEffect(this, this._config, event));
    }
  }
}

/* globals FanfareCheerEffect FanfareSubEffect */
/* vim: set ts=2 sts=2 sw=2 et: */
