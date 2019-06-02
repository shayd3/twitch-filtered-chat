/* Twitch Filtered Chat - Message Injection Testing Module */

/* To use: AddAsset("tests/inject.js"); */

function BuildMessage(flag_obj, cmd=null, msg=null) {
  let flags = {};
  flags["badge-info"] = "subscriber/12";
  flags["badges"] = "moderator/1,subscriber/12,bits/1000";
  flags["color"] = "#0262C1";
  flags["display-name"] = "Kaedenn";
  flags["flags"] = "";
  flags["id"] = "6ba8dc82-000f-4da6-9131-d69233b14e41";
  flags["mod"] = 1;
  flags["subscriber"] = 1;
  flags["turbo"] = 0;
  flags["emotes"] = "";
  flags["user-type"] = "mod";
  flags["user-id"] = "175437030";
  flags["room-id"] = "70067886";
  flags["tmi-sent-ts"] = Number(new Date());
  flags["__injected"] = 1;
  for (let [k, v] of Object.entries(flag_obj)) {
    flags[k] = Twitch.EncodeFlag(v);
  }
  let user = "kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv";
  let ch = "#dwangoac";

  let command = cmd || "PRIVMSG";

  let fstr = Object.entries(flags).map(([k,v]) => (`${k}=${v}`)).join(";");
  let message = `@${fstr} :${user} ${command} ${ch}`;
  if (msg !== null) { message = `${message} :${msg}`; }
  if (!message.endsWith("\r\n")) message += "\r\n";

  Util.DebugOnly(flags, JSON.stringify(message));
  return message;
}

var TEST_MESSAGES = { };

TEST_MESSAGES.GIFTSUB = BuildMessage({
  "msg-id": "subgift",
  "msg-param-months": "1",
  "msg-param-origin-id": "da 39 a3 ee 5e 6b 4b 0d 32 55 bf ef 95 60 18 90 af d8 07 09",
  "msg-param-recipient-display-name": "KatDevsGames",
  "msg-param-recipient-id": "31157663",
  "msg-param-recipient-user-name": "katdevsgames",
  "msg-param-sender-count": "1",
  "msg-param-sub-plan-name": "Channel Subscription (dwangoAC)",
  "msg-param-sub-plan": "1000",
  "system-msg": "Melos_Solro gifted a Tier 1 sub to KatDevsGames! This is their first Gift Sub in the channel!"
}, "USERNOTICE");

TEST_MESSAGES.RESUB = BuildMessage({
  "emotes": "1656901:25-32",
  "msg-id": "resub",
  "msg-param-cumulative-months": "3",
  "msg-param-months": "0",
  "msg-param-should-share-streak": "0",
  "msg-param-sub-plan-name": "Channel Subscription (dwangoAC)",
  "msg-param-sub-plan": "1000",
  "system-msg": "Shewolf25 subscribed at Tier 1. They've subscribed for 3 months!"
}, "USERNOTICE", "dose this break anything wolfsLUL");

TEST_MESSAGES.RESUB2 = BuildMessage({
  "emotes": "88:0-7",
  "msg-id": "resub",
  "msg-param-cumulative-months": "2",
  "msg-param-months": "0",
  "msg-param-should-share-streak": "1",
  "msg-param-streak-months": "1",
  "msg-param-sub-plan-name": "Channel Subscription (dwangoAC)",
  "msg-param-sub-plan": "1000",
  "system-msg": "Feevey subscribed at Tier 1. They've subscribed for 2 months, currently on a 1 month streak!"
}, "USERNOTICE", "PogChamp");

TEST_MESSAGES.GIFTSUB2 = BuildMessage({
  "msg-id": "subgift",
  "msg-param-months": "1",
  "msg-param-origin-id": "da 39 a3 ee 5e 6b 4b 0d 32 55 bf ef 95 60 18 90 af d8 07 09",
  "msg-param-recipient-display-name": "Kaedenn_",
  "msg-param-recipient-id": "175437030",
  "msg-param-recipient-user-name": "Kaedenn_",
  "msg-param-sender-count": "1",
  "msg-param-sub-plan-name": "Channel Subscription (dwangoAC)",
  "msg-param-sub-plan": "1000",
  "system-msg": "Kaedenn gifted a Tier 1 sub to Kaedenn_! This is their first Gift Sub in the channel!"
}, "USERNOTICE");

TEST_MESSAGES.EFFECT1 = BuildMessage({"bits": "100"}, "PRIVMSG",
  "cheer100 bold marquee rainbow This text is bold, rainbow, and scrolling " +
  "across the screen");

TEST_MESSAGES.EFFECT2 = BuildMessage({"bits": "100"}, "PRIVMSG",
  "cheer100 marquee bold italic underline upsidedown strikethrough big " +
  "rainbow This text is using almost every effect and looks quite weird");

TEST_MESSAGES.EFFECT3 = BuildMessage({"bits": "100"}, "PRIVMSG",
  "cheer100 bold italic underline upsidedown strikethrough big rainbow " +
  "This text is using almost every effect except marquee");

TEST_MESSAGES.CLIP = BuildMessage({"emotes": "25:5-9,75-79"},
  "PRIVMSG",
  "Test Kappa test https://clips.twitch.tv/BillowingCreativePastaHeyGuys " +
  "test Kappa test");

TEST_MESSAGES.RAID = BuildMessage({
  "display-name": "Kaedenn_",
  "login": "kaedenn_",
  "msg-id": "raid",
  "msg-param-displayName": "Kaedenn_",
  "msg-param-login": "kaedenn_",
  "msg-param-viewerCount": "9999",
  "system-msg": "quite a few raiders from Kaedenn_ have joined"
}, "USERNOTICE");

