/* Twitch Filtered Chat Fanfare: Particle */"use strict";/** Particle configuration
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
 * Most of the variables above can be set via one of the following
 * configuration formats:
 *   "X"                use value directly
 *   "Xmin", "Xmax"     use a random number between "Xmin" and "Xmax"
 *   "Xrange"           use a random number between Xrange[0] and Xrange[1]
 * The attributes supporting this format are:
 *   x, y               position
 *   dx, dy             velocity
 *   xforce, yforce     "acceleration"
 *   force              directionless force coefficient
 * Other attributes:
 *   a                  particle opacity (also lifetime)
 *   lifeTick           decrease in opacity per tick
 *   image              DOM Image object
 *   width              image width (or 0 if no image is set/loaded)
 *   height             image height (or 0 if no image is set/loaded)
 *   left, top          x, y
 *   right, bottom      x + width, y + height
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
 */var _createClass=function(){function a(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}();function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}var FanfareParticle=function(){/* exported FanfareParticle */function a(b){_classCallCheck(this,a),this._config=b,this.x=0,this.y=0,this.dx=0,this.dy=0,this.xforce=0,this.yforce=0,this.force=0,this.a=1,this.lifeTick=.01,this._image=null,this._applyConfig(b)}/* Position */return _createClass(a,[{key:"draw",/* Draw the particle to the given context */value:function b(a){this.image&&this.image.complete&&(a.globalAlpha=this.a,a.drawImage(this.image,this.x,this.y))}/* Apply the configuration object (see large comment above) */},{key:"_applyConfig",value:function g(a){var b=a||{},c=function(a){return"number"==typeof b[a]},d=function(a){return Util.IsArray(b[a])&&2===b[a].length},e=function(a,b){return Math.random()*(b-a)+a},f=function(a,f){return c(a)?b[a]:c(a+"min")&&c(a+"max")?e(b[a+"min"],b[a+"max"]):d(a+"range")?e(b[a+"range"][0],b[a+"range"][1]):f};this.x=f("x",0),this.y=f("y",0),this.dx=f("dx",0),this.dy=f("dy",0),this.a=f("a",1),this.xforce=f("xforce",0),this.yforce=f("yforce",0),this.force=f("force",0),this.lifeTick=f("lifeTick",.01),a.image&&(this.image=a.image)}/* Handle particle movement and decrease opacity by this.lifeTick */},{key:"tick",value:function g(){var a=Math.sin,b=Math.cos,c=Math.atan2,d=Math.hypot;if(this.alive&&(this.a-=this.lifeTick,this.x+=this.dx,this.y+=this.dy,0!==this.xforce&&(this.dx+=this.xforce),0!==this.yforce&&(this.dy+=this.yforce),0!==this.force)){var e=this.force*d(this.x,this.y),f=c(this.y,this.x);this.dx=e*b(f),this.dy=e*a(f)}}},{key:"top",get:function a(){return this.y}},{key:"left",get:function a(){return this.x}},{key:"bottom",get:function a(){return this.y+this.height}},{key:"right",get:function a(){return this.x+this.width}/* Size */},{key:"width",get:function a(){return this._image?this._image.width:0}},{key:"height",get:function a(){return this._image?this._image.height:0}/* Get or set the particle image */},{key:"image",get:function a(){return this._image},set:function b(a){"string"==typeof a?(this._image=document.createElement("img"),this._image.src=a):this._image=a}/* Return whether or not the particle is "alive" */},{key:"alive",get:function a(){return 0<this.a}}]),a}();