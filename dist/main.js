/* Twitch Filtered Chat Driver Script */

"use strict";

/* Module names (also used as directory names) */

var MOD_TFC = 'twitch-filtered-chat';
var MOD_TWAPI = 'twitch-api';

/* Obtain information based on window.location and navigator.userAgent */
var URI = '' + window.location;
var IS_LOCAL = window.location.protocol === "file:";
var IS_HTTP = window.location.protocol === "http:";
var IS_HTTPS = window.location.protocol === "https:";
var IS_TESLA = Boolean(navigator.userAgent.match(/\bTesla\b/));
var IS_GITIO = window.location.hostname.indexOf('github.io') > -1;
var USE_DIST = Boolean(window.location.search.match(/\busedist\b/)) || IS_TESLA;
var BASE_URI = URI.substr(0, URI.indexOf(MOD_TFC)).replace(/\/$/, '');
var SELF_URI = URI.replace(/\/index.html(\?.*)?$/, '');

/* Asset storage object */
var ASSETS = {};

/* Log things to the console, usable even if the console is disabled */
function _console(func) {
  if (console && console[func]) {
    var _console2;

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    return (_console2 = console)[func].apply(_console2, args);
  }
}

function _console_error() {
  for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  return _console.apply(undefined, ["error"].concat(args));
}
function _console_warn() {
  for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }

  return _console.apply(undefined, ["warn"].concat(args));
}
function _console_log() {
  for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    args[_key4] = arguments[_key4];
  }

  return _console.apply(undefined, ["log"].concat(args));
}
function _console_info() {
  for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
    args[_key5] = arguments[_key5];
  }

  return _console.apply(undefined, ["info"].concat(args));
}
function _console_debug() {
  for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
    args[_key6] = arguments[_key6];
  }

  return _console.apply(undefined, ["debug"].concat(args));
}

/* Parse layout= query string value */
function ParseLayout(str) {
  /* exported ParseLayout */
  var layout = { Cols: null, Chat: true, Slim: false };
  if (str.indexOf(':') > -1) {
    var v1 = str.substr(0, str.indexOf(':'));
    var v2 = str.substr(str.indexOf(':') + 1);
    if (v1 === "single") {
      layout.Cols = "single";
    } else if (v1 === "double") {
      layout.Cols = "double";
    } else {
      _console_warn("Unknown layout", v1, "defaulting to double");
      layout.Cols = "double";
    }
    if (v2 === "nochat") {
      layout.Chat = false;
    } else if (v2 === "slim") {
      layout.Slim = true;
      layout.Chat = false;
    } else if (v2 !== "chat") {
      _console_warn('Unknown layout option', v2);
    }
  } else if (str === "single") {
    layout.Cols = "single";
  } else if (str === "double") {
    layout.Cols = "double";
  } else if (str === "tesla") {
    layout.Cols = "single";
    layout.Chat = false;
    layout.Slim = true;
    layout.Tesla = true;
  } else {
    _console_error("Failed to parse layout", str);
  }
  return layout;
}

/* Generate layout= query string value */
function FormatLayout(layout) {
  /* exported FormatLayout */
  var k = "";
  var v = "";
  if (layout.Tesla) {
    return "tesla";
  } else if (layout.Cols === "single") {
    k = "single";
  } else if (layout.Cols === "double") {
    k = "double";
  }
  if (layout.Slim) {
    v = "slim";
  } else if (layout.Chat) {
    v = "chat";
  } else {
    v = "nochat";
  }
  return k + ':' + v;
}

/* Obtain the final path to an asset */
function GetAssetURL(file, tree) {
  var path = file;
  var root = '';
  if (tree === MOD_TFC) {
    if (USE_DIST) {
      root = SELF_URI + '/dist';
    } else if (IS_GITIO) {
      root = SELF_URI;
    } else {
      root = SELF_URI;
    }
  } else if (tree === MOD_TWAPI) {
    if (USE_DIST) {
      root = BASE_URI + '/' + MOD_TWAPI + '/dist';
    } else if (IS_GITIO) {
      root = BASE_URI + '/' + MOD_TWAPI;
    } else {
      root = BASE_URI + '/' + MOD_TWAPI;
    }
  } else if (file.startsWith('//')) {
    if (IS_HTTPS) {
      path = 'https:' + file;
    } else if (IS_HTTP) {
      path = 'http:' + file;
    } else if (IS_LOCAL) {
      path = 'http:' + file;
    } else {
      _console_info('Unknown protocol', window.location.protocol);
      path = 'http:' + file;
    }
  }
  var result = root ? root + '/' + path : path;
  _console_debug("GetAssetURL(", file, tree, ") ->", result);
  return result;
}

