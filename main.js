/* Twitch Filtered Chat Loader */

"use strict";

/* Module names (also used as directory names) */
const MOD_TFC = "twitch-filtered-chat";
const MOD_TWAPI = "twitch-api";

/* Obtain information based on window.location and navigator.userAgent */
const URI = `${window.location}`;
const IS_TESLA = Boolean(navigator.userAgent.match(/\bTesla\b/));
const ASK_DIST = Boolean(window.location.search.match(/\busedist\b/));
const USE_DIST = ASK_DIST || IS_TESLA;
const BASE_URI = URI.substr(0, URI.indexOf(MOD_TFC)).replace(/\/$/, "");
const SELF_URI = URI.replace(/\/index.html(\?.*)?$/, "");
const GIT_URL = "https://kaedenn.github.io/twitch-filtered-chat/index.html";
const CUR_URL = ((l) => `${l.protocol}//${l.hostname}${l.pathname}`)(window.location);

/* Paths to modules */
const PATH_TFC = SELF_URI + (USE_DIST ? "/dist" : "");
// const PATH_TWAPI = BASE_URI + "/" + MOD_TWAPI + (USE_DIST ? "/dist" : "");
const PATH_TWAPI = "https://kaedenn.github.io/twitch-api"

/* Asset storage object */
var ASSETS = {};

/* Log things to the console, usable even if the console is disabled */
function _console(func, ...args) {
  if (console && console[func]) {
    return console[func](...args);
  }
}

function _console_error(...args) { return _console("error", ...args); }
function _console_warn(...args) { return _console("warn", ...args); }
function _console_log(...args) { return _console("log", ...args); }
function _console_info(...args) { return _console("info", ...args); }
function _console_debug(...args) { return _console("debug", ...args); }

/* Obtain the layout to use */
function GetLayout() { /* exported GetLayout */
  let layout_raw = Util.ParseQueryString().layout || "double:chat";
  return ParseLayout(layout_raw);
}

