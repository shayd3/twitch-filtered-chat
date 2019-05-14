'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* Twitch Filtered Chat: Plugin support */

/** Plugin registration and usage
 *
 * To add your own plugins, place them in this directory and call
 * P.add with the plugin's definition (see below).
 *
 * P.add expects an object with (at least) the following
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

var PluginStorageClass = function () {
  function PluginStorageClass() {
    _classCallCheck(this, PluginStorageClass);

    this._plugins = {};
  }

  _createClass(PluginStorageClass, [{
    key: '_path',


    /* Resolve the path to a plugin */
    value: function _path(plugin_def) {
      /* TODO: allow remote plugins */
      var base = window.location.pathname;
      if (base.endsWith('/index.html')) {
        base = base.substr(0, base.lastIndexOf('/'));
      }
      return base + '/plugins/' + plugin_def.file;
    }

    /* Sanitize a plugin's constructor to accepted characters */

  }, {
    key: '_ctor',
    value: function _ctor(plugin_def) {
      if (plugin_def.ctor.match(/^[A-Za-z0-9_]+$/)) {
        return window[plugin_def.ctor];
      } else {
        throw new Error("Plugin has an illegal ctor");
      }
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
  }, {
    key: '_load',
    value: function _load(plugin, client) {
      var self = this;
      var ctor = plugin.ctor;
      return new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = self._path(plugin);
        s.onload = function () {
          /* Construct the plugin */
          try {
            if (window[ctor] === undefined) {
              throw new Error("Constructor for " + ctor + " not found");
            }
            var obj = new window[ctor](resolve, reject, client, plugin.args);
            self._plugins[ctor]._loaded = true;
            if (client.GetDebug()) {
              self._plugins[ctor].obj = obj;
            }
            obj._plugin_name = ctor;
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
            var err = new Error("Loading " + ctor + " failed: " + JSON.stringify(e));
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
  }, {
    key: 'add',
    value: function add(plugin_def) {
      this._plugins[plugin_def.ctor] = plugin_def;
      plugin_def._loaded = false;
    }
  }, {
    key: 'LoadAll',
    value: function LoadAll(client) {
      return new Promise(function (resolve, reject) {
        var _this = this;

        var order = Object.keys(this._plugins).sort(function (a, b) {
          return _this._cmp(a, b);
        });
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = order[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var n = _step.value;

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
      }.bind(this));
    }
  }, {
    key: 'plugins',
    get: function get() {
      return Util.JSONClone(this._plugins);
    }
  }]);

  return PluginStorageClass;
}();

var Plugins = new PluginStorageClass();
/* Two example plugins; see plugins/<file> for their contents */
Plugins.add({ "ctor": "SamplePlugin",
  "args": [],
  "file": "plugin-sample.js",
  "order": 1000 });
Plugins.add({ "ctor": "SamplePlugin2",
  "args": [],
  "file": "plugin-sample-2.js",
  "order": 1000 });

/* The following plugin is not distributed */
if (window.location.protocol === "file:") {
  Plugins.add({ "ctor": "DwangoACPlugin",
    "silent": true,
    "args": [],
    "file": "dwangoAC.js",
    "order": 999 });
}