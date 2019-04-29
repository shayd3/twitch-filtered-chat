/* Twitch Filtered Chat Main Configuration */

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
const CSSCheerStyles = {
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
  return {
    cost: 1,
    style: `color: ${AllColors[colorname]}`
  };
}

