/* Twitch Filtered Chat Fanfare: Effects */

"use strict";

class FanfareEffect { /* {{{0 */
  constructor(host, config) {
    this._host = host;
    this._config = config || {};
    this._particles = [];

    /* Event callbacks */
    this._cb = {};
  }

  config(k) { return this._config[k]; }
  get count() { return this._particles.length; }
  get alive() { return this._particles.filter((p) => p.alive).length; }

  get onload() { return this._cb.onload; }
  set onload(fn) { this._cb.onload = fn; }
  get onpredraw() { return this._cb.onpredraw; }
  set onpredraw(fn) { this._cb.onpredraw = fn; }
  get ondraw() { return this._cb.ondraw; }
  set ondraw(fn) { this._cb.ondraw = fn; }
  get onstart() { return this._cb.start; }
  set onstart(fn) { this._cb.start = fn; }
  get onend() { return this._cb.end; }
  set onend(fn) { this._cb.end = fn; }
  get oncomplete() { return this._cb.complete; }
  set oncomplete(fn) { this._cb.complete = fn; }

  fire(name, ...args) {
    if (this._cb.hasOwnProperty(name)) {
      this._cb[name](...args);
    }
  }

  load() {
    return new Promise((function(resolve, reject) {
      let img = null;
      if (this.emote) {
        img = this._host.twitchEmote(this.emote);
      } else if (this.imageUrl) {
        img = this._host.image(this.imageUrl);
      }
      img.onload = (function(ev) {
        this._image = img;
        this.fire("load", this);
        this.initialize();
        resolve(ev);
      }).bind(this);
      img.onerror = (function(ev) {
        Util.Error(ev);
        reject(ev);
      }).bind(this);
    }).bind(this));
  }

  start() {
    this.initialize();
    this.fire("start", this);
  }

  tick() {
    this.fire("tick", this);
    let numAlive = 0;
    for (let p of this._particles) {
      p.tick();
      if (p.alive) {
        numAlive += 1;
      }
    }
    if (numAlive === 0) {
      this.fire("end", this);
      this.fire("complete", this);
    }
    return numAlive > 0;
  }

  draw(context) {
    this.fire("predraw", this);
    for (let p of this._particles) {
      p.draw(context);
    }
    this.fire("draw", this);
  }
} /* 0}}} */

class FanfareCheerEffect extends FanfareEffect { /* {{{0 */
  constructor(host, config, event) {
    super(host, config);
    this._event = event;
    this._bits = event.bits || 1;
  }

  get name() { return "FanfareCheerEffect"; }

  get num() {
    if (this.config("numparticles")) {
      return this.config("numparticles");
    } else if (this._image && this._image.width) {
      return this._host.width / this._image.width;
    } else {
      return 10;
    }
  }

  static get background() {
    if ($("body").hasClass("light")) {
      return "light";
    } else {
      return "dark";
    }
  }

  static get scale() {
    return "2";
  }

  static cheerToURL(cdef, bits, pbg=null, pscale=null) {
    let bg = pbg || FanfareCheerEffect.background;
    let scale = pscale || FanfareCheerEffect.scale;
    /* Determine background and scale */
    if (!cdef.backgrounds.includes(bg)) {
      Util.DebugOnly(`Background ${bg} not in ${JSON.stringify(cdef.backgrounds)}`);
      bg = cdef.backgrounds[0];
    }
    if (!cdef.scales.map((n) => `${n}`).includes(scale)) {
      Util.DebugOnly(`Scale ${scale} not in ${JSON.stringify(cdef.scales)}`);
      scale = cdef.scales[0];
    }
    /* Figure out the tier we're using */
    let curr_bits = 0;
    let tier = cdef.tiers[0];
    for (let tdef of Object.values(cdef.tiers)) {
      if (tdef.min_bits > curr_bits && bits >= tdef.min_bits) {
        tier = tdef;
      }
    }
    /* Return the derived URL */
    Util.DebugOnly(tier, `Using ${bg} ${scale}`);
    try {
      return tier.images[bg].static[scale];
    }
    catch (e) {
      Util.ErrorOnly(e);
      Util.ErrorOnly(tier, bg, scale);
      return "";
    }
  }

  get emote() {
    /* null forces imageUrl to be called */
    return null;
  }

  get imageUrl() {
    let cheermote = "Cheer";
    let [bg, scale] = [null, null];
    if (this.config("cheermote")) {
      cheermote = this.config("cheermote");
    }
    if (this.config("cheerbg")) {
      bg = this.config("cheerbg");
    }
    if (this.config("cheerscale")) {
      scale = this.config("cheerscale");
    }
    let cdef = this._host._client.GetGlobalCheer(cheermote);
    return FanfareCheerEffect.cheerToURL(cdef, this._bits, bg, scale);
  }

  /* Called by base class */
  initialize() {
    for (let i = 0; i < this.num; ++i) {
      this._particles.push(new FanfareParticle({
        xmin: 0,
        xmax: this._host.width - 40,
        ymin: this._host.height - 100,
        ymax: this._host.height - 30,
        dxmin: 0,
        dxmax: 1,
        dymin: 0,
        dymax: 1,
        xforcemin: -0.1,
        xforcemax: 0.1,
        yforcemin: -0.5,
        yforcemax: 0,
        image: this._image
      }));
    }
  }
} /* 0}}} */

class FanfareSubEffect extends FanfareEffect { /* {{{0 */
  constructor(host, config, event) {
    super(host, config);
    this._event = event;
    this._kind = event.kind || TwitchSubEvent.SUB;
    this._tier = event.plan || TwitchSubEvent.PLAN_TIER1;
  }

  get name() { return "FanfareSubEffect"; }

  get num() {
    if (this.config("numparticles")) {
      return this.config("numparticles");
    } else if (this._image && this._image.width) {
      return this._host.width / this._image.width;
    } else {
      return 10;
    }
  }

  get emote() {
    /* null forces imageUrl to be called */
    return null;
  }

  get imageUrl() {
    let emote = "HolidayPresent";
    let size = "1.0";
    if (this.config("subemote")) {
      emote = this.config("subemote");
    } else if (this._kind === TwitchSubEvent.SUB) {
      emote = "MrDestructoid";
    } else if (this._kind === TwitchSubEvent.RESUB) {
      emote = "PraiseIt";
    } else if (this._kind === TwitchSubEvent.GIFTSUB) {
      emote = "HolidayPresent";
    } else if (this._kind === TwitchSubEvent.ANONGIFTSUB) {
      emote = "HolidayPresent";
    } else if (this.config("emote")) {
      emote = this.config("emote");
    }
    if (this._tier === TwitchSubEvent.PLAN_TIER2) {
      size = "2.0";
    } else if (this._tier === TwitchSubEvent.PLAN_TIER3) {
      size = "3.0";
    }
    return this._host._client.GetEmote(emote, size);
  }

  /* Called by base class */
  initialize() {
    for (let i = 0; i < this.num; ++i) {
      this._particles.push(new FanfareParticle({
        xmin: 0,
        xmax: this._host.width - 40,
        ymin: this._host.height - 100,
        ymax: this._host.height - 30,
        dxrange: [-5, 5],
        dyrange: [-4, 1],
        xforcemin: -0.1,
        xforcemax: 0.1,
        yforcemin: -0.5,
        yforcemax: 0,
        image: this._image
      }));
    }
  }
} /* 0}}} */

/* exported FanfareEffect FanfareCheerEffect FanfareSubEffect */
/* globals FanfareParticle */
