/* HTML Generator for the Twitch Filtered Chat (v2) */

"use strict";

/* TODO:
 * Implement raid and calling code
 * Fix URL formatting with emotes (URLs in emotes are formatted)
 */

/* Fold methods
%g/^  [^ ].*{$/norm $zf%
 */

class HTMLGenerator {
  constructor() {
    this._client = null;
    this._config = null;
    this._default_colors = ["lightseagreen", "forestgreen", "goldenrod", "dodgerblue", "darkorchid", "crimson"];
    this._user_colors = {};
  }
  set client(c) { this._client = c; }
  set config(c) { this._config = c; }
  /* Generation from chat events */
  getColorFor(username) {
    if (!this._user_colors.hasOwnProperty(username)) {
      /* Taken from Twitch vendor javascript */
      var r = 0;
      for (let i = 0; i < username.length; ++i) {
        r = (r << 5) - r + username.charCodeAt(i);
      }
      r = r % this._default_colors.length;
      if (r < 0) r += this._default_colors.length;
      let c = this._default_colors[r];
      this._user_colors[username] = c;
    }
    return this._user_colors[username];
  }
  _twitchEmote(emote) {
    if (emote.id !== null) {
      let $e = $(`<img class="emote twitch-emote" />`);
      $e.attr('tw-emote-id', emote.id);
      $e.attr('src', Twitch.URL.Emote(emote.id));
      let html = $e[0].outerHTML;
      emote.final_length = html.length;
      return html;
    }
    return null;
  }
  _genCheer(cheer, bits) {
    /* Use the highest tier that doesn't exceed the cheered bits */
    let t = cheer.tiers.filter((t) => bits >= t.min_bits).max((t) => t.min_bits);
    let color = t.color;
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
    if (this._client.IsGlobalBadge(badge_name, badge_num)) {
      let badge_info = this._client.GetGlobalBadge(badge_name, badge_num);
      $b.attr('src', badge_info.image_url_1x);
      $b.attr('tw-badge-scope', 'global');
      $b.attr('alt', badge_info.title);
    } else if (this._client.IsChannelBadge(event.channel, badge_name)) {
      let badge_info = this._client.GetChannelBadge(event.channel, badge_name);
      let badge_src = !!badge_info.alpha ? badge_info.alpha : badge_info.image;
      $b.attr('src', badge_src);
      $b.attr('tw-badge', JSON.stringify(badge_info));
      if (!!event.channel) {
        $b.attr('tw-badge-scope', 'channel');
        $b.attr('tw-badge-channel', event.channel.channel.lstrip('#'));
      }
    } else {
      return null;
    }
    return $b;
  }
  _genBadges(event) {
    let $bc = $(`<span class="badges" data-badges="1"></span>`);
    $bc.addClass('badges');
    $bc.attr('data-badges', '1');
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
          console.warn('Unknown badge', badge_name, badge_num, 'for', event);
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
    if (event.flags['bttv-badges']) {
      for (let badge of Object.values(event.flags['bttv-badges'])) {
        let $b = $(`<img class="badge bttv-badge" width="18px" height="18px" />`);
        $b.attr('data-badge', '1');
        $b.attr('data-ffz-badge', '1');
        $b.attr('tw-badge-scope', 'ffz');
        /* For if BTTV ever adds badges */
      }
    }
    return $bc;
  }
  _genName(event) {
    let user = event.flag("display-name");
    if (!user) user = event.user;
    let $e = $(`<span class="username" data-username="1"></span>`);
    $e.addClass('username');
    $e.attr('data-username', '1');
    let color = event.flags.color;
    /* Add "low-contrast" for usernames hard to see */
    let c1 = Util.ContrastRatio(color, '#303030')
    let c2 = Util.ContrastRatio(color, '#0e0e0e')
    $e.attr('data-contrast-1', c1);
    $e.attr('data-contrast-2', c2);
    if (c1 < 4 && c2 < 4) { $e.addClass("low-contrast"); }
    $e.css('color', color);
    $e.html(user.escape());
    return $e[0].outerHTML;
  }
  _genMsgInfo(event) {
    let $msg = $(`<span class="message" data-message="1"></span>`);
    let $effects = [];

    /* Escape the message, keeping track of how characters move */
    let [message, map] = Util.EscapeWithMap(event.message);
    map.push(message.length); /* Prevent off-the-end mistakes */

    /* Kept for testing
    console.log("m1=", JSON.stringify(message), ";", "map1=", JSON.stringify(map), ";");
    */

    /* Handle early mod-only antics */
    if (!$("#cbForce").is(":checked") && event.ismod) {
      let word0 = event.message.split(" ")[0];
      if (word0 == "force") {
        event.flags.force = true;
      } else if (word0 == "forcejs") {
        event.flags.force = true;
      } else if (word0 == "forcebits" || word0 == "forcecheer") {
        /* Modify both message and event.message, as they're both used below */
        if (word0.length == 9) {
          event.values.message = "cheer1000" + event.message.substr(9);
          message = "cheer1000" + message.substr(9);
        } else if (word0.length == 10) {
          event.values.message = "cheer1000" + event.message.substr(10);
          message = "cheer1000 " + message.substr(10);
        }
        event.flags.bits = 1000;
        event.flags.force = true;
      }
    }
    /* Handle emotes */
    if (event.flag('emotes')) {
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
        /* Shift the entire map to keep track */
        for (let idx = emote.ostart; idx < map.length; ++idx) {
          if (map[idx] < emote.end) {
            /* All characters within the emote point to the emote's end */
            map[idx] = emote.final_length;
          } else {
            /* All characters after are shifted by the change in length */
            map[idx] += emote.final_length - (emote.end - emote.start) - 1;
          }
        }
      }
    }

