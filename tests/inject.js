/* Twitch Filtered Chat - Message Injection Testing Module */

/* To use:
AddAsset("tests/inject.js", MOD_TFC, null, null);
 */

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
  for (let [k, v] of Object.entries(flag_obj)) {
    flags[k] = v.replace(/ /g, "\\s");
  }
  let user = "kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv";
  let ch = "#dwangoac";

  if (!cmd) cmd = "PRIVMSG";

  let flag_str = Object.entries(flags).map(([k,v]) => (`${k}=${v}`)).join(";");
  let message = `@${flag_str} :${user} ${cmd} ${ch}`;
  if (msg !== null) { message = `${message} :${msg}`; }
  if (!message.endsWith("\r\n")) message += "\r\n";

  console.log(flags, user, ch, message);
  return message;
}

const TEST_MESSAGES = {
  "CHEER1": "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;bits=1;color=#0262C1;display-name=Kaedenn_;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :cheer1\r\n",
  "CHEER2": "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;bits=400;color=#0262C1;display-name=Kaedenn_;emotes=25:14-18/3:29-30/153556:41-48;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :test cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test\r\n",
  "CHEER3": "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;bits=400;color=#0262C1;display-name=Kaedenn_;emotes=25:14-18/3:29-30/153556:41-48;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :&&&& cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test\r\n",
  "GIFTSUB": "@badge-info=subscriber/14;badges=moderator/1,subscriber/12,bits/100;color=#10B796;display-name=Melos_Solro;emotes=;flags=;id=3ecb7d31-8e9a-4145-8bf6-c887804b4c4d;login=melos_solro;mod=1;msg-id=subgift;msg-param-months=1;msg-param-origin-id=da\\s39\\sa3\\see\\s5e\\s6b\\s4b\\s0d\\s32\\s55\\sbf\\sef\\s95\\s60\\s18\\s90\\saf\\sd8\\s07\\s09;msg-param-recipient-display-name=KatDevsGames;msg-param-recipient-id=31157663;msg-param-recipient-user-name=katdevsgames;msg-param-sender-count=1;msg-param-sub-plan-name=Channel\\sSubscription\\s(dwangoAC);msg-param-sub-plan=1000;room-id=70067886;subscriber=1;system-msg=Melos_Solro\\sgifted\\sa\\sTier\\s1\\ssub\\sto\\sKatDevsGames!\\sThis\\sis\\stheir\\sfirst\\sGift\\sSub\\sin\\sthe\\schannel!;tmi-sent-ts=1557024081997;user-id=36141189;user-type=mod :tmi.twitch.tv USERNOTICE #dwangoac\r\n"
};

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
  "msg-param-origin-id": "da 39 a3 ee 5e 6b 4b 0d 32 55 bf ef 95 60 18 90 af d8 07 09",
  "msg-param-recipient-display-name": "Kaedenn_",
  "msg-param-recipient-id": "175437030",
  "msg-param-recipient-user-name": "Kaedenn_",
  "msg-param-sender-count": "1",
  "msg-param-sub-plan-name": "Channel\\sSubscription\\s(dwangoAC)",
  "msg-param-sub-plan": "1000",
  "system-msg": "Kaedenn\\sgifted\\sa\\sTier\\s1\\ssub\\sto\\sKaedenn_!\\sThis\\sis\\stheir\\sfirst\\sGift\\sSub\\sin\\sthe\\schannel!"
}, "USERNOTICE");

TEST_MESSAGES.EFFECT1 = BuildMessage({"bits": "100"}, "PRIVMSG",
  "cheer100 bold marquee rainbow This text is bold, rainbow, and scrolling across the screen");
TEST_MESSAGES.EFFECT2 = BuildMessage({"bits": "100"}, "PRIVMSG",
  "cheer100 marquee bold italic underline upsidedown strikethrough big rainbow This text is using almost every effect and looks quite weird");
TEST_MESSAGES.EFFECT3 = BuildMessage({"bits": "100"}, "PRIVMSG",
  "cheer100 bold italic underline upsidedown strikethrough big rainbow This text is using almost every effect except marquee");

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

/* TODO: TEST */
TEST_MESSAGES.NEW_CHATTER = BuildMessage({
  "badge-info": "",
  "badges": "",
  "color": "",
  "display-name": "SevenTest1",
  "emotes": "30259:0-6",
  "id": "37feed0f-b9c7-4c3a-b475-21c6c6d21c3d",
  "login": "seventest1",
  "mod": "0",
  "msg-id": "ritual",
  "msg-param-ritual-name": "new_chatter",
  "room-id": "6316121",
  "subscriber": "0",
  "system-msg": "Seventoes\\sis\\snew\\shere!",
  "tmi-sent-ts": "1508363903826",
  "turbo": "0",
  "user-id": "131260580",
  "user-type": ""
}, "USERNOTICE");

function inject_message(msg) {
  let e = new Event("message");
  e.data = msg;
  client._onWebsocketMessage(e);
}

/* Tests:
var TwitchColors = ["blue","blueviolet","cadetblue","chocolate","coral","dodgerblue","firebrick","goldenrod","green","hotpink","orangered","red","seagreen","springgreen","yellowgreen"];

var MsgWithColor = ((c) => inject_message(BuildMessage({"color": c}, "PRIVMSG", c)));
client.get("HTMLGen")._default_colors.forEach(MsgWithColor);
*/

/* vim: set ts=2 sts=2 sw=2 et: */
