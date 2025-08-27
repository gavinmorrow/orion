/**
 * @template T
 * @param {T} o
 * @returns {T extends { [key: string]: any} ? true : false} */
const isObject = (o) =>
  /** @type {any} */ (o?.toString() === "[object Object]");

/**
 * Find the difference in two objects.
 * @template {{[key: string]: any }} T
 * @param {T} a
 * @param {T} b
 * @returns {{[key: string]: any }}
 */
export const findDiff = (a, b) => {
  /** @type {{ [key: string]: any}} */
  const diff = {};
  for (const key of Object.keys(a)) {
    const av = a[key];
    const bv = b[key];
    if (av !== bv) {
      if (isObject(av) && isObject(bv)) {
        const nestedDiff = findDiff(av, bv);
        if (Object.keys(nestedDiff).length > 0) {
          diff[key] = nestedDiff;
        }
      } else diff[key] = b[key];
    }
  }
  return diff;
};

/**
 * @param {{ [key: string]: any }} o
 * @param {{ [key: string]: any }} diff
 */
export const applyDiff = (o, diff) => {
  const clone = structuredClone(o);
  if (clone == null) return diff;
  if (diff == null) return clone;

  for (const key of Object.keys(diff)) {
    if (isObject(diff[key])) {
      clone[key] = applyDiff(clone[key], diff[key]);
    } else clone[key] = diff[key];
  }
  return clone;
};