    /* Kept for testing
    console.log("m2=", JSON.stringify(message), ";", "map2=", JSON.stringify(map), ";");
    */

    /* Handle cheers */
    if (event.flag('bits') && event.flag('bits') > 0) {
      let bits_left = event.flag('bits');
      let matches = this._client.FindCheers(event.channel.channel, event.message);
      matches.sort((a, b) => a.start - b.start);
      while (matches.length > 0) {
        let match = matches.pop();
        let cheer = match.cheer;
        let bits = match.bits;
        let start = map[match.start];
        let end = map[match.end];
        let chtml = this._genCheer(cheer, bits);
        /* Place the cheer HTML in the proper spot */
        let msg_start = message.substr(0, start);
        let msg_end = message.substr(end);
        message = msg_start + chtml + msg_end;
        for (let idx = match.start; idx < map.length; ++idx) {
          if (map[idx] - map[match.start] < (end - start)) {
            /* Inside the modified range */
          } else {
            /* After the modified range */
            map[idx] += chtml.length - (end - start);
          }
        }
        let end_words = msg_end.trimStart().split(" ");
        /* Scan words after the cheer for effects */
        while (end_words.length > 0) {
          let s = null;
          /* CSSCheerStyles and ColorNames have our valid styles */
          if (CSSCheerStyles.hasOwnProperty(end_words[0])) {
            s = CSSCheerStyles[end_words[0]];
          } else if (ColorNames.hasOwnProperty(end_words[0])) {
            s = CSSColorStyle(ColorNames[end_words[0]]);
          }
          if (s == null) break;
          if (!s._disabled) {
            if (bits_left < s.cost) break;
            $effects.push(s);
            bits_left -= s.cost;
          }
          end_words.shift();
        }
      }
    }

    /* Kept for testing
    console.log("m3=", JSON.stringify(message), ";", "map3=", JSON.stringify(map), ";");
    */

    /* Handle FFZ emotes */
    let ffz_emotes = this._client.GetFFZEmotes(event.channel.channel);
    if (ffz_emotes && ffz_emotes.emotes) {
      let ffz_emote_arr = [];
      for (let [k,v] of Object.entries(ffz_emotes.emotes)) {
        ffz_emote_arr.push([v, k]);
      }
      let results = Twitch.ScanEmotes(event.message, ffz_emote_arr);
      results.sort((a, b) => (a.start - b.start));
      while (results.length > 0) {
        let emote = results.pop();
        let start = emote.start;
        let end = emote.end+1;
        let mstart = map[start];
        let mend = map[end];
        let url = emote.id.urls[Object.keys(emote.id.urls).min()];
        let $i = $(`<img class="emote ffz-emote" ffz-emote-id=${emote.id.id} />`);
        $i.attr('src', url);
        $i.attr('width', emote.id.width);
        $i.attr('height', emote.id.height);
        let msg_start = message.substr(0, mstart);
        let msg_end = message.substr(mend);
        let emote_str = $i[0].outerHTML;
        message = `${msg_start}${emote_str}${msg_end}`;
        for (let idx = emote.start; idx < map.length; ++idx) {
          if (map[idx] - map[emote.start] < (end - start)) {
            /* Inside the modified range */
          } else {
            /* After the modified range */
            map[idx] += emote_str.length - (end - start);
          }
        }
      }
    }

    /* Handle BTTV emotes */
    let bttv_emotes = this._client.GetBTTVEmotes(event.channel.channel);
    if (bttv_emotes && bttv_emotes.emotes) {
      let bttv_emote_arr = [];
      for (let [k,v] of Object.entries(bttv_emotes.emotes)) {
        bttv_emote_arr.push([v, k]);
      }
      let results = Twitch.ScanEmotes(event.message, bttv_emote_arr);
      results.sort((a, b) => (a.start - b.start));
      if (results.length > 0) {
        console.log(results);
      }
      while (results.length > 0) {
        let emote = results.pop();
        let start = emote.start;
        let end = emote.end+1;
        let mstart = map[start];
        let mend = map[end];
        let $i = $(`<img class="emote bttv-emote" bttv-emote-id="${emote.id.id}" />`);
        $i.attr("src", emote.id.url);
        let msg_start = message.substr(0, mstart);
        let msg_end = message.substr(mend);
        let emote_str = $i[0].outerHTML;
        message = `${msg_start}${emote_str}${msg_end}`;
        for (let idx = emote.start; idx < map.length; ++idx) {
          if (map[idx] - map[emote.start] < (end - start)) {
            /* Inside the modified range */
          } else {
            /* After the modified range */
            map[idx] += emote_str.length - (end - start);
          }
        }
      }
    }

