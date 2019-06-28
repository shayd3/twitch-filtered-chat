/* Twitch Filtered Chat Fanfare: Effects */

"use strict";

class FanfareEffect { /* exported FanfareEffect */
  constructor(plugin, config) {
    this._plugin = plugin;
    this._config = config;
    this._particles = [];

    /* Event callbacks */
    this._cb = {};
  }

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
      let img = this._plugin.twitchEmote(this.emote);
      img.onload = (function(ev) {
        this._image = img;
        this.fire("load", this);
        this.initialize();
        resolve(ev);
      }).bind(this);
      img.onerror = (function(ev) {
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
}

class FanfareCheerEffect extends FanfareEffect { /* exported FanfareCheerEffect */
  constructor(plugin, config, event) {
    super(plugin, config);
    this._event = event;
  }

  get num() {
    if (this._config.numparticles) return this._config.numparticles;
    if (this._image && this._image.width) {
      return this._plugin.width / this._image.width;
    }
    return 10;
  }

  get emote() {
    if (this._config.cheeremote) return this._config.cheeremote;
    if (this._config.emote) return this._config.emote;
    return "FrankerZ";
  }

  /* Called by base class */
  initialize() {
    for (let i = 0; i < this.num; ++i) {
      this._particles.push(new FanfareParticle({
        xmin: 0,
        xmax: this._plugin.width - 40,
        ymin: this._plugin.height - 100,
        ymax: this._plugin.height - 30,
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
}

class FanfareSubEffect extends FanfareEffect { /* exported FanfareSubEffect */
  constructor(plugin, config, event) {
    super(plugin, config);
    this._event = event;
  }

  get num() {
    if (this._config.numparticles) return this._config.numparticles;
    if (this._image && this._image.width) {
      return this._plugin.width / this._image.width;
    }
    return 10;
  }

  get emote() {
    if (this._config.subemote) return this._config.subemote;
    if (this._config.emote) return this._config.emote;
    return "HolidayPresent";
  }

  /* Called by base class */
  initialize() {
    for (let i = 0; i < this.num; ++i) {
      this._particles.push(new FanfareParticle({
        xmin: 0,
        xmax: this._plugin.width - 40,
        ymin: this._plugin.height - 100,
        ymax: this._plugin.height - 30,
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
}

/* globals FanfareParticle */
