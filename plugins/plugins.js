/* Twitch Filtered Chat: Plugin support */

/* TODO: Make a README.md */

/** Plugin configuration
 *
 * To configure plugins, pass a plugincfg= value in the query string. Value
 * must be a URI-encoded object of the following form:
 *   {
 *     <plugin tag>: {
 *       <config key>: <config value>,
 *       ...
 *     }
 *   }
 *
 * Plugins may or may not use this configuration. See each plugin's
 * documentation for their expected tag and configuration keys.
 */

/** Plugin registration and usage
 *
 * To add your own plugins, place them in this directory and call
 * Plugins.add with the plugin's definition object:
 *   ctor: function that, when called, constructs the plugin
 *   file: the path to the plugin relative to this directory
 *   args: passed as a 4th argument to the plugin constructor
 *   order: the order in which the plugins are constructed
 *   silent: if present and non-falsy, silence loading errors
 *   remote: if present and non-falsy, treat file as an absolute path
 *
 * All registered plugins are loaded once the page loads. To load a
 * plugin after that, add it with Plugins.add and call Plugins.load.
 *
 * Plugins with lower order are constructed before plugins with higher
 * order. Default order is 1000.
 */

/*** Expected plugin API
 *
 ** constructor(resolve, reject[, client [, args[, config]]])
 *    resolve: call with `this` when the plugin has finished constructing
 *    reject:  call with an Error() if loading the plugin fails
 *    client:  reference to the TwitchClient object
 *    args:    value of the plugin definition "args" key
 *    config:  configuration object, excluding sensitive items
 ** name:      plugin's name, as a string or getter attribute
 *
 *** Available plugin API
 *
 ** shouldFilter(module, event)
 *  Return true to filter out the event, false to hide it, or some other
 *  value to continue testing subsequent filters.
 *    module:  a HTML DOM element referring to one of the modules
 *    event:   a TwitchEvent (or TwitchChatEvent, or TwitchSubEvent)
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

  /* Load the given plugin object with the TwitchClient instance given */
  _load(plugin, client, config) {
    if (this.disabled || PluginStorageClass.disabled) { return; }
    Util.LogOnly("Loading plugin " + JSON.stringify(plugin));
    let self = this;
    let ctor = plugin.ctor;
    return new Promise(function(resolve, reject) {
      let s = document.createElement("script");
      if (plugin.remote) {
        s.src = plugin.file;
      } else {
        let base = window.location.pathname;
        if (base.endsWith("/index.html")) {
          base = base.substr(0, base.lastIndexOf("/"));
        }
        s.src = `${base}/plugins/${plugin.file}`;
      }
      s.onload = function() {
        /* Construct the plugin */
        if (!Util.Defined(ctor)) {
          reject(new Error(`Constructor "${ctor}" not found`));
        }
        try {
          /* Last level of security against ACE: sanitize plugin names */
          let cname = ctor.replace(/[^A-Za-z0-9_]/g, "");
          /* Obtain plugin name and construct it */
          let cfunc = (new Function(`return ${cname}`))();
          /* Ensure the configuration object is present */
          let cfgobj = Util.JSONClone(config) || {};
          if (!cfgobj.PluginConfig) {
            cfgobj.PluginConfig = {};
          }
          let obj = new (cfunc)(resolve, reject, client, plugin.args, cfgobj);
          /* Ensure plugin defines a name attribute */
          if (typeof(obj.name) !== "string") {
            obj.name = ctor;
          }
          /* Store the plugin and mark it as loaded */
          obj._plugin_name = ctor;
          self._plugins[ctor]._loaded = true;
          self._plugins[ctor].obj = obj;
          Util.DebugOnly("Plugin", self._plugins[ctor], "loaded");
        }
        catch (e) {
          if (self._plugins[ctor].silent) {
            Util.ErrorOnly(e);
            resolve();
          } else {
            self._plugins[ctor]._error = true;
            self._plugins[ctor]._error_obj = e;
            reject(e);
          }
        }
      };
      s.onerror = function(e) {
        /* Silent plugins fail silently */
        if (!self._plugins[ctor].silent) {
          let err = new Error(`Loading ${ctor} failed: ${JSON.stringify(e)}`);
          self._plugins[ctor]._error = true;
          self._plugins[ctor]._error_obj = err;
          Util.ErrorOnly(err);
          reject(err);
        } else {
          resolve();
        }
      };
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
    if (!Util.IsArray(plugin_def.args)) {
      plugin_def.args = [];
    }
    this._plugins[plugin_def.ctor] = plugin_def;
    plugin_def._loaded = false;
  }

  /* Load all added plugin objects */
  loadAll(client, config) {
    if (this.disabled || PluginStorageClass.disabled) { return; }
    return new Promise((function(resolve, reject) {
      Promise.all(Object.values(this._plugins).map((p) => {
        this._load(p, client, config);
      }))
        .then(() => resolve())
        .catch((e) => reject(e));
    }).bind(this));
  }

  /* Load a plugin by name */
  load(ctor, client, config) {
    if (this.disabled || PluginStorageClass.disabled) { return; }
    return new Promise((function(resolve, reject) {
      let plugin_def = this._plugins[ctor];
      if (plugin_def) {
        try {
          this._load(plugin_def, client, config)
            .then(function() { resolve(); })
            .catch(function(e) { reject(e); });
        }
        catch (e) {
          Util.Error("Failed loading plugin", ctor, plugin_def, e);
          Content.addError(e);
          reject(e);
        }
      } else {
        reject(new Error(`Invalid plugin ${ctor}`));
      }
    }).bind(this));
  }

  /* Call a plugin function and return an array of results */
  invoke(func, ...args) {
    let results = [];
    for (let plugin of Object.values(this._plugins)) {
      if (typeof(plugin[func]) === "function") {
        results.push(plugin[func](...args));
      }
    }
    return results;
  }

  /* Disable plugin support entirely */
  disable() {
    Util.Log("Disabling plugin support");
    PluginStorageClass.disabled = true;
    this.disabled = true;
    if (window.Plugins) window.Plugins = null;
    if (window.PluginStorageClass) window.PluginStorageClass = null;
    window.PluginsAreDisabled = true;
  }
}

/* Two example plugins; see plugins/<file> for their contents */
const Plugins = new PluginStorageClass(
  {ctor: "SamplePlugin", args: ["Example", "arguments"], file: "plugin-sample.js"},
  {ctor: "SamplePlugin2", file: "plugin-sample-2.js"}
);

/* The following plugin is custom and not distributed */
if (window.location.protocol === "file:") {
  Plugins.add({"ctor": "DwangoACPlugin",
               "silent": true,
               "file": "dwangoAC.js",
               "order": 999});
}

/* vim: set ts=2 sts=2 sw=2 et: */
