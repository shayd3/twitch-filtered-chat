'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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

var CHAT_COMMANDS = {};

var PluginStorageClass = function () {
  function PluginStorageClass() {
    _classCallCheck(this, PluginStorageClass);

    this._plugins = {};
  }

  _createClass(PluginStorageClass, [{
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
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(client) {
        var _this = this;

        var order, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, n, p;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                order = Object.keys(this._plugins).sort(function (a, b) {
                  return _this._cmp(a, b);
                });
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context.prev = 4;
                _iterator = order[Symbol.iterator]();

              case 6:
                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                  _context.next = 21;
                  break;
                }

                n = _step.value;
                p = this._plugins[n];

                Util.LogOnly("Loading plugin " + JSON.stringify(p));
                _context.prev = 10;
                _context.next = 13;
                return this._load(p, client);

              case 13:
                _context.next = 18;
                break;

              case 15:
                _context.prev = 15;
                _context.t0 = _context['catch'](10);

                add_error(_context.t0);

              case 18:
                _iteratorNormalCompletion = true;
                _context.next = 6;
                break;

              case 21:
                _context.next = 27;
                break;

              case 23:
                _context.prev = 23;
                _context.t1 = _context['catch'](4);
                _didIteratorError = true;
                _iteratorError = _context.t1;

              case 27:
                _context.prev = 27;
                _context.prev = 28;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 30:
                _context.prev = 30;

                if (!_didIteratorError) {
                  _context.next = 33;
                  break;
                }

                throw _iteratorError;

              case 33:
                return _context.finish(30);

              case 34:
                return _context.finish(27);

              case 35:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[4, 23, 27, 35], [10, 15], [28,, 30, 34]]);
      }));

      function LoadAll(_x) {
        return _ref.apply(this, arguments);
      }

      return LoadAll;
    }()
  }, {
    key: 'AddChatCommand',
    value: function AddChatCommand(command, plugin, action) {
      var desc = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

      if (!command.startsWith('//')) {
        command = '//' + command;
      }
      if (!CHAT_COMMANDS.hasOwnProperty(command)) {
        CHAT_COMMANDS[command] = [action];
      } else {
        CHAT_COMMANDS[command].push(action);
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