/* Add an asset to be loaded; returns a Promise */
function AddAsset(src) {
  var tree = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var loadcb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var errcb = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

  var path = GetAssetURL(src, tree);
  if (ASSETS[path]) {
    throw new Error('Asset ' + path + ' already added: ' + JSON.stringify(ASSETS[path]));
  }
  ASSETS[path] = {};
  var asset = ASSETS[path];
  return new Promise(function (resolve, reject) {
    _console_info("About to load asset", path);
    asset.file = src;
    asset.src = path;
    asset.tree = tree;
    asset.loaded = false;
    asset.error = false;
    asset.script = document.createElement("script");
    asset.script.setAttribute("type", "text/javascript");
    asset.script.setAttribute("src", asset.src);
    asset.script.onload = function () {
      _console_log(asset.src + ' loaded');
      asset.loaded = true;
      if (loadcb) {
        loadcb(asset);
      }
      resolve(asset);
    };
    asset.script.onerror = function (e) {
      _console_error("Failed loading", asset, e);
      asset.error = true;
      if (errcb) {
        errcb(asset, e);
      }
      reject(e);
    };
    document.head.appendChild(asset.script);
  });
}

/* Load TWAPI */
function loadTWAPI() {
  return Promise.all([AddAsset("utility.js", MOD_TWAPI, null, null), AddAsset("twitch-utility.js", MOD_TWAPI, null, null), AddAsset("colors.js", MOD_TWAPI, null, null), AddAsset("client.js", MOD_TWAPI, null, null)]);
}

/* Load TFC */
function loadTFC() {
  /* Load config.js before everything else */
  return AddAsset("config.js", MOD_TFC, null, null).then(function () {
    return Promise.all([AddAsset("htmlgen.js", MOD_TFC, null, null), AddAsset("commands.js", MOD_TFC, null, null), AddAsset("filtered-chat.js", MOD_TFC, null, null), !USE_DIST ? AddAsset("plugins/plugins.js", MOD_TFC, null, null) : null]);
  });
}

/* Called by body.onload */
function Main(global) {
  /* exported Main */
  /* Populate templates and load the client */
  function index_main() {
    Util.LogOnly("Assets loaded; initializing page...");

    /* Remove the top-level "Loading" message */
    $("#wrapper #wrapper-loading").remove();

    /* Obtain a layout to use */
    var layout_raw = Util.ParseQueryString().layout || "double:chat";
    var layout = ParseLayout(layout_raw);

    /* Create the chat input elements */
    var $ChatBox = $('<textarea id="txtChat"></textarea>');
    $ChatBox.attr("placeholder", "Send a message").attr("hist-index", "-1");
    var $Chat = $('<div id="chat"></div>').append($ChatBox);

    var $Column1 = $("#column1");
    var $Column2 = $("#column2");
    var $Columns = $(".column");
    var $Module1 = $("#module1");
    var $Module2 = $("#module2");
    var $Modules = $(".module");
    $Modules.find('.clear-chat-icon').attr("width", "1.1em").attr("height", "1.1em");
    $Modules.find('.header .settings input[type="checkbox"]').attr('checked', 'checked');
    $Modules.find('.header label.name').val('Chat');
    $Modules.find('.header input.name').attr("value", 'Chat');

    if (layout.Cols === "single") {
      $Column1.removeClass("left").addClass("full");
      $Module1.removeClass("left").addClass('full');
      $Column1.show();
      $Column2.remove();
    } else {
      $Columns.show();
    }

    /* Add the chat box */
    if (layout.Chat) {
      var $ChatModule = null;
      $ChatModule = layout.Cols === "single" ? $Module1 : $Module2;
      $ChatModule.removeClass("no-chat");
      $ChatModule.addClass("has-chat");
      $ChatModule.append($Chat);
    }

    /* Shrink the content for the Tesla */
    if (layout.Tesla) {
      $(".module .content").css("height", "calc(100% - 2em)");
    }

    /* If slim layout, remove the entire header */
    if (layout.Slim) {
      $(".header").hide();
      $(".module").addClass("slim");
      $(".content").addClass("slim");
      $("#settings_button").hide();
    }

    /* Initialize the chat commands object */
    InitChatCommands();

    Util.LogOnly("Waiting for document to finish rendering...");

    /* Once rerendering is complete, start up the client */
    requestAnimationFrame(function () {
      /* Focus on the chat texarea */
      var c = document.getElementById("txtChat");
      if (c && c.focus) c.focus();
      /* Call client_main to construct the filtered chat */
      Util.LogOnly("Document rendered; setting up TFC...");
      try {
        client_main(layout);
      } catch (e) {
        if (e.name === "ReferenceError") {
          if ((e.message || "").match(/\bclient_main\b.*(?:not |un)defined\b/)) {
            alert("FATAL: filtered-chat.js failed to load; client_main is undefined");
            throw e;
          }
        }
        _console_error(e);
        var msg = "client_main error: " + e.toString();
        if (e.stack) msg += ";\nstack: " + e.stack.toString();
        alert(msg);
        throw e;
      }
    });
  }

  /* Add TWAPI assets, then TFC assets, and then call index_main */
  loadTWAPI().then(loadTFC).then(index_main).catch(function (e) {
    var msg = "TWAPI/TFC Failure: ";
    var t = e.target || e.srcElement || e.originalTarget;
    if (t.attributes && t.attributes.src && t.attributes.src.value) {
      msg += "while loading " + t.attributes.src.value;
    } else if (t.outerHTML) {
      msg += "while loading " + t.outerHTML;
    } else {
      msg += "while loading " + t;
    }
    _console_error(msg, e);
    if (e.stack) {
      msg += ": stack: " + e.stack;
    }
    alert(msg);
  });
}

/* vim: set ts=2 sts=2 sw=2 et: */