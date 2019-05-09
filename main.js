/* Twitch Filtered Chat Driver Script */

"use strict";

/* NOTE: This script may execute before the page finishes loading. Don't rely
 * on jQuery or any of the other script dependencies being available.
 */

const USE_DIST = !!window.location.search.match(/\busedist\b/);
const MOD_TFC = 'twitch-filtered-chat';
const MOD_TWAPI = 'twitch-api';
var ASSETS = [];

function GetAssetURL(file, tree) {
  const URI = `${window.location}`;
  const IS_TESLA = !!navigator.userAgent.match(/\bTesla\b/);
  const IS_GIT = URI.indexOf('github.io') > -1;
  const BASE_URI = URI.substr(0, URI.indexOf(MOD_TFC)).replace(/\/$/, '');
  const SELF_URI = URI.replace(/\/index.html(\?.*)?$/, '');
  let root = '';
  if (tree === MOD_TFC) {
    if (IS_TESLA || USE_DIST) {
      root = `${SELF_URI}/dist`;
    } else if (IS_GIT) {
      root = SELF_URI;
    } else {
      root = SELF_URI;
    }
  } else if (tree === MOD_TWAPI) {
    if (IS_TESLA || USE_DIST) {
      root = `${BASE_URI}/${MOD_TWAPI}/dist`;
    } else if (IS_GIT) {
      root = `${BASE_URI}/${MOD_TWAPI}`;
    } else {
      root = `${BASE_URI}/${MOD_TWAPI}`;
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
  return `${root}/${file}`;
}

function AddAsset(src, tree=null, loadcb=null, errcb=null) {
  ASSETS.push({});
  let asset = ASSETS[ASSETS.length - 1];
  asset.file = src;
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
    if (loadcb) { loadcb(asset); }
  }
  asset.script.onerror = function(e) {
    if (errcb) { errcb(asset, e); }
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
function ParseLayout(str) { /* exported ParseLayout */
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
function FormatLayout(layout) { /* exported FormatLayout */
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

function asset_error(asset, e) {
  let m = e.toString();
  m = m + "\n";
  m = JSON.stringify(asset);
  m + m + "\n";
  m = JSON.stringify(e);
  m = m + "\n";
  if (e.stack) m = m + e.stack;
  alert("asset error: " + m);
}

/* Add top-level assets */
AddAsset("config.js", MOD_TFC, null, asset_error);
AddAsset("htmlgen.js", MOD_TFC, null, asset_error);
AddAsset("commands.js", MOD_TFC, null, asset_error);
AddAsset("filtered-chat.js", MOD_TFC, null, asset_error);
if (!USE_DIST) {
  AddAsset("plugins/plugins.js", MOD_TFC, null, asset_error);
}

/* Called by body.onload */
function Main(global) { /* exported Main */
  /* Populate the debug div with text */
  function debug_msg(msg) {
    let d = document.getElementById("debug");
    if (d) {
      d.innerHTML = `${msg}<br />${d.innerHTML}`;
    }
  }
  global.debug_msg = debug_msg;

  /* Add TWAPI assets */
  AddAsset("utility.js", MOD_TWAPI, null, asset_error);
  AddAsset("twitch-utility.js", MOD_TWAPI, null, asset_error);
  AddAsset("colors.js", MOD_TWAPI, null, asset_error);
  AddAsset("client.js", MOD_TWAPI, null, asset_error);

  /* Populate templates and load the client */
  function index_main() {
    Util.LogOnly("Assets loaded; initializing page...");

    /* Parse layout */
    let layout_raw = Util.ParseQueryString().layout;
    if (layout_raw === undefined) layout_raw = "double:chat";
    let layout = ParseLayout(layout_raw);

    /* Remove the top-level "Loading" message */
    $("#wrapper #wrapper-loading").remove();
    /* Create the chat input elements */
    let $ChatBox = $(`<textarea id="txtChat"></textarea>`);
    $ChatBox.attr("placeholder", "Send a message");
    $ChatBox.attr("hist-index", "-1");
    let $Chat = $(`<div id="chat"></div>`).append($ChatBox);

    let $Column1 = $("#column1");
    let $Column2 = $("#column2");
    let $Columns = $(".column");
    let $Module1 = $("#module1");
    let $Module2 = $("#module2");
    let $Modules = $(".module");
    $Modules.find('.clear-chat-icon')
            .attr("width", "1.1em")
            .attr("height", "1.1em");
    $Modules.find('.header .settings input[type="checkbox"]')
            .attr('checked', 'checked');
    $Modules.find('.header label.name').val('Chat');
    $Modules.find('.header input.name').attr("value", 'Chat');

    if (layout.Cols == "single") {
      $Column1.removeClass("left");
      $Column1.addClass("full");
      $Module1.removeClass("left");
      $Module1.addClass('full');
      $Column1.show();
      $Column2.remove();
    } else {
      $Columns.show();
    }

    let $ChatModule = null;
    if (layout.Chat) {
      $ChatModule = layout.Cols == "single" ? $Module1 : $Module2;
    }
    if ($ChatModule !== null) {
      $ChatModule.removeClass("no-chat");
      $ChatModule.addClass("has-chat");
      $ChatModule.find(".content").append($Chat);
    }

    /* Shrink the content for the Tesla */
    if (layout.Tesla) {
      //$(".module").css("height", "calc(100% - 2em)");
      $(".module .content").css("height", "calc(100% - 2em)");
    }

    /* If slim layout, remove the entire header */
    if (layout.Slim) {
      $(".header").hide();
      $(".content").addClass("slim");
      $("#settings_button").hide();
    }

    Util.LogOnly("Waiting for document to finish rendering...");

    /* Once rerendering is complete, start up the client */
    $(document).ready(function() {
      try {
        Util.LogOnly("Document rendered; setting up TFC...");
        client_main(layout);
        /* After that, focus on the chat box (if present) */
        let $c = $("#txtChat");
        if ($c && $c.length > 0 && !$c.attr("focused")) {
          $c.attr("focused", "1");
          $c[0].focus();
        }
      } catch(e) {
        alert("client_main error: " + e.toString());
        alert("Stacktrace: " + e.stack ? e.stack.toString() : "no stack");
        throw e;
      }
    });
  }

  /* Once the document is loaded, wait for the scripts, then do layout */
  onReady(index_main);
}

