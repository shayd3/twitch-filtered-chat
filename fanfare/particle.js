/* Twitch Filtered Chat Fanfare: Particle */

"use strict";

/* Configuration (`X` is a particle attribute):
 *  Attribute formats:
 *   "X"                use value directly
 *   "Xmin", "Xmax"     use a random number between "Xmin" and "Xmax"
 *   "Xrange"           use a random number between Xrange[0] and Xrange[1]
 *  Attributes with format support:
 *   x, y               position
 *   dx, dy             velocity
 *   xforce, yforce     "acceleration"
 *   force              directionless force coefficient
 *  Other attributes:
 *   a                  particle lifetime and opacity
 *   lifeTick           decrease in opacity per tick
 *   image              DOM Image object
 *   width              image width (or 0 if no image is set)
 *   height             image height (or 0 if no image is set)
 *   left, top          x, y
 *   right, bottom      x + width, y + height
 */
class FanfareParticle { /* exported FanfareParticle */
  constructor(config) {
    this._config = config;
    this.x = 0;
    this.y = 0;
    this.dx = 0;
    this.dy = 0;
    this.xforce = 0;
    this.yforce = 0;
    this.force = 0;
    this.a = 1;
    this.lifeTick = 0.01;
    this._image = null;
    this._applyConfig(config);
  }

  get width() { return this._image ? this._image.width : 0; }
  get height() { return this._image ? this._image.height : 0; }

  get top() { return this.y; }
  get left() { return this.x; }
  get bottom() { return this.y + this.height; }
  get right() { return this.x + this.width; }

  get image() {
    return this._image;
  }
  set image(img) {
    if (typeof(img) === "string") {
      this._image = document.createElement("img");
      this._image.src = img;
    } else {
      this._image = img;
    }
  }

  draw(context) {
    if (!this.image || !this.image.complete) {
      /* No need to draw if the image isn't loaded */
      return;
    }
    context.save();
    context.globalAlpha = this.a;
    context.drawImage(this.image, this.x, this.y);
    context.restore();
  }

  _applyConfig(config) {
    let opts = config || {};
    let hasNum = (k) => (typeof(opts[k]) === "number");
    let hasRange = (k) => (Util.IsArray(opts[k]) && opts[k].length === 2);
    let randNum = (min, max) => Math.random() * (max - min) + min;
    let getValue = (k, dflt) => {
      if (hasNum(k)) {
        return k;
      } else if (hasNum(`${k}min`) && hasNum(`${k}max`)) {
        return randNum(opts[`${k}min`], opts[`${k}max`]);
      } else if (hasRange(`${k}range`)) {
        return randNum(opts[`${k}range`][0], opts[`${k}range`][1]);
      } else {
        return dflt;
      }
    };
    this.x = getValue("x", 0);
    this.y = getValue("y", 0);
    this.dx = getValue("dx", 0);
    this.dy = getValue("dy", 0);
    this.a = getValue("a", 1);
    this.xforce = getValue("xforce", 0);
    this.yforce = getValue("yforce", 0);
    this.force = getValue("force", 0);
    if (config.image) {
      this.image = config.image;
    }
  }

  tick() {
    if (this.alive) {
      this.a -= this.lifeTick;
      this.x += this.dx;
      this.y += this.dy;
      if (this.xforce !== 0) this.dx += this.xforce;
      if (this.yforce !== 0) this.dy += this.yforce;
      if (this.force !== 0) {
        let scale = this.force * Math.hypot(this.x, this.y);
        let angle = Math.atan2(this.y, this.x);
        this.dx = scale * Math.cos(angle);
        this.dy = scale * Math.sin(angle);
      }
    }
  }

  get alive() {
    return this.a > 0;
  }
}