    /* Kept for testing
    console.log("m4=", JSON.stringify(message), ";", "map4=", JSON.stringify(map), ";");
    */

    /* @user highlighting */
    message = message.replace(/(^|\b\s*)(@\w+)(\s*\b|$)/g, function(m, p1, p2, p3) {
      if (p2.substr(1).toLowerCase() == this._client.GetName().toLowerCase()) {
        $msg.addClass("highlight");
      }
      return `${p1}<em>${p2}</em>${p3}`;
    });
    /* Handle mod-only antics */
    if (event.ismod && !$("#cbForce").is(":checked") && event.flags.force) {
      if (event.message.startsWith('force ')) {
        /* Force: undo everything above and put the message, unescaped, as-is */
        message = event.message.replace('force ', '');
      } else if (event.message.startsWith('forcejs ')) {
        /* Forcejs: undo everything above and wrap unescaped message in script tags */
        message = `<script>${event.message.replace('forcejs ', '')}</script>`;
      }
    }
    /* FIXME: url formatting breaks emotes, as URLs inside <img> elements are formatted
    message = message.replace(Util.URL_REGEX, function(url) {
      let u = new URL(url);
      return `<a href="${u}" target="_blank">${u}</a>`;
    });*/
    $msg.html(message);
    return {e: $msg, effects: $effects};
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
    if (!event.flags.color) event.flags.color = this.getColorFor(event.user);
    if (this._client.IsUIDSelf(event.flags["user-id"])) {
      $e.addClass('self');
    }
    $e.attr("data-id", event.flags.id);
    $e.attr("data-user", event.user);
    $e.attr("data-user-id", event.flags["user-id"]);
    $e.attr("data-channel", event.channel.channel.lstrip('#'));
    if (!!event.channel.room)
      $e.attr("data-room", event.channel.room);
    if (!!event.channel.roomuid)
      $e.attr("data-roomuid", event.channel.roomuid);
    $e.attr("data-channelid", event.flags["room-id"]);
    $e.attr("data-subscriber", event.flags.subscriber);
    $e.attr("data-mod", event.flags.mod);
    $e.attr("data-vip", event.isvip ? "1" : "0");
    $e.attr("data-caster", event.flags.broadcaster ? "1" : "0");
    $e.attr("data-sent-ts", event.flags["tmi-sent-ts"]);
    $e.attr("data-recv-ts", Date.now());
    let badges_elem = $(this._genBadges(event));
    let name_elem = $(this._genName(event));
    let msg_def = this._genMsgInfo(event);
    $e.append(badges_elem);
    $e.append(name_elem);
    if (!event.values.action) {
      $e.html($e.html() + ":");
    } else {
      msg_def.e.css("color", event.flags.color);
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
    $w.append($(`<span class="message sub-message">subscribed using ${event.value('sub_plan').escape()}!</span>`));
    return $w[0].outerHTML;
  }
  resub(event) {
    let $w = this._genSubWrapper(event);
    if (event.value('sub_streak_months')) {
      $w.append($(`<span class="message sub-message">resubscribed for ${event.value('sub_months')} months, a streak of ${event.value('sub_streak_months')} months!</span>`));
    } else {
      $w.append($(`<span class="message sub-message">resubscribed for ${event.value('sub_months')} months!</span>`));
    }
    return $w[0].outerHTML;
  }
  giftsub(event) {
    let user = event.flag('msg-param-recipient-user-name');
    let gifter = event.flag('login');
    let months = event.flag('msg-param-sub-months');
    return `${event.command}: ${gifter} gifted to ${user} ${months}`;
  }
  anongiftsub(event) {
    let user = event.flag('msg-param-recipient-user-name');
    let gifter = event.flag('login');
    let months = event.flag('msg-param-sub-months');
    return `${event.command}: ${gifter} gifted to ${user} ${months}`;
  }
  raid(event) {
    /* TODO */
  }

  /* General-use */
  url(href=null, text=null, classes=null, id=null) {
    let $l = $(`<a></a>`);
    if (href !== null) {
      $l.attr("href", href);
    } else {
      $l.attr("href", "javascript:void(0)");
    }
    if (text !== null) {
      $l.html(text.escape());
    } else if (href !== null) {
      $l.html(href.escape());
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
