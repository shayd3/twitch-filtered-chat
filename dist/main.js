/* Twitch Filtered Chat Driver Script */

"use strict";

var IS_TESLA = !!navigator.userAgent.match(/\bTesla\b/);
var USE_DIST = !!window.location.search.match(/\busedist\b/) || IS_TESLA;
var MOD_TFC = 'twitch-filtered-chat';
var MOD_TWAPI = 'twitch-api';
var ASSETS = {};

/* Parse layout= query string value */
function ParseLayout(str) {
  /* exported ParseLayout */
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

/* Given a filename/path and a tree, obtain the path to an asset */
function GetAssetURL(file, tree) {
  var URI = '' + window.location;
  var IS_GIT = URI.indexOf('github.io') > -1;
  var BASE_URI = URI.substr(0, URI.indexOf(MOD_TFC)).replace(/\/$/, '');
  var SELF_URI = URI.replace(/\/index.html(\?.*)?$/, '');
  var root = '';
  if (tree === MOD_TFC) {
    if (USE_DIST) {
      root = SELF_URI + '/dist';
    } else if (IS_GIT) {
      root = SELF_URI;
    } else {
      root = SELF_URI;
    }
  } else if (tree === MOD_TWAPI) {
    if (USE_DIST) {
      root = BASE_URI + '/' + MOD_TWAPI + '/dist';
    } else if (IS_GIT) {
      root = BASE_URI + '/' + MOD_TWAPI;
    } else {
      root = BASE_URI + '/' + MOD_TWAPI;
    }
  } else if (file.startsWith('//')) {
    if (window.location.protocol === "https:") {
      return 'https:' + file;
    } else if (window.location.protocol === "http:") {
      return 'http:' + file;
    } else if (window.location.protocol === "file:") {
      return 'http:' + file;
    } else {
      return 'http:' + file;
    }
  } else if (!file.match(/^[\w-]+:/)) {
    if (window.location.protocol === "https:") {
      return 'https://' + file;
    } else if (window.location.protocol === "http:") {
      return 'http://' + file;
    } else if (window.location.protocol === "file:") {
      return 'http://' + file;
    } else {
      return 'http://' + file;
    }
  }
  return root + '/' + file;
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
    asset.file = src;
    asset.src = path;
    asset.tree = tree;
    asset.loaded = false;
    asset.error = false;
    asset.script = document.createElement("script");
    asset.script.setAttribute("type", "text/javascript");
    asset.script.setAttribute("src", asset.src);
    asset.script.onload = function () {
      console.log(asset.src + ' loaded');
      asset.loaded = true;
      if (loadcb) {
        loadcb(asset);
      }
      resolve(asset);
    };
    asset.script.onerror = function (e) {
      console.error("Failed loading", asset, e);
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
  return Promise.all([AddAsset("config.js", MOD_TFC, null, null), AddAsset("htmlgen.js", MOD_TFC, null, null), AddAsset("commands.js", MOD_TFC, null, null), AddAsset("filtered-chat.js", MOD_TFC, null, null), !USE_DIST ? AddAsset("plugins/plugins.js", MOD_TFC, null, null) : null]);
}

/* Called by body.onload */
function Main(global) {
  /* exported Main */
  /* Populate the debug div with text */
  function debug_msg(msg) {
    var d = document.getElementById("debug");
    if (d) {
      d.innerHTML = msg + '<br />' + d.innerHTML;
    }
  }
  global.debug_msg = debug_msg;

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

    if (layout.Cols == "single") {
      $Column1.removeClass("left").addClass("full");
      $Module1.removeClass("left").addClass('full');
      $Column1.show();
      $Column2.remove();
    } else {
      $Columns.show();
    }

    if (layout.Chat) {
      var $ChatModule = null;
      $ChatModule = layout.Cols == "single" ? $Module1 : $Module2;
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
      $(".content").addClass("slim");
      $("#settings_button").hide();
    }

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
        console.error(e);
        var msg = "client_main error: " + e.toString();
        if (e.stack) msg += ";\nstack: " + e.stack.toString();
        alert(msg);
        throw e;
      }
    });
  }

  /* Add TWAPI assets, then TFC assets, and then call index_main */
  loadTWAPI().then(function () {
    return loadTFC();
  }).then(function () {
    return index_main();
  }).catch(function (e) {
    var msg = "TWAPI/TFC Failure: ";
    var t = e.target || e.srcElement || e.originalTarget;
    if (t.attributes && t.attributes.src && t.attributes.src.value) {
      msg += "while loading " + t.attributes.src.value;
    } else if (t.outerHTML) {
      msg += "while loading " + t.outerHTML;
    } else {
      msg += "while loading " + t;
    }
    console.error(msg, e);
    if (e.stack) {
      msg += ": stack: " + e.stack;
    }
    alert(msg);
  });
}