TEST_MESSAGES.RAID2 = BuildMessage({
  "display-name": "Kaedenn_",
  "login": "kaedenn_",
  "msg-id": "raid",
  "msg-param-displayName": "Kaedenn_",
  "msg-param-login": "kaedenn_",
  "msg-param-viewerCount": "9999"
}, "USERNOTICE");

TEST_MESSAGES.NEW_CHATTER = BuildMessage({
  "display-name": "SevenTest1",
  "emotes": "30259:0-6",
  "login": "seventest1",
  "msg-id": "ritual",
  "msg-param-ritual-name": "new_chatter",
  "system-msg": "Seventoes is new here!"
}, "USERNOTICE");

TEST_MESSAGES.SUBMYSTERYGIFT = BuildMessage({
/*
{"_cmd":"OTHERUSERNOTICE","_raw":"@badge-info=subscriber/1;badges=subscriber/0,premium/1;color=;display-name=jbwags;emotes=;flags=;id=2cf8bc95-6ea0-4a25-a285-a79e8843205c;login=jbwags;mod=0;msg-id=submysterygift;msg-param-mass-gift-count=1;msg-param-origin-id=3d\\sd8\\s9d\\s7c\\sac\\scb\\s84\\se3\\sa4\\s93\\sc9\\s6b\\sc4\\s17\\s5f\\sc5\\s8f\\s0d\\sea\\s3a;msg-param-sender-count=1;msg-param-sub-plan=1000;room-id=20702886;subscriber=1;system-msg=jbwags\\sis\\sgifting\\s1\\sTier\\s1\\sSubs\\sto\\sCarlSagan42's\\scommunity!\\sThey've\\sgifted\\sa\\stotal\\sof\\s1\\sin\\sthe\\schannel!;tmi-sent-ts=1558753095621;user-id=73171363;user-type= :tmi.twitch.tv USERNOTICE #carlsagan42","_parsed":{"cmd":"USERNOTICE","flags":{"badge-info":[["subscriber","1"]],"badges":[["subscriber","0"],["premium","1"]],"color":null,"display-name":"jbwags","emotes":null,"flags":null,"id":"2cf8bc95-6ea0-4a25-a285-a79e8843205c","login":"jbwags","mod":0,"msg-id":"submysterygift","msg-param-mass-gift-count":1,"msg-param-origin-id":"3d d8 9d 7c ac cb 84 e3 a4 93 c9 6b c4 17 5f c5 8f 0d ea 3a","msg-param-sender-count":1,"msg-param-sub-plan":1000,"room-id":20702886,"subscriber":1,"system-msg":"jbwags is gifting 1 Tier 1 Subs to CarlSagan42's community! They've gifted a total of 1 in the channel!","tmi-sent-ts":1558753095621,"user-id":73171363,"user-type":null},"server":"tmi.twitch.tv","channel":{"channel":"#carlsagan42","room":null,"roomuid":null},"message":"","sub_kind":null,"issub":false,"israid":false,"isritual":false,"user":"undefined"},"_stacktrace":[{"text":"_TwitchClient__onWebsocketMessage@file:///home/kaedenn/Programming/twitch-api/client.js:1498:11","name":"???","file":"/home/kaedenn/Programming/twitch-filtered-chat/index.html","line":0,"column":0},{"text":"_ws_onmessage@file:///home/kaedenn/Programming/twitch-api/client.js:381:9","name":"???","file":"/home/kaedenn/Programming/twitch-filtered-chat/index.html","line":0,"column":0}]}
 */
  "badge-info": "subscriber/1",
  "badges": "subscriber/0,premium/1",
  "color": "",
  "display-name": "jbwags",
  "emotes": "",
  "flags": "",
  "id": "2cf8bc95-6ea0-4a25-a285-a79e8843205c",
  "login": "jbwags",
  "mod": "0",
  "msg-id": "submysterygift",
  "msg-param-mass-gift-count": "1",
  "msg-param-origin-id": "3d d8 9d 7c ac cb 84 e3 a4 93 c9 6b c4 17 5f c5 8f 0d ea 3a",
  "msg-param-sender-count": "1",
  "msg-param-sub-plan": "1000",
  "room-id": "20702886",
  "subscriber": "1",
  "system-msg": "jbwags is gifting 1 Tier 1 Subs to CarlSagan42's community! They've gifted a total of 1 in the channel!",
  "tmi-sent-ts": "1558753095621",
  "user-id": "73171363",
  "user-type": ""
}, "USERNOTICE");

function inject_message(msg) { /* exported inject_message */
  if (Util.Defined("client")) {
    let e = new Event("message");
    e.data = msg;
    (new Function("return client"))()._onWebsocketMessage(e);
  } else {
    Util.ErrorOnly("Can't inject messages; client object isn't global");
  }
}
if (Util.Defined("client")) {
  let clientObj = (new Function("return client"))();
  TEST_MESSAGES.COLORS = {};
  TEST_MESSAGES.COLORS_ME = {};
  for (let color of clientObj.get("HTMLGen")._default_colors) {
    let key = color.toUpperCase();
    let msg1 = BuildMessage({"color": color}, "PRIVMSG", color);
    let msg2 = BuildMessage({"color": color}, "PRIVMSG", `\x01ACTION ${color}\x01`);
    TEST_MESSAGES.COLORS[key] = msg1;
    TEST_MESSAGES.COLORS_ME[key] = msg2;
  }
  Util.DebugOnly(`Initialized ${Object.keys(TEST_MESSAGES).length} test messages`);
}

/* vim: set ts=2 sts=2 sw=2 et: */
