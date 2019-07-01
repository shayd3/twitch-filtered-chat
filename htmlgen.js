/* HTML Generator for the Twitch Filtered Chat */

"use strict";

/* TODO:
 * Format clip information
 * USERNOTICEs:
 *   rewardgift
 *   submysterygift
 *   primepaidupgrade
 *   giftpaidupgrade
 *     msg-param-promo-gift-total
 *     msg-param-promo-name
 *   anongiftpaidupgrade
 *     msg-param-promo-gift-total
 *     msg-param-promo-name
 *   unraid
 *   bitsbadgetier
 */

class HTMLGenerator { /* exported HTMLGenerator */
  constructor(client, config=null) {
    this._client = client;
    this._config = config || {};
    this._default_colors = [
      "lightseagreen",
      "forestgreen",
      "goldenrod",
      "dodgerblue",
      "darkorchid",
      "crimson"];
    this._user_colors = {};
    this._bg_colors = ["#1d1d1d", "#0a0a0a", "#d1d1d1"];
    this._highlights = [];

    /* Ensure config has certain values */
    if (!this._config.Layout) this._config.Layout = {};
    if (!this._config.ShowClips) this._config.ShowClips = false;
  }

  setValue(k, v) {
    this._config[k] = v;
  }

  getValue(k) {
    return this._config[k];
  }

  get enableAntics() {
    return !this.getValue("NoForce") && !$("#cbForce").is(":checked");
  }

  set enableAntics(val) {
    if (val) {
      this.setValue("NoForce", true);
      $("#cbForce").check();
    } else {
      this.setValue("NoForce", false);
      $("#cbForce").uncheck();
    }
  }

  addHighlightMatch(pat) {
    this._highlights.push(pat);
  }

  get highlightMatches() {
    return this._highlights;
  }

  set highlightMatches(v) {
    this._highlights = v;
  }

  getColorFor(username) {
    let name = `${username}`;
    if (typeof(username) !== "string") {
      let arg_msg = `${typeof(username)}, ${JSON.stringify(username)}`;
      Util.Error(`Expected string, got ${arg_msg}`);
    }
    if (!this._user_colors.hasOwnProperty(name)) {
      /* Taken from Twitch vendor javascript */
      let r = 0;
      for (let i = 0; i < name.length; ++i) {
        r = (r << 5) - r + name.charCodeAt(i);
      }
      r = r % this._default_colors.length;
      if (r < 0) r += this._default_colors.length;
      this._user_colors[name] = this._default_colors[r];
    }
    return this._user_colors[name];
  }

  /* Returns array of [css attr, css value] */
  genBorderCSS(color) {
    let border = Util.GetMaxContrast(color, this._bg_colors);
    return [
      "text-shadow",
      `-0.8px -0.8px 0 ${border}, 0.8px -0.8px 0 ${border},
       -0.8px  0.8px 0 ${border}, 0.8px  0.8px 0 ${border}`
    ];
  }

  /* Returns jquery node */
  genName(name, color) {
    let $e = $(`<span class="username" data-username="1"></span>`);
    $e.css("color", color || this.getColorFor(name) || "#ffffff");
    /* Determine the best border color to use */
    let [attr, val] = this.genBorderCSS($e.css("color"));
    $e.css(attr, val);
    $e.text(name);
    return $e;
  }

  /* Returns string */
  twitchEmote(id, name=null) {
    let opts = {id: id};
    if (name) {
      opts.name = name;
    }
    return this._emote("twitch", this._client.GetEmote(id), opts);
  }

  _checkUndefined(ev, $w) {
    /* Verify the message doesn't contain "undefined" */
    if ($w[0].outerHTML.indexOf("undefined") > -1) {
      Util.Error("msg contains undefined");
      Util.ErrorOnly(ev, $w, $w[0].outerHTML);
    }
  }

  /* Returns string */
  _emote(source, url, opts=null) {
    let $w = $(`<span class="emote-wrapper"></span>`);
    let $i = $(`<img class="emote" />`);
    $w.addClass(`${source}-emote`);
    $w.attr("data-is-emote-wrapper", "1");
    $i.addClass(`${source}-emote`);
    $i.attr("data-is-emote", "1");
    $i.attr("src", url);
    $i.attr("data-emote-src", source);
    if (opts) {
      if (opts.id) {
        $i.attr("data-emote-id", opts.id);
        $i.attr("alt", opts.id);
        $i.attr("title", opts.id);
        $w.attr("data-emote-name", opts.id);
      }
      /* opts.name overrides opts.id for all but $i[data-emote-id] */
      if (opts.name) {
        $i.attr("data-emote-name", opts.name);
        $i.attr("alt", opts.name);
        $i.attr("title", opts.name);
        $w.attr("data-emote-name", opts.name);
      }
      if (opts.w || opts.width) {
        $i.attr("width", opts.w || opts.width);
      }
      if (opts.h || opts.height) {
        $i.attr("height", opts.h || opts.height);
      }
      if (opts.def) {
        $i.attr("data-emote-def", JSON.stringify(opts.def));
      }
    }
    let lines = [];
    if ($i.attr("data-emote-name")) {
      lines.push($i.attr("data-emote-name"));
    }
    if (source === "twitch") {
      lines.push("Twitch");
    } else if (source === "ffz") {
      lines.push("FFZ");
    } else if (source === "bttv") {
      lines.push("BTTV");
    } else {
      lines.push(source);
    }
    $w.attr("data-text", lines.map((l) => l.replace(/ /g, "\xa0")).join("\n"));
    $w.append($i);
    return $w[0].outerHTML;
  }

