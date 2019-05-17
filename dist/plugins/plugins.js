'use strict';var _createClass=function(){function a(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,'value'in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}();function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError('Cannot call a class as a function')}/* Twitch Filtered Chat: Plugin support *//** Plugin registration and usage
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
 */var PluginStorageClass=function(){function a(){if(_classCallCheck(this,a),a.disabled)throw new Error('Disabled');this._plugins={};for(var b=arguments.length,c=Array(b),d=0;d<b;d++)c[d]=arguments[d];var e=!0,f=!1,g=void 0;try{for(var h,i,j=c[Symbol.iterator]();!(e=(h=j.next()).done);e=!0)i=h.value,this.add(i)}catch(a){f=!0,g=a}finally{try{!e&&j.return&&j.return()}finally{if(f)throw g}}}/* Return a copy of the added plugin objects */return _createClass(a,[{key:'_path',/* Resolve the path to a plugin */value:function d(b){/* TODO: allow remote plugins */if(!(this.disabled||a.disabled)){var c=window.location.pathname;return c.endsWith('/index.html')&&(c=c.substr(0,c.lastIndexOf('/'))),c+'/plugins/'+b.file}}/* Return which plugin (by name) loads first */},{key:'_cmp',value:function e(a,b){var c=this._plugins[a],d=this._plugins[b];return c.order===d.order?c.ctor>d.ctor:c.order>d.order}/* Load the given plugin object with the TwitchClient instance given */},{key:'_load',value:function g(b,c){if(!(this.disabled||a.disabled)){var d=this,f=b.ctor;return new Promise(function(a,g){var h=document.createElement('script');h.src=d._path(b),h.onload=function(){/* Construct the plugin */if(!Util.Defined(f))throw new Error('Constructor "'+f+'" not found');try{/* Last level of security against code injection */var e=f.replace(/[^A-Za-z0-9_]/g,''),h=new Function('return '+e)(),i=new h(a,g,c,b.args);i._plugin_name=f,d._plugins[f]._loaded=!0,d._plugins[f].obj=i}catch(b){d._plugins[f].silent?(Util.ErrorOnly(b),a()):(d._plugins[f]._error=!0,d._plugins[f]._error_obj=b,g(b))}},h.onerror=function(b){if(!d._plugins[f].silent){var c=new Error('Loading '+f+' failed: '+JSON.stringify(b));d._plugins[f]._error=!0,d._plugins[f]._error_obj=c,Util.ErrorOnly(c),g(c)}else a()},document.head.appendChild(h)})}}/* Add a plugin object */},{key:'add',value:function c(b){if(!(this.disabled||a.disabled)){/* Validate plugin before adding */if(!b.ctor.match(/^[A-Za-z0-9_]+$/))throw new Error('Invalid plugin name: '+b.ctor);'number'!=typeof b.order&&(b.order=1e3),Util.IsArray(b.args)||(b.args=[]),this._plugins[b.ctor]=b,b._loaded=!1}}/* Load all added plugin objects */},{key:'loadAll',value:function c(b){return this.disabled||a.disabled?void 0:new Promise(function(a,c){var d=this,e=Object.keys(this._plugins).sort(function(c,a){return d._cmp(c,a)}),f=!0,g=!1,h=void 0;try{for(var i,j=e[Symbol.iterator]();!(f=(i=j.next()).done);f=!0){var k=i.value,l=this._plugins[k];Util.LogOnly('Loading plugin '+JSON.stringify(l));try{this._load(l,b).then(function(){a()}).catch(function(a){c(a)})}catch(a){Content.addError(a)}}}catch(a){g=!0,h=a}finally{try{!f&&j.return&&j.return()}finally{if(g)throw h}}}.bind(this))}/* Disable plugin support entirely */},{key:'disable',value:function b(){a.disabled=!0,this.disabled=!0,window.Plugins&&(window.Plugins=null),window.PluginStorageClass&&(window.PluginStorageClass=null)}},{key:'plugins',get:function b(){return this.disabled||a.disabled?null:Util.JSONClone(this._plugins)}}]),a}(),Plugins=new PluginStorageClass({ctor:'SamplePlugin',args:['Example','arguments'],file:'plugin-sample.js'},{ctor:'SamplePlugin2',file:'plugin-sample-2.js'},{ctor:'FanfarePlugin',file:'fanfare.js'});/* Two example plugins; see plugins/<file> for their contents *//* The following plugin is custom and not distributed */'file:'===window.location.protocol&&Plugins.add({ctor:'DwangoACPlugin',silent:!0,file:'dwangoAC.js',order:999});