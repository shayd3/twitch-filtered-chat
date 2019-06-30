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
 */var _slicedToArray=function(){function a(a,b){var c=[],d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done)&&(c.push(g.value),!(b&&c.length===b));d=!0);}catch(a){e=!0,f=a}finally{try{!d&&h["return"]&&h["return"]()}finally{if(e)throw f}}return c}return function(b,c){if(Array.isArray(b))return b;if(Symbol.iterator in Object(b))return a(b,c);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),_createClass=function(){function a(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}();function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}var Fanfare=function(){function a(b,c){_classCallCheck(this,a),this._client=b,this._config=c.Fanfare||{enable:!1},this._on=this._config.enable,this._tick=this._config.tick||a.DEFAULT_TPS,this._running=[],this._timer=null,this._canvas=this.elem("canvas","ff-canvas",{id:"ff-canvas",style:"pointer-events: none; position: absolute; top: 0; left: 0; z-index: 100;"}),this._cWidth=window.innerWidth,this._cHeight=window.innerHeight,this._canvas.width=this._cWidth,this._canvas.height=this._cHeight,this._context=this._canvas.getContext("2d"),document.body.appendChild(this._canvas),ChatCommands.add("fanfare",this._onCmd,"Enable or disable fanfare",this),ChatCommands.addUsage("fanfare",null,"Show fanfare status and help"),ChatCommands.addUsage("fanfare","help","Show fanfare help"),ChatCommands.addUsage("fanfare","on","Enable fanfare"),ChatCommands.addUsage("fanfare","off","Disable fanfare"),ChatCommands.addUsage("fanfare","demo","Demonstrate fanfare"),ChatCommands.addUsage("fanfare","cheerdemo","Demonstrate cheer fanfare"),ChatCommands.addUsage("fanfare","subdemo","Demonstrate sub fanfare"),ChatCommands.addAlias("ff","fanfare"),b.bind("twitch-chat",this._onChatEvent.bind(this,b)),b.bind("twitch-sub",this._onSubEvent.bind(this,b)),b.bind("twitch-resub",this._onSubEvent.bind(this,b)),b.bind("twitch-giftsub",this._onSubEvent.bind(this,b)),b.bind("twitch-anongiftsub",this._onSubEvent.bind(this,b))}return _createClass(a,null,[{key:"DEFAULT_NUM_PARTICLES",/* exported Fanfare */get:function a(){return 25}},{key:"DEFAULT_TPS",get:function a(){return 30}}]),_createClass(a,[{key:"elem",/* Create an element with some default attributes */value:function A(a,b){var c=document.createElement(a),d=("ff "+b).trim(),e=function(a,b){"innerHTML"===a?c.innerHTML=b:"innerText"===a?c.innerText=b:c.setAttribute(a,b)};e("class",d),e("data-from","fanfare");for(var f=arguments.length,g=Array(2<f?f-2:0),h=2;h<f;h++)g[h-2]=arguments[h];var i=!0,j=!1,l=void 0;try{for(var m,n,o=g[Symbol.iterator]();!(i=(m=o.next()).done);i=!0)if(n=m.value,Util.IsArray(n)&&2===n.length){var p=_slicedToArray(n,2),q=p[0],k=p[1];e(q,k)}else{var r=!0,s=!1,t=void 0;try{for(var u,v=Object.entries(n)[Symbol.iterator]();!(r=(u=v.next()).done);r=!0){var w=u.value,x=_slicedToArray(w,2),y=x[0],z=x[1];e(y,z)}}catch(a){s=!0,t=a}finally{try{!r&&v.return&&v.return()}finally{if(s)throw t}}}}catch(a){j=!0,l=a}finally{try{!i&&o.return&&o.return()}finally{if(j)throw l}}return c}/* Construct an img element */},{key:"image",value:function d(a){var b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:null,c=b?Util.JSONClone(b):{};return c.src=a,this.elem("img","ff-image ff-emote",c)}/* Construct an img element of a Twitch emote */},{key:"twitchEmote",value:function c(a){var b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:null;return this.image(this._client.GetEmote(a),b)}/* Clears the canvas */},{key:"clearCanvas",value:function a(){this._context.clearRect(0,0,this.width,this.height)}/* Start a new animation */},{key:"addEffect",value:function c(a){var b=this;a.load().then(function(){Util.LogOnly("Loaded effect, starting...",a),b._running.push(a),b.startAnimation()}).catch(function(a){Util.Error("Failed to load effect",a)})}/* Begin animating */},{key:"startAnimation",value:function c(){if(null===this._timer){var a=this._animate.bind(this),b=1e3/this._tick;this._timer=window.setInterval(a,b),Util.LogOnly("Fanfare: starting animations with id "+this._timer)}}/* Animation function */},{key:"_animate",value:function h(){var a=[];this.clearCanvas();var b=!0,c=!1,d=void 0;try{for(var e,f,g=this._running[Symbol.iterator]();!(b=(e=g.next()).done);b=!0)f=e.value,f.tick()&&(f.draw(this._context),a.push(f))}catch(a){c=!0,d=a}finally{try{!b&&g.return&&g.return()}finally{if(c)throw d}}this._running=a,0===this._running.length&&this.stopAnimation()}/* Terminate animations */},{key:"stopAnimation",value:function a(){null!==this._timer&&(Util.LogOnly("Fanfare: stopping antimations with id "+this._timer),window.clearInterval(this._timer),this._timer=null,this._running=[])}/* Handle //fanfare (or //ff) command */},{key:"_onCmd",value:function I(a,b,c,d){/* Note: called as a command; `this` refers to a command object */var e=0===b.length?null:b[0];if(null===e||"help"===e){null===e&&Content.addHelpText("Fanfare is "+(d._on?"en":"dis")+"abled"),this.printUsage(),Content.addHelp("Add a number to cheerdemo to simulate that number of bits"),Content.addHelp("Available arguments for subdemo:");var f=!0,g=!1,h=void 0;try{for(var i,j,l=TwitchSubEvent.KINDS[Symbol.iterator]();!(f=(i=l.next()).done);f=!0)j=i.value,Content.addHelpLine(j,"Demonstrate the "+j+" type of subscription")}catch(a){g=!0,h=a}finally{try{!f&&l.return&&l.return()}finally{if(g)throw h}}var m=!0,n=!1,o=void 0;try{for(var q,r=TwitchSubEvent.PLANS[Symbol.iterator]();!(m=(q=r.next()).done);m=!0){var s=q.value,t=TwitchSubEvent.PlanName(s);Content.addHelpLine(s,"Demonstrate a "+t+" subscription")}}catch(a){n=!0,o=a}finally{try{!m&&r.return&&r.return()}finally{if(n)throw o}}Content.addHelp("Default kind: "+TwitchSubEvent.SUB),Content.addHelp("Default plan: "+TwitchSubEvent.PLAN_TIER1)}else if("on"===e)d._on=!0,Content.addInfo("Fanfare is now enabled");else if("off"===e)d._on=!1,Content.addInfo("Fanfare is now disabled");else if("demo"===e)d._onChatEvent(d._client,{bits:1e3},!0),d._onSubEvent(d._client,{kind:TwitchSubEvent.SUB,plan:TwitchSubEvent.PLAN_TIER1},!0);else if("cheerdemo"===e){var J=1e3;2===b.length&&Util.IsNumber(b[1])&&(J=Util.ParseNumber(b[1])),d._onChatEvent(d._client,{bits:J},!0)}else if("subdemo"===e){var u=TwitchSubEvent.SUB,v=TwitchSubEvent.PLAN_TIER1;if(1<b.length){var w=!0,x=!1,y=void 0;try{for(var z,A,B=TwitchSubEvent.KINDS[Symbol.iterator]();!(w=(z=B.next()).done);w=!0)A=z.value,b.includes(A)&&(u=A)}catch(a){x=!0,y=a}finally{try{!w&&B.return&&B.return()}finally{if(x)throw y}}var C=!0,D=!1,E=void 0;try{for(var F,G,H=TwitchSubEvent.PLANS[Symbol.iterator]();!(C=(F=H.next()).done);C=!0)G=F.value,b.includes(G)&&(v=G)}catch(a){D=!0,E=a}finally{try{!C&&H.return&&H.return()}finally{if(D)throw E}}}d._onSubEvent(d._client,{kind:u,plan:v},!0)}else Content.addError("Fanfare: unknown argument "+e.escape()),this.printUsage()}/* Received a message from the client */},{key:"_onChatEvent",value:function d(a,b){var c=!!(2<arguments.length&&void 0!==arguments[2])&&arguments[2];(this._on||c)&&0<b.bits&&this.addEffect(new FanfareCheerEffect(this,this._config,b))}/* Received a subscription event from the client */},{key:"_onSubEvent",value:function d(a,b){var c=!!(2<arguments.length&&void 0!==arguments[2])&&arguments[2];(this._on||c)&&this.addEffect(new FanfareSubEffect(this,this._config,b))}},{key:"enable",get:function a(){return this._on},set:function b(a){this._on=a}},{key:"tps",get:function a(){return this._tick},set:function b(a){this._tick=a}},{key:"tickTime",set:function b(a){this._tick=1e3*a}/* Canvas attributes */},{key:"canvas",get:function a(){return this._canvas}},{key:"context",get:function a(){return this._context}},{key:"width",get:function a(){return this._canvas.width}},{key:"height",get:function a(){return this._canvas.height}}]),a}();/* globals FanfareCheerEffect FanfareSubEffect *//* vim: set ts=2 sts=2 sw=2 et: */