'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var PluginStorageClass = function () {
  function PluginStorageClass() {
    _classCallCheck(this, PluginStorageClass);

    this._plugins = {};
    this._chat_commands = null;
    this._stored_chat_commands = {};
  }

  _createClass(PluginStorageClass, [{
    key: 'set_commands_obj',
    value: function set_commands_obj(obj) {
      this._chat_commands = obj;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.entries(this._stored_chat_commands)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _ref = _step.value;

          var _ref2 = _slicedToArray(_ref, 2);

          var cmd = _ref2[0];
          var cobj = _ref2[1];

          var cstr = cmd.replace(/^\/\//, "");
          this._chat_commands.add(cstr, cobj.func, cobj.desc);
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
  }, {
    key: '_path',
    value: function _path(plugin_def) {
      var base = window.location.pathname;
      if (base.endsWith('/index.html')) {
        base = base.substr(0, base.lastIndexOf('/'));
      }
      return base + '/plugins/' + plugin_def.file;
    }
  }, {
    key: '_ctor',
    value: function _ctor(plugin_def) {
      if (plugin_def.ctor.match(/^[A-Za-z0-9_]+$/)) {
        return window[plugin_def.ctor];
      } else {
        throw new Error("Plugin has an illegal ctor");
      }
    }
  }, {
    key: '_cmp',
    value: function _cmp(n1, n2) {
      var p1 = this._plugins[n1];
      var p2 = this._plugins[n2];
      if (p1.order == p2.order) {
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
    key: 'Add',
    value: function Add(plugin_def) {
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
  }, {
    key: 'AddChatCommand',
    value: function AddChatCommand(command, plugin, action) {
      var desc = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

      if (!command.startsWith('//')) {
        command = '//' + command;
      }
      if (this._chat_commands) {
        var cstr = command.replace(/^\/\//, "");
        var pname = plugin._plugin_name;
        if (!pname) {
          pname = plugin.constructor.name;
        }
        var descstr = 'Command added by ' + pname + ': ';
        if (desc) {
          descstr += desc;
        } else {
          descstr += "no description given";
        }
        this._chat_commands.add(cstr, action, descstr);
      } else if (!this._stored_chat_commands.hasOwnProperty(command)) {
        this._stored_chat_commands[command] = { plugin: plugin, func: action, desc: desc };
      } else {
        Util.Error('Plugin conflict: command ' + command.escape() + ' already exists');
      }
      if (this._plugins.hasOwnProperty(plugin.constructor.name)) {
        var p = this._plugins[plugin.constructor.name];
        if (!p.hasOwnProperty("commands")) {
          p.commands = [];
        }
        p.commands.push(command);
      }
    }
  }, {
    key: 'plugins',
    get: function get() {
      return JSON.parse(JSON.stringify(this._plugins));
    }
  }]);

  return PluginStorageClass;
}();

var Plugins = new PluginStorageClass();
/* Un-comment this to enable the sample plugin */
Plugins.Add({ "ctor": "SamplePlugin",
  "args": [],
  "file": "plugin-sample.js",
  "order": 1000 });
Plugins.Add({ "ctor": "SamplePlugin2",
  "args": [],
  "file": "plugin-sample-2.js",
  "order": 1000 });
/* */

/* The following plugin is not distributed */
Plugins.Add({ "ctor": "DwangoACPlugin",
  "silent": true,
  "args": [],
  "file": "dwangoAC.js",
  "order": 999 });