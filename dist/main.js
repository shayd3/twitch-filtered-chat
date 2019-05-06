/* Twitch Filtered Chat Driver Script */

"use strict";

/* NOTE: This script may execute before the page finishes loading. Don't rely
 * on jQuery or any of the other script dependencies being available.
 */

var MOD_SELF = 'twitch-filtered-chat';
var MOD_TWAPI = 'twitch-api';
var IS_GIT = ('' + window.location).indexOf('github.io') > -1;
var IS_LOCAL = window.location.protocol === "file:";
var ASSETS = [];

var IS_TESLA = !!navigator.userAgent.match(/\bTesla\b/);

function GetAssetURL(file, tree) {
  if (tree === MOD_TWAPI) {
    if (IS_TESLA || window.location.search.indexOf('usedist=1') > -1) {
      return MOD_TWAPI + '/dist/' + file;
    } else if (IS_GIT) {
      return MOD_TWAPI + '/' + file;
    } else {
      return '../' + MOD_TWAPI + '/' + file;
    }
  } else if (file.startsWith('//')) {
    if (window.location.protocol === "https:") {
      return 'https:' + file;
    } else if (window.location.protocol === "http:") {
      return 'http:' + file;
    } else if (window.location.protocol === "file:") {
      return 'http:' + file;
    }
  }
  return file;
}

function AddAsset(src) {
  var tree = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var errcb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

  ASSETS.push({});
  var asset = ASSETS[ASSETS.length - 1];
  asset.src = GetAssetURL(src, tree);
  asset.tree = tree;
  asset.loaded = false;
  asset.error = false;
  asset.script = document.createElement("script");
  asset.script.setAttribute("type", "text/javascript");
  asset.script.setAttribute("src", asset.src);
  asset.script.onload = function () {
    console.log(asset.src + ' loaded');
    asset.loaded = true;
  };
  asset.script.onerror = function (e) {
    if (errcb) {
      errorcb(asset, e);
    }
    console.error("Failed loading", asset, e);
    asset.error = true;
  };
  document.head.appendChild(asset.script);
}

function AssetsLoaded() {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = ASSETS[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var a = _step.value;

      if (a.loaded !== true) {
        return false;
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

  return true;
}

/* Parse layout= query string value */
function ParseLayout(str) {
  var layout = { Cols: null, Chat: true, Slim: false };
  if (str.indexOf(':') > -1) {
    var v1 = str.substr(0, str.indexOf(':'));
    var v2 = str.substr(str.indexOf(':') + 1);
    if (v1 == "single") {
      layout.Cols = "single";
    } else if (v1 == "double") {
      layout.Cols = "double";
    } else {
      console.warn("Unknown layout", v1, "defaulting to double");
      layout.Cols = "double";
    }
    if (v2 == "nochat") {
      layout.Chat = false;
    } else if (v2 == "slim") {
      layout.Slim = true;
      layout.Chat = false;
    } else if (v2 != "chat") {
      console.warn('Unknown layout option', v2);
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
    console.error("Failed to parse layout", str);
  }
  return layout;
}

/* Generate layout= query string value */
function FormatLayout(layout) {
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

function onReady(func) {
  try {
    if (AssetsLoaded()) {
      func();
    } else {
      window.setTimeout(onReady.bind(window, func), 50);
    }
  } catch (e) {
    alert("Fail: " + e.toString());
    throw e;
  }
}