/** Fanfare Plugin
 *
 * Demonstrates an example "Fanfare" plugin that displays a FrankerZ whenever
 * someone subscribes.
 *
 * Commands:
 *   //ff on:       Enables fanfare
 *   //ff off:      Disables fanfare
 *   //ff:          Displays //ff usage and whether or not fanfare is enabled
 *
 * Configuration (plugin key: "fanfare") keys:
 *   enabled        If present and non-falsy, enable this plugin by default
 *   particles      Number of particles to display (default: 25)
 *
 * TODO:
 * Simultaneous effects: one class per effect
 *   Each class would have .startAnimation, .stopAnimation, etc
 * IDEA: Move this to its own proper module, instead of a plugin?
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

const FanfareCSS = `
.ff.ff-canvas {
  pointer-events: none;
  position: absolute;
  left: 0px;
  top: 0px;
  z-index: 100;
}
`;

class FanfarePlugin { /* exported FanfarePlugin */
  static get DEFAULT_NUM_PARTICLES() { return 25; }
  static get DEFAULT_TPS() { return 30; }

  constructor(resolve, reject, client, args, config) {
    this._args = args;

    /* Grab configuration */
    this._client = client;
    this._config = config.PluginConfig.fanfare || {enable: false};
    this._on = this._config.enable;
    this._n = this._config.particles || FanfarePlugin.DEFAULT_NUM_PARTICLES;
    this._tick = this._config.tick || FanfarePlugin.DEFAULT_TPS;
    this._particles = [];

    /* Effects queued up */
    this._queue = [];

    /* Timer ID used with setInterval */
    this._timer = null;

    /* Create stylesheet */
    let e = this._elem("style", "", {type: "text/css", id: "ff-styles"});
    e.innerText = FanfareCSS;
    document.head.appendChild(e);

    /* Create canvas */
    this._canvas = this._elem("canvas", "ff-canvas", {id: "ff-canvas"});
    this._cWidth = window.innerWidth;
    this._cHeight = window.innerHeight;
    this._canvas.width = this._cWidth;
    this._canvas.height = this._cHeight;
    this._context = this._canvas.getContext("2d");
    document.body.appendChild(this._canvas);

    /* Create chat commands */
    let D = (s) => `From plugin ${this.name}: ${s}`;
    ChatCommands.add("fanfare", this._onCmd, D("Enable or disable fanfare"), this);
    ChatCommands.addUsage("fanfare", null, D("Show fanfare status"));
    ChatCommands.addUsage("fanfare", "on", D("Enable fanfare"));
    ChatCommands.addUsage("fanfare", "off", D("Disable fanfare"));
    ChatCommands.addUsage("fanfare", "demo", D("Demonstrate fanfare"));
    ChatCommands.addAlias("ff", "fanfare");

    /* Bind to the relevant client events */
    client.bind("twitch-chat", this._onChatEvent.bind(this, client));
    client.bind("twitch-sub", this._onSubEvent.bind(this, client));
    client.bind("twitch-resub", this._onSubEvent.bind(this, client));
    client.bind("twitch-giftsub", this._onSubEvent.bind(this, client));
    client.bind("twitch-anongiftsub", this._onSubEvent.bind(this, client));

    /* Create the array of particles */
    this.resetParticles();

    /* And we're done */
    resolve(this);
  }

  get n() { return this._n; }
  get enable() { return this._on; }
  get tps() { return this._tick; }

  /* Canvas width and height */
  get width() { return this._canvas.width; }
  get height() { return this._canvas.height; }

  /* Number of particles */
  get pCount() { return this._particles.length; }

  /* Number of "alive" particles (p.a > 0) */
  get pLive() { return this._particles.filter((p) => p.alive).length; }

  /* Return the emote used for the subscription fanfare */
  get subEmote() {
    if (this._config.subemote) {
      return this._config.subemote;
    } else {
      return "FrankerZ";
    }
  }

  /* Set the emote used for the subscription fanfare */
  set subEmote(e) {
    this._config.subemote = e;
  }

  /* Return the emote used for the cheer fanfare */
  get cheerEmote() {
    if (this._config.cheeremote) {
      return this._config.cheeremote;
    } else {
      return "FrankerZ";
    }
  }

  /* Set the emote used for the cheer fanfare */
  set cheerEmote(e) {
    this._config.cheeremote = e;
  }

  /* Map func over particles */
  pMap(func) {
    this._particles.map((p) => func(p));
  }

  /* Construct a particle given the configuration given (see resetParticles) */
  pInit(config) {
    return new FanfareParticle(config);
  }

  /* Reset the particles, optionally applying a configuration */
  resetParticles(config=null, count=null) {
    let newParticles = [];
    let n = (count === null ? this._n : count);
    for (let i = 0; i < n; ++i) {
      let p = new FanfareParticle(config || {});
      if (config && !config.image) {
        if (this._particles[i] && this._particles[i].image) {
          p.image = this._particles[i].image;
        }
      }
      newParticles.push(p);
    }
    this._particles = newParticles;
  }

  /* Clears the canvas */
  clearCanvas() {
    this._context.clearRect(0, 0, this.width, this.height);
  }

  /* Begin animation */
  startAnimation() {
    if (this._timer === null) {
      let fn = this._animate.bind(this);
      let rate = 1000 / this._tick;
      this._timer = window.setInterval(fn, rate);
      Util.Log(`Fanfare: starting animation with id ${this._timer}`);
    }
  }

  /* Animation function */
  _animate() {
    this.clearCanvas();
    let numAlive = 0;
    for (let p of this._particles) {
      if (p.alive) {
        p.draw(this._context);
        numAlive += 1;
      }
      p.tick();
    }
    if (numAlive === 0) {
      this.stopAnimation();
    }
  }

  /* Terminate animation prematurely */
  stopAnimation() {
    if (this._timer !== null) {
      Util.Log(`Fanfare: stopping antimation with id ${this._timer}`);
      window.clearInterval(this._timer);
      this._timer = null;
    }
  }

  /* Create an element with some default attributes */
  _elem(type, classes, ...attrs) {
    let e = document.createElement(type);
    let cls = `ff ${classes}`.trim();
    e.setAttribute("class", cls);
    e.setAttribute("data-from", "plugin");
    e.setAttribute("data-from-plugin", this.name);
    for (let aobj of attrs) {
      if (Util.IsArray(aobj) && aobj.length === 2) {
        let [k, v] = aobj;
        e.setAttribute(k, v);
      } else {
        for (let [k, v] of Object.entries(aobj)) {
          e.setAttribute(k, v);
        }
      }
    }
    return e;
  }

  /* Construct an img element */
  _image(url, opts=null) {
    let o = opts ? Util.JSONClone(opts) : {};
    o.src = url;
    return this._elem("img", "ff-image ff-emote", o);
  }

  /* Construct an img element of a Twitch emote */
  _twitchEmote(id, opts=null) {
    return this._image(this._client.GetEmote(id), opts);
  }

  /* Trigger the cheer effect */
  _doFanfareCheer(event) {
    let bits = event.bits;
    Util.DebugOnly(`Cheer fanfare for ${bits} bits`, event);
    this.resetParticles({
      xmin: 0,
      xmax: this.width - 40,
      ymin: this.height - 100,
      ymax: this.height - 30,
      xforcemin: -0.1,
      xforcemax: 0.1,
      yforcemin: -0.5,
      yforcemax: 0,
      image: this._twitchEmote(this.cheerEmote)
    });
  }

  /* Trigger the sub event */
  _doFanfareSub(event) {
    let kind = event.kind;
    Util.DebugOnly(`Sub fanfare for ${kind}`, event);
    this.resetParticles({
      xmin: 0,
      xmax: this.width - 40,
      ymin: this.height - 100,
      ymax: this.height - 30,
      xforcemin: -0.1,
      xforcemax: 0.1,
      yforcemin: -0.5,
      yforcemax: 0,
      image: this._twitchEmote(this.subEmote)
    });
  }

  /* Handle //ff command */
  _onCmd(cmd, tokens, client, self) {
    /* Note: called as a command; `this` refers to a command object */
    let t0 = tokens.length === 0 ? null : tokens[0];
    if (t0 === null) {
      Content.addHelpText(`Fanfare is ${self._on ? "en" : "dis"}abled`);
      this.printUsage();
    } else if (t0 === "on") {
      self._on = true;
      Content.addInfo("Fanfare is now enabled");
    } else if (t0 === "off") {
      self._on = false;
      Content.addInfo("Fanfare is now disabled");
    } else if (t0 === "demo") {
      self._onChatEvent(self._client, {bits: 1000}, true);
    } else {
      Content.addError(`Fanfare: unknown argument ${t0.escape()}`);
      this.printUsage();
    }
  }

  /* Received a message from the client */
  _onChatEvent(client, event, override=false) {
    if (this._on || override) {
      if (event.bits > 0) {
        this._doFanfareCheer(event);
        this.startAnimation();
      }
    }
  }

  /* Received a subscription event from the client */
  _onSubEvent(client, event, override=false) {
    if (this._on || override) {
      this._doFanfareSub(event);
      this.startAnimation();
    }
  }

  get name() { return "FanfarePlugin"; }
}

/* globals FanfareParticle FanfareCheerEffect FanfareSubEffect */
/* vim: set ts=2 sts=2 sw=2 et: */
