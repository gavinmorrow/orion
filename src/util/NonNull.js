/**
 * @template T
 * @param {T} x
 * @param {string} context
 * @returns {NonNullable<T>}
 */
export const NonNull = (x, context = "none") => {
  if (x === null || x === undefined)
    throw new Error(`non-null assertion failed! context: ${context}`);
  return x;
};
