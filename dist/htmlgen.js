/* HTML Generator for the Twitch Filtered Chat */

"use strict";

/* TODO:
 * Implement raid and calling code
 * Implement TwitchSubEvent htmlgen
 * Ensure /me formatting is fixed
 * Add clip formatting code (this._config.ShowClips)
 * Implement "light" and "dark" colorschemes
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

/* exported HTMLGenerator */

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
    this._bg_colors = ["#1d1d1d", "#0a0a0a", "#d1d1d1"];

    /* Ensure config has certain values */
    if (!this._config.Layout) this._config.Layout = {};
    if (!this._config.ShowClips) this._config.ShowClips = false;
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
  }, {
    key: "getColorFor",
    value: function getColorFor(username) {
      var name = "" + username;
      if (typeof username !== "string") {
        Util.Error("Expected string, got " + (typeof username === "undefined" ? "undefined" : _typeof(username)) + ": " + JSON.stringify(username));
      }
      if (!this._user_colors.hasOwnProperty(name)) {
        /* Taken from Twitch vendor javascript */
        var r = 0;
        for (var i = 0; i < name.length; ++i) {
          r = (r << 5) - r + name.charCodeAt(i);
        }
        r = r % this._default_colors.length;
        if (r < 0) r += this._default_colors.length;
        this._user_colors[name] = this._default_colors[r];
      }
      return this._user_colors[name];
    }
  }, {
    key: "genName",
    value: function genName(name, color) {
      var $e = $("<span class=\"username\" data-username=\"1\"></span>");
      $e.addClass('username');
      $e.attr('data-username', '1');
      $e.css('color', color);
      /* Determine the best border color to use */
      var border = Util.GetMaxContrast(color, this._bg_colors);
      $e.css("text-shadow", "-0.8px -0.8px 0 " + border + ",\n                            0.8px -0.8px 0 " + border + ",\n                           -0.8px  0.8px 0 " + border + ",\n                            0.8px  0.8px 0 " + border);
      $e.text(name);
      return $e[0].outerHTML;
    }
  }, {
    key: "formatURLs",
    value: function formatURLs(message) {
      var $m = $("<span></span>").html(message);
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
      var to_url = function to_url(u) {
        return new URL(Util.URL(u));
      };
      /* Obtain text nodes with URLs */
      var nodes = Util.SearchTree($m[0], text_and_has_url);
      var replace_info = [];
      /* Populate nodes and their new contents */
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = nodes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var node = _step.value;

          var matches = node.nodeValue.match(Util.URL_REGEX);
          var parts = Util.SplitByMatches(node.nodeValue, matches, to_url);
          var newNodes = [];
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = parts[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var part = _step3.value;

              newNodes.push(Util.CreateNode(part));
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

          replace_info.push([node.parentNode, newNodes]);
        }
        /* Replace the nodes' contents with the new children */
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

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = replace_info[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _ref = _step2.value;

          var _ref2 = _slicedToArray(_ref, 2);

          var _node = _ref2[0];
          var children = _ref2[1];

          _node.innerHTML = "";
          var _iteratorNormalCompletion4 = true;
          var _didIteratorError4 = false;
          var _iteratorError4 = undefined;

          try {
            for (var _iterator4 = children[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
              var child = _step4.value;

              _node.innerHTML += Util.GetHTML(child);
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

      return $m[0].innerHTML;
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
      var t = cheer.tiers.filter(function (n) {
        return bits >= n.min_bits;
      }).max(function (n) {
        return n.min_bits;
      });
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
        var badge_src = _badge_info.alpha || _badge_info.image;
        $b.attr('src', badge_src);
        $b.attr('tw-badge', JSON.stringify(_badge_info));
        if (event.channel) {
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
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = event.flags.badges[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var _ref3 = _step5.value;

            var _ref4 = _slicedToArray(_ref3, 2);

            var badge_name = _ref4[0];
            var badge_num = _ref4[1];

            var $b = this._genTwitchBadge(event, badge_name, badge_num);
            if ($b === null) {
              Util.Warn('Unknown badge', badge_name, badge_num, 'for', event);
              continue;
            } else {
              $bc.append($b);
            }
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
      }
      /* Add FFZ badges */
      if (event.flags['ffz-badges']) {
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = Object.values(event.flags['ffz-badges'])[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var badge = _step6.value;

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
  }, {
    key: "_genName",
    value: function _genName(event) {
      var user = event.flags["display-name"] || event.user;
      var color = event.flags.color || this.getColorFor(event.user);
      if (!color) {
        color = '#ffffff';
      }
      return this.genName(user, color);
    }
  }, {
    key: "_msgEmotesTransform",
    value: function _msgEmotesTransform(event, message, map /*, $msg, $effects*/) {
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
          /* Adjust the map */
          for (var idx = emote.ostart; idx < map.length; ++idx) {
            if (map[idx] >= emote.end) {
              map[idx] += emote.final_length - (emote.end - emote.start) - 1;
            }
          }
        }
      }
      return message;
    }
  }, {
    key: "_msgCheersTransform",
    value: function _msgCheersTransform(event, message, map, $msg, $effects) {
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
          var _ref5 = [map[match.start], map[match.end]],
              start = _ref5[0],
              end = _ref5[1];

          var chtml = this._genCheer(cheer, bits);
          var msg_start = message.substr(0, start);
          var msg_end = message.substr(end);
          message = msg_start + chtml + msg_end;
          /* Adjust the map */
          for (var idx = match.start; idx < map.length; ++idx) {
            if (map[idx] - map[match.start] >= end - start) {
              map[idx] += chtml.length - (end - start);
            }
          }
          var end_words = msg_end.trimStart().split(" ");
          /* Scan for cheer effects */
          while (end_words.length > 0) {
            var word = end_words[0].toLowerCase();
            var s = GetCheerStyle(word);
            if (!s) {
              break;
            }
            if (!s._disabled) {
              if (bits_left < s.cost) {
                break;
              }
              $effects.push(s);
              bits_left -= s.cost;
            }
            end_words.shift();
          }
        }
      }
      return message;
    }
  }, {
    key: "_msgFFZEmotesTransform",
    value: function _msgFFZEmotesTransform(event, message, map /*, $msg, $effects*/) {
      var ffz_emotes = this._client.GetFFZEmotes(event.channel.channel);
      if (ffz_emotes && ffz_emotes.emotes) {
        var ffz_emote_arr = [];
        var _iteratorNormalCompletion7 = true;
        var _didIteratorError7 = false;
        var _iteratorError7 = undefined;

        try {
          for (var _iterator7 = Object.entries(ffz_emotes.emotes)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var _ref6 = _step7.value;

            var _ref7 = _slicedToArray(_ref6, 2);

            var k = _ref7[0];
            var v = _ref7[1];

            ffz_emote_arr.push([v, k]);
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

        var results = Twitch.ScanEmotes(event.message, ffz_emote_arr);
        results.sort(function (a, b) {
          return a.start - b.start;
        });
        while (results.length > 0) {
          var emote = results.pop();
          var _ref8 = [emote.start, emote.end + 1],
              start = _ref8[0],
              end = _ref8[1];
          var _ref9 = [map[start], map[end]],
              mstart = _ref9[0],
              mend = _ref9[1];

          var url = emote.id.urls[Object.keys(emote.id.urls).min()];
          var $i = $("<img class=\"emote ffz-emote\" ffz-emote-id=" + emote.id.id + " />");
          $i.attr('src', url);
          $i.attr('width', emote.id.width);
          $i.attr('height', emote.id.height);
          var msg_start = message.substr(0, mstart);
          var msg_end = message.substr(mend);
          var emote_str = $i[0].outerHTML;
          message = "" + msg_start + emote_str + msg_end;
          /* Adjust the map */
          for (var idx = emote.start; idx < map.length; ++idx) {
            if (map[idx] - map[emote.start] >= end - start) {
              map[idx] += emote_str.length - (end - start);
            }
          }
        }
      }
      return message;
    }
  }, {
    key: "_msgBTTVEmotesTransform",
    value: function _msgBTTVEmotesTransform(event, message, map /*, $msg, $effects*/) {
      var bttv_emotes = this._client.GetBTTVEmotes(event.channel.channel);
      if (bttv_emotes && bttv_emotes.emotes) {
        var bttv_emote_arr = [];
        var _iteratorNormalCompletion8 = true;
        var _didIteratorError8 = false;
        var _iteratorError8 = undefined;

        try {
          for (var _iterator8 = Object.entries(bttv_emotes.emotes)[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var _ref10 = _step8.value;

            var _ref11 = _slicedToArray(_ref10, 2);

            var k = _ref11[0];
            var v = _ref11[1];

            bttv_emote_arr.push([v, k]);
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

        var results = Twitch.ScanEmotes(event.message, bttv_emote_arr);
        results.sort(function (a, b) {
          return a.start - b.start;
        });
        while (results.length > 0) {
          var emote = results.pop();
          var _ref12 = [emote.start, emote.end + 1],
              start = _ref12[0],
              end = _ref12[1];
          var _ref13 = [map[start], map[end]],
              mstart = _ref13[0],
              mend = _ref13[1];

          var $i = $("<img class=\"emote bttv-emote\" bttv-emote-id=\"" + emote.id.id + "\" />");
          $i.attr("src", emote.id.url);
          var msg_start = message.substr(0, mstart);
          var msg_end = message.substr(mend);
          var emote_str = $i[0].outerHTML;
          message = "" + msg_start + emote_str + msg_end;
          /* Adjust the map */
          for (var idx = emote.start; idx < map.length; ++idx) {
            if (map[idx] - map[emote.start] >= end - start) {
              map[idx] += emote_str.length - (end - start);
            }
          }
        }
      }
      return message;
    }
  }, {
    key: "_msgAtUserTransform",
    value: function _msgAtUserTransform(event, message, map, $msg /*, $effects */) {
      message = message.replace(/(^|\b\s*)(@\w+)(\s*\b|$)/g, function (m, p1, p2, p3) {
        if (p2.substr(1).toLowerCase() == this._client.GetName().toLowerCase()) {
          $msg.addClass("highlight");
          return p1 + "<em class=\"at-user at-self\">" + p2 + "</em>" + p3;
        } else {
          return p1 + "<em class=\"at-user\">" + p2 + "</em>" + p3;
        }
      }.bind(this));
      return message;
    }
  }, {
    key: "_msgURLTransform",
    value: function _msgURLTransform(event, message /*, map, $msg, $effects*/) {
      return this.formatURLs(message);
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

      /* Handle early mod-only antics */
      if (!$("#cbForce").is(":checked") && event.ismod) {
        var word0 = event.message.split(" ")[0];
        if (word0 == "force") {
          event.flags.force = true;
        } else if (word0 == "forcejs") {
          event.flags.force = true;
        } else if (word0 == "forcebits" || word0 == "forcecheer") {
          var wordlen = word0.length;
          var msgprefix = "cheer1000";
          while (msgprefix.length < word0.length) {
            msgprefix += ' ';
          }
          /* Modify both message and event.message, as they're both used below */
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
          message = "<script>" + event.message.substr('forcejs '.length) + "</script>";
        }
      }

      $msg.html(message);

      return { e: $msg, effects: $effects };
    }
  }, {
    key: "_addChatAttrs",
    value: function _addChatAttrs($e, event) {
      $e.attr("data-id", event.flags.id);
      $e.attr("data-user", event.user);
      $e.attr("data-user-id", event.flags["user-id"]);
      $e.attr("data-channel", event.channel.channel.lstrip('#'));
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
      var color = event.flags.color || this.getColorFor(event.user);
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
      var msg_def = this._genMsgInfo(event);
      if (!event.flags.action) {
        $e.html($e.html() + ":");
      } else {
        msg_def.e.css("color", color);
      }
      $e.html($e.html() + "&nbsp;");
      var html_pre = [];
      var html_post = [];
      if (msg_def.effects.length > 0) {
        var _iteratorNormalCompletion9 = true;
        var _didIteratorError9 = false;
        var _iteratorError9 = undefined;

        try {
          for (var _iterator9 = msg_def.effects[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
            var effect = _step9.value;

            if (effect.class) msg_def.e.addClass(effect.class);
            if (effect.style) msg_def.e.attr("style", effect.style);
            if (effect.wclass) $e.addClass(effect.wclass);
            if (effect.wstyle) $e.attr("style", effect.wstyle);
            if (effect.html_pre) html_pre.push(effect.html_pre);
            if (effect.html_post) html_post.unshift(effect.html_post);
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
      $e.append($(html_pre.join("") + msg_def.e[0].outerHTML + html_post.join("")));
      return $e[0].outerHTML;
    }
  }, {
    key: "sub",
    value: function sub(event) {
      /* FIXME: Use TwitchSubEvent */
      var $w = this._genSubWrapper(event);
      var $m = $("<span class=\"message sub-message\"></span>");
      $m.text("subscribed using " + event.value('sub_plan') + "!");
      $w.append($m);
      return $w[0].outerHTML;
    }
  }, {
    key: "resub",
    value: function resub(event) {
      /* FIXME: Use TwitchSubEvent */
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
      /* FIXME: Use TwitchSubEvent */
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
      /* FIXME: Use TwitchSubEvent */
      /* TODO */
      var user = event.flags['msg-param-recipient-user-name'];
      var gifter = event.flags.login;
      var months = event.flags['msg-param-sub-months'];
      return event.command + ": " + gifter + " gifted to " + user + " " + months;
    }
  }, {
    key: "raid",
    value: function raid(event) {
      /* TODO */
      return event.repr();
    }

    /* General-use functions below */

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
          var _iteratorNormalCompletion10 = true;
          var _didIteratorError10 = false;
          var _iteratorError10 = undefined;

          try {
            for (var _iterator10 = classes[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
              var c = _step10.value;

              $l.addClass(c);
            }
          } catch (err) {
            _didIteratorError10 = true;
            _iteratorError10 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion10 && _iterator10.return) {
                _iterator10.return();
              }
            } finally {
              if (_didIteratorError10) {
                throw _iteratorError10;
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
        var _iteratorNormalCompletion11 = true;
        var _didIteratorError11 = false;
        var _iteratorError11 = undefined;

        try {
          for (var _iterator11 = classes[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
            var c = _step11.value;

            $e.addClass(c);
          }
        } catch (err) {
          _didIteratorError11 = true;
          _iteratorError11 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion11 && _iterator11.return) {
              _iterator11.return();
            }
          } finally {
            if (_didIteratorError11) {
              throw _iteratorError11;
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
      var _iteratorNormalCompletion12 = true;
      var _didIteratorError12 = false;
      var _iteratorError12 = undefined;

      try {
        for (var _iterator12 = colors[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
          var c = _step12.value;

          this._bg_colors.push(c);
        }
      } catch (err) {
        _didIteratorError12 = true;
        _iteratorError12 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion12 && _iterator12.return) {
            _iterator12.return();
          }
        } finally {
          if (_didIteratorError12) {
            throw _iteratorError12;
          }
        }
      }
    }
  }]);

  return HTMLGenerator;
}();