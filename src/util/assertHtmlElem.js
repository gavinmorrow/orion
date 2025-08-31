/**
 * @template {Element?} T
 * @param {T} e
 * @returns {T extends null ? null : (T & HTMLElement)} */
export const assertHTMLElem = (e) => {
  if (e == null) return /** @type {any} */ (e);

  // Must take property off of window b/c DOM elems are from the page realm
  // See <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof#instanceof_and_multiple_realms> (2025-08-31)
  if (!(e instanceof window.HTMLElement))
    throw new Error(`HTMLElement assertion failed! elem: ${e}`);

  return /** @type {T extends null ? null : (T & HTMLElement)} */ (e);
};

/**
 * @template {Element} T
 * @param {NodeListOf<T>} l
 * @returns {NodeListOf<T & HTMLElement>} */
export const assertHTMLElems = (l) => {
  // Must take property off of window b/c DOM elems are from the page realm
  // See <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof#instanceof_and_multiple_realms> (2025-08-31)
  if (l.item(0) != null && !(l.item(0) instanceof window.HTMLElement))
    throw new Error(`NodeList<HTMLElement> assertion failed! list: ${l}`);

  return /** @type {NodeListOf<T & HTMLElement>} */ (l);
};
