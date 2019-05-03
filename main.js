/* Twitch Filtered Chat Driver Script */

"use strict";

/* NOTE: This script may execute before the page finishes loading. Don't rely
 * on jQuery or any of the other script dependencies being available.
 */

const MOD_SELF = 'twitch-filtered-chat';
const MOD_TWAPI = 'twitch-api';
const IS_GIT = `${window.location}`.indexOf('github.io') > -1;
const IS_LOCAL = window.location.protocol === "file:";
var ASSETS = [];

function GetAssetURL(file, tree) {
  if (tree === MOD_TWAPI) {
    if (IS_GIT) {
      return `${MOD_TWAPI}/${file}`;
    } else {
      return `../${MOD_TWAPI}/${file}`;
    }
  } else if (file.startsWith('//')) {
    if (window.location.protocol === "https:") {
      return `https:${file}`;
    } else if (window.location.protocol === "http:") {
      return `http:${file}`;
    } else if (window.location.protocol === "file:") {
      return `http:${file}`;
    }
  }
  return file;
}

function AddAsset(src, tree=null, errcb=null) {
  ASSETS.push({});
  let asset = ASSETS[ASSETS.length - 1];
  asset.src = GetAssetURL(src, tree);
  asset.tree = tree;
  asset.loaded = false;
  asset.error = false;
  asset.script = document.createElement("script");
  asset.script.setAttribute("type", "text/javascript");
  asset.script.setAttribute("src", asset.src);
  asset.script.onload = function() {
    console.log(`${asset.src} loaded`);
    asset.loaded = true;
  }
  asset.script.onerror = function(e) {
    if (errcb) { errorcb(asset, e); }
    console.error("Failed loading", asset, e);
    asset.error = true;
  }
  document.head.appendChild(asset.script);
}

function AssetsLoaded() {
  for (let a of ASSETS) {
    if (a.loaded !== true) {
      return false;
    }
  }
  return true;
}

/* Parse layout= query string value */
function ParseLayout(str) {
  let layout = {Cols: null, Chat: true, Slim: false};
  if (str.indexOf(':') > -1) {
    let v1 = str.substr(0, str.indexOf(':'));
    let v2 = str.substr(str.indexOf(':')+1);
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
  let k = "";
  let v = "";
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
  return `${k}:${v}`;
}

function onReady(func) {
  try {
    if (AssetsLoaded()) {
      func();
    } else {
      window.setTimeout(onReady.bind(window, func), 50);
    }
  }
  catch (e) {
    alert("Fail: " + e.toString());
    throw e;
  }
}

