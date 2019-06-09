# Twitch Filtered Chat

It's Twitch Chat, but Filtered!

## Usage

URL: `https://kaedenn.github.io/twitch-filtered-chat/index.html?<OPTIONS>`

### Query String Options:

| Option Key     | Option Value |
|----------------|--------------|
|  `layout`      | Layout to use, explained below |
|  `config_key`  | Config key override (default: `tfc-config`) |
|  `config`      | Alias for `config_key` |
|  `key`         | Alias for `config_key` |
|  `clientid`    | ClientID override to use for Twitch asset loading |
|  `user`        | Username to use (requires `pass`) |
|  `pass`        | OAuth token to use (requires `user`; removed once parsed) |
|  `debug`       | Either a number or one of `false` (0), `true` or `debug` (1), or `trace` (2) (default: 0) |
|  `channels`    | Channels to join (with or without #), separated by commas |
|  `noffz`       | Disable FFZ support (badges and emotes) entirely |
|  `nobttv`      | Disable BTTV support (emotes) entirely |
|  `noassets`    | Prevents loading of image (badge, emote, cheer) assets (implies `noffz` and `nobttv`) |
|  `hmax`        | Maximum size of sent chat history (default 300) |
|  `trans`       | Makes the backgrounds completely transparent |
|  `module1`     | The encoded module configuration for module 1 (explained below) |
|  `module2`     | The encoded module configuration for module 2 (explained below) |
|  `reconnect`   | If present, automatically reconnect if connection is lost |
|  `size`        | Overrides the body font size (in pt) (default: 18) |
|  `plugins`     | If present, enables use of plugins (see plugins directory) |
|  `disable`     | Disable specific cheer effects, separated by commas |
|  `enable`      | Enable specific cheer effects, separated by commas |
|  `max`         | Maximum number of chat messages to retain (default 100) |
|  `font`        | Override default font `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` |
|  `scroll`      | If non-empty, show scroll bars (default: hidden) |
|  `clips`       | If non-empty, show clip information in chat (default: hidden) |
|  `nols`        | Forcibly disable `localStorage` support. Note that this disables `pass` support entirely, as `localStorage` is needed to store passwords |
|  `scheme`      | Color scheme to use. Valid values: `light` and `dark`. Default: `dark` |

All option values must be URL-encoded.

### Layout:

| Layout | Description |
| ------ | ----------- |
| `layout=double:chat` | Two columns; right column has a chat box. This is the default |
| `layout=single:chat` | One column with a chat box |
| `layout=double:nochat` | Two columns without a chat box |
| `layout=single:nochat` | One column without a chat box |
| `layout=double:slim` | Two columns without headers, settings, or a chat box |
| `layout=single:slim` | One column without header, settings, or a chat box |
| `layout=double` | Exactly `layout=double:chat` |
| `layout=single` | Exactly `layout=single:chat` |
| `layout=tesla` | Special layout for use on embedded browsers, such as in a Tesla. This is similar to `layout=single:slim` but changes numerous other behaviors |

For a `single` column, the module is `module1`. For `double` columns, the left module is `module1` and the right module is `module2`.

### Module configuration:

`module1=<name>,<flags>,<kw-include>,<user-include>,<user-exclude>,<start-exclude>,<channel-exclude>`

`module2=<name>,<flags>,<kw-include>,<user-include>,<user-exclude>,<start-exclude>,<channel-exclude>`

If `layout` is `single`, `module1` is shown. Otherwise, `module1` is the left module and `module2` the right.

`name`: Module's name

`flags`: a sequence of 1s (shown) or 0s (filtered) for `Pleb`, `Sub`, `VIP`, `Mod`, `Events`, `Bits`, and `/me`.

`kw-include`: Display the message if it contains the value given, overriding excludes

`user-include`: Always show messages from this user, overriding

`user-exclude`: Don't show messages from this user

`start-exclude`: Don't show messages starting with the value given

`channel-exclude`: Exclude messages from this channel (for `layout=double` usage)

Default: `module1=Chat,1111111,,,,,&module2=Chat,1111111,,,,,`

### Cheer Effects:

The following cheer effects are available and cost one bit each.

| Effect Name | Description |
| ----------- | ----------- |
| `marquee` | Message scrolls from right to left across the chat window |
| `bold` | Message is bold |
| `italic` | Message is italicised |
| `underline` | Message is underlined |
| `upsidedown` | Message is upside-down (may not work with some other effects) |
| `inverted` | Message uses inverted colors (may not work with some other effects) |
| `strikethrough` | Message has a strike-through |
| `subscript` | Message is formatted as a subscript |
| `superscript` | Message is formatted as a superscript |
| `big` | Message is bigger than normal |
| `small` | Message is smaller than normal |
| `rainbow` | Message is rainbow (red -> yellow -> green -> cyan -> blue -> purple -> red) |
| `disco` | Message cycles through the rainbow colors in order |
| color | Message will use the color specified, by name (won't work with rainbow). Almost every color you can think of should work (see `config.js` `ColorNames`) |

To use them, add them to the message after the cheer:

  `cheer3 bold marquee rainbow Hello streamer`: This message is big, rainbow, and scrolling across the screen`

  `cheer1 rainbow marquee Hello`: This message isn't scrolling because effects cost one bit each`

  `marquee cheer1 Hey there`: This message has no extra formatting; the effect must be immediately after the cheer.

  `cheer1 big blue bold Greetings`: The message is big, bold, and blue.

### Examples:

Connect to `#dwangoAC` with default configuration:

  `?channels=dwangoAC`

Connect to `#pangaeapanga` with no chat:

  `?channels=pangaeapanga&layout=double:nochat`

Connect to `#dwangoAC` in slim mode, filtering `TAS9000` and messages starting with `!`:

  `?channels=dwangoac&module1=Chat,1111111,,,TAS9000,!,&layout=single:slim`

Connect to `#dwangoAC` and `#pangaeapanga`, showing `#dwangoAC` chat in the left column and `#pangaeapanga` in the right column. Filter out `Stay_Hydrated_Bot`, `Nightbot`, and `TAS9000`.

  `?channels=%23dwangoac%2C%23pangaeapanga&module1=dwangoAC's%2520Chat%2C1111111%2C%2C%2CTAS9000%252CNightbot%252CStay_Hydrated_Bot%2C!%2C%252523dwangoAC&module2=pangaeapanga's%2520Chat%2C1111111%2C%2C%2CTAS9000%252CNightbot%252CStay_Hydrated_Bot%2C!%2C&layout=double%3Anochat`

### Hotkeys

The following hotkeys are available:

| Key Name | Action |
| -------- | ------ |
| `ScrollLock` | Toggles automatic scrolling when new messages are received |
| `Escape` | Closes all visible settings windows |

## Development

For getting started, you will need both this and `twitch-api`:
```bash
mkdir tfc && cd tfc # optional
checkout https://github.com/Kaedenn/twitch-filtered-chat
checkout https://github.com/Kaedenn/twitch-api
cd twitch-filtered-chat
firefox index.html # or chrome, or whatever browser you fancy
```
and have fun!

### Plugins

Plugin documentation is coming relatively soon.

### Commands

Chat command documentation is coming relatively soon.

## Testing

Please test the filtered chat in your own browser. Load it up and ensure you can change settings and that things work as you'd expect.

`https://kaedenn.github.io/twitch-filtered-chat/index.html?debug=1&channels=%23dwangoac&module1=DwangoAC%2520Chat%2C1111111%2C%2CKaedenn_%2CTAS9000%252CNightbot%252CStay_Hydrated_Bot%2C!%2C%252523dwangoAC&module2=Main%2520Chat%2C1111111%2C%2CKaedenn_%2CTAS9000%252CNightbot%252CStay_Hydrated_Bot%2C!%2C&layout=double%3Achat`

If you have errors loading that, try the following link which forces ES5:

`https://kaedenn.github.io/twitch-filtered-chat/index.html?debug=1&channels=%23dwangoac&module1=DwangoAC%2520Chat%2C1111111%2C%2CKaedenn_%2CTAS9000%252CNightbot%252CStay_Hydrated_Bot%2C!%2C%252523dwangoAC&module2=Main%2520Chat%2C1111111%2C%2CKaedenn_%2CTAS9000%252CNightbot%252CStay_Hydrated_Bot%2C!%2C&layout=double%3Achat&usedist=1`

## Vim Support

These files use vim section labels to assist code folding. You may use the following if `foldmethod=section` doesn't work for you.

```vim
function! <SID>FoldAllSections(...)
  let oldpos = getpos(".")
  call setpos(".", [bufnr("%"), 0, 0, 0])
  let s = search("{{{[0-9]", "W")
  while s != 0
    let ls = line(".")
    let sn = getline(".")[match(getline("."), "{{{[0-9]") + 3][0]
    let le = search(sn . "}}}", "nW")
    execute(":" . ls . "," . le . "fold")
    execute(":" . ls . "," . le . "foldopen")
    let s = search("{{{[0-9]", "W")
  endwhile
  execute(":normal zM")
  call setpos(".", oldpos)
endfunction

map <leader>F :call <SID>FoldAllSections()^M
```

Note that `^M` refers to a literal `^M` character: `^V^M` on Linux. This can be omitted; you will instead need to press Enter after typing `<leader>F`.

## Credits

YoshiRulz - Improving rainbow effect

Inverted - Improving username contrast, helping with disco effect

SighnWave - Creating the disco effect

Feeve - Assisting with debugging resub bugs
