/**
 * @template {Element?} T
 * @param {T} e
 * @returns {T extends null ? null : (T & HTMLElement)} */
export const assertHTMLElem = (e) => {
  if (e == null) return /** @type {any} */ (e);

  if (!(e instanceof HTMLElement))
    throw new Error(`HTMLElement assertion failed! elem: ${e}`);

  return /** @type {T extends null ? null : (T & HTMLElement)} */ (e);
};

/**
 * @template {Element} T
 * @param {NodeListOf<T>} l
 * @returns {NodeListOf<T & HTMLElement>} */
export const assertHTMLElems = (l) => {
  if (l.item(0) != null && !(l.item(0) instanceof HTMLElement))
    throw new Error(`NodeList<HTMLElement> assertion failed! list: ${l}`);

  return /** @type {NodeListOf<T & HTMLElement>} */ (l);
};