/* Parse layout= query string value */
function ParseLayout(str) { /* exported ParseLayout */
  let layout = {Cols: null, Chat: true, Slim: false};
  if (str.indexOf(":") > -1) {
    let v1 = str.substr(0, str.indexOf(":"));
    let v2 = str.substr(str.indexOf(":")+1);
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
      _console_warn("Unknown layout option", v2);
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

/* Add an asset to be loaded; returns a Promise */
function AddAsset(src, tree=null, loadcb=null, errcb=null) {
  /* Determine the final path to the asset */
  let path = src;
  switch (tree) {
    case MOD_TFC:
      path = PATH_TFC + "/" + src;
      break;
    case MOD_TWAPI:
      path = PATH_TWAPI + "/" + src;
      break;
    default:
      if (src.startsWith("//")) {
        path = window.location.protocol + src;
      }
      break;
  }
  _console_debug(`${src} @ ${tree} -> ${path}`);

  /* Prevent double-loading */
  if (ASSETS[path]) {
    let astr = JSON.stringify(ASSETS[path]);
    throw new Error(`Asset ${path} already added: ${astr}`);
  }

  /* Construct and load the asset */
  ASSETS[path] = {};
  let asset = ASSETS[path];
  return new Promise(function(resolve, reject) {
    _console_info("About to load asset", path);
    asset.file = src;
    asset.src = path;
    asset.tree = tree;
    asset.loaded = false;
    asset.error = false;
    asset.script = document.createElement("script");
    asset.script.setAttribute("type", "text/javascript");
    asset.script.setAttribute("src", asset.src);
    asset.script.onload = function() {
      _console_debug("Loaded", asset);
      _console_log(`${asset.src} loaded`);
      asset.loaded = true;
      if (loadcb) { loadcb(asset); }
      resolve(asset);
    };
    asset.script.onerror = function(e) {
      _console_error("Failed loading", asset, e);
      asset.error = true;
      if (errcb) { errcb(asset, e); }
      reject(e);
    };
    document.head.appendChild(asset.script);
  });
}

/* Called by body.onload */
function Main(global) { /* exported Main */
  /* Populate templates and load the client */
  function indexMain() {
    Util.LogOnly("Assets loaded; initializing page...");

    /* Remove the top-level "Loading" message */
    $("#wrapper #wrapper-loading").remove();

    /* Obtain a layout to use */
    let layout = GetLayout();

    /* Create the chat input elements */
    let $Chat = $(`<div id="chat"></div>`)
      .append($(`<textarea id="txtChat" placeholder="Send a message"></textarea>`));

    /* Apply default settings and formatting */
    let $Columns = $(".column");
    let $Modules = $(".module");
    let [$Column1, $Column2] = [$("#column1"), $("#column2")];
    let [$Module1, $Module2] = [$("#module1"), $("#module2")];
    /* Default: all checkboxes are checked */
    $Modules.find(".header .settings input[type=\"checkbox\"]")
            .attr("checked", "checked");
    /* Default: modules are named "Chat" */
    $Modules.find(".header label.name").val("Chat");
    $Modules.find(".header input.name").attr("value", "Chat");

    /* Apply single-column layout */
    if (layout.Cols === "single") {
      $Column1.removeClass("left").addClass("full");
      $Module1.removeClass("left").addClass("full");
      $Column1.show();
      $Column2.remove();
    } else {
      $Columns.show();
    }

    /* Add the chat box */
    if (layout.Chat) {
      let $ChatModule = null;
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
      $("body").addClass("tfc-slim");
      $(".module").addClass("slim");
      $(".content").addClass("slim");
      $("#btnSettings").hide();
    }

    /* Initialize the chat commands object */
    InitChatCommands();

    Util.LogOnly("Waiting for document to finish rendering...");

    /* Once rerendering is complete, start up the client */
    requestAnimationFrame(() => {
      /* Focus on the chat texarea */
      let c = document.getElementById("txtChat");
      if (c && c.focus) c.focus();
      /* Call doLoadClient to construct the filtered chat */
      Util.LogOnly("Document rendered; setting up TFC...");
      try {
        doLoadClient();
      } catch(e) {
        _console_error(e);
        if (e.name === "ReferenceError") {
          let m = e.message || "";
          if (m.match(/\bdoLoadClient\b.*(?:not |un)defined\b/)) {
            alert("FATAL: filtered-chat.js failed to load");
          }
        } else {
          let msg = "doLoadClient error: " + e.toString();
          if (e.stack) {
            msg += ";\nstack: " + e.stack.toString();
          }
          alert(msg);
        }
        throw e;
      }
    });
  }

  /* Extend jQuery with some useful methods */
  (function($jQuery) {
    /* Check or uncheck a checkbox (e.check(), e.check(false)) */
    $jQuery.fn.check = function(...args) {
      let cond = args.length > 0 ? Boolean(args[0]) : true;
      this.each((i, n) => {
        n.checked = cond;
        n.dispatchEvent(new Event("change"));
      });
    };
    /* Uncheck a checkbox */
    $jQuery.fn.uncheck = function() {
      this.each((i, n) => {
        n.checked = false;
        n.dispatchEvent(new Event("change"));
      });
    };
  })(jQuery);

  /* Add TWAPI assets, then TFC assets, and then call indexMain */
  Promise.all([
    AddAsset("utility.js", MOD_TWAPI, null, null),
    AddAsset("client.js", MOD_TWAPI, null, null)])
  .then(() => AddAsset("config.js", MOD_TFC, null, null))
  .then(() => Promise.all([
    AddAsset("htmlgen.js", MOD_TFC, null, null),
    AddAsset("commands.js", MOD_TFC, null, null),
    AddAsset("filtered-chat.js", MOD_TFC, null, null),
    AddAsset("plugins/plugins.js", MOD_TFC, null, null)]))
  .then(() => Promise.all([
    AddAsset("fanfare/particle.js", MOD_TFC),
    AddAsset("fanfare/effect.js", MOD_TFC),
    AddAsset("fanfare/fanfare.js", MOD_TFC)
  ]))
  .then(indexMain)
  .catch((e) => {
    console.error(e);
    let msg = "TWAPI/TFC Failure ";
    let t = e.target || e.srcElement || e.originalTarget;
    if (t === null || !t) {
      msg += "while loading unknown target";
    } else if (t.attributes && t.attributes.src && t.attributes.src.value) {
      msg += "while loading " + t.attributes.src.value;
    } else if (t.outerHTML) {
      msg += "while loading " + t.outerHTML;
    } else if (t.nodeValue) {
      msg += "while loading " + t.nodeValue;
    } else {
      msg += "while loading " + t;
    }
    msg += `:\n${e}` + (e.stack ? `;\nstack: ${e.stack}` : ``);
    _console_error(msg, e);
    alert(msg);
  });
}

/* eslintrc config: */
/* exported MOD_TFC MOD_TWAPI IS_TESLA ASK_DIST USE_DIST */
/* exported URI BASE_URI SELF_URI GIT_URL CUR_URL PATH_TFC PATH_TWAPI */
/* globals InitChatCommands doLoadClient */

/* vim: set ts=2 sts=2 sw=2 et: */
