/* Twitch Filtered Chat Fanfare: Effects */

"use strict";

class FanfareEffect { /* exported FanfareEffect */
  constructor(plugin, config, tickFn) {
    this._plugin = plugin;
    this._config = config;
    this._timer = null;
    this._tick_func = tickFn;
    this._particles = [];
  }

  get count() { return this._particles.length; }
  get alive() { return this._particles.filter((p) => p.alive).length; }
  get running() { return this._timer !== null; }

  resetParticles(config, count=null) {
    let newParticles = [];
    let n = (count === null ? this._plugin.n : count);
    for (let i = 0; i < n; ++i) {
      let p = new FanfareParticle(config);
      if (!config.image) {
        if (this._particles[i] && this._particles[i].image) {
          p.image = this._particles[i].image;
        }
      }
      newParticles.push(p);
    }
    this._particles = newParticles;
  }
  startAnimation() {
    if (this._timer === null) {
      let delay = 1000 / this._plugin.tps;
      this._timer = window.setInterval(this._tick_func, delay);
    }
  }
  stopAnimation() {
    if (this._timer !== null) {
      window.clearInterval(this._timer);
      this._timer = null;
    }
  }
}

class FanfareCheerEffect extends FanfareEffect { /* exported FanfareCheerEffect */
  constructor(plugin, config) {
    super(plugin, config);
  }

  animate() {
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
}

class FanfareSubEffect extends FanfareEffect { /* exported FanfareSubEffect */
  constructor(plugin, config) {
    super(plugin, config);
    this.resetParticles();
  }

  animate() {
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
}

/* globals FanfareParticle */
