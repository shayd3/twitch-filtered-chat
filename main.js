/* Twitch Filtered Chat Driver Script */

"use strict";

var ASSETS = [];

function CreateURL(src, tree) {
  let l = window.location;
  let ls = `${l}`;
  if (tree === "twitch-api") {
    let base = ls.substr(0, ls.indexOf('/twitch-filtered-chat'));
    src = `${base}/twitch-api/${src}`;
  }
  if (src.startsWith('/')) {
    if (l.protocol === "https:") {
      src = "https:" + s;
    } else {
      src = "http:" + s;
    }
  }
  return src;
}

function AddAsset(src, tree=null) {
  ASSETS.push({});
  let s = document.createElement("script");
  let asset = ASSETS[ASSETS.length - 1];
  asset.src = CreateURL(src, tree);
  asset.tree = tree;
  asset.script = s;
  asset.loaded = false;
  asset.error = false;
  s.setAttribute("type", "text/javascript");
  s.setAttribute("src", asset.src);
  s.onload = function() {
    console.log(`${asset.src} loaded`);
    asset.loaded = true;
  }
  s.onerror = function(e) {
    console.error("Failed loading", asset, e);
    asset.error = true;
  }
  document.head.appendChild(s);
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
  }
}

