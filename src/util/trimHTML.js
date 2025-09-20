/** @param {ChildNode?} node */
const isWhitespace = (node) => node?.textContent?.trim() === "";

/** @param {HTMLElement} elem */
export const trimHTML = (elem) => {
  while (isWhitespace(elem.firstChild)) {
    elem.firstChild?.remove();
  }
  while (isWhitespace(elem.lastChild)) {
    elem.lastChild?.remove();
  }
};
