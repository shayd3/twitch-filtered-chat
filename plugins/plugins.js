/* Twitch Filtered Chat: Plugin support */

/** Plugin registration and usage
 *
 * To add your own plugins, place them in this directory and call
 * P.Add with the plugin's definition (see below).
 *
 * P.Add expects an object with (at least) the following
 * attributes:
 *    ctor: function that, when called, constructs the plugin
 *    args: if present, will be added to the constructor
 *    file: the path to the plugin relative to this directory
 *    order: the order in which the plugins are constructed
 *
 * Plugins with lower order are constructed before plugins with higher
 * order.
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
 * window.MyPlugin = MyPlugin;
 *  This is needed to find the plugin's constructor.
 *  TODO: Figure out a better way. There *has* to be a better way.
 *
 * For security reasons, if the plugin stores a reference to the
 * client, then the constructed plugin should not store references to
 * itself in any globally-accessible object.
 *
 * Plugins are not given the configuration object. Sorry.
 */

class PluginStorageClass {
  constructor() {
    this._plugins = {};
  }

  get plugins() { return JSON.parse(JSON.stringify(this._plugins)); }

  _path(plugin_def) {
    let base = window.location.pathname;
    if (base.endsWith('/index.html')) {
      base = base.substr(0, base.lastIndexOf('/'));
    }
    return `${base}/plugins/${plugin_def.file}`;
  }

  _ctor(plugin_def) {
    if (plugin_def.ctor.match(/^[A-Za-z0-9_]+$/)) {
      return window[plugin_def.ctor];
    } else {
      throw new Error("Plugin has an illegal ctor");
    }
  }

  _cmp(n1, n2) {
    let p1 = this._plugins[n1];
    let p2 = this._plugins[n2];
    if (p1.order == p2.order) {
      return p1.ctor > p2.ctor;
    } else {
      return p1.order > p2.order;
    }
  }

  _load(plugin, client) {
    let self = this;
    let ctor = plugin.ctor;
    return new Promise(function(resolve, reject) {
      let s = document.createElement('script');
      s.src = self._path(plugin);
      s.onload = function() {
        /* Construct the plugin */
        try {
          if (window[ctor] === undefined) {
            throw new Error("Constructor for " + ctor + " not found");
          }
          let obj = new window[ctor](resolve, reject, client, plugin.args);
          self._plugins[ctor]._loaded = true;
          if (client.GetDebug()) {
            self._plugins[ctor].obj = obj;
          }
          obj._plugin_name = ctor;
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
          let err = new Error("Loading " + ctor + " failed: " + JSON.stringify(e));
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

  Add(plugin_def) {
    this._plugins[plugin_def.ctor] = plugin_def;
    plugin_def._loaded = false;
  }

  LoadAll(client) {
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
}

let Plugins = new PluginStorageClass();
/* Un-comment this to enable the sample plugin */
Plugins.Add({"ctor": "SamplePlugin",
             "args": [],
             "file": "plugin-sample.js",
             "order": 1000});
Plugins.Add({"ctor": "SamplePlugin2",
             "args": [],
             "file": "plugin-sample-2.js",
             "order": 1000});
/* */

/* The following plugin is not distributed */
Plugins.Add({"ctor": "DwangoACPlugin",
             "silent": true,
             "args": [],
             "file": "dwangoAC.js",
             "order": 999});
