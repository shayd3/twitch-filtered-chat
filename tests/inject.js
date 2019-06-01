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
    flags[k] = v.replace(/ /g, "\\s");
  }
  let user = "kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv";
  let ch = "#dwangoac";

  if (!cmd) cmd = "PRIVMSG";

  let fstr = Object.entries(flags).map(([k,v]) => (`${k}=${v}`)).join(";");
  let message = `@${fstr} :${user} ${cmd} ${ch}`;
  if (msg !== null) { message = `${message} :${msg}`; }
  if (!message.endsWith("\r\n")) message += "\r\n";

  Util.LogOnly(flags, user, ch, message);
  return message;
}

var TEST_MESSAGES = { };

TEST_MESSAGES.CHEER1 = BuildMessage({
  "bits": "1"
}, "PRIVMSG", ":cheer1");

TEST_MESSAGES.CHEER2 = BuildMessage({
  "bits": "400"
}, "PRIVMSG", "test cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test");

TEST_MESSAGES.CHEER3 = BuildMessage({
  "bits": "400"
}, "PRIVMSG", "&&&& cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test");

TEST_MESSAGES.GIFTSUB = BuildMessage({
  "msg-id": "subgift",
  "msg-param-months": "1",
  "msg-param-origin-id": "da\\s39\\sa3\\see\\s5e\\s6b\\s4b\\s0d\\s32\\s55\\sbf\\sef\\s95\\s60\\s18\\s90\\saf\\sd8\\s07\\s09",
  "msg-param-recipient-display-name": "KatDevsGames",
  "msg-param-recipient-id": "31157663",
  "msg-param-recipient-user-name": "katdevsgames",
  "msg-param-sender-count": "1",
  "msg-param-sub-plan-name": "Channel\\sSubscription\\s(dwangoAC)",
  "msg-param-sub-plan": "1000",
  "system-msg": "Melos_Solro\\sgifted\\sa\\sTier\\s1\\ssub\\sto\\sKatDevsGames!\\sThis\\sis\\stheir\\sfirst\\sGift\\sSub\\sin\\sthe\\schannel!"
}, "USERNOTICE");

TEST_MESSAGES.RESUB = BuildMessage({
  "emotes": "1656901:25-32",
  "msg-id": "resub",
  "msg-param-cumulative-months": "3",
  "msg-param-months": "0",
  "msg-param-should-share-streak": "0",
  "msg-param-sub-plan-name": "Channel\\sSubscription\\s(dwangoAC)",
  "msg-param-sub-plan": "1000",
  "system-msg": "Shewolf25\\ssubscribed\\sat\\sTier\\s1.\\sThey've\\ssubscribed\\sfor\\s3\\smonths!"
}, "USERNOTICE", "dose this break anything wolfsLUL");

TEST_MESSAGES.RESUB2 = BuildMessage({
  "emotes": "88:0-7",
  "msg-id": "resub",
  "msg-param-cumulative-months": "2",
  "msg-param-months": "0",
  "msg-param-should-share-streak": "1",
  "msg-param-streak-months": "1",
  "msg-param-sub-plan-name": "Channel\\sSubscription\\s(dwangoAC)",
  "msg-param-sub-plan": "1000",
  "system-msg": "Feevey\\ssubscribed\\sat\\sTier\\s1.\\sThey've\\ssubscribed\\sfor\\s2\\smonths,\\scurrently\\son\\sa\\s1\\smonth\\sstreak!"
}, "USERNOTICE", "PogChamp");

TEST_MESSAGES.GIFTSUB2 = BuildMessage({
  "msg-id": "subgift",
  "msg-param-months": "1",
  "msg-param-origin-id": "da\\s39\\sa3\\see\\s5e\\s6b\\s4b\\s0d\\s32\\s55\\sbf\\sef\\s95\\s60\\s18\\s90\\saf\\sd8\\s07\\s09",
  "msg-param-recipient-display-name": "Kaedenn_",
  "msg-param-recipient-id": "175437030",
  "msg-param-recipient-user-name": "Kaedenn_",
  "msg-param-sender-count": "1",
  "msg-param-sub-plan-name": "Channel\\sSubscription\\s(dwangoAC)",
  "msg-param-sub-plan": "1000",
  "system-msg": "Kaedenn\\sgifted\\sa\\sTier\\s1\\ssub\\sto\\sKaedenn_!\\sThis\\sis\\stheir\\sfirst\\sGift\\sSub\\sin\\sthe\\schannel!"
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
  "system-msg": "Seventoes\\sis\\snew\\shere!"
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
}

/* vim: set ts=2 sts=2 sw=2 et: */
