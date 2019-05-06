/* HTML Generator for the Twitch Filtered Chat */

"use strict";

/* TODO:
 * Implement raid and calling code
 * Implement TwitchSubEvent htmlgen
 * Fix URL formatting with emotes (URLs in emotes are formatted)
 * Fix the following username colors:
 *   #725ac1
 */

/** Chat message structure
 *
 * div.line.line-wrapper
 *  div.chat-line (has attrs)
 *   span.badges
 *    img.badge
 *   span.username
 *   span.message
 *
 * div.chat-line attrs:
 *  data-id
 *  data-user
 *  data-user-id
 *  data-channel
 *  data-channel-id
 *  data-subscriber
 *  data-vip
 *  data-mod
 *  data-caster
 *  data-sent-ts
 *  data-recv-ts
 */

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HTMLGenerator = function () {
  function HTMLGenerator(client) {
    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    _classCallCheck(this, HTMLGenerator);

    this._client = client;
    this._config = config || {};
    this._default_colors = ["lightseagreen", "forestgreen", "goldenrod", "dodgerblue", "darkorchid", "crimson"];
    this._user_colors = {};
    this._bg_colors = [];

    /* Ensure config has certain values */
    if (!this._config.Layout) this._config.Layout = {};
  }

  _createClass(HTMLGenerator, [{
    key: "setValue",
    value: function setValue(k, v) {
      this._config[k] = v;
    }
  }, {
    key: "getValue",
    value: function getValue(k) {
      return this._config[k];
    }

    /* Generation from chat events */

  }, {
    key: "getColorFor",
    value: function getColorFor(username) {
      if (!username) {
        /* TODO: figure out why this happens (giftsub in the Tesla) */
        Util.Error("invalid username passed to genColorFor, using random color");
        var i = Math.floor(Math.random() * this._default_colors.length);
        return this._default_colors[i];
      }
      if (!this._user_colors.hasOwnProperty(username)) {
        /* Taken from Twitch vendor javascript */
        var r = 0;
        for (var _i = 0; _i < username.length; ++_i) {
          r = (r << 5) - r + username.charCodeAt(_i);
        }
        r = r % this._default_colors.length;
        if (r < 0) r += this._default_colors.length;
        var c = this._default_colors[r];
        this._user_colors[username] = c;
      }
      /* FIXME: Figure out why this happens on the Tesla */
      if (!this._user_colors[username]) {
        var i = Math.floor(Math.random() * this._default_colors.length);
        this._user_colors[username] = this._default_colors[i];
        Util.Error("user_colors for " + username + " still null; using " + i + ": " + this._user_colors[username]);
      }
      return this._user_colors[username];
    }
  }, {
    key: "_twitchEmote",
    value: function _twitchEmote(emote) {
      if (emote.id !== null) {
        var $e = $("<img class=\"emote twitch-emote\" />");
        $e.attr('tw-emote-id', emote.id);
        $e.attr('src', Twitch.URL.Emote(emote.id));
        if (emote.name) {
          $e.attr('alt', emote.name);
          $e.attr('title', emote.name);
        }
        var html = $e[0].outerHTML;
        emote.final_length = html.length;
        return html;
      }
      return null;
    }
  }, {
    key: "_genCheer",
    value: function _genCheer(cheer, bits) {
      /* Use the highest tier that doesn't exceed the cheered bits */
      var t = cheer.tiers.filter(function (t) {
        return bits >= t.min_bits;
      }).max(function (t) {
        return t.min_bits;
      });
      var color = t.color;
      /* Use the smallest scale available */
      var url = t.images.dark.animated[cheer.scales.min(function (s) {
        return +s;
      })];
      var $w = $("<span class=\"cheer cheermote\"></span>");
      $w.css('color', t.color);
      var $img = $("<img class=\"cheer-image\" />");
      $img.attr('alt', cheer.prefix).attr('title', cheer.prefix);
      $img.attr('src', url);
      $w.append($img);
      $w.append(bits);
      return $w[0].outerHTML;
    }
  }, {
    key: "_genTwitchBadge",
    value: function _genTwitchBadge(event, badge_name, badge_num) {
      var $b = $("<img class=\"badge\" width=\"18px\" height=\"18px\" />");
      $b.attr('tw-badge-cause', JSON.stringify([badge_name, badge_num]));
      $b.attr('data-badge', '1');
      $b.attr('data-badge-name', badge_name);
      $b.attr('data-badge-num', badge_num);
      $b.attr('title', badge_name + "/" + badge_num);
      $b.attr('alt', badge_name + "/" + badge_num);
      if (this._client.IsGlobalBadge(badge_name, badge_num)) {
        var badge_info = this._client.GetGlobalBadge(badge_name, badge_num);
        $b.attr('src', badge_info.image_url_1x);
        $b.attr('tw-badge-scope', 'global');
      } else if (this._client.IsChannelBadge(event.channel, badge_name)) {
        var _badge_info = this._client.GetChannelBadge(event.channel, badge_name);
        var badge_src = !!_badge_info.alpha ? _badge_info.alpha : _badge_info.image;
        $b.attr('src', badge_src);
        $b.attr('tw-badge', JSON.stringify(_badge_info));
        if (!!event.channel) {
          $b.attr('tw-badge-scope', 'channel');
          $b.attr('tw-badge-channel', event.channel.channel.lstrip('#'));
        }
      } else {
        return null;
      }
      return $b;
    }
  }, {
    key: "_genBadges",
    value: function _genBadges(event) {
      var $bc = $("<span class=\"badges\" data-badges=\"1\"></span>");
      $bc.addClass('badges');
      $bc.attr('data-badges', '1');
      var total_width = 0;
      if (event.flags['badges']) {
        total_width += 18 * event.flags['badges'].length;
      }
      if (event.flags['ffz-badges']) {
        total_width += 18 * event.flags['ffz-badges'].length;
      }
      if (event.flags['bttv-badges']) {
        total_width += 18 * event.flags['bttv-badges'].length;
      }
      $bc.css("overflow", "hidden");
      $bc.css("width", total_width + "px");
      $bc.css("max-width", total_width + "px");
      /* Add Twitch-native badges */
      if (event.flags.badges) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = event.flags.badges[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _step$value = _slicedToArray(_step.value, 2),
                badge_name = _step$value[0],
                badge_num = _step$value[1];

            var $b = this._genTwitchBadge(event, badge_name, badge_num);
            if ($b === null) {
              console.warn('Unknown badge', badge_name, badge_num, 'for', event);
              continue;
            } else {
              $bc.append($b);
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
      }
      /* Add FFZ badges */
      if (event.flags['ffz-badges']) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = Object.values(event.flags['ffz-badges'])[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var badge = _step2.value;

            var _$b = $("<img class=\"badge ffz-badge\" width=\"18px\" height=\"18px\" />");
            _$b.attr('data-badge', '1');
            _$b.attr('data-ffz-badge', '1');
            _$b.attr('tw-badge-scope', 'ffz');
            _$b.attr('src', Util.URL(badge.image));
            _$b.attr('alt', badge.name);
            _$b.attr('title', badge.title);
            $bc.append(_$b);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }
      if (event.flags['bttv-badges']) {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = Object.values(event.flags['bttv-badges'])[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var _badge = _step3.value;

            var _$b2 = $("<img class=\"badge bttv-badge\" width=\"18px\" height=\"18px\" />");
            _$b2.attr('data-badge', '1');
            _$b2.attr('data-ffz-badge', '1');
            _$b2.attr('tw-badge-scope', 'ffz');
            /* For if BTTV ever adds badges */
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }
      }
      return $bc;
    }
  }, {
    key: "_genName",
    value: function _genName(event) {
      var user = event.flags["display-name"] || event.user;
      var color = event.flags.color || this.getColorFor(event.user);
      if (!color) {
        color = '#ffffff';
      }
      var $e = $("<span class=\"username\" data-username=\"1\"></span>");
      $e.addClass('username');
      $e.attr('data-username', '1');
      $e.css('color', color);
      /* Calculate "brightness" of the username */
      var luma = new Util.Color(color).yiq[0];
      if (luma >= 128) {
        $e.addClass("luma-dark");
      } else if (luma >= 120) {
        $e.addClass("luma-mid");
      } else {
        $e.addClass("luma-light");
      }
      $e.text(user);
      return $e[0].outerHTML;
    }
  }, {
    key: "_genMsgInfo",
    value: function _genMsgInfo(event) {
      var $msg = $("<span class=\"message\" data-message=\"1\"></span>");
      var $effects = [];

      /* Escape the message, keeping track of how characters move */

      var _Util$EscapeWithMap = Util.EscapeWithMap(event.message),
          _Util$EscapeWithMap2 = _slicedToArray(_Util$EscapeWithMap, 2),
          message = _Util$EscapeWithMap2[0],
          map = _Util$EscapeWithMap2[1];

      map.push(message.length); /* Prevent off-the-end mistakes */

      /* Kept for testing
      console.log("m1=", JSON.stringify(message), ";", "map1=", JSON.stringify(map), ";");
      */

      /* Handle early mod-only antics */
      if (!$("#cbForce").is(":checked") && event.ismod) {
        var word0 = event.message.split(" ")[0];
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
      if (event.flags.emotes) {
        var emotes = event.flags.emotes.map(function (e) {
          return { 'id': e.id, 'name': e.name,
            'start': map[e.start], 'end': map[e.end],
            'ostart': e.start, 'oend': e.end };
        });
        emotes.sort(function (a, b) {
          return a.start - b.start;
        });
        while (emotes.length > 0) {
          var emote = emotes.pop();
          var msg_start = message.substr(0, emote.start);
          var msg_end = message.substr(emote.end + 1);
          var emote_str = this._twitchEmote(emote);
          message = "" + msg_start + emote_str + msg_end;
          /* Shift the entire map to keep track */
          for (var idx = emote.ostart; idx < map.length; ++idx) {
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
      if (event.flags.bits && event.flags.bits > 0) {
        var bits_left = event.flags.bits;
        var matches = this._client.FindCheers(event.channel.channel, event.message);
        matches.sort(function (a, b) {
          return a.start - b.start;
        });
        while (matches.length > 0) {
          var match = matches.pop();
          var cheer = match.cheer;
          var bits = match.bits;
          var start = map[match.start];
          var end = map[match.end];
          var chtml = this._genCheer(cheer, bits);
          /* Place the cheer HTML in the proper spot */
          var _msg_start = message.substr(0, start);
          var _msg_end = message.substr(end);
          message = _msg_start + chtml + _msg_end;
          for (var _idx = match.start; _idx < map.length; ++_idx) {
            if (map[_idx] - map[match.start] < end - start) {
              /* Inside the modified range */
            } else {
              /* After the modified range */
              map[_idx] += chtml.length - (end - start);
            }
          }
          var end_words = _msg_end.trimStart().split(" ");
          /* Scan words after the cheer for effects */
          while (end_words.length > 0) {
            var word = end_words[0].toLowerCase();
            var s = null;
            /* CSSCheerStyles and ColorNames have our valid styles */
            if (CSSCheerStyles.hasOwnProperty(word)) {
              s = CSSCheerStyles[word];
            } else if (ColorNames.hasOwnProperty(word)) {
              s = CSSColorStyle(ColorNames[word]);
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
      var ffz_emotes = this._client.GetFFZEmotes(event.channel.channel);
      if (ffz_emotes && ffz_emotes.emotes) {
        var ffz_emote_arr = [];
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = Object.entries(ffz_emotes.emotes)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _step4$value = _slicedToArray(_step4.value, 2),
                k = _step4$value[0],
                v = _step4$value[1];

            ffz_emote_arr.push([v, k]);
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }

        var results = Twitch.ScanEmotes(event.message, ffz_emote_arr);
        results.sort(function (a, b) {
          return a.start - b.start;
        });
        while (results.length > 0) {
          var _emote = results.pop();
          var _start = _emote.start;
          var _end = _emote.end + 1;
          var mstart = map[_start];
          var mend = map[_end];
          var url = _emote.id.urls[Object.keys(_emote.id.urls).min()];
          var $i = $("<img class=\"emote ffz-emote\" ffz-emote-id=" + _emote.id.id + " />");
          $i.attr('src', url);
          $i.attr('width', _emote.id.width);
          $i.attr('height', _emote.id.height);
          var _msg_start2 = message.substr(0, mstart);
          var _msg_end2 = message.substr(mend);
          var _emote_str = $i[0].outerHTML;
          message = "" + _msg_start2 + _emote_str + _msg_end2;
          for (var _idx2 = _emote.start; _idx2 < map.length; ++_idx2) {
            if (map[_idx2] - map[_emote.start] < _end - _start) {
              /* Inside the modified range */
            } else {
              /* After the modified range */
              map[_idx2] += _emote_str.length - (_end - _start);
            }
          }
        }
      }

      /* Handle BTTV emotes */
      var bttv_emotes = this._client.GetBTTVEmotes(event.channel.channel);
      if (bttv_emotes && bttv_emotes.emotes) {
        var bttv_emote_arr = [];
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = Object.entries(bttv_emotes.emotes)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var _step5$value = _slicedToArray(_step5.value, 2),
                k = _step5$value[0],
                v = _step5$value[1];

            bttv_emote_arr.push([v, k]);
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }

        var _results = Twitch.ScanEmotes(event.message, bttv_emote_arr);
        _results.sort(function (a, b) {
          return a.start - b.start;
        });
        while (_results.length > 0) {
          var _emote2 = _results.pop();
          var _start2 = _emote2.start;
          var _end2 = _emote2.end + 1;
          var _mstart = map[_start2];
          var _mend = map[_end2];
          var _$i = $("<img class=\"emote bttv-emote\" bttv-emote-id=\"" + _emote2.id.id + "\" />");
          _$i.attr("src", _emote2.id.url);
          var _msg_start3 = message.substr(0, _mstart);
          var _msg_end3 = message.substr(_mend);
          var _emote_str2 = _$i[0].outerHTML;
          message = "" + _msg_start3 + _emote_str2 + _msg_end3;
          for (var _idx3 = _emote2.start; _idx3 < map.length; ++_idx3) {
            if (map[_idx3] - map[_emote2.start] < _end2 - _start2) {
              /* Inside the modified range */
            } else {
              /* After the modified range */
              map[_idx3] += _emote_str2.length - (_end2 - _start2);
            }
          }
        }
      }

      /* Kept for testing
      console.log("m4=", JSON.stringify(message), ";", "map4=", JSON.stringify(map), ";");
      */

      /* @user highlighting */
      message = message.replace(/(^|\b\s*)(@\w+)(\s*\b|$)/g, function (m, p1, p2, p3) {
        if (p2.substr(1).toLowerCase() == this._client.GetName().toLowerCase()) {
          $msg.addClass("highlight");
        }
        return p1 + "<em>" + p2 + "</em>" + p3;
      }.bind(this));
      /* Handle mod-only antics */
      if (event.ismod && !$("#cbForce").is(":checked") && event.flags.force) {
        if (event.message.startsWith('force ')) {
          /* Force: undo everything above and put the message, unescaped, as-is */
          message = event.message.replace('force ', '');
        } else if (event.message.startsWith('forcejs ')) {
          /* Forcejs: undo everything above and wrap unescaped message in script tags */
          message = "<script>" + event.message.replace('forcejs ', '') + "</script>";
        }
      }
      /* FIXME: url formatting breaks emotes, as URLs inside <img> elements are formatted
      message = message.replace(Util.URL_REGEX, function(url) {
        let u = new URL(url);
        return `<a href="${u}" target="_blank">${u}</a>`;
      });*/
      $msg.html(message);
      return { e: $msg, effects: $effects };
    }
  }, {
    key: "_genSubWrapper",
    value: function _genSubWrapper(event) {
      var $e = $("<div></div>");
      $e.addClass("chat-line").addClass("sub").addClass("notice");
      $e.append($(this._genBadges(event)));
      $e.append($(this._genName(event)));
      $e.html($e.html() + "&nbsp;");
      return $e;
    }
  }, {
    key: "gen",
    value: function gen(event) {
      var $e = $("<div class=\"chat-line\"></div>");
      if (!event.flags.color) event.flags.color = this.getColorFor(event.user);
      if (this._client.IsUIDSelf(event.flags["user-id"])) {
        $e.addClass('self');
      }
      /* Add data attributes */
      $e.attr("data-id", event.flags.id);
      $e.attr("data-user", event.user);
      $e.attr("data-user-id", event.flags["user-id"]);
      $e.attr("data-channel", event.channel.channel.lstrip('#'));
      if (!!event.channel.room) $e.attr("data-room", event.channel.room);
      if (!!event.channel.roomuid) $e.attr("data-roomuid", event.channel.roomuid);
      $e.attr("data-channel-id", event.flags["room-id"]);
      $e.attr("data-subscriber", event.flags.subscriber);
      $e.attr("data-mod", event.flags.mod);
      $e.attr("data-vip", event.isvip ? "1" : "0");
      $e.attr("data-caster", event.flags.broadcaster ? "1" : "0");
      $e.attr("data-sent-ts", event.flags["tmi-sent-ts"]);
      $e.attr("data-recv-ts", Date.now());
      if (!this._config.Layout.Slim) {
        /* Add attributes as classes */
        if (event.flags.subscriber) $e.addClass("chat-sub");
        if (event.flags.mod) $e.addClass("chat-mod");
        if (event.flags.vip) $e.addClass("chat-vip");
        if (event.flags.broadcaster) $e.addClass("chat-caster");
      }
      /* Generate line content */
      var badges_elem = $(this._genBadges(event));
      var name_elem = $(this._genName(event));
      var msg_def = this._genMsgInfo(event);
      $e.append(badges_elem);
      $e.append(name_elem);
      if (!event.values.action) {
        $e.html($e.html() + ":");
      } else {
        msg_def.e.css("color", event.flags.color);
      }
      $e.html($e.html() + "&nbsp;");
      var html_pre = [];
      var html_post = [];
      if (msg_def.effects.length > 0) {
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = msg_def.effects[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var effect = _step6.value;

            if (effect.class) msg_def.e.addClass(effect.class);
            if (effect.style) msg_def.e.attr("style", effect.style);
            if (effect.wclass) $e.addClass(effect.wclass);
            if (effect.wstyle) $e.attr("style", effect.wstyle);
            if (effect.html_pre) html_pre.push(effect.html_pre);
            if (effect.html_post) html_post.unshift(effect.html_post);
          }
        } catch (err) {
          _didIteratorError6 = true;
          _iteratorError6 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
              _iterator6.return();
            }
          } finally {
            if (_didIteratorError6) {
              throw _iteratorError6;
            }
          }
        }
      }
      $e.append($(html_pre.join("") + msg_def.e[0].outerHTML + html_post.join("")));
      return $e[0].outerHTML;
    }
  }, {
    key: "sub",
    value: function sub(event) {
      var $w = this._genSubWrapper(event);
      var $m = $("<span class=\"message sub-message\"></span>");
      $m.text("subscribed using " + event.value('sub_plan') + "!");
      $w.append($m);
      return $w[0].outerHTML;
    }
  }, {
    key: "resub",
    value: function resub(event) {
      var $w = this._genSubWrapper(event);
      var $m = $("<span class=\"message sub-message\"></span>");
      var months = event.value('sub_months');
      var streak = event.value('sub_streak_months');
      if (streak) {
        $m.text("resubscribed for " + months + " months, a streak of " + streak + " months!");
      } else {
        $m.text("resubscribed for " + months + " months!");
      }
      $w.append($m);
      return $w[0].outerHTML;
    }
  }, {
    key: "giftsub",
    value: function giftsub(event) {
      var $w = this._genSubWrapper(event);
      var $m = $("<span class=\"message sub-message\"></span>");
      if (event.flags['system-msg']) {
        $m.text(event.flags['system-msg']);
      } else {
        var user = event.flags['msg-param-recipient-user-name'];
        var gifter = event.flags['login'];
        $m.text(gifter + " gifted a subscription to " + user + "!");
      }
      $w.append($m);
      return $w[0].outerHTML;
    }
  }, {
    key: "anongiftsub",
    value: function anongiftsub(event) {
      var user = event.flags['msg-param-recipient-user-name'];
      var gifter = event.flags.login;
      var months = event.flags['msg-param-sub-months'];
      return event.command + ": " + gifter + " gifted to " + user + " " + months;
    }
  }, {
    key: "raid",
    value: function raid(event) {}
    /* TODO */


    /* General-use */

  }, {
    key: "url",
    value: function url() {
      var href = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var text = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var classes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var id = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

      var $l = $("<a></a>");
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
        if (typeof classes === "string") {
          $l.addClass(classes);
        } else {
          var _iteratorNormalCompletion7 = true;
          var _didIteratorError7 = false;
          var _iteratorError7 = undefined;

          try {
            for (var _iterator7 = classes[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
              var c = _step7.value;

              $l.addClass(c);
            }
          } catch (err) {
            _didIteratorError7 = true;
            _iteratorError7 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion7 && _iterator7.return) {
                _iterator7.return();
              }
            } finally {
              if (_didIteratorError7) {
                throw _iteratorError7;
              }
            }
          }
        }
      }
      if (id !== null) {
        $l.attr("id", id);
      }
      return $l[0].outerHTML;
    }
  }, {
    key: "checkbox",
    value: function checkbox(value) {
      var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var classes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var checked = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      var $e = $("<input type=\"checkbox\" />");
      $e.attr("value", value);
      if (id !== null) {
        $e.attr("id", id);
      }
      if (typeof classes === "string") {
        $e.addClass(classes);
      } else {
        var _iteratorNormalCompletion8 = true;
        var _didIteratorError8 = false;
        var _iteratorError8 = undefined;

        try {
          for (var _iterator8 = classes[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var c = _step8.value;

            $e.addClass(c);
          }
        } catch (err) {
          _didIteratorError8 = true;
          _iteratorError8 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion8 && _iterator8.return) {
              _iterator8.return();
            }
          } finally {
            if (_didIteratorError8) {
              throw _iteratorError8;
            }
          }
        }
      }
      if (checked !== null) {
        $e.attr("checked", "checked");
      }
      return $e[0].outerHTML;
    }
  }, {
    key: "client",
    set: function set(c) {
      this._client = c;
    }
  }, {
    key: "bgcolors",
    set: function set(colors) {
      this._bg_colors = [];
      var _iteratorNormalCompletion9 = true;
      var _didIteratorError9 = false;
      var _iteratorError9 = undefined;

      try {
        for (var _iterator9 = colors[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
          var c = _step9.value;

          this._bg_colors.push(c);
        }
      } catch (err) {
        _didIteratorError9 = true;
        _iteratorError9 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion9 && _iterator9.return) {
            _iterator9.return();
          }
        } finally {
          if (_didIteratorError9) {
            throw _iteratorError9;
          }
        }
      }
    }
  }]);

  return HTMLGenerator;
}();