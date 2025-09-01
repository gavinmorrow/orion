// Use V instead of any b/c it is more semantically correct.
/**
 * NOTE: For objects from another realm, make sure to take the class from that realm as well.
 *       (e.g. use `window.HTMLInputElement` instead of `HTMLInputElement`.)
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof#instanceof_and_multiple_realms
 * @template V
 * @template T
 * @param {V} val
 * @param {new (...args: any) => T} ty
 * @returns {asserts val is T} */
export const assertIsClass = (val, ty) => {
  /** @type {boolean} */
  let isTy;

  try {
    isTy = val instanceof ty;
  } catch {
    // val is not an object
    isTy = false;
  }

  if (!isTy) {
    console.error("Type assertion failed!", { val, ty });
    throw new Error(`Type assertion failed! val: ${val}, ty: ${ty}`);
  }
};
