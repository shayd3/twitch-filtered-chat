'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var PluginStorageClass = function () {
  function PluginStorageClass() {
    _classCallCheck(this, PluginStorageClass);

    if (PluginStorageClass.disabled) {
      throw new Error("Disabled");
    }
    this._plugins = {};

    for (var _len = arguments.length, plugin_defs = Array(_len), _key = 0; _key < _len; _key++) {
      plugin_defs[_key] = arguments[_key];
    }

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = plugin_defs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var plugin = _step.value;

        this.add(plugin);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  /* Return a copy of the added plugin objects */


  _createClass(PluginStorageClass, [{
    key: '_path',


    /* Resolve the path to a plugin */
    value: function _path(plugin_def) {
      /* TODO: allow remote plugins */
      if (this.disabled || PluginStorageClass.disabled) {
        return;
      }
      var base = window.location.pathname;
      if (base.endsWith('/index.html')) {
        base = base.substr(0, base.lastIndexOf('/'));
      }
      return base + '/plugins/' + plugin_def.file;
    }

    /* Return which plugin (by name) loads first */

  }, {
    key: '_cmp',
    value: function _cmp(n1, n2) {
      var p1 = this._plugins[n1];
      var p2 = this._plugins[n2];
      if (p1.order === p2.order) {
        return p1.ctor > p2.ctor;
      } else {
        return p1.order > p2.order;
      }
    }

    /* Load the given plugin object with the TwitchClient instance given */

  }, {
    key: '_load',
    value: function _load(plugin, client) {
      if (this.disabled || PluginStorageClass.disabled) {
        return;
      }
      var self = this;
      var ctor = plugin.ctor;
      return new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = self._path(plugin);
        s.onload = function () {
          /* Construct the plugin */
          if (!Util.Defined(ctor)) {
            throw new Error('Constructor "' + ctor + '" not found');
          }
          try {
            /* Last level of security against code injection */
            var cname = ctor.replace(/[^A-Za-z0-9_]/g, "");
            var cfunc = new Function('return ' + cname)();
            var obj = new cfunc(resolve, reject, client, plugin.args);
            obj._plugin_name = ctor;
            self._plugins[ctor]._loaded = true;
            self._plugins[ctor].obj = obj;
          } catch (e) {
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
        s.onerror = function (e) {
          if (!self._plugins[ctor].silent) {
            var err = new Error('Loading ' + ctor + ' failed: ' + JSON.stringify(e));
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

  }, {
    key: 'add',
    value: function add(plugin_def) {
      if (this.disabled || PluginStorageClass.disabled) {
        return;
      }
      /* Validate plugin before adding */
      if (!plugin_def.ctor.match(/^[A-Za-z0-9_]+$/)) {
        throw new Error("Invalid plugin name: " + plugin_def.ctor);
      }
      if (typeof plugin_def.order !== "number") {
        plugin_def.order = 1000;
      }
      if (!Util.IsArray(plugin_def.args)) {
        plugin_def.args = [];
      }
      this._plugins[plugin_def.ctor] = plugin_def;
      plugin_def._loaded = false;
    }

    /* Load all added plugin objects */

  }, {
    key: 'loadAll',
    value: function loadAll(client) {
      if (this.disabled || PluginStorageClass.disabled) {
        return;
      }
      return new Promise(function (resolve, reject) {
        var _this = this;

        var order = Object.keys(this._plugins).sort(function (a, b) {
          return _this._cmp(a, b);
        });
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = order[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var n = _step2.value;

            var p = this._plugins[n];
            Util.LogOnly("Loading plugin " + JSON.stringify(p));
            try {
              this._load(p, client).then(function () {
                resolve();
              }).catch(function (e) {
                reject(e);
              });
            } catch (e) {
              Content.addError(e);
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }.bind(this));
    }

    /* Disable plugin support entirely */

  }, {
    key: 'disable',
    value: function disable() {
      PluginStorageClass.disabled = true;
      this.disabled = true;
      if (window.Plugins) window.Plugins = null;
      if (window.PluginStorageClass) window.PluginStorageClass = null;
    }
  }, {
    key: 'plugins',
    get: function get() {
      if (this.disabled || PluginStorageClass.disabled) {
        return null;
      }
      return Util.JSONClone(this._plugins);
    }
  }]);

  return PluginStorageClass;
}();

/* Two example plugins; see plugins/<file> for their contents */


var Plugins = new PluginStorageClass({ ctor: "SamplePlugin", args: ["Example", "arguments"], file: "plugin-sample.js" }, { ctor: "SamplePlugin2", file: "plugin-sample-2.js" });

/* The following plugin is custom and not distributed */
if (window.location.protocol === "file:") {
  Plugins.add({ "ctor": "DwangoACPlugin",
    "silent": true,
    "file": "dwangoAC.js",
    "order": 999 });
}

/* vim: set ts=2 sts=2 sw=2 et: */