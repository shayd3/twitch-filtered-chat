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
 */"use strict";/** Particle configuration
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
 */var _slicedToArray=function(){function a(a,b){var c=[],d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done)&&(c.push(g.value),!(b&&c.length===b));d=!0);}catch(a){e=!0,f=a}finally{try{!d&&h["return"]&&h["return"]()}finally{if(e)throw f}}return c}return function(b,c){if(Array.isArray(b))return b;if(Symbol.iterator in Object(b))return a(b,c);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),_createClass=function(){function a(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}();function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}/* globals FanfareCheerEffect FanfareSubEffect *//* vim: set ts=2 sts=2 sw=2 et: */var FanfareCSS="\n.ff.ff-canvas {\n  pointer-events: none;\n  position: absolute;\n  left: 0px;\n  top: 0px;\n  z-index: 100;\n}\n",Fanfare=function(){function a(b,c){_classCallCheck(this,a),this._client=b,this._config=c.fanfare||{enable:!1},this._on=this._config.enable,this._tick=this._config.tick||a.DEFAULT_TPS,this._on=!0,this._running=[],this._timer=null;/* Create stylesheet */var d=this.elem("style","",{type:"text/css",id:"ff-styles"});d.innerText=FanfareCSS,document.head.appendChild(d),this._canvas=this.elem("canvas","ff-canvas",{id:"ff-canvas"}),this._cWidth=window.innerWidth,this._cHeight=window.innerHeight,this._canvas.width=this._cWidth,this._canvas.height=this._cHeight,this._context=this._canvas.getContext("2d"),document.body.appendChild(this._canvas),ChatCommands.add("fanfare",this._onCmd,"Enable or disable fanfare",this),ChatCommands.addUsage("fanfare",null,"Show fanfare status"),ChatCommands.addUsage("fanfare","on","Enable fanfare"),ChatCommands.addUsage("fanfare","off","Disable fanfare"),ChatCommands.addUsage("fanfare","demo","Demonstrate fanfare"),ChatCommands.addAlias("ff","fanfare"),b.bind("twitch-chat",this._onChatEvent.bind(this,b)),b.bind("twitch-sub",this._onSubEvent.bind(this,b)),b.bind("twitch-resub",this._onSubEvent.bind(this,b)),b.bind("twitch-giftsub",this._onSubEvent.bind(this,b)),b.bind("twitch-anongiftsub",this._onSubEvent.bind(this,b))}return _createClass(a,null,[{key:"DEFAULT_NUM_PARTICLES",/* exported Fanfare */get:function a(){return 25}},{key:"DEFAULT_TPS",get:function a(){return 30}}]),_createClass(a,[{key:"elem",/* Create an element with some default attributes */value:function z(a,b){var c=document.createElement(a),d=("ff "+b).trim();c.setAttribute("class",d),c.setAttribute("data-from","fanfare");for(var e=arguments.length,f=Array(2<e?e-2:0),g=2;g<e;g++)f[g-2]=arguments[g];var h=!0,i=!1,j=void 0;try{for(var l,m,n=f[Symbol.iterator]();!(h=(l=n.next()).done);h=!0)if(m=l.value,Util.IsArray(m)&&2===m.length){var o=_slicedToArray(m,2),p=o[0],k=o[1];c.setAttribute(p,k)}else{var q=!0,r=!1,s=void 0;try{for(var t,u=Object.entries(m)[Symbol.iterator]();!(q=(t=u.next()).done);q=!0){var v=t.value,w=_slicedToArray(v,2),x=w[0],y=w[1];c.setAttribute(x,y)}}catch(a){r=!0,s=a}finally{try{!q&&u.return&&u.return()}finally{if(r)throw s}}}}catch(a){i=!0,j=a}finally{try{!h&&n.return&&n.return()}finally{if(i)throw j}}return c}/* Construct an img element */},{key:"image",value:function d(a){var b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:null,c=b?Util.JSONClone(b):{};return c.src=a,this.elem("img","ff-image ff-emote",c)}/* Construct an img element of a Twitch emote */},{key:"twitchEmote",value:function c(a){var b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:null;return this.image(this._client.GetEmote(a),b)}/* Clears the canvas */},{key:"clearCanvas",value:function a(){this._context.clearRect(0,0,this.width,this.height)}/* Start a new animation */},{key:"addEffect",value:function c(a){var b=this;a.load().then(function(){Util.LogOnly("Loaded effect, starting...",a),b._running.push(a),b.startAnimation()}).catch(function(a){Util.Error("Failed to load effect",a)})}/* Begin animating */},{key:"startAnimation",value:function c(){if(null===this._timer){var a=this._animate.bind(this),b=1e3/this._tick;this._timer=window.setInterval(a,b),Util.LogOnly("Fanfare: starting animation with id "+this._timer)}}/* Animation function */},{key:"_animate",value:function h(){var a=[];this.clearCanvas();var b=!0,c=!1,d=void 0;try{for(var e,f,g=this._running[Symbol.iterator]();!(b=(e=g.next()).done);b=!0)f=e.value,f.tick()&&(f.draw(this._context),a.push(f))}catch(a){c=!0,d=a}finally{try{!b&&g.return&&g.return()}finally{if(c)throw d}}this._running=a,0===this._running.length&&this.stopAnimation()}/* Terminate animations prematurely */},{key:"stopAnimation",value:function a(){null!==this._timer&&(Util.LogOnly("Fanfare: stopping antimations with id "+this._timer),window.clearInterval(this._timer),this._timer=null)}/* Handle //ff command */},{key:"_onCmd",value:function f(a,b,c,d){/* Note: called as a command; `this` refers to a command object */var e=0===b.length?null:b[0];null===e?(Content.addHelpText("Fanfare is "+(d._on?"en":"dis")+"abled"),this.printUsage()):"on"===e?(d._on=!0,Content.addInfo("Fanfare is now enabled")):"off"===e?(d._on=!1,Content.addInfo("Fanfare is now disabled")):"demo"===e?(d._onChatEvent(d._client,{bits:1e3},!0),d._onSubEvent(d._client,{},!0)):(Content.addError("Fanfare: unknown argument "+e.escape()),this.printUsage())}/* Received a message from the client */},{key:"_onChatEvent",value:function d(a,b){var c=!!(2<arguments.length&&void 0!==arguments[2])&&arguments[2];Util.DebugOnly("Received onChatEvent",b),(this._on||c)&&0<b.bits&&this.addEffect(new FanfareCheerEffect(this,this._config,b))}/* Received a subscription event from the client */},{key:"_onSubEvent",value:function d(a,b){var c=!!(2<arguments.length&&void 0!==arguments[2])&&arguments[2];Util.DebugOnly("Received onSubEvent",b),(this._on||c)&&this.addEffect(new FanfareSubEffect(this,this._config,b))}},{key:"enable",get:function a(){return this._on},set:function b(a){this._on=a}},{key:"tps",get:function a(){return this._tick},set:function b(a){this._tick=a}},{key:"tickTime",set:function b(a){this._tick=1e3*a}},{key:"canvas",get:function a(){return this._canvas}},{key:"context",get:function a(){return this._context}},{key:"width",get:function a(){return this._canvas.width}},{key:"height",get:function a(){return this._canvas.height}}]),a}();