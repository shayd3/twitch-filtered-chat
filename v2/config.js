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
var CSSCheerStyles = {
  cssmarquee: {
    _disabled: true,
    cost: 1,
    class: "effect-marquee",
    style: "",
    wclass: "effect-marquee-container",
    wstyle: "",
    html_pre: "",
    html_post: ""
  },
  marquee: {
    cost: 1,
    //class: "effect-marquee",
    style: "",
    //wclass: "effect-marquee-container",
    wstyle: "",
    html_pre: "<marquee>",
    html_post: "</marquee>"
  },
  bold: {
    cost: 1,
    class: "effect-bold",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: ""
  },
  italic: {
    cost: 1,
    class: "effect-italic",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: ""
  },
  underline: {
    cost: 1,
    class: "effect-underline",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: ""
  },
  upsidedown: {
    cost: 1,
    class: "effect-upsidedown",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: ""
  },
  inverted: {
    cost: 1,
    class: "effect-inverted",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: ""
  },
  strikethrough: {
    cost: 1,
    class: "effect-strikethrough",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: ""
  },
  subscript: {
    cost: 1,
    class: "effect-subscript",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: ""
  },
  superscript: {
    cost: 1,
    class: "effect-superscript",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: ""
  },
  big: {
    cost: 1,
    class: "effect-big",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: ""
  },
  small: {
    cost: 1,
    class: "effect-small",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: ""
  },
  rainbow: {
    cost: 1,
    class: "effect-rainbow",
    style: "",
    wclass: "",
    wstyle: "",
    html_pre: "",
    html_post: ""
  }
};

function CSSColorStyle(colorname) {
  return {
    cost: 1,
    style: `color: ${AllColors[colorname]}`
  };
}

/* Colors to use for users without username colors specified */
var DefaultUserColors = [
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

