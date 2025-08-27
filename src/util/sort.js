/**
 * Sort two of anything for `Array.prototype.sort()`
 * @template T
 * @param {T} a
 * @param {T} b
 * @returns {-1|0|1} -1 if a < b, +1 if a > b, and 0 otherwise
 */
export const sortForArray = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
