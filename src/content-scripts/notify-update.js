import { ApiError } from "/src/util/api.js";
import { assertIsClass } from "/src/util/assertIsClass.js";

import { BannerAlert } from "./banner-alert.js";
import { VERSION } from "./common.js";

/** @returns {Promise<string>} */
const getLatestVersion = async () => {
  // Don't use Promise methods to avoid `InternalError: Promise rejection
  // value is a non-unwrappable cross-compartment wrapper.`
  // (see <https://bugzilla.mozilla.org/show_bug.cgi?id=1871516>)
  try {
    const res = await fetch(
      "https://gavinmorrow.github.io/orion/updates.json",
      {
        cache: "no-cache",
      },
    );
    const json = await res.json();
    const versions =
      json.addons["{a58d637c-b5fb-4549-a2f6-ae76b6dd6672}"].updates;
    return versions[versions.length - 1].version;
  } catch (err) {
    assertIsClass(err, Error);
    throw new ApiError("checkForUpdates", err);
  }
};

/** @param {String} a @param {String} b */
const compareVersions = (a, b) => {
  const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
  const [bMajor, bMinor, bPatch] = b.split(".").map(Number);
  if (aMajor > bMajor) return -1;
  else if (aMajor < bMajor) return 1;
  else {
    if (aMinor > bMinor) return -1;
    else if (aMinor < bMinor) return 1;
    else {
      if (aPatch > bPatch) return -1;
      else if (bPatch > aPatch) return 1;
      else return 0;
    }
  }
};

/** @returns {Promise<Set<string>>} */
const getIgnoredUpdates = async () =>
  new Set(
    await browser.runtime.sendMessage({
      type: "updateReminders.getIgnoredUpdates",
    }),
  );
/** @param {string} data */
const setIngoredUpdate = async (data) =>
  browser.runtime.sendMessage({ type: "updateReminders.ignoreUpdate", data });

export default async () => {
  // Don't use Promise methods to avoid `InternalError: Promise rejection
  // value is a non-unwrappable cross-compartment wrapper.`
  // (see <https://bugzilla.mozilla.org/show_bug.cgi?id=1871516>)
  const latest = await getLatestVersion();
  const newVersionAvailable = compareVersions(VERSION, latest) === 1;
  const updateIgnored = (await getIgnoredUpdates()).has(latest);

  if (newVersionAvailable && !updateIgnored) {
    const banner = BannerAlert.createBanner(
      `New version available! Current: ${VERSION}, Latest: ${latest}`,
      "info",
      [
        { name: "show-update", displayText: "How to update" },
        { name: "remind-later", displayText: "Remind me later" },
      ],
      // TODO: include info on how to update
    );

    let ignoreUpdate = true;
    banner.addEventListener("banner-alert-action-show-update", async () => {
      ignoreUpdate = false;
      banner.close();

      const a = document.createElement("a");
      a.href = "https://gavinmorrow.github.io/orion/#updating";
      // *Not* target=_blank, b/c updating works best when the extension isn't open.
      a.click();
    });
    banner.addEventListener("banner-alert-action-remind-later", () => {
      ignoreUpdate = false;
      banner.close();
    });
    banner.addEventListener("banner-alert-close", () => {
      if (ignoreUpdate) setIngoredUpdate(latest);
    });
  }
};
