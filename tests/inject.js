/* Twitch Filtered Chat - Message Injection Testing Module */

/* To use:
AddAsset("tests/inject.js", null, asset_error)
 */

function BuildMessage(flag_obj, cmd=null, msg=null) {
  let flags = {};
  flags['badge-info'] = 'subscriber/12';
  flags.badges = 'moderator/1,subscriber/12,bits/1000';
  flags.color = '#0262C1';
  flags['display-name'] = 'Kaedenn';
  flags.flags = '';
  flags.id = '6ba8dc82-000f-4da6-9131-d69233b14e41';
  flags.mod = 1;
  flags.subscriber = 1;
  flags.turbo = 0;
  flags.emotes = '';
  flags['user-type'] = 'mod';
  flags['user-id'] = '175437030';
  flags['room-id'] = '70067886';
  flags['tmi-sent-ts'] = Number(new Date());
  for (let [k, v] of Object.entries(flag_obj)) {
    flags[k] = v.replace(/ /g, '\\s');
  }
  let user = 'kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv';
  let ch = '#dwangoac';

  if (!cmd) cmd = "PRIVMSG";

  let flag_str = Object.entries(flags).map(([k,v]) => (`${k}=${v}`)).join(";");
  let message = `@${flag_str} :${user} ${cmd} ${ch}`;
  if (cmd === "PRIVMSG") { message = `${message} :${msg}`; }
  if (!message.endsWith('\r\n')) message += "\r\n";

  console.log(flags, user, ch, message);
  return message;
}

const TEST_MESSAGES = {
  'PRIVMSG1': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;color=#0262C1;display-name=Kaedenn_;emotes=25:14-18/3:29-30/153556:41-48;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :test cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test\r\n",
  'PRIVMSG2': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;color=#0262C1;display-name=Kaedenn_;emotes=25:14-18/3:29-30/153556:41-48;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :&&&& cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test\r\n",
  'CHEER1': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;bits=1;color=#0262C1;display-name=Kaedenn_;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :cheer1\r\n",
  'CHEER2': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;bits=400;color=#0262C1;display-name=Kaedenn_;emotes=25:14-18/3:29-30/153556:41-48;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :test cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test\r\n",
  'CHEER3': "@badge-info=subscriber/12;badges=moderator/1,subscriber/12,bits/1000;bits=400;color=#0262C1;display-name=Kaedenn_;emotes=25:14-18/3:29-30/153556:41-48;flags=;id=6ba8dc82-000f-4da6-9131-d69233b14e41;mod=1;room-id=70067886;subscriber=1;tmi-sent-ts=1555701270187;turbo=0;user-id=175437030;user-type=mod :kaedenn_!kaedenn_@kaedenn_.tmi.twitch.tv PRIVMSG #dwangoac :&&&& cheer100 Kappa cheer100 :D cheer100 BlessRNG cheer100 test\r\n",
  'RESUB': "@badge-info=;badges=staff/1,broadcaster/1,turbo/1;color=#008000;display-name=ronni;emotes=;id=db25007f-7a18-43eb-9379-80131e44d633;login=ronni;mod=0;msg-id=resub;msg-param-cumulative-months=6;msg-param-streak-months=2;msg-param-should-share-streak=1;msg-param-sub-plan=Prime;msg-param-sub-plan-name=Prime;room-id=70067886;subscriber=1;system-msg=ronni\\shas\\ssubscribed\\sfor\\s6\\smonths!;tmi-sent-ts=1507246572675;turbo=1;user-id=1337;user-type=staff :tmi.twitch.tv USERNOTICE #dwangoac :Great stream -- keep it up!\r\n",
  'GIFTSUB': "@badge-info=subscriber/14;badges=moderator/1,subscriber/12,bits/100;color=#10B796;display-name=Melos_Solro;emotes=;flags=;id=3ecb7d31-8e9a-4145-8bf6-c887804b4c4d;login=melos_solro;mod=1;msg-id=subgift;msg-param-months=1;msg-param-origin-id=da\\s39\\sa3\\see\\s5e\\s6b\\s4b\\s0d\\s32\\s55\\sbf\\sef\\s95\\s60\\s18\\s90\\saf\\sd8\\s07\\s09;msg-param-recipient-display-name=KatDevsGames;msg-param-recipient-id=31157663;msg-param-recipient-user-name=katdevsgames;msg-param-sender-count=1;msg-param-sub-plan-name=Channel\\sSubscription\\s(dwangoAC);msg-param-sub-plan=1000;room-id=70067886;subscriber=1;system-msg=Melos_Solro\\sgifted\\sa\\sTier\\s1\\ssub\\sto\\sKatDevsGames!\\sThis\\sis\\stheir\\sfirst\\sGift\\sSub\\sin\\sthe\\schannel!;tmi-sent-ts=1557024081997;user-id=36141189;user-type=mod :tmi.twitch.tv USERNOTICE #dwangoac\r\n"
};

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
  "cheer100 bold marquee rainbow This text is bold, rainbow, and scrolling across the screen");
TEST_MESSAGES.EFFECT2 = BuildMessage({"bits": "100"}, "PRIVMSG",
  "cheer100 marquee bold italic underline upsidedown strikethrough big rainbow This text is using almost every effect and looks quite weird");
TEST_MESSAGES.EFFECT3 = BuildMessage({"bits": "100"}, "PRIVMSG",
  "cheer100 bold italic underline upsidedown strikethrough big rainbow This text is using almost every effect except marquee");

function inject_message(msg) {
  let e = new Event('message');
  e.data = msg;
  client._onWebsocketMessage(e);
}

/* Tests:
var TwitchColors = ["blue","blueviolet","cadetblue","chocolate","coral","dodgerblue","firebrick","goldenrod","green","hotpink","orangered","red","seagreen","springgreen","yellowgreen"];

var MsgWithColor = ((c) => inject_message(BuildMessage({"color": c}, "PRIVMSG", c)));
client.get("HTMLGen")._default_colors.forEach(MsgWithColor);
*/

