/* Twitch Filtered Chat Fanfare: Particle */"use strict";/* Configuration (`X` is a particle attribute):
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
 */var _createClass=function(){function a(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}();function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}var FanfareParticle=function(){/* exported FanfareParticle */function a(b){_classCallCheck(this,a),this._config=b,this.x=0,this.y=0,this.dx=0,this.dy=0,this.xforce=0,this.yforce=0,this.force=0,this.a=1,this.lifeTick=.01,this._image=null,this._applyConfig(b)}return _createClass(a,[{key:"draw",value:function b(a){this.image&&this.image.complete&&(a.save(),a.globalAlpha=this.a,a.drawImage(this.image,this.x,this.y),a.restore())}},{key:"_applyConfig",value:function g(a){var b=a||{},c=function(a){return"number"==typeof b[a]},d=function(a){return Util.IsArray(b[a])&&2===b[a].length},e=function(a,b){return Math.random()*(b-a)+a},f=function(a,f){return c(a)?a:c(a+"min")&&c(a+"max")?e(b[a+"min"],b[a+"max"]):d(a+"range")?e(b[a+"range"][0],b[a+"range"][1]):f};this.x=f("x",0),this.y=f("y",0),this.dx=f("dx",0),this.dy=f("dy",0),this.a=f("a",1),this.xforce=f("xforce",0),this.yforce=f("yforce",0),this.force=f("force",0),a.image&&(this.image=a.image)}},{key:"tick",value:function g(){var a=Math.sin,b=Math.cos,c=Math.atan2,d=Math.hypot;if(this.alive&&(this.a-=this.lifeTick,this.x+=this.dx,this.y+=this.dy,0!==this.xforce&&(this.dx+=this.xforce),0!==this.yforce&&(this.dy+=this.yforce),0!==this.force)){var e=this.force*d(this.x,this.y),f=c(this.y,this.x);this.dx=e*b(f),this.dy=e*a(f)}}},{key:"width",get:function a(){return this._image?this._image.width:0}},{key:"height",get:function a(){return this._image?this._image.height:0}},{key:"top",get:function a(){return this.y}},{key:"left",get:function a(){return this.x}},{key:"bottom",get:function a(){return this.y+this.height}},{key:"right",get:function a(){return this.x+this.width}},{key:"image",get:function a(){return this._image},set:function b(a){"string"==typeof a?(this._image=document.createElement("img"),this._image.src=a):this._image=a}},{key:"alive",get:function a(){return 0<this.a}}]),a}();