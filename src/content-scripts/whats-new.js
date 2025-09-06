import { BannerAlert } from "./banner-alert.js";
import { promiseError, VERSION } from "./common.js";

const getViewedVersions = async () =>
  new Set(
    await browser.runtime.sendMessage({ type: "whatsNew.getViewedVersions" }),
  );
const setVersionViewed = async (/** @type {string} */ data) =>
  browser.runtime.sendMessage({ type: "whatsNew.setVersionViewed", data });

promiseError(async () => {
  /** @type {Set<string>} */
  const viewedVersions = await getViewedVersions();
  if (viewedVersions.has(VERSION)) {
    console.log(`What's New already viewed for version ${VERSION}.`);
    return;
  }

  const wrapper = document.createElement("div");
  document.body.appendChild(wrapper);

  const banner = BannerAlert.createBanner(
    `Orion was updated to version ${VERSION}.`,
    "info",
    [
      { name: "open-changelog", displayText: "Open changelog" },
      { name: "remind-later", displayText: "Remind me later" },
    ],
  );
  let remindLater = false;
  banner.addEventListener("banner-alert-action-open-changelog", async () => {
    banner.close();

    const a = document.createElement("a");
    a.href = "https://gavinmorrow.github.io/orion/CHANGELOG";
    a.target = "_blank";
    a.click();
  });
  banner.addEventListener("banner-alert-action-remind-later", () => {
    remindLater = true;
    banner.close();
  });
  banner.addEventListener("banner-alert-close", () => {
    if (!remindLater) setVersionViewed(VERSION);
  });
}, reportError)();
