"use strict";var _createClass=function(){function a(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}();function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}/* Twitch Filtered Chat: Plugin support *//** Plugin registration and usage
 *
 * To add your own plugins, place them in this directory and call
 * Plugins.add with the plugin's definition object:
 *   ctor: function that, when called, constructs the plugin
 *   file: the path to the plugin relative to this directory
 *   args: passed as a 4th argument to the plugin constructor
 *   order: the order in which the plugins are constructed
 *   silent: if present and non-falsy, don't report loading errors
 *
 * Plugins with lower order are constructed before plugins with higher
 * order. Default order is 1000.
 *
 *//** Expected plugin API
 *
 * constructor(resolve, reject[, client [, args]])
 *  resolve: call once the plugin has finished constructing
 *  reject:  call with an Error() on failure loading the plugin
 *  client:  reference to the TwitchClient object (optional)
 *  args:    value of the plugin definition "args" key
 *
 * name:     either a getter or a string attribute with the plugin's name.
 *
 * For security reasons, if the plugin stores a reference to the
 * client, then the constructed plugin should not store references to
 * itself in any globally-accessible object.
 *
 * Plugins are not given the configuration object. Sorry.
 */var PluginStorageClass=function(){function a(){if(_classCallCheck(this,a),a.disabled)throw new Error("Disabled");this._plugins={};for(var b=arguments.length,c=Array(b),d=0;d<b;d++)c[d]=arguments[d];var e=!0,f=!1,g=void 0;try{for(var h,i,j=c[Symbol.iterator]();!(e=(h=j.next()).done);e=!0)i=h.value,this.add(i)}catch(a){f=!0,g=a}finally{try{!e&&j.return&&j.return()}finally{if(f)throw g}}}/* Return a copy of the added plugin objects */return _createClass(a,[{key:"_path",/* Resolve the path to a plugin */value:function d(b){/* TODO: allow remote plugins */if(!(this.disabled||a.disabled)){var c=window.location.pathname;return c.endsWith("/index.html")&&(c=c.substr(0,c.lastIndexOf("/"))),c+"/plugins/"+b.file}}/* Return which plugin (by name) loads first */},{key:"_cmp",value:function e(a,b){var c=this._plugins[a],d=this._plugins[b];return c.order===d.order?c.ctor>d.ctor:c.order>d.order}/* Load the given plugin object with the TwitchClient instance given */},{key:"_load",value:function h(b,c,d){if(!(this.disabled||a.disabled)){var f=this,g=b.ctor;return new Promise(function(a,h){var i=document.createElement("script");i.src=f._path(b),i.onload=function(){/* Construct the plugin */if(!Util.Defined(g))throw new Error("Constructor \""+g+"\" not found");try{/* Last level of security against code injection */var e=g.replace(/[^A-Za-z0-9_]/g,""),i=new Function("return "+e)(),j=new i(a,h,c,b.args,d);j._plugin_name=g,f._plugins[g]._loaded=!0,f._plugins[g].obj=j}catch(b){f._plugins[g].silent?(Util.ErrorOnly(b),a()):(f._plugins[g]._error=!0,f._plugins[g]._error_obj=b,h(b))}},i.onerror=function(b){if(!f._plugins[g].silent){var c=new Error("Loading "+g+" failed: "+JSON.stringify(b));f._plugins[g]._error=!0,f._plugins[g]._error_obj=c,Util.ErrorOnly(c),h(c)}else a()},document.head.appendChild(i)})}}/* Add a plugin object */},{key:"add",value:function c(b){if(!(this.disabled||a.disabled)){/* Validate plugin before adding */if(!b.ctor.match(/^[A-Za-z0-9_]+$/))throw new Error("Invalid plugin name: "+b.ctor);"number"!=typeof b.order&&(b.order=1e3),Util.IsArray(b.args)||(b.args=[]),this._plugins[b.ctor]=b,b._loaded=!1}}/* Load all added plugin objects */},{key:"loadAll",value:function d(b,c){return this.disabled||a.disabled?void 0:new Promise(function(a,d){var e=this,f=Object.keys(this._plugins).sort(function(c,a){return e._cmp(c,a)}),g=!0,h=!1,i=void 0;try{for(var j,k=f[Symbol.iterator]();!(g=(j=k.next()).done);g=!0){var l=j.value,m=this._plugins[l];Util.LogOnly("Loading plugin "+JSON.stringify(m));try{this._load(m,b,c).then(function(){a()}).catch(function(a){d(a)})}catch(a){Util.Error("Failed loading plugin",l,m,a),Content.addError(a)}}}catch(a){h=!0,i=a}finally{try{!g&&k.return&&k.return()}finally{if(h)throw i}}}.bind(this))}/* Disable plugin support entirely */},{key:"disable",value:function b(){a.disabled=!0,this.disabled=!0,window.Plugins&&(window.Plugins=null),window.PluginStorageClass&&(window.PluginStorageClass=null)}},{key:"plugins",get:function b(){return this.disabled||a.disabled?null:Util.JSONClone(this._plugins)}}]),a}(),Plugins=new PluginStorageClass({ctor:"SamplePlugin",args:["Example","arguments"],file:"plugin-sample.js"},{ctor:"SamplePlugin2",file:"plugin-sample-2.js"},{ctor:"FanfarePlugin",file:"fanfare.js"});/* Two example plugins; see plugins/<file> for their contents *//* The following plugin is custom and not distributed */"file:"===window.location.protocol&&Plugins.add({ctor:"DwangoACPlugin",silent:!0,file:"dwangoAC.js",order:999});