  /* Returns string */
  _getCheerImage(cheerdef, scale) {
    let scheme = $("body").hasClass("light") ? "light" : "dark";
    let imagesets = cheerdef.images[scheme] || cheerdef.images.dark;
    let images = this._config.NoAnim ? imagesets.static : imagesets.animated;
    return images[scale];
  }

  /* Returns string */
  _genCheer(cheer, bits) {
    let $img = $(`<img class="cheer-image" />`);
    let $w = $(`<span class="cheer cheermote"></span>`);
    /* Use the highest tier image that doesn't exceed the cheered bits */
    let possible_cheers = cheer.tiers.filter((n) => bits >= n.min_bits);
    let best_cheer = possible_cheers.max((n) => n.min_bits);
    /* Use the smallest scale available */
    let url = this._getCheerImage(best_cheer, cheer.scales.min((s) => +s));
    $img.attr("alt", `${cheer.prefix} ${bits} bits`);
    $img.attr("title", `${cheer.prefix} ${bits} bits`);
    $img.attr("src", url);
    $w.css("color", best_cheer.color);
    $w.attr("data-cheer-def", JSON.stringify(best_cheer));
    $w.attr("data-cheer", JSON.stringify(cheer));
    $w.append($img);
    $w.append(bits);
    return $w[0].outerHTML;
  }

  /* Returns jquery node */
  _wrapBadge(elem) {
    let $e = $(elem);
    let $s = $(`<span class="badge"></span>`);
    let getData = (aname) => elem.attr(`data-${aname}`) || "";
    let lines = [];
    let info_str = getData("badge");
    let badge_desc = `${getData("badge-name")}`;
    let badge_num = Util.ParseNumber(`${getData("badge-num")}`);
    let submonths = Util.ParseNumber(`${getData("badge-submonths")}`);
    let scope = getData("badge-scope");
    /* Copy all data attributes from elem to $s */
    for (let e of $e) {
      for (let attr of e.getAttributeNames()) {
        if (attr.startsWith("data-")) {
          $s.attr(attr, e.getAttribute(attr));
        }
      }
    }
    /* Store image information */
    if (info_str.length > 0) {
      let info = JSON.parse(info_str);
      if (info.image_url_4x) {
        $s.attr("data-icon-large-src", info.image_url_4x);
      } else if (info.image_url_2x) {
        $s.attr("data-icon-large-src", info.image_url_2x);
      }
    }
    /* Append badge number */
    if (badge_num) {
      /* Appending (1) is redundant */
      if (badge_num !== 1) {
        badge_desc += ` (${badge_num})`;
      }
    }
    lines.push(badge_desc.toTitleCase());
    /* Append number of months subscribed */
    if (submonths) {
      lines.push(`${submonths} month${submonths === 1 ? "" : "s"}`);
    }
    /* Append badge source */
    if (scope === "global") {
      lines.push("Global Badge");
    } else if (scope === "channel") {
      lines.push("Channel Badge");
      lines.push("#" + getData("badge-channel"));
    } else if (scope === "ffz") {
      lines.push("FFZ Badge");
    } else if (scope === "bttv") {
      lines.push("BTTV Badge");
    }
    /* Replace spaces in each line with &nbsp; (\xa0, 160) */
    $s.attr("data-text", lines.map((l) => l.replace(/ /g, "\xa0")).join("\n"));
    return $s.append(elem);
  }

