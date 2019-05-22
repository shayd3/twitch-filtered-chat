/* HTML Generator for the Twitch Filtered Chat */

"use strict";

/* TODO:
 * Implement "new user" ritual
 * Implement "light" and "dark" colorschemes
 * Add emote information on hover
 * Add badge information on hover (broken?)
 * Add clip information on hover
 */

/* exported HTMLGenerator */
class HTMLGenerator {
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

    /* Ensure config has certain values */
    if (!this._config.Layout) this._config.Layout = {};
    if (!this._config.ShowClips) this._config.ShowClips = false;
  }

  get name() {
    return this._client.GetName();
  }

  setValue(k, v) {
    this._config[k] = v;
  }

  getValue(k) {
    return this._config[k];
  }

  set bgcolors(colors) {
    this._bg_colors = [];
    for (let c of colors) {
      this._bg_colors.push(c);
    }
  }

  getColorFor(username) {
    let name = `${username}`;
    if (typeof(username) !== "string") {
      Util.Error(`Expected string, got ${typeof(username)}: ` +
                 JSON.stringify(username));
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

  genBorderCSS(color) {
    let border = Util.GetMaxContrast(color, this._bg_colors);
    return [
      "text-shadow",
      `-0.8px -0.8px 0 ${border}, 0.8px -0.8px 0 ${border},
       -0.8px  0.8px 0 ${border}, 0.8px  0.8px 0 ${border}`
    ];
  }

  genName(name, color) {
    let $e = $(`<span class="username"></span>`);
    if (color) {
      $e.css('color', color);
    } else if (this.getColorFor(name)) {
      $e.css("color", this.getColorFor(name));
    } else {
      $e.css("color", "#ffffff");
    }
    /* Determine the best border color to use */
    let [attr, val] = this.genBorderCSS($e.css("color"));
    $e.css(attr, val);
    /* Makes it so clicking on the name opens the context window */
    $e.attr('data-username', '1');
    $e.text(name);
    return $e[0].outerHTML;
  }

  formatURLs(message) {
    let $m = $("<span></span>").html(message);
    /* SearchTree predicate */
    function text_and_has_url(elem) {
      if (elem.nodeType === Node.TEXT_NODE) {
        if (elem.nodeValue.match(Util.URL_REGEX)) {
          return true;
        }
      }
      return false;
    }
    /* SplitByMatches map function */
    let to_url = (u) => new URL(Util.URL(u));
    /* Obtain text nodes with URLs */
    let nodes = Util.SearchTree($m[0], text_and_has_url);
    let replace_info = [];
    /* Populate nodes and their new contents */
    for (let node of nodes) {
      let matches = node.nodeValue.match(Util.URL_REGEX);
      let parts = Util.SplitByMatches(node.nodeValue, matches, to_url);
      let newNodes = [];
      for (let part of parts) {
        let newnode = Util.CreateNode(part);
        if (part instanceof URL) {
          if (part.host === "clips.twitch.tv" && this._config.ShowClips) {
            newnode.setAttribute("onmouseover", "onURLHover(this, true)");
            newnode.setAttribute("onmouseout", "onURLHover(this, false)");
          }
        }
        newNodes.push(newnode);
      }
      replace_info.push([node.parentNode, newNodes]);
    }
    /* Replace the nodes' contents with the new children */
    for (let [node, children] of replace_info) {
      node.innerHTML = "";
      for (let child of children) {
        node.innerHTML += Util.GetHTML(child);
      }
    }
    return $m[0].innerHTML;
  }

  _checkUndefined(ev, $w) {
    if ($w[0].outerHTML.indexOf("undefined") > -1) {
      Util.Error("msg contains undefined");
      Util.ErrorOnly(ev, $w, $w[0].outerHTML);
    }
  }

  _remap(map, mstart, mend, len) {
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
    let start = map[mstart];
    let end = map[mend];
    for (let idx = mstart; idx < map.length; ++idx) {
      if (map[idx] - map[mstart] >= (end - start)) {
        map[idx] += len - (end - start);
      }
    }
  }

  _twitchEmote(emote) {
    /* Usage: _twitchEmote({id: "Kappa", name: "Kappa"}) */
    if (emote.id !== null) {
      let $e = $(`<img class="emote twitch-emote" />`);
      $e.attr("tw-emote-src", "twitch");
      $e.attr("tw-emote-id", emote.id);
      $e.attr("src", this._client.GetEmote(emote.id));
      if (emote.name) {
        $e.attr("alt", emote.name);
        $e.attr("title", emote.name);
      }
      let html = $e[0].outerHTML;
      emote.final_length = html.length;
      return html;
    }
    return null;
  }

  _addonEmote(addon, src, id, w=null, h=null) {
    let ident = addon.replace(/[^a-z0-9_]/g, "");
    let $i = $(`<img class="emote">`);
    $i.addClass(`${ident}-emote`);
    $i.attr(`${ident}-emote-id`, id);
    $i.attr("src", src);
    if (w !== null) {
      $i.attr("width", w);
    }
    if (h !== null) {
      $i.attr("height", h);
    }
    return $i[0].outerHTML;
  }

  _genCheer(cheer, bits) {
    /* Use the highest tier image that doesn't exceed the cheered bits */
    let t = cheer.tiers.filter((n) => bits >= n.min_bits).max((n) => n.min_bits);
    /* Use the smallest scale available */
    let url = t.images.dark.animated[cheer.scales.min((s) => +s)];
    let $w = $(`<span class="cheer cheermote"></span>`);
    $w.css('color', t.color);
    let $img = $(`<img class="cheer-image" />`);
    $img.attr('alt', cheer.prefix).attr('title', cheer.prefix);
    $img.attr('src', url);
    $w.append($img);
    $w.append(bits);
    return $w[0].outerHTML;
  }

  _genTwitchBadge(event, badge_name, badge_num) {
    let $b = $(`<img class="badge" width="18px" height="18px" />`);
    $b.attr('tw-badge-cause', JSON.stringify([badge_name, badge_num]));
    $b.attr('data-badge', '1');
    $b.attr('data-badge-name', badge_name);
    $b.attr('data-badge-num', badge_num);
    $b.attr('title', `${badge_name}/${badge_num}`);
    $b.attr('alt', `${badge_name}/${badge_num}`);
    if (this._client.IsGlobalBadge(badge_name, badge_num)) {
      let badge_info = this._client.GetGlobalBadge(badge_name, badge_num);
      $b.attr('src', badge_info.image_url_1x);
      $b.attr('tw-badge-scope', 'global');
      $b.attr("data-text", `Global badge`);
    } else if (this._client.IsChannelBadge(event.channel, badge_name)) {
      let badge_info = this._client.GetChannelBadge(event.channel, badge_name);
      let badge_src = badge_info.alpha || badge_info.image;
      $b.attr('src', badge_src);
      $b.attr('tw-badge', JSON.stringify(badge_info));
      $b.attr("data-text", `Channel badge`);
      if (event.channel) {
        $b.attr('tw-badge-scope', 'channel');
        $b.attr('tw-badge-channel', event.channel.channel.replace(/^#/, ""));
      }
    } else {
      return null;
    }
    return $b;
  }

  _genBadges(event) {
    let $bc = $(`<span class="badges" data-badges="1"></span>`);
    $bc.addClass('badges');
    let total_width = 0;
    if (event.flags['badges']) {
      total_width += 18 * event.flags['badges'].length
    }
    if (event.flags['ffz-badges']) {
      total_width += 18 * event.flags['ffz-badges'].length
    }
    if (event.flags['bttv-badges']) {
      total_width += 18 * event.flags['bttv-badges'].length
    }
    $bc.css("overflow", "hidden");
    $bc.css("width", `${total_width}px`);
    $bc.css("max-width", `${total_width}px`);
    /* Add Twitch-native badges */
    if (event.flags.badges) {
      for (let [badge_name, badge_num] of event.flags.badges) {
        let $b = this._genTwitchBadge(event, badge_name, badge_num);
        if ($b === null) {
          Util.Warn('Unknown badge', badge_name, badge_num, 'for', event);
          continue;
        } else {
          $bc.append($b);
        }
      }
    }
    /* Add FFZ badges */
    if (event.flags['ffz-badges']) {
      for (let badge of Object.values(event.flags['ffz-badges'])) {
        let $b = $(`<img class="badge ffz-badge" width="18px" height="18px" />`);
        $b.attr('data-badge', '1');
        $b.attr('data-ffz-badge', '1');
        $b.attr('tw-badge-scope', 'ffz');
        $b.attr('src', Util.URL(badge.image));
        $b.attr('alt', badge.name);
        $b.attr('title', badge.title);
        $bc.append($b);
      }
    }
    /* For if BTTV ever adds badges
    if (event.flags['bttv-badges']) {
      for (let badge of Object.values(event.flags['bttv-badges'])) {
        let $b = $(`<img class="badge bttv-badge" width="18px" height="18px" />`);
        $b.attr('data-badge', '1');
        $b.attr('data-ffz-badge', '1');
        $b.attr('tw-badge-scope', 'ffz');
      }
    } */
    return $bc;
  }

  _genName(event) {
    /* Display upper-case name, assign color to lower-case name */
    let user = event.name || event.user;
    let color = event.flags.color || this.getColorFor(event.user);
    if (!color) { color = '#ffffff'; }
    return this.genName(user, color);
  }

  _msgCheersTransform(event, message, map, $msg, $effects) {
    if (event.flags.bits && event.flags.bits > 0) {
      let bits_left = event.flags.bits;
      let matches = this._client.FindCheers(event.channel, event.message);
      /* Sort the cheer matches from right-to-left */
      matches.sort((a, b) => a.start - b.start);
      while (matches.length > 0) {
        let match = matches.pop();
        let [start, end] = [map[match.start], map[match.end]];
        let cheer_html = this._genCheer(match.cheer, match.bits);
        /* Insert the cheer HTML and adjust the map */
        message = message.substr(0, start) + cheer_html + message.substr(end);
        this._remap(map, match.start, match.end, cheer_html.length);
        /* Scan for cheer effects */
        let pos = start + cheer_html.length;
        start = pos;
        end = pos;
        while (pos < message.length) {
          let word = "";
          if (message[pos].match(/\s/)) {
            pos += 1;
          } else {
            /* NOTE: This would be cleaner with some kind of "search starting
             * from" function */
            end = message.substr(pos).search(/\s/);
            end = end === -1 ? message.length : pos + end;
            word = message.substring(pos, end);
            let s = GetCheerStyle(word.toLowerCase());
            /* Stop scanning at the first non-effect word */
            if (!s) {
              end = pos;
              break;
            } else if (!s._disabled && bits_left >= s.cost) {
              /* Don't stop scanning for disabled effects, or if the effect
               * uses more bits than are left */
              $effects.push(s);
              bits_left -= s.cost;
            }
            pos = end;
          }
        }
        if (start !== end) {
          /* Remove [start:end] from the message and adjust the map */
          message = message.substr(0, start) + ' ' + message.substr(end);
          this._remap(map, start, end, 0);
        }
      }
    }
    return message;
  }

  _msgEmotesTransform(event, message, map, $msg, $effects) {
    if (event.flags.emotes) {
      let emotes = event.flags.emotes.map(function(e) {
        return {'id': e.id, 'name': e.name,
                'start': map[e.start], 'end': map[e.end],
                'ostart': e.start, 'oend': e.end};
      });
      emotes.sort((a, b) => a.start - b.start);
      while (emotes.length > 0) {
        let emote = emotes.pop();
        let msg_start = message.substr(0, emote.start);
        let msg_end = message.substr(emote.end+1);
        let emote_str = this._twitchEmote(emote);
        message = `${msg_start}${emote_str}${msg_end}`;
        /* Adjust the map */
        for (let idx = emote.ostart; idx < map.length; ++idx) {
          if (map[idx] >= emote.end) {
            map[idx] += emote.final_length - (emote.end - emote.start) - 1;
          }
        }
      }
    }
    return message;
  }

  _msgFFZEmotesTransform(event, message, map, $msg, $effects) {
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
        let emote_str = this._addonEmote("ffz", url, edef.id, edef.width, edef.height);
        let msg_start = message.substr(0, map[emote.start]);
        let msg_end = message.substr(map[emote.end+1]);
        message = `${msg_start}${emote_str}${msg_end}`;
        /* Adjust the map */
        this._remap(map, emote.start, emote.end+1, emote_str.length)
      }
    }
    return message;
  }

  _msgBTTVEmotesTransform(event, message, map, $msg, $effects) {
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
      let emote_str = this._addonEmote("bttv", edef.url, edef.id);
      let msg_start = message.substr(0, map[emote.start]);
      let msg_end = message.substr(map[emote.end+1]);
      message = `${msg_start}${emote_str}${msg_end}`;
      /* Adjust the map */
      this._remap(map, emote.start, emote.end+1, emote_str.length);
    }
    return message;
  }

  _msgAtUserTransform(event, message, map, $msg, $effects) {
    let pat = /(^|\b\s*)(@\w+)(\s*\b|$)/g;
    message = message.replace(pat, (function(m, p1, p2, p3) {
      if (p2.substr(1).toLowerCase() === this.name.toLowerCase()) {
        $msg.addClass("highlight");
        return `${p1}<em class="at-user at-self">${p2}</em>${p3}`;
      } else {
        return `${p1}<em class="at-user">${p2}</em>${p3}`;
      }
    }).bind(this));
    return message;
  }

  _msgURLTransform(event, message, map, $msg, $effects) {
    return this.formatURLs(message);
  }

  _genMsgInfo(event) {
    let $msg = $(`<span class="message" data-message="1"></span>`);
    let $effects = [];

    /* Escape the message, keeping track of how characters move */
    let [message, map] = Util.EscapeWithMap(event.message);
    map.push(message.length); /* Prevent off-the-end mistakes */

    /* Handle early mod-only antics */
    if (!$("#cbForce").is(":checked") && event.ismod) {
      let word0 = event.message.split(" ")[0];
      if (word0 === "force") {
        event.flags.force = true;
      } else if (word0 === "forcejs") {
        event.flags.force = true;
      } else if (word0 === "forcebits" || word0 === "forcecheer") {
        let wordlen = word0.length;
        let msgprefix = "cheer1000";
        while (msgprefix.length < word0.length) {
          msgprefix += ' ';
        }
        /* Modify message and event.message, as they're both used below */
        event.values.message = msgprefix + event.message.substr(wordlen);
        message = msgprefix + message.substr(wordlen);
        event.flags.bits = 1000;
        event.flags.force = true;
      }
    }

    /* Apply message transformations */
    message = this._msgEmotesTransform(event, message, map, $msg, $effects);
    message = this._msgCheersTransform(event, message, map, $msg, $effects);
    message = this._msgFFZEmotesTransform(event, message, map, $msg, $effects);
    message = this._msgBTTVEmotesTransform(event, message, map, $msg, $effects);
    message = this._msgAtUserTransform(event, message, map, $msg, $effects);
    message = this._msgURLTransform(event, message, map, $msg, $effects);

    /* Handle mod-only antics */
    if (event.ismod && !$("#cbForce").is(":checked") && event.flags.force) {
      if (event.message.startsWith('force ')) {
        /* "force": use raw message with no formatting */
        message = event.message.substr('force '.length);
      } else if (event.message.startsWith('forcejs ')) {
        /* "forcejs": use raw message wrapped in script tags */
        message = `<script>${event.message.substr('forcejs '.length)}</script>`;
      }
    }

    $msg.html(message);

    return {e: $msg, effects: $effects};
  }

  _addChatAttrs($e, event) {
    $e.attr("data-id", event.flags.id);
    $e.attr("data-user", event.user);
    $e.attr("data-user-id", event.flags["user-id"]);
    $e.attr("data-channel", event.channel.channel.replace(/^#/, ""));
    if (event.channel.room) {
      $e.attr("data-room", event.channel.room);
    }
    if (event.channel.roomuid) {
      $e.attr("data-roomuid", event.channel.roomuid);
    }
    $e.attr("data-channel-id", event.flags["room-id"]);
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

  _genSubWrapper(event) {
    let $e = $(`<div></div>`);
    $e.addClass("chat-line").addClass("sub").addClass("notice");
    $e.append($(this._genBadges(event)));
    $e.append($(this._genName(event)));
    $e.html($e.html() + "&nbsp;");
    return $e;
  }

  gen(event) {
    let $e = $(`<div class="chat-line"></div>`);
    let color = event.flags.color || this.getColorFor(event.user);
    if (this._client.IsUIDSelf(event.flags["user-id"])) {
      $e.addClass('self');
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
    $e.append($(this._genBadges(event)));
    $e.append($(this._genName(event)));
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
    $e.append($(html_pre.join("") + msg_def.e[0].outerHTML + html_post.join("")));
    return $e[0].outerHTML;
  }

  sub(event) {
    let $w = this._genSubWrapper(event);
    let $m = $(`<span class="message sub-message"></span>`);
    let e = this._twitchEmote({"id": "PogChamp"});
    $m.text(Strings.Sub(TwitchSubEvent.PlanName(event.plan_id)));
    $m.html(e + "&nbsp;" + $m.html());
    $w.append($m);
    this._checkUndefined(event, $w);
    return $w[0].outerHTML;
  }

  resub(event) {
    let $w = this._genSubWrapper(event);
    let $m = $(`<span class="message sub-message"></span>`);
    let e = this._twitchEmote({"id": "PogChamp"});
    let months = event.months || event.total_months;
    let streak = event.streak_months;
    let plan = TwitchSubEvent.PlanName(event.plan_id);
    if (event.share_streak) {
      $m.text(Strings.ResubStreak(months, plan, streak));
    } else {
      $m.text(Strings.Resub(months, plan));
    }
    $m.html(e + "&nbsp;" + $m.html());
    $w.append($m);
    this._checkUndefined(event, $w);
    return $w[0].outerHTML;
  }

  giftsub(event) {
    let $w = this._genSubWrapper(event);
    let $m = $(`<span class="message sub-message"></span>`);
    if (event.flags['system-msg']) {
      $m.text(event.flags['system-msg']);
    } else {
      let user = event.recipient;
      let gifter = event.user;
      let plan = TwitchSubEvent.PlanName(event.plan_id);
      $m.text(Strings.GiftSub(gifter, plan, user));
    }
    let e = this._twitchEmote({"id": "HolidayPresent"});
    $m.html(e + "&nbsp;" + $m.html());
    $w.append($m);
    this._checkUndefined(event, $w);
    return $w[0].outerHTML;
  }

  anongiftsub(event) {
    let $w = this._genSubWrapper(event);
    let $m = $(`<span class="message sub-message"></span>`);
    if (event.flags["system-msg"]) {
      $m.text(event.flags["system-msg"]);
    } else {
      let user = event.recipient_name || event.recipient;
      let plan = TwitchSubEvent.PlanName(event.plan_id);
      $m.text(Strings.AnonGiftSub(plan, user));
    }
    let e = this._twitchEmote({"id": "HolidayPresent"});
    $m.html(e + "&nbsp;" + $m.html());
    $w.append($m);
    this._checkUndefined(event, $w);
    return $w[0].outerHTML;
  }

  raid(event) {
    let $w = $(`<div class="chat-line raid"></div>`);
    if (event.flags["system-msg"]) {
      $w.text(event.flags["system-msg"]);
    } else {
      /* Unlikely */
      let raider = event.flags["msg-param-displayName"] ||
                   event.flags["msg-param-login"];
      let count = event.flags["msg-param-viewerCount"];
      let user = this.genName(raider, event.flags.color);
      $w.html(Strings.Raid(user, count));
    }
    let e = this._twitchEmote({"id": "TombRaid"});
    $w.html(e + "&nbsp;" + $w.html());
    this._checkUndefined(event, $w);
    return $w[0].outerHTML;
  }

  new_user(event) { /* TODO */
    /* Strings.NewUser(event.user) */
  }

  /* General-use functions below */

  url(href=null, text=null, classes=null, id=null) {
    let $l = $(`<a></a>`);
    if (href !== null) {
      $l.attr("href", href);
    } else {
      $l.attr("href", "javascript:void(0)");
    }
    if (text !== null) {
      $l.text(text);
    } else if (href !== null) {
      $l.text(href);
    } else {
      $l.val("undefined");
    }
    if (classes !== null) {
      if (typeof(classes) === "string") {
        $l.addClass(classes);
      } else {
        for (let c of classes) {
          $l.addClass(c);
        }
      }
    }
    if (id !== null) {
      $l.attr("id", id);
    }
    return $l[0].outerHTML;
  }

  checkbox(value, id=null, classes=null, checked=false) {
    let $e = $(`<input type="checkbox" />`);
    $e.attr("value", value);
    if (id !== null) {
      $e.attr("id", id);
    }
    if (typeof(classes) === "string") {
      $e.addClass(classes);
    } else {
      for (let c of classes) {
        $e.addClass(c);
      }
    }
    if (checked !== null) {
      $e.attr("checked", "checked");
    }
    return $e[0].outerHTML;
  }
}

/* vim: set ts=2 sts=2 sw=2 et: */
