/* Twitch Filtered Chat: Plugin support */

/** Plugin registration and usage
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
 */

/** Expected plugin API
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
 */

class PluginStorageClass {
  constructor(...plugin_defs) {
    if (PluginStorageClass.disabled) { throw new Error("Disabled"); }
    this._plugins = {};
    for (let plugin of plugin_defs) {
      this.add(plugin);
    }
  }

  /* Return a copy of the added plugin objects */
  get plugins() {
    if (this.disabled || PluginStorageClass.disabled) { return null; }
    return Util.JSONClone(this._plugins);
  }

  /* Resolve the path to a plugin */
  _path(plugin_def) { /* TODO: allow remote plugins */
    if (this.disabled || PluginStorageClass.disabled) { return; }
    let base = window.location.pathname;
    if (base.endsWith('/index.html')) {
      base = base.substr(0, base.lastIndexOf('/'));
    }
    return `${base}/plugins/${plugin_def.file}`;
  }

  /* Return which plugin (by name) loads first */
  _cmp(n1, n2) {
    let p1 = this._plugins[n1];
    let p2 = this._plugins[n2];
    if (p1.order === p2.order) {
      return p1.ctor > p2.ctor;
    } else {
      return p1.order > p2.order;
    }
  }

  /* Load the given plugin object with the TwitchClient instance given */
  _load(plugin, client) {
    if (this.disabled || PluginStorageClass.disabled) { return; }
    let self = this;
    let ctor = plugin.ctor;
    return new Promise(function(resolve, reject) {
      let s = document.createElement('script');
      s.src = self._path(plugin);
      s.onload = function() {
        /* Construct the plugin */
        if (!Util.Defined(ctor)) {
          throw new Error(`Constructor "${ctor}" not found`);
        }
        try {
          /* Last level of security against code injection */
          let cname = ctor.replace(/[^A-Za-z0-9_]/g, "");
          let cfunc = (new Function(`return ${cname}`))();
          let obj = new (cfunc)(resolve, reject, client, plugin.args);
          obj._plugin_name = ctor;
          self._plugins[ctor]._loaded = true;
          self._plugins[ctor].obj = obj;
        }
        catch (e) {
          if (!self._plugins[ctor].silent) {
            self._plugins[ctor]._error = true;
            self._plugins[ctor]._error_obj = e;
            reject(e);
          } else {
            Util.ErrorOnly(e);
            resolve();
          }
        }
      };
      s.onerror = function(e) {
        if (!self._plugins[ctor].silent) {
          let err = new Error(`Loading ${ctor} failed: ${JSON.stringify(e)}`);
          self._plugins[ctor]._error = true;
          self._plugins[ctor]._error_obj = err;
          Util.ErrorOnly(err);
          reject(err);
        } else {
          resolve();
        }
      }
      document.head.appendChild(s);
    });
  }

  /* Add a plugin object */
  add(plugin_def) {
    if (this.disabled || PluginStorageClass.disabled) { return; }
    /* Validate plugin before adding */
    if (!plugin_def.ctor.match(/^[A-Za-z0-9_]+$/)) {
      throw new Error("Invalid plugin name: " + plugin_def.ctor);
    }
    if (typeof(plugin_def.order) !== "number") {
      plugin_def.order = 1000;
    }
    if (!Util.IsArray(plugin_def.args)) {
      plugin_def.args = [];
    }
    this._plugins[plugin_def.ctor] = plugin_def;
    plugin_def._loaded = false;
  }

  /* Load all added plugin objects */
  loadAll(client) {
    if (this.disabled || PluginStorageClass.disabled) { return; }
    return new Promise((function(resolve, reject) {
      let order = Object.keys(this._plugins).sort((a, b) => this._cmp(a, b));
      for (let n of order) {
        let p = this._plugins[n];
        Util.LogOnly("Loading plugin " + JSON.stringify(p));
        try {
          this._load(p, client)
            .then(function() { resolve(); })
            .catch(function(e) { reject(e); });
        }
        catch (e) {
          Content.addError(e);
        }
      }
    }).bind(this));
  }

  /* Disable plugin support entirely */
  disable() {
    PluginStorageClass.disabled = true;
    this.disabled = true;
    if (window.Plugins) window.Plugins = null;
    if (window.PluginStorageClass) window.PluginStorageClass = null;
  }
}

/* Two example plugins; see plugins/<file> for their contents */
const Plugins = new PluginStorageClass(
  {ctor: "SamplePlugin", args: ["Example", "arguments"], file: "plugin-sample.js"},
  {ctor: "SamplePlugin2", file: "plugin-sample-2.js"},
  {ctor: "FanfarePlugin", file: "fanfare.js"}
);

/* The following plugin is custom and not distributed */
if (window.location.protocol === "file:") {
  Plugins.add({"ctor": "DwangoACPlugin",
               "silent": true,
               "file": "dwangoAC.js",
               "order": 999});
}

/* vim: set ts=2 sts=2 sw=2 et: */