  /* Returns jquery node */
  _genBadges(event) {
    let $bc = $(`<span class="badges" data-badges="1"></span>`);
    let total_width = 0;
    if (event.flags["badges"]) {
      total_width += 18 * event.flags["badges"].length;
    }
    if (event.flags["ffz-badges"]) {
      total_width += 18 * event.flags["ffz-badges"].length;
    }
    if (event.flags["bttv-badges"]) {
      total_width += 18 * event.flags["bttv-badges"].length;
    }
    $bc.css("overflow", "hidden");
    $bc.css("width", `${total_width}px`);
    $bc.css("max-width", `${total_width}px`);
    function makeBadge(classes) {
      return $(`<img class="badge" width="18px" height="18px" />`)
        .addClass(classes);
    }
    /* Add Twitch-native badges */
    if (event.flags.badges) {
      for (let [bname, bnum] of event.flags.badges) {
        let $b = makeBadge("twitch-badge");
        $b.attr("data-badge-name", bname);
        $b.attr("data-badge-num", bnum);
        $b.attr("data-badge-cause", JSON.stringify([bname, bnum]));
        $b.attr("data-badge", "1");
        $b.attr("title", `${bname}/${bnum}`);
        $b.attr("alt", `${bname}/${bnum}`);
        if (this._client.IsChannelBadge(event.channel, bname, bnum)) {
          /* Format a channel-specific badge */
          let ch = event.channel;
          let badge_info = this._client.GetChannelBadge(ch, bname, bnum);
          let badge_src = badge_info.image_url_1x;
          let channel = event.channelString.replace(/^#/, "");
          $b.attr("src", badge_src);
          $b.attr("data-badge", JSON.stringify(badge_info));
          $b.attr("data-badge-scope", "channel");
          $b.attr("data-badge-channel", channel);
        } else if (this._client.IsGlobalBadge(bname, bnum)) {
          /* Format a global badge */
          let badge_info = this._client.GetGlobalBadge(bname, bnum);
          $b.attr("src", badge_info.image_url_1x);
          $b.attr("data-badge-scope", "global");
          $b.attr("data-badge", JSON.stringify(badge_info));
        } else {
          /* Twitch native badges are either channel or global */
          Util.Warn("Unknown badge", bname, bnum, "for", event);
          continue;
        }
        /* Store the precise number of months subscribed */
        if (bname === "subscriber") {
          if (event.subMonths) {
            $b.attr("data-badge-submonths", event.subMonths);
          }
        }
        $bc.append(this._wrapBadge($b));
      }
    }
    /* Add FFZ badges */
    if (event.flags["ffz-badges"]) {
      for (let badge of Object.values(event.flags["ffz-badges"])) {
        let $b = makeBadge("ffz-badge");
        $b.attr("data-badge", "1");
        $b.attr("data-ffz-badge", "1");
        $b.attr("data-badge-scope", "ffz");
        $b.attr("data-badge-name", badge.title);
        $b.attr("src", Util.URL(badge.image));
        $b.attr("alt", badge.name);
        $b.attr("title", badge.title);
        $bc.append(this._wrapBadge($b));
      }
    }
    /* For if BTTV ever adds badges
    if (event.flags["bttv-badges"]) {
      for (let badge of Object.values(event.flags["bttv-badges"])) {
        let $b = makeBadge("bttv-badge");
        $b.attr("data-badge", "1");
        $b.attr("data-ffz-badge", "1");
        $b.attr("data-badge-scope", "bttv");
        $b.attr("data-badge-name", "Unknown BTTV Badge");
        $b.attr("src", Util.URL(badge.image));
        $b.attr("alt", "Unknown BTTV Badge");
        $b.attr("title", "Unknown BTTV Badge");
        $bc.append(this._wrapBadge($b));
      }
    } */
    return $bc;
  }

  /* Returns jquery node */
  _genName(event) {
    /* Display upper-case name, assign color to lower-case name */
    let user = event.name || event.user;
    let color = event.flags.color || this.getColorFor(event.user);
    if (!color) { color = "#ffffff"; }
    return this.genName(user, color);
  }

  _remap(map, start, end, len) {
    /* IDEA BEHIND MAP ADJUSTMENT:
     * 1) Maintain two parallel strings, `msg0` (original) and `msg` (final).
     * 2) Maintain the following invariant:
     *  a) msg0.indexOf("substr") === map[msg.indexOf("substr")]
     *  b) msg0[idx] === msg1[map[idx]]
     * Exceptions:
     *  If msg0[idx] is part of a formatted entity; msg[map[idx]] may not be
     *  the same character.
     * Usage:
     *  The map allows for formatting the final message based on where items
     *  appear in the original message.
     */
    let mstart = map[start];
    let mend = map[end];
    for (let idx = start; idx < end; ++idx) {
      /* Set values within the range to the end */
      map[idx] = mend + len;
    }
    for (let idx = end; idx < map.length; ++idx) {
      /* Adjust values beyond the range by length */
      map[idx] += len - (mend - mstart);
    }
  }

  _msgCheersTransform(event, message, map, $msg, $effects) {
    let result = message;
    if (event.flags.bits && event.flags.bits > 0) {
      let bits_left = event.flags.bits;
      let matches = this._client.FindCheers(event.channel, event.message);
      /* Sort the cheer matches from right-to-left */
      matches.sort((a, b) => a.start - b.start);
      while (matches.length > 0) {
        let match = matches.pop();
        let [start, end] = [map[match.start], map[match.end]];
        let cheer_html = this._genCheer(match.cheer, match.bits);
        let pos = start + cheer_html.length;
        /* Insert the cheer HTML and adjust the map */
        result = result.substr(0, start) + cheer_html + result.substr(end);
        this._remap(map, match.start, match.end, cheer_html.length);
        /* Scan for cheer effects */
        start = end = pos;
        while (pos < result.length) {
          let word = "";
          if (result[pos].match(/\s/)) {
            pos += 1;
          } else {
            /* NOTE: This would be cleaner with some kind of "search starting
             * from" function: result.matchFrom(/\s/, pos) */
            end = result.substr(pos).search(/\s/);
            end = end === -1 ? result.length : pos + end;
            word = result.substring(pos, end);
            let s = GetCheerStyle(word.toLowerCase());
            if (s && !s._disabled && bits_left >= s.cost) {
              /* Continue scanning for disabled effects and effects using more
               * bits than are left */
              $effects.push(s);
              bits_left -= s.cost;
            } else {
              /* Stop scanning at the first non-effect word */
              end = pos;
              break;
            }
            pos = end;
          }
        }
        if (start !== end) {
          /* Remove [start:end] from the result and adjust the map */
          result = result.substr(0, start) + " " + result.substr(end);
          this._remap(map, start, end, 0);
        }
      }
    }
    return result;
  }

  _msgEmotesTransform(event, message, map, $msg, $effects) {
    let result = message;
    if (event.flags.emotes) {
      let emotes = event.flags.emotes.map(function(e) {
        return {
          id: e.id,
          name: e.name || event.message.substring(e.start, e.end+1),
          start: e.start,
          end: e.end,
          def: e
        };
      });
      emotes.sort((a, b) => map[a.start] - map[b.start]);
      while (emotes.length > 0) {
        let emote = emotes.pop();
        let emote_src = this._client.GetEmote(emote.id);
        let msg_start = result.substr(0, map[emote.start]);
        let msg_end = result.substr(map[emote.end]+1);
        let emote_str = this._emote("twitch", emote_src, emote);
        result = `${msg_start}${emote_str}${msg_end}`;
        /* Adjust the map */
        this._remap(map, emote.start, emote.end, emote_str.length - 1);
      }
    }
    return result;
  }

  _msgFFZEmotesTransform(event, message, map, $msg, $effects) {
    let result = message;
    let ffz_emotes = this._client.GetFFZEmotes(event.channel);
    if (ffz_emotes && ffz_emotes.emotes) {
      let ffz_emote_arr = [];
      for (let [k,v] of Object.entries(ffz_emotes.emotes)) {
        ffz_emote_arr.push([v, k]);
      }
      let results = Twitch.ScanEmotes(event.message, ffz_emote_arr);
      results.sort((a, b) => (a.start - b.start));
      while (results.length > 0) {
        let emote = results.pop();
        let edef = emote.id;
        let url = edef.urls[Object.keys(edef.urls).min()];
        let emote_opts = {
          id: edef.id,
          w: edef.width,
          h: edef.height,
          def: edef
        };
        let emote_str = this._emote("ffz", url, emote_opts);
        let msg_start = result.substr(0, map[emote.start]);
        let msg_end = result.substr(map[emote.end+1]);
        result = `${msg_start}${emote_str}${msg_end}`;
        this._remap(map, emote.start, emote.end+1, emote_str.length);
      }
    }
    return result;
  }

  _msgBTTVEmotesTransform(event, message, map, $msg, $effects) {
    let result = message;
    let all_emotes = this._client.GetGlobalBTTVEmotes();
    let ch_emotes = this._client.GetBTTVEmotes(event.channel);
    let emotes = {};
    for (let [k, v] of Object.entries(all_emotes)) {
      emotes[k] = v;
    }
    /* Channel emotes override global emotes */
    for (let [k, v] of Object.entries(ch_emotes)) {
      emotes[k] = v;
    }
    let emote_arr = [];
    for (let k of Object.keys(emotes)) {
      emote_arr.push([k, RegExp.escape(k)]);
    }
    let results = Twitch.ScanEmotes(event.message, emote_arr);
    results.sort((a, b) => (a.start - b.start));
    while (results.length > 0) {
      let emote = results.pop();
      let edef = emotes[emote.id];
      let emote_opts = {id: edef.id, name: edef.code, def: edef};
      let emote_str = this._emote("bttv", edef.url, emote_opts);
      let msg_start = result.substr(0, map[emote.start]);
      let msg_end = result.substr(map[emote.end+1]);
      result = `${msg_start}${emote_str}${msg_end}`;
      this._remap(map, emote.start, emote.end+1, emote_str.length);
    }
    return result;
  }

  _msgAtUserTransform(event, message, map, $msg, $effects) {
    let result = message;
    let pat = /(?:^|\b\s*)(@\w+)(?:\s*\b|$)/g;
    let locations = [];
    let arr = null;
    while ((arr = pat.exec(event.message)) !== null) {
      let start = arr.index + arr[0].indexOf(arr[1]);
      let end = start + arr[1].length;
      locations.push({part: arr[1], start: start, end: end});
    }
    /* Ensure the locations array is indeed sorted */
    locations.sort((a, b) => (a.start - b.start));
    while (locations.length > 0) {
      let location = locations.pop();
      let node = $(`<em class="at-user"></em>`).text(location.part);
      if (location.part.substr(1).equalsLowerCase(this._client.GetName())) {
        $msg.addClass("at-self");
        node.addClass("at-self");
      }
      let msg_start = result.substr(0, map[location.start]);
      let msg_part = node[0].outerHTML;
      let msg_end = result.substr(map[location.end]);
      result = msg_start + msg_part + msg_end;
      this._remap(map, location.start, location.end, msg_part.length);
    }
    return result;
  }

  _msgHighlightTransform(event, message, map, $msg, $effects) {
    let result = message;
    for (let pat of this._highlights) {
      let pattern = pat;
      let locations = [];
      let arr = null;
      /* Ensure pattern has "g" flag */
      if (pat.flags.indexOf("g") === -1) {
        pattern = new RegExp(pat, pat.flags + "g");
      }
      while ((arr = pattern.exec(event.message)) !== null) {
        let whole = arr[0];
        let part = arr.length > 1 ? arr[1] : arr[0];
        let start = arr.index + whole.indexOf(part);
        let end = start + part.length;
        locations.push({part: part, start: start, end: end});
      }
      /* Ensure the locations array is indeed sorted */
      locations.sort((a, b) => (a.start - b.start));
      while (locations.length > 0) {
        let location = locations.pop();
        let node = $(`<em class="highlight"></em>`).text(location.part);
        let msg_start = result.substr(0, map[location.start]);
        let msg_part = node[0].outerHTML;
        let msg_end = result.substr(map[location.end]);
        $msg.addClass("highlight");
        result = msg_start + msg_part + msg_end;
        this._remap(map, location.start, location.end, msg_part.length);
      }
    }
    return result;
  }

  _msgURLTransform(event, message, map, $msg, $effects) {
    let result = message;
    let locations = [];
    let arr = null;
    while ((arr = Util.URL_REGEX.exec(event.message)) !== null) {
      /* arr = [wholeMatch, matchPart] */
      let start = arr.index + arr[0].indexOf(arr[1]);
      let end = start + arr[1].length;
      locations.push({whole: arr[0], part: arr[1], start: start, end: end});
    }
    /* Ensure the locations array is indeed sorted */
    locations.sort((a, b) => (a.start - b.start));
    while (locations.length > 0) {
      let location = locations.pop();
      let url = null;
      try {
        url = new URL(Util.URL(location.part));
      }
      catch (e) {
        Util.Error("Invalid URL", location, e);
        continue;
      }
      if (this._config.ShowClips && url.hostname === "clips.twitch.tv") {
        $msg.attr("data-clip", url.pathname.strip("/"));
      }
      let new_node = Util.CreateNode(url);
      let msg_start = result.substr(0, map[location.start]);
      let msg_part = new_node.outerHTML;
      let msg_end = result.substr(map[location.end]);
      result = msg_start + msg_part + msg_end;
      this._remap(map, location.start, location.end, msg_part.length);
    }
    return result;
  }

  /* Returns whether or not the event contains mod antics */
  hasAntics(event) {
    let hasForce = false;
    if (this.enableAntics && event.ismod && event.message.length > 0) {
      let t0 = event.message.split(" ")[0];
      switch (t0.replace(/-/g, "")) {
        case "force":
        case "!tfcforce":
        case "forceeval":
        case "!tfceval":
        case "!tfcforceeval":
        case "forcejs":
        case "!tfcjs":
        case "!tfcforcejs":
        case "forcejsonly":
        case "!tfcjsonly":
        case "!tfcforcejsonly":
        case "forcebits":
        case "forcecheer":
          hasForce = true;
          break;
        default:
          hasForce = false;
      }
    }
    return hasForce;
  }

  /* Returns msginfo object */
  _genMsgInfo(event) {
    let $msg = $(`<span class="message" data-message="1"></span>`);
    let $effects = [];

    /* Escape the message, keeping track of how characters move */
    let [message, map] = Util.EscapeWithMap(event.message);
    map.push(message.length); /* Prevent off-the-end mistakes */

    /* Handle early mod-only antics */
    if (this.enableAntics && event.ismod) {
      let t0 = event.message.split(" ")[0];
      switch (t0.replace(/-/g, "")) {
        case "force":
        case "!tfcforce":
          /* Message is raw HTML */
          event.flags.force = true;
          event.flags.force_kind = "force";
          break;
        case "forceeval":
        case "!tfceval":
        case "!tfcforceeval":
          /* Message is a JavaScript expression */
          event.flags.force = true;
          event.flags.force_kind = "forceeval";
          break;
        case "forcejs":
        case "!tfcjs":
        case "!tfcforcejs":
          /* Message is a JavaScript function call */
          event.flags.force = true;
          event.flags.force_kind = "forcejs";
          break;
        case "forcejsonly":
        case "!tfcjsonly":
        case "!tfcforcejsonly":
          /* As above, for the matched tag(s) */
          event.flags.force = true;
          event.flags.force_kind = "forcejsonly";
          break;
        case "forcebits":
        case "forcecheer":
          /* Prepend "cheer1000" to the message */
          event.flags.force = true;
          event.flags.force_kind = "bits";
          break;
        default:
          event.flags.force = false;
      }
      if (event.flags.force_kind === "bits") {
        let wordlen = t0.length;
        let msgprefix = "cheer1000";
        while (msgprefix.length < t0.length) {
          msgprefix += " ";
        }
        /* Modify message and event.message, as they're both used below */
        event.values.message = msgprefix + event.message.substr(wordlen);
        message = msgprefix + message.substr(wordlen);
        event.flags.bits = 1000;
      }
    } else {
      /* Prevent unauthorized access */
      event.flags.force = false;
    }

    let logMessage = () => {};
    if (Util.DebugLevel === Util.LEVEL_TRACE) {
      let idx = 1;
      logMessage = (...args) => { Util.LogOnly(idx++, message, ...args); };
    }
    /* Apply message transformations */
    logMessage(event);
    message = this._msgEmotesTransform(event, message, map, $msg, $effects);
    logMessage();
    message = this._msgCheersTransform(event, message, map, $msg, $effects);
    logMessage();
    message = this._msgFFZEmotesTransform(event, message, map, $msg, $effects);
    logMessage();
    message = this._msgBTTVEmotesTransform(event, message, map, $msg, $effects);
    logMessage();
    message = this._msgURLTransform(event, message, map, $msg, $effects);
    logMessage();
    message = this._msgAtUserTransform(event, message, map, $msg, $effects);
    logMessage();
    message = this._msgHighlightTransform(event, message, map, $msg, $effects);
    logMessage();

    /* Handle mod-only antics */
    if (event.ismod && this.enableAntics && event.flags.force) {
      /* NOTE: These will run twice for layout=double */
      let ts = event.message.split(" ").slice(1).join(" ");
      if (event.flags.force_kind === "force") {
        /* force: use raw message with no formatting */
        message = ts;
      } else if (event.flags.force_kind === "forceeval") {
        /* force-eval: evaluate ts as a function */
        try {
          let func = new Function(`return ${ts}`);
          message = JSON.stringify(func.bind(this)());
        }
        catch (e) {
          message = `Can't let you do that, ${event.user}: ${e}`.escape();
        }
      } else if (event.flags.force_kind === "forcejs") {
        /* forcejs: use raw message wrapped in script tags */
        message = `<script>${ts}</script>`;
      } else if (event.flags.force_kind === "forcejsonly" && ts.length > 0) {
        /* forcejs-only: forcejs, limited to a ?tag value:
         *  <tag>: execute if ?tag value === <tag>
         *  ?<tag>: execute if ?tag value contains <tag> */
        let t1 = ts.split(" ")[0];
        let tag = this.getValue("tag") || "";
        let matches = false;
        if (t1 === tag) matches = true;
        if (t1.startsWith("?") && tag.indexOf(t1.substr(1)) > -1) matches = true;
        if (matches) {
          message = `<script>${ts.split(" ").slice(1).join(" ")}</script>`;
        }
      }
    }

    $msg.html(message);

    return {e: $msg, effects: $effects};
  }

  _addChatAttrs($e, event) {
    $e.attr("data-id", event.flags.id);
    $e.attr("data-user", event.user);
    $e.attr("data-user-id", event.flags["user-id"]);
    $e.attr("data-channel", event.channelString.replace(/^#/, ""));
    $e.attr("data-channel-id", event.flags["room-id"]);
    $e.attr("data-channel-full", Twitch.FormatChannel(event.channel));
    if (event.channel.room) {
      $e.attr("data-room", event.channel.room);
    }
    if (event.channel.roomuid) {
      $e.attr("data-roomuid", event.channel.roomuid);
    }
    if (event.issub) {
      $e.attr("data-subscriber", "1");
    }
    if (event.ismod) {
      $e.attr("data-mod", "1");
    }
    if (event.isvip) {
      $e.attr("data-vip", "1");
    }
    if (event.iscaster) {
      $e.attr("data-caster", "1");
    }
    $e.attr("data-sent-ts", event.flags["tmi-sent-ts"]);
    $e.attr("data-recv-ts", Date.now());
  }

  /* Returns jquery node */
  _genSubWrapper(event) {
    let $e = $(`<div class="chat-line sub notice"></div>`);
    this._addChatAttrs($e, event);
    $e.append(this._genBadges(event));
    $e.append(this._genName(event));
    $e.html($e.html() + "&nbsp;");
    return $e;
  }

  /* Returns jquery node */
  gen(event) {
    let $e = $(`<div class="chat-line"></div>`);
    let color = event.flags.color || this.getColorFor(event.user);
    if (this._client.IsUIDSelf(event.flags["user-id"])) {
      $e.addClass("self");
    }
    /* Add data attributes */
    this._addChatAttrs($e, event);
    /* Add attributes as classes */
    if (!this._config.Layout.Slim) {
      if (event.flags.subscriber) $e.addClass("chat-sub");
      if (event.flags.mod) $e.addClass("chat-mod");
      if (event.flags.vip) $e.addClass("chat-vip");
      if (event.flags.broadcaster) $e.addClass("chat-caster");
    }
    /* Generate line content */
    $e.append(this._genBadges(event));
    $e.append(this._genName(event));
    let msg_def = this._genMsgInfo(event);
    if (!event.flags.action) {
      $e.html($e.html() + ":");
    } else {
      let [attr, val] = this.genBorderCSS(color);
      msg_def.e.css("color", color);
      msg_def.e.css(attr, val);
    }
    $e.html($e.html() + "&nbsp;");
    let html_pre = [];
    let html_post = [];
    if (msg_def.effects.length > 0) {
      for (let effect of msg_def.effects) {
        if (effect.class) msg_def.e.addClass(effect.class);
        if (effect.style) msg_def.e.attr("style", effect.style);
        if (effect.wclass) $e.addClass(effect.wclass);
        if (effect.wstyle) $e.attr("style", effect.wstyle);
        if (effect.html_pre) html_pre.push(effect.html_pre);
        if (effect.html_post) html_post.unshift(effect.html_post);
      }
    }
    let pre_html = html_pre.join("");
    let msg_html = msg_def.e[0].outerHTML;
    let post_html = html_post.join("");
    $e.append(pre_html + msg_html + post_html);
    return $e;
  }

  /* Returns jquery node */
  sub(event) {
    let $w = this._genSubWrapper(event);
    let $m = $(`<span class="message sub-message"></span>`);
    let e = this.twitchEmote("PogChamp");
    if (event.flags["system-msg"]) {
      $m.text(event.flags["system-msg"]);
    } else {
      $m.text(Strings.Sub(TwitchSubEvent.PlanName(`${event.plan_id}`)));
    }
    $m.addClass("effect-rainbow").addClass("effect-disco");
    $m.html($m.html() + e + "&nbsp;");
    $w.append($m);
    this._checkUndefined(event, $w);
    return $w;
  }

  /* Returns jquery node */
  resub(event) {
    let $w = this._genSubWrapper(event);
    let $m = $(`<span class="message sub-message"></span>`);
    let e = this.twitchEmote("PogChamp");
    let months = event.months || event.total_months;
    let streak = event.streak_months;
    let plan = event.plan || TwitchSubEvent.PlanName(`${event.plan_id}`);
    $m.addClass("effect-rainbow").addClass("effect-disco");
    if (event.flags["system-msg"]) {
      $m.text(event.flags["system-msg"]);
    } else if (event.share_streak) {
      $m.text(Strings.ResubStreak(months, plan, streak));
    } else {
      $m.text(Strings.Resub(months, plan));
    }
    $m.html($m.html() + "&nbsp;" + e);
    $w.append($m);
    this._checkUndefined(event, $w);
    return $w;
  }

  /* Returns jquery node */
  giftsub(event) {
    let $w = this._genSubWrapper(event);
    let $m = $(`<span class="message sub-message"></span>`);
    let e = this.twitchEmote("HolidayPresent");
    $m.addClass("effect-rainbow").addClass("effect-disco");
    if (event.flags["system-msg"]) {
      $m.text(event.flags["system-msg"]);
    } else {
      let user = event.recipient;
      let gifter = event.user;
      let plan = TwitchSubEvent.PlanName(`${event.plan_id}`);
      $m.text(Strings.GiftSub(gifter, plan, user));
    }
    $m.html($m.html() + e + "&nbsp;");
    $w.append($m);
    this._checkUndefined(event, $w);
    return $w;
  }

  /* Returns jquery node */
  anongiftsub(event) {
    let $w = this._genSubWrapper(event);
    let $m = $(`<span class="message sub-message"></span>`);
    let e = this.twitchEmote("HolidayPresent");
    $m.addClass("effect-rainbow").addClass("effect-disco");
    if (event.flags["system-msg"]) {
      $m.text(event.flags["system-msg"]);
    } else {
      let user = event.recipient_name || event.recipient;
      let plan = TwitchSubEvent.PlanName(`${event.plan_id}`);
      $m.text(Strings.AnonGiftSub(plan, user));
    }
    $m.html($m.html() + e + "&nbsp;");
    $w.append($m);
    this._checkUndefined(event, $w);
    return $w;
  }

  /* Returns jquery node */
  raid(event) {
    let $w = $(`<div class="chat-line raid"></div>`);
    let $m = $(`<span class="message raid-message"></span>`);
    let e = this.twitchEmote("TombRaid");
    $m.addClass("effect-rainbow").addClass("effect-disco");
    if (event.flags["system-msg"]) {
      $m.text(event.flags["system-msg"]);
    } else {
      /* Unlikely */
      let raider = event.flags["msg-param-displayName"] ||
                   event.flags["msg-param-login"];
      let count = event.flags["msg-param-viewerCount"];
      $m.html(Strings.Raid(raider, count));
    }
    $w.append($m);
    $w.html(e + "&nbsp;" + $w.html());
    this._checkUndefined(event, $w);
    return $w;
  }

  /* Returns jquery node */
  newUser(event) {
    let $e = $(`<div class="chat-line new-user notice"></div>`);
    let $msg = $(`<span class="message" data-message="1"></span>`);
    this._addChatAttrs($e, event);
    $e.append(this._genBadges(event));
    $e.append(this._genName(event));
    $msg.text(event.flags["system-msg"] + " Say hello!");
    $e.html($e.html() + ":&nbsp;");
    $e.append($msg);
    return $e;
  }

  /* Returns jquery node */
  rewardGift(event) {
    let message = `${event.command} TODO`;
    return $(`<div class="message">${message}</div>`);
  }

  /* Returns jquery node */
  mysteryGift(event) {
    let message = `${event.command} TODO`;
    return $(`<div class="message">${message}</div>`);
  }

  /* Returns jquery node */
  giftUpgrade(event) {
    let message = `${event.command} TODO`;
    return $(`<div class="message">${message}</div>`);
  }

  /* Returns jquery node */
  genClip(slug, clip_data, game_data) {
    /* TODO: Polish, CSS */
    Util.Debug("genClip", slug, clip_data, game_data);
    let $w = $("<div class=\"clip-preview\"></div>");
    let streamer = clip_data.broadcaster_name;
    let game = game_data.name;
    let clipper = clip_data.creator_name;
    let title = clip_data.title;
    let image = clip_data.thumbnail_url;
    let $thumbnail = $("<img class=\"clip-thumbnail\" height=\"48px\"/>");
    let $title = $("<div class=\"clip-title\"></div>");
    let $desc = $("<div class=\"clip-desc\"></div>");
    let $creator = $("<div class=\"clip-creator\"></div>");
    $w.attr("data-slug", slug);
    $w.append($thumbnail.attr("src", image));
    $w.append($title.text(title));
    $w.append($desc.text(`${streamer} playing ${game}`));
    $w.append($creator.text(`Clipped by ${clipper}`));
    return $w;
  }

  /* General-use functions below */

  /* Returns jquery node */
  url(href=null, text=null, classes=null, id=null) {
    let $l = $(`<a></a>`);
    if (href) {
      $l.attr("href", href);
    } else {
      $l.attr("href", "javascript:void(0)");
    }
    if (text) {
      $l.text(text);
    } else if (href) {
      $l.text(href);
    } else {
      $l.val("undefined");
    }
    if (Util.IsArray(classes)) {
      for (let c of classes) {
        $l.addClass(c);
      }
    } else if (classes) {
      $l.addClass(classes);
    }
    if (id) {
      $l.attr("id", id);
    }
    return $l;
  }

  /* Returns string */
  checkbox(value, id=null, classes=null, checked=false) {
    let $e = $(`<input type="checkbox" />`);
    $e.attr("value", value);
    if (id) {
      $e.attr("id", id);
    }
    if (Util.IsArray(classes)) {
      for (let c of classes) {
        $e.addClass(c);
      }
    } else {
      $e.addClass(classes);
    }
    if (checked) {
      $e.check();
    }
    return $e[0].outerHTML;
  }
}

/* globals Strings GetCheerStyle */

/* vim: set ts=2 sts=2 sw=2 et: */
