/** Fanfare
 *
 * Commands:
 *   //ff           Displays //ff usage and whether or not fanfare is enabled
 *   //ff help      Displays //ff usage
 *   //ff on        Enables fanfare
 *   //ff off       Disables fanfare
 *   //ff demo      Demonstrates available fanfares
 *   //ff cheerdemo Demonstrates the cheer effect (see //ff help for more)
 *   //ff subdemo   Demonstrates the sub effect (see //ff help for more)
 *
 * Configuration keys:
 *   fanfare        Query string key `&fanfare=<value>`
 *   Fanfare        Config object key
 *
 * The `&fanfare=<value>` value is either a number (non-zero for enable), a
 * boolean, or a JSON-encoded object with the following attributes:
 *   enable         boolean; whether or not fanfares are enabled
 *   suburl         URL to the image to use for sub fanfares; overrides all
 *                  other image settings
 *   cheerurl       URL to the image to use for cheer fanfares; overrides all
 *                  other image settings
 *   imageurl       URL to the image to use for all fanfares; overrides all
 *                  other image settings other than "suburl" and "cheerurl"
 *   cheerbg        background: either "light" or "dark" (default: "dark")
 *   cheermote      image name (default: "Cheer")
 *   cheerscale     image scale (default: "1.0")
 *   subemote       emote to use for sub events
 *   emote          fallback emote if no other image is defined
 *   numparticles   number of particles (default: window.width / image.width)
 *
 * Example configuration items:
 *  The following all enable fanfares:
 *   &fanfare=1
 *   &fanfare=true
 *   &fanfare=%7B%22enable%22%3Atrue%7D
 *
 *  The following enable fanfares and set specific emotes:
 *   &fanfare=%7B%22subemote%22%3A%22FrankerZ%22%7D
 *                  Use "FrankerZ" for all sub fanfares
 *   &fanfare=%7Bemote%22%3A%22FrankerZ%22%7D
 *                  Use "FrankerZ" for all fanfares
 *
 * For cheer fanfares, the URL to the image is derived via the following:
 *  1) If config["cheerurl"] is defined, use it. We're done.
 *  2) If config["imageurl"] is defined, use it. We're done.
 *  3) Otherwise, determine the cheermote to use via the following steps:
 *    a) If config["cheermote"] is given, use it. Otherwise, use "Cheer"
 *    b) If config["bg"] is given, use it. Otherwise use the first background
 *       defined in the cheer data (usually "dark")
 *    c) If config["cheerscale"] is given, use it. Otherwise, use the first
 *       scale defined in the cheer data (usually "1")
 *  4) Given the cheermote, background, and scale, determine the exact image to
 *     use based on the number of bits cheered.
 *
 * For sub fanfares, the URL to the image is derived via the following:
 *  1) If config["suburl"] is defined, use it. We're done.
 *  2) If config["imageurl"] is defined, use it. We're done.
 *  3) Otherwise, determine the emote to use via the following steps:
 *    a) If config["subemote"] is defined, use the URL to the emote given
 *    b) If the sub kind is "sub", use the emote "MrDestructoid"
 *    c) If the sub kind is "resub", use the emote "PraiseIt"
 *    d) If the sub kind is "subgift", use the emote "HolidayPresent"
 *    e) If the sub kind is "anonsubgift", use the emote "HolidayPresent"
 *    f) Otherwise, if config["emote"] is given, use it.
 *    g) Otherwise, use "HolidayPresent"
 *  4) Determine the size of the emote:
 *    a) If the sub is Tier 2, use "2.0" (80x60px)
 *    b) If the sub is Tier 3, use "3.0" (120x90px)
 *    c) Otherwise, use "1.0" (40x30px)
 *  5) Use the URL to the emote and size chosen
 */

/* TODO:
 * Somehow handle animated images
 * Provide APIs to add effects from plugins
 */

"use strict";

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

  /* Listen to a twitch event */
  bindClient(event_name, event_func) {
    this._client.bind(event_name, event_func);
  }

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
        requestAnimationFrame(() => {
          effect.draw(this._context);
        });
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
      Content.addHelpText("Add a number to cheerdemo to simulate that number of bits");
      Content.addHelpText("Available arguments for subdemo:");
      for (let kind of TwitchSubEvent.KINDS) {
        Content.addHelpLine(kind, `Demonstrate the ${kind} type of subscription`);
      }
      for (let plan of TwitchSubEvent.PLANS) {
        let name = TwitchSubEvent.PlanName(plan);
        Content.addHelpLine(plan, `Demonstrate a ${name} subscription`);
      }
      Content.addHelpText(`Default kind: ${TwitchSubEvent.SUB}`);
      Content.addHelpText(`Default plan: ${TwitchSubEvent.PLAN_TIER1}`);
    } else if (t0 === "on") {
      self._on = true;
      Content.addInfoText("Fanfare is now enabled");
    } else if (t0 === "off") {
      self._on = false;
      Content.addInfoText("Fanfare is now disabled");
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
      Content.addErrorText(`Fanfare: unknown argument ${t0}`);
      this.printUsage();
    }
  }

  /* Received a message from the client */
  _onChatEvent(client, event, override=false) {
    Util.Debug("_onChatEvent", client, event, override);
    if (this._on || override) {
      if (event.bits > 0) {
        let e = new FanfareCheerEffect(this, this._config, event);
        e.load().then(() => {
          this.addEffect(e);
        }).catch((err) => {
          Util.Error(`Failed to load effect ${e.name}:`, err, e);
        });
      }
    }
  }

  /* Received a subscription event from the client */
  _onSubEvent(client, event, override=false) {
    Util.Debug("_onSubEvent", client, event, override);
    if (this._on || override) {
      let e = new FanfareSubEffect(this, this._config, event);
      e.load().then(() => {
        this.addEffect(e);
      }).catch((err) => {
        Util.Error(`Failed to load effect ${e.name}:`, err, e);
      });
    }
  }
}

/* globals FanfareCheerEffect FanfareSubEffect */
/* vim: set ts=2 sts=2 sw=2 et: */
