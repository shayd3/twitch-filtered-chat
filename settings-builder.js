/* Twitch Filtered Chat Settings Builder Driver */

"use strict";

const CFG_STORE_KEY = "tfc-config-store";

/* Load a saved configuration (or all saved configurations) */
function loadConfig(key=null) {
  let cfg = localStorage[CFG_STORE_KEY] || {};
  return key ? (cfg[key] || {}) : cfg;
}

/* Save a configuration */
function saveConfig(key, value) {
  let cfg = localStorage[CFG_STORE_KEY] || {};
  cfg[key] = value;
  localStorage[CFG_STORE_KEY] = cfg;
}

/* Generate a URL using the given config */
function generateURL(cfg) { /* exported generateURL */
  /* TODO */
}

function onBuilderLoaded() { /* exported onBuilderLoaded */
  debug("Builder loaded");
  for (let [k,v] of Object.entries(localStorage)) {
    debug(`localStorage ${k}: ${v.length}`);
  }
  let savedConfigs = loadConfig();
  debug(`Loaded ${savedConfigs.length} saved configurations`);
}

document.dispatchEvent(new Event("builder-loaded"));

/* globals debug addEntry */

