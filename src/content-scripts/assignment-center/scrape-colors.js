import { assertHTMLElem, assertHTMLElems } from "/src/util/assertHtmlElem.js";
import { NonNull } from "/src/util/NonNull.js";

import { memo } from "../common.js";

/**
 * Assumes the page is already loaded.
 * @returns A map of class names (*not* ids) to *rgb* css colors.
 */
export const [scrapeClassColors, _updateScrapedClassColors] = memo(async () => {
  const toolbarDropdownButtons = Array.from(
    assertHTMLElems(
      document.querySelectorAll(
        // Select for all dropdown buttons in the toolbar
        "app-student-assignment-center sky-toolbar button.sky-dropdown-button",
      ),
    ),
  ).filter(
    // There are multiple that are dropdowns (although one is hidden):
    // "Reports" and "More" (the "…"). They have weird spaces in front/behind,
    // so just check if it is included.
    (btn) => btn.textContent.toLowerCase().includes("more"),
  );

  if (toolbarDropdownButtons.length != 1) {
    console.warn(
      "Could not find the view more toolbar button. Candidates: ",
      toolbarDropdownButtons,
    );
    return new Map();
  }

  toolbarDropdownButtons[0].click();

  // Hide the popup
  const popup = NonNull(
    assertHTMLElem(document.querySelector("sky-dropdown-menu")),
  );
  popup.style.display = "none";
  // Wait for a bit because it doesn't appear instantly. (CURSE YOU ANGULAR(?))
  await new Promise((r) => setTimeout(r, 100));
  // Show the popup again because the rest of the stuff happens quickly enough
  // to not actually show up, and this is very close to the code that hides it.
  // Also, if the user disables the custom UI, they might want to use this.
  popup.style.display = "";

  const editViewSettingsBtn = Array.from(
    assertHTMLElems(
      document.querySelectorAll("sky-dropdown-menu sky-dropdown-item button"),
    ),
  ).filter((btn) => btn.textContent.toLowerCase().includes("view settings"));

  if (editViewSettingsBtn.length != 1) {
    console.warn(
      "Could not find the edit view settings button. Candidates: ",
      editViewSettingsBtn,
    );
    return new Map();
  }

  editViewSettingsBtn[0].click();

  const colorpickers = Array.from(
    document.querySelectorAll("sky-modal-content sky-colorpicker"),
  );
  const colors = colorpickers.map(
    (colorpicker) =>
      NonNull(
        assertHTMLElem(colorpicker.querySelector("button[title*='select' i]")),
      ).style.backgroundColor,
  );
  const classes = colorpickers.map((btn) =>
    NonNull(
      NonNull(btn.parentElement).previousElementSibling,
    ).textContent.trim(),
  );
  const map = new Map();
  for (let i = 0; i < classes.length; i++) {
    map.set(classes[i], colors[i]);
  }

  const closeBtn = Array.from(
    assertHTMLElems(document.querySelectorAll("sky-modal-footer button")),
  ).find((btn) => btn.textContent.toLowerCase().includes("cancel"));

  if (closeBtn != undefined) closeBtn.click();
  else {
    // TODO: report error unobtrusively.
    console.error("Could not find the close button.");

    // As a backup, just hide the entire modal so stuff is still useable.
    NonNull(
      assertHTMLElem(document.querySelector("sky-modal-host")),
    ).style.display = "none";
  }

  return map;
});
