/** @param {{ [index: string]: any }} a @param {{ [index: string]: any }} b */
export default function meshObjects(a = {}, b = {}) {
  const o = structuredClone(a);
  for (const p in b) {
    if (Object.hasOwn(o, p) && typeof o[p] === "object")
      o[p] = meshObjects(o[p], b[p]);
    else o[p] = b[p];
  }
  return o;
}
