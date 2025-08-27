import { NonNull } from "/src/util/NonNull.js";

import { settings, waitForElem } from "../common.js";

/**
 * Returns the #orion-main element, or creates it if it doesn't exist.
 * @param {HTMLElement?} sibling
 * @returns {Promise<HTMLElement>}
 */
export const createOrionMain = async (sibling = null) => {
  let orionMain = document.getElementById("orion-main");

  if (orionMain == null) {
    orionMain = document.createElement("div");
    orionMain.id = "orion-main";
    orionMain.style.colorScheme = "dark";

    const s = await settings();
    orionMain.style.filter = `saturate(${s.assignmentCenter.customUi.saturation})`;

    if (sibling == null) {
      console.log("Waiting for assignment center...");
      sibling = await waitForElem("app-student-assignment-center", null);
    }
    // Always defined b/c it's not the root elem
    NonNull(sibling.parentElement).prepend(orionMain);
  }

  return orionMain;
};
