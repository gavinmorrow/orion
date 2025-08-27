import { BannerAlert } from "../content-scripts/banner-alert.js";

import { ApiError } from "./api.js";
import { assertIsClass } from "./assertIsClass.js";
import { NonNull } from "./NonNull.js";

/**
 * Display an error to the user.
 * @param {ApiError|Error} err */
export const reportError = (err) => {
  console.error(err);

  try {
    if (shouldAlert(err)) {
      const suggestReload = err instanceof ApiError ? err.suggestReload : true;
      // TODO: include count of how many times it occurred
      const banner = BannerAlert.createBanner(
        `Error: ${err.message}. If this persists, please contact Gavin.`,
        "warning",
        [
          ...(suggestReload
            ? [{ name: "reload", displayText: "Reload page" }]
            : []),
          { name: "full-error", displayText: "Show full error" },
          { name: "email", displayText: "Email Gavin" },
        ],
      );

      banner.addEventListener("banner-alert-action-reload", () => {
        location.reload();
      });

      const fullMessage = `${err}\n\nCause:\n${err.cause}\n\nStack:\n${err.stack}`;
      banner.addEventListener("banner-alert-action-full-error", () => {
        alert(fullMessage);
      });

      banner.addEventListener("banner-alert-action-email", () => {
        const a = document.createElement("a");
        a.href = `mailto:gavinmorrow${"@"}hunterschools${"."}org?subject=${encodeURI("Error in Orion")}&body=${encodeURI(fullMessage)}`;
        a.target = "_blank";
        a.click();
      });
    }
  } catch (e) {
    assertIsClass(e, Error);

    let msg = `Error thrown while reporting error:

New Error: ${e}
Cause:${e.cause}
Stack:${e.stack}

Original Error: ${err}
Cause: ${err.cause}
Stack: ${err.stack}`;

    console.error(msg);
    alert(msg);
  }
};

///-/// Prevent spam errors from being reported too much ///-///
/** @type {Map<keyof typeof ApiError.MESSAGES|string, number> } */
let recentErrors = new Map();
/** @param {ApiError|Error} err @returns {boolean}*/
const shouldAlert = (err) => {
  const action = err instanceof ApiError ? err.action : err.message;
  const numRecent = recentErrors.get(action) ?? 0;

  // Increment count
  recentErrors.set(action, numRecent + 1);
  // Decrement count after period of time
  setTimeout(
    () =>
      recentErrors.set(
        action,
        NonNull(recentErrors.get(action), "error count should be set") - 1,
      ),
    1 * 1000,
  );

  return numRecent <= 0;
};
