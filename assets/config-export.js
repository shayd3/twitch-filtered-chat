
function formatValue(key, val) {
  if (val === null) {
    return "null";
  } else if (typeof(val) === "undefined") {
    return "undefined";
  } else {
    return JSON.stringify(val);
  }
}

function textNode(s) {
  return $(`<span class="text"></span>`).text(s);
}

function indentKey(level, key) {
  return $(`<div class="line"></div>`)
    .addClass("indent" + level)
    .append($(`<span class="key"></span>`)
        .append(key));
}

function formatLogEntry(val) {
  let result = $(`<span class="log-entry"></span>`);
  if (val) {
    let copy = JSON.parse(JSON.stringify(val)) || {};
    let cmd = copy._cmd;
    let raw = copy._raw;
    let parsed = copy._parsed;
    let stack = copy._stacktrace || [];
    let c_str = JSON.stringify(cmd);
    let r_str = JSON.stringify(raw);
    let p_str = JSON.stringify(parsed);

    let rows = [
      textNode("new TwitchChatEvent("),
      indentKey("3", textNode(c_str + ",")),
      indentKey("3", textNode(r_str + ","))
    ];

    let showStack = true;
    if (stack.length === 2) {
      let [n0, n1] = [stack[0].name, stack[1].name];
      if (n0 === "_onWebsocketMessage" && n1 === "_ws_onmessage") {
        showStack = false;
      }
    }
    if (showStack) {
      rows.push(indentKey("3", textNode(p_str + ",")));
      rows.push(indentKey("3", textNode(JSON.stringify(stack) + ")")));
    } else {
      rows.push(indentKey("3", textNode(p_str + ")")));
    }

    rows.map((row) => result.append(row));
  } else {
    result.text(JSON.stringify(val));
  }
  return result;
}

function formatRow(key, val) {
  let line = $(`<div class="line indent1"></div>`);
  let ke = $(`<span class="key"></span>`).text(key);
  let eq = $(`<span class="eq">:&nbsp;</span>`);
  let ve = $(`<span class="val"></span>`);
  let vs = formatValue(key, val);
  if (key === "debug-msg-log") {
    /* Special formatting for the message log (//log) */
    let obj = (typeof(val) === "string" ? JSON.parse(val) : val);
    ve.append(textNode("["));
    for (let [idx, entry] of Object.entries(obj)) {
      let lline = $(`<div class="line indent2"></div>`);
      let lk = $(`<span class="key"></span>`).text(`[${idx}]`);
      let leq = textNode(" = ");
      let lv = $(`<span class="val"></span>`).append(formatLogEntry(entry));
      ve.append(lline.append(lk).append(leq).append(lv));
    }
    let close = $(`<span class="key">]</span>`);
    ve.append($(`<div class="line indent1"></div>`).append(close));
  } else if (key === "tfc-config" || key.startsWith("tfc-config-")) {
    /* Special handling for the main configuration */
    let obj = (typeof(val) === "string" ? JSON.parse(val) : val);
    ve.append(textNode("{"));
    for (let [idx, entry] of Object.entries(obj)) {
      let lline = $(`<div class="line indent2"></div>`);
      let lk = $(`<span class="key"></span>`).text(`[${idx}]`);
      let leq = textNode(" = ");
      let lv = $(`<span class="val"></span>`).text(JSON.stringify(entry));
      ve.append(lline.append(lk).append(leq).append(lv));
    }
    let close = $(`<span class="key">]</span>`);
    ve.append($(`<div class="line indent1"></div>`).append(close));
  } else {
    ve = $(`<span class="val"></span>`).html(vs);
  }
  return line.append(ke).append(eq).append(ve);
}

function showStorage(ls=null) {
  let storage = ls || localStorage;
  let format = $("#format").is(":checked");
  $(".content-pre").text("");
  $(".content").html("");
  $(".content-post").text("");
  if (format) {
    $(".content-pre").text("localStorage = {");
    for (let key of Object.keys(storage)) {
      $(".content").append(formatRow(key, storage[key]));
    }
    $(".content-post").text("};");
  } else {
    $(".content").text(JSON.stringify(storage));
  }
}

$(document).ready(function() {
  $("#format").change(function(e) {
    if ($(this).is(":checked")) {
      $("body").addClass("format");
    } else {
      $("body").removeClass("format");
    }
    showStorage();
  });
  showStorage();
});

