// Twitch Filtered Chat
// Configuration

// All user-configurable items should be included in this file

/* Defining a new CSS style:
 *  <style_name>: {
 *    cost: <number: bits>,
 *    class: <CSS class name(s) for text "span" element>,
 *    style: <CSS style(s) for text "span" element>,
 *    wclass: <CSS class name(s) for containing "div" element>,
 *    wstyle: <CSS style(s) for containing "div" element>,
 *    html_pre: <HTML to place before the line "span" element>,
 *    html_post: <HTML to place after the line "span" element>,
 *    whtml_pre: <HTML to place before the containing "div" element>,
 *    whtml_post: <HTML to place after the containing "div" element>
 *  }
 * Line format:
 *  <p>
 *    ${whtml_pre}
 *    <div class="line-wrapper ${wclass}" style="${wstyle}">
 *      badges
 *      <span class="username" style="color: ${username_color}; ${text_shadow}">
 *        username
 *      </span>
 *      ${html_pre}
 *      <span class="line-text ${class}" style="${style}">
 *        text
 *      </span>
 *      ${html_post}
 *    </div>
 *    ${whtml_post}
 *  </p>
 */
var css_styles = {
  cssmarquee: {
    _disabled: true,
    cost: 1,
    class: "effect-marquee",
    style: "",
    wclass: "effect-marquee-container",
    wstyle: "",
    html_pre: "",
    html_post: "",
    whtml_pre: "",
    whtml_post: ""
  },
  marquee: {
    cost: 1,
    //class: "effect-marquee",
    style: "",
    //wclass: "effect-marquee-container",
    wstyle: "",
    html_pre: "<marquee>",
    html_post: "</marquee>",
    whtml_pre: "",
    whtml_post: ""
  },
  bold: {
    cost: 1,
    class: "effect-bold",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: "",
    whtml_pre: "",
    whtml_post: ""
  },
  italic: {
    cost: 1,
    class: "effect-italic",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: "",
    whtml_pre: "",
    whtml_post: ""
  },
  underline: {
    cost: 1,
    class: "effect-underline",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: "",
    whtml_pre: "",
    whtml_post: ""
  },
  upsidedown: {
    cost: 1,
    class: "effect-upsidedown",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: "",
    whtml_pre: "",
    whtml_post: ""
  },
  inverted: {
    cost: 1,
    class: "effect-inverted",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: "",
    whtml_pre: "",
    whtml_post: ""
  },
  strikethrough: {
    cost: 1,
    class: "effect-strikethrough",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: "",
    whtml_pre: "",
    whtml_post: ""
  },
  subscript: {
    cost: 1,
    class: "effect-subscript",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: "",
    whtml_pre: "",
    whtml_post: ""
  },
  superscript: {
    cost: 1,
    class: "effect-superscript",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: "",
    whtml_pre: "",
    whtml_post: ""
  },
  big: {
    cost: 1,
    class: "effect-big",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: "",
    whtml_pre: "",
    whtml_post: ""
  },
  small: {
    cost: 1,
    class: "effect-small",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: "",
    whtml_pre: "",
    whtml_post: ""
  },
  rainbow: {
    cost: 1,
    class: "effect-rainbow",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: "",
    whtml_pre: "",
    whtml_post: ""
  }
};

function css_color_style(colorname) {
  return {
    cost: 1,
    style: `color: ${colors[colorname]}`
  };
}

/* Users allowed to use "force" */
var super_users = {
    Kaedenn_: 1,
    MediaMagnet: 1,
    dwangoAC: 1
};

/* Colors to use for users without username colors specified */
var default_colors = [
    '#0000FF',
    '#008000',
    '#FF0000',
    '#B22222',
    '#FF7F50',
    '#9ACD32',
    '#FF4500',
    '#2E8B57',
    '#DAA520',
    '#D2691E',
    '#5F9EA0',
    '#1E90FF',
    '#FF69B4',
    '#8A2BE2',
    '#00FF7F'
];

function GetRandomColor() {
    return default_colors[Math.floor(Math.random() * default_colors.length)];
}

