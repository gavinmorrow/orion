import { BannerAlert } from "./banner-alert";
import { featureFlag, promiseError, waitForElems } from "./common";

promiseError(
  featureFlag(
    (s) => s.keepWorking.clickAutomatically,
    async () => {
      // Okay to use while loop b/c it awaits a promise internally
      while (true) {
        // Full path as of 2025-05-14:
        //
        //   sky-modal-host
        // > sky-confirm
        // > .sky-confirm
        // > sky-modal
        // > .sky-modal-dialog
        // > .sky-modal
        // > .sky-modal-content
        // > sky-modal-content
        // > .sky-confirm-buttons
        // > button[keep working]

        // Search for a modal
        // SAFETY: query selects for button
        const modalBtns = /** @type {NodeListOf<HTMLButtonElement>?} */ (
          await waitForElems(
            "sky-modal .sky-confirm-buttons button",
            Infinity,
            // Try not to hog resources.
            // The interval can be somewhat low b/c if the keep working dialog pops
            // up, they're probably not actively using the site anyways.
            1000,
          )
        );

        if (modalBtns == null) continue;

        // Look for the correct button
        const keepWorkingBtns = Array.from(modalBtns).filter((elem) =>
          elem.textContent.toLowerCase().includes("keep working"),
        );
        if (keepWorkingBtns.length > 1) {
          console.error(
            "Multiple keep working buttons found:",
            keepWorkingBtns,
          );
          throw new Error("Multiple keep working buttons found");
        }

        const keepWorkingBtn = keepWorkingBtns[0];
        // It may not be the right modal, so it's fine if the button doesn't exist.
        if (keepWorkingBtn == null) continue;
        keepWorkingBtn.click();

        // Show a banner if requested
        featureFlag(
          (s) => s.keepWorking.showBanner,
          () =>
            BannerAlert.createBanner(
              "Keep working automatically clicked.",
              "info",
            ),
        );
      }
    },
  ),
  reportError,
)();
