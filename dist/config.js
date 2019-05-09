/* Twitch Filtered Chat Main Configuration */

"use strict";

/* Defining a new CSS style:
 *  <style_name>: {
 *    cost: <number: bits>,
 *    class: <CSS class name(s) for text "span" element>,
 *    style: <CSS style(s) for text "span" element>,
 *    wclass: <CSS class name(s) for containing "div" element>,
 *    wstyle: <CSS style(s) for containing "div" element>,
 *    html_pre: <HTML to place before the line "span" element>,
 *    html_post: <HTML to place after the line "span" element>,
 *  }
 * Line format:
 *  <div class="line line-wrapper">
 *    <div class="chat-line ${wclass}" style="${wstyle}">
 *      <span class="badges" data-badges="1">
 *        <img class="badge" ... />
 *      </span>
 *      <span class="username" style="color: ${username_color}; ${text_shadow}">
 *        username
 *      </span>
 *      ${html_pre}
 *      <span class="message ${class}" style="${style}">
 *        text
 *      </span>
 *      ${html_post}
 *    </div>
 *  </div>
 */

/* CSS cheer styles */

var CSSCheerStyles = { /* exported CSSCheerStyles */
  cssmarquee: {
    _disabled: true,
    cost: 1,
    class: "effect-marquee",
    wclass: "effect-marquee-container"
  },
  marquee: {
    cost: 1,
    html_pre: "<marquee>",
    html_post: "</marquee>"
  },
  bold: {
    cost: 1,
    class: "effect-bold"
  },
  italic: {
    cost: 1,
    class: "effect-italic"
  },
  underline: {
    cost: 1,
    class: "effect-underline"
  },
  upsidedown: {
    cost: 1,
    class: "effect-upsidedown"
  },
  inverted: {
    cost: 1,
    class: "effect-inverted"
  },
  strikethrough: {
    cost: 1,
    class: "effect-strikethrough"
  },
  subscript: {
    cost: 1,
    class: "effect-subscript"
  },
  superscript: {
    cost: 1,
    class: "effect-superscript"
  },
  big: {
    cost: 1,
    class: "effect-big"
  },
  small: {
    cost: 1,
    class: "effect-small"
  },
  rainbow: {
    cost: 1,
    class: "effect-rainbow"
  }
};

/* Generate a CSSCheerStyle for the color given */
function CSSColorStyle(colorname) {
  /* exported CSSColorStyle */
  return {
    cost: 1,
    style: "color: " + AllColors[colorname]
  };
}

/* Obtain a style definition for the given word */
function GetCheerStyle(word) {
  /* exported GetCheerStyle */
  if (CSSCheerStyles.hasOwnProperty(word)) {
    return CSSCheerStyles[word];
  } else if (ColorNames.hasOwnProperty(word)) {
    return CSSColorStyle(word);
  }
  return null;
}

/* Colors usable in cheer effects */
var ColorNames = { /* exported ColorNames */
  "dust": "#b2996e",
  "tea": "#65ab7c",
  "cement": "#a5a391",
  "spruce": "#0a5f38",
  "booger": "#9bb53c",
  "bland": "#afa88b",
  "desert": "#ccad60",
  "purply": "#983fb2",
  "liliac": "#c48efd",
  "custard": "#fffd78",
  "manilla": "#fffa86",
  "bruise": "#7e4071",
  "azul": "#1d5dec",
  "darkgreen": "#054907",
  "lichen": "#8fb67b",
  "burple": "#6832e3",
  "butterscotch": "#fdb147",
  "toupe": "#c7ac7d",
  "squash": "#f2ab15",
  "cinnamon": "#ac4f06",
  "cocoa": "#875f42",
  "orangeish": "#fd8d49",
  "swamp": "#698339",
  "camo": "#7f8f4e",
  "fern": "#63a950",
  "sapphire": "#2138ab",
  "parchment": "#fefcaf",
  "straw": "#fcf679",
  "terracota": "#cb6843",
  "creme": "#ffffb6",
  "topaz": "#13bbaf",
  "wintergreen": "#20f986",
  "leather": "#ac7434",
  "hazel": "#8e7618",
  "canary": "#fdff63",
  "mushroom": "#ba9e88",
  "greenblue": "#23c48b",
  "carmine": "#9d0216",
  "grapefruit": "#fd5956",
  "ice": "#d6fffa",
  "algae": "#54ac68",
  "pinky": "#fc86aa",
  "darkblue": "#030764",
  "rosa": "#fe86a4",
  "lipstick": "#d5174e",
  "claret": "#680018",
  "dandelion": "#fedf08",
  "orangered": "#fe420f",
  "ruby": "#ca0147",
  "dark": "#1b2431",
  "putty": "#beae8a",
  "saffron": "#feb209",
  "twilight": "#4e518b",
  "bluegrey": "#85a3b2",
  "petrol": "#005f6a",
  "royal": "#0c1793",
  "butter": "#ffff81",
  "orangish": "#fc824a",
  "leaf": "#71aa34",
  "sunflower": "#ffc512",
  "velvet": "#750851",
  "carnation": "#fd798f",
  "wisteria": "#a87dc2",
  "pale": "#fff9d0",
  "greyblue": "#77a1b5",
  "purpley": "#8756e4",
  "diarrhea": "#9f8303",
  "viridian": "#1e9167",
  "bile": "#b5c306",
  "spearmint": "#1ef876",
  "yellowgreen": "#bbf90f",
  "heather": "#a484ac",
  "mango": "#ffa62b",
  "shamrock": "#01b44c",
  "bubblegum": "#ff6cb5",
  "lightgreen": "#76ff7b",
  "merlot": "#730039",
  "apple": "#6ecb3c",
  "heliotrope": "#d94ff5",
  "dusk": "#4e5481",
  "kiwi": "#9cef43",
  "seaweed": "#18d17b",
  "iris": "#6258c4",
  "perrywinkle": "#8f8ce7",
  "tealish": "#24bca8",
  "pear": "#cbf85f",
  "sandy": "#f1da7a",
  "greyish": "#a8a495",
  "banana": "#ffff7e",
  "tomato": "#ef4026",
  "sea": "#3c9992",
  "buff": "#fef69e",
  "fawn": "#cfaf7b",
  "amethyst": "#9b5fc0",
  "chestnut": "#742802",
  "pea": "#a4bf20",
  "stone": "#ada587",
  "earth": "#a2653e",
  "asparagus": "#77ab56",
  "blueberry": "#464196",
  "caramel": "#af6f09",
  "ocher": "#bf9b0c",
  "lightblue": "#7bc8f6",
  "golden": "#f5bf03",
  "gunmetal": "#536267",
  "cherry": "#cf0234",
  "midnight": "#03012d",
  "blood": "#770001",
  "berry": "#990f4b",
  "poo": "#8f7303",
  "snot": "#acbb0d",
  "drab": "#828344",
  "rouge": "#ab1239",
  "wheat": "#fbdd7e",
  "watermelon": "#fd4659",
  "mulberry": "#920a4e",
  "auburn": "#9a3001",
  "celadon": "#befdb7",
  "celery": "#c1fd95",
  "strawberry": "#fb2943",
  "copper": "#b66325",
  "ivory": "#ffffcb",
  "adobe": "#bd6c48",
  "barney": "#ac1db8",
  "ocre": "#c69c04",
  "maize": "#f4d054",
  "sandstone": "#c9ae74",
  "camel": "#c69f59",
  "marine": "#042e60",
  "sepia": "#985e2b",
  "coffee": "#a6814c",
  "mocha": "#9d7651",
  "ecru": "#feffca",
  "purpleish": "#98568d",
  "cranberry": "#9e003a",
  "melon": "#ff7855",
  "silver": "#c5c9c7",
  "amber": "#feb308",
  "vermillion": "#f4320c",
  "russet": "#a13905",
  "pine": "#2b5d34",
  "bluish": "#2976bb",
  "bronze": "#a87900",
  "shit": "#7f5f00",
  "dirt": "#8a6e45",
  "pistachio": "#c0fa8b",
  "yellowish": "#faee66",
  "bordeaux": "#7b002c",
  "ocean": "#017b92",
  "marigold": "#fcc006",
  "steel": "#738595",
  "blush": "#f29e8e",
  "lemon": "#fdff52",
  "cerise": "#de0c62",
  "apricot": "#ffb16d",
  "blurple": "#5539cc",
  "bluegreen": "#017a79",
  "forest": "#0b5509",
  "ultramarine": "#2000b1",
  "purplish": "#94568c",
  "reddish": "#c44240",
  "avocado": "#90b134",
  "umber": "#b26400",
  "poop": "#7f5e00",
  "eggshell": "#ffffd4",
  "denim": "#3b638c",
  "evergreen": "#05472a",
  "aubergine": "#3d0734",
  "mahogany": "#4a0100",
  "mud": "#735c12",
  "brownish": "#9c6d57",
  "clay": "#b66a50",
  "jade": "#1fa774",
  "emerald": "#01a049",
  "sky": "#82cafc",
  "orchid": "#c875c4",
  "raspberry": "#b00149",
  "tangerine": "#ff9408",
  "pumpkin": "#e17701",
  "charcoal": "#343837",
  "cornflower": "#6a79f7",
  "chocolate": "#3d1c02",
  "scarlet": "#be0119",
  "sienna": "#a9561e",
  "terracotta": "#ca6641",
  "grass": "#5cac2d",
  "moss": "#769958",
  "vomit": "#a2a415",
  "pinkish": "#d46a7e",
  "cobalt": "#1e488f",
  "wine": "#80013f",
  "azure": "#069af3",
  "grape": "#6c3461",
  "greenish": "#40a368",
  "coral": "#fc5a50",
  "cream": "#ffffc2",
  "brick": "#a03623",
  "sage": "#87ae73",
  "white": "#ffffff",
  "eggplant": "#380835",
  "puke": "#a5a502",
  "fuchsia": "#ed0dd9",
  "crimson": "#8c000f",
  "ochre": "#bf9005",
  "cerulean": "#0485d1",
  "rust": "#a83c09",
  "slate": "#516572",
  "goldenrod": "#fac205",
  "seafoam": "#80f9ad",
  "puce": "#a57e52",
  "sand": "#e2ca76",
  "mint": "#9ffeb0",
  "chartreuse": "#c1f80a",
  "taupe": "#b9a281",
  "khaki": "#aaa662",
  "burgundy": "#610023",
  "plum": "#580f41",
  "gold": "#dbb40c",
  "glod": "#ffdf00",
  "tasbot": "#7a5b07",
  "navy": "#01153e",
  "aquamarine": "#04d8b2",
  "rose": "#cf6275",
  "mustard": "#ceb301",
  "indigo": "#380282",
  "lime": "#aaff32",
  "periwinkle": "#8e82fe",
  "peach": "#ffb07c",
  "black": "#000000",
  "lilac": "#cea2fd",
  "beige": "#e6daa6",
  "salmon": "#ff796c",
  "olive": "#6e750e",
  "maroon": "#650021",
  "mauve": "#ae7181",
  "aqua": "#13eac9",
  "cyan": "#00ffff",
  "tan": "#d1b26f",
  "lavender": "#c79fef",
  "turquoise": "#06c2ac",
  "violet": "#9a0eea",
  "grey": "#929591",
  "yellow": "#ffff14",
  "magenta": "#c20078",
  "orange": "#f97306",
  "teal": "#029386",
  "red": "#e50000",
  "brown": "#653700",
  "pink": "#ff81c0",
  "blue": "#0343df",
  "green": "#15b01a",
  "purple": "#7e1e9c"
};