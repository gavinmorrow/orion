import api from "/src/util/api.js";
import { assertIsClass } from "/src/util/assertIsClass.js";
import { resizeHeaderSpacer } from "/src/util/headerHeight.js";
import { NonNull } from "/src/util/NonNull.js";
import { reportError } from "/src/util/reportError.js";

import { BannerAlert } from "../banner-alert.js";
import {
  featureFlag,
  getAssignmentsCache,
  promiseError,
  settings,
  waitFor,
  waitForElem,
} from "../common.js";

import AssignmentCenter from "./AssignmentCenter.js";
import { createOrionMain } from "./create-orion-main.js";
import ToolbarMenu from "./ToolbarMenu.js";

console.info("Modifying assignment center...");

const viewIconNames = {
  calendar: "calendar-ltr",
  list: "text-bullet-list",
};

/**
 * @typedef {keyof typeof viewIconNames} View
 */
const views = {
  /** @param {View} view */
  switchTo: async (view) => views.getElem(view).then((btn) => btn.click()),

  /**
   * @param {View} iconName The name of the icon in the input
   * @returns {Promise<HTMLInputElement>}
   */
  getElem: async (iconName) => {
    const elem = await waitForElem(
      `[aria-label='Assignment center view'] [iconname='${viewIconNames[iconName]}'] input`,
    );
    assertIsClass(elem, HTMLInputElement);
    return elem;
  },

  currentView: async () => {
    const calendar = await views.getElem("calendar");
    const list = await views.getElem("list");

    if (calendar?.checked) return "calendar";
    else if (list?.checked) return "list";
    else {
      console.error("Unknown view!", { calendar, list });
      return null;
    }
  },

  /**
   * Register an event handler to be called on every view change.
   * @param {(newView: View, e: Event) => any} fn
   */
  onChange: async (fn) => {
    const allViews = /** @type {(keyof typeof viewIconNames)[]} */ (
      Object.keys(viewIconNames)
    );
    for (const view of allViews) {
      const elem = await views.getElem(view);
      elem.addEventListener("change", fn.bind(null, view));
    }
  },
};

/**
 * FIXES: At the top of the calendar, if the month is too long, it wraps onto
 * the next line. However, the containing div doesn't grow to fit.
 */
const fixCalendarHeaderOverflow = featureFlag(
  (s) => s.assignmentCenter.calendar.fixCalendarHeaderOverflow,
  async () => {
    const calHeader = await waitForElem("#calendar-date-container");
    if (calHeader) calHeader.style.height = "fit-content";
    else console.error("calendar header not found.");
  },
);

const filterByNotCompleted = featureFlag(
  (s) => s.assignmentCenter.filter.autoNotCompleted,
  async () => {
    const completedInput = await waitFor(async () =>
      Array.from(
        document.querySelectorAll("label.sky-checkbox-wrapper.sky-switch"),
      )
        .filter((e) => e.textContent === "Completed")[0]
        .querySelector("input"),
    );
    if (completedInput?.checked === true) completedInput.click();
  },
);

const hideLowerNavbar = featureFlag(
  (s) => s.assignmentCenter.hideLowerNavbar,
  async () => {
    const lowerNavbar = await waitForElem("#site-nav-lower");
    if (lowerNavbar == null) return;
    lowerNavbar.hidden = true;

    await resizeHeaderSpacer();
    // It's okay to call this on resize because (in experimental testing)
    // it consistently took <= 1ms
    window.addEventListener("resize", resizeHeaderSpacer);
  },
);

const createCustomUi = async () => {
  // switch to list view, so scraping is possible
  views.switchTo("list");

  const oldElem = NonNull(await waitForElem("app-student-assignment-center"));

  try {
    const wrapper = await createOrionMain(oldElem);
    // construct our own elements
    const cachedAssignments = await getAssignmentsCache();
    console.log({ cachedAssignments });
    const assignmentCenter = new AssignmentCenter(
      cachedAssignments,
      await settings(),
    );
    const toolbarMenu = new ToolbarMenu({ oldElem, assignmentCenter });
    wrapper.append(toolbarMenu, assignmentCenter);

    // hide theirs
    oldElem.hidden = true;

    const updateAssignments = async () => {
      try {
        const assignments = await api
          .getAllAssignmentData()
          .then(api.parseAssignments);
        assignmentCenter.meshAssignmentsArray(assignments);
      } catch (err) {
        assertIsClass(err, Error);
        reportError(err);
      }
    };
    if (navigator.onLine) await updateAssignments();
    else {
      const banner = BannerAlert.createBanner(
        "Waiting for internet connection...",
        "info",
        [{ name: "reload", displayText: "Reload page" }],
      );
      banner.addEventListener("banner-alert-action-reload", () =>
        location.reload(),
      );
      window.addEventListener("online", updateAssignments);
    }

    // Scrape active assignments first so it goes faster
    // await scrapeAssignments("Active").then(assignmentCenter.addAssignments);
    // await scrapeAssignments("Past").then(assignmentCenter.addAssignments);
  } catch (err) {
    console.error(`There was an error creating the custom UI: ${err}`);
    console.error(err);
    assertIsClass(err, Error);
    reportError(err);
  }
};

const assignmentCenterBroken = featureFlag(
  (s) => s.assignmentCenter.reloadOnBroken,
  async () => {
    const loggedIn = (await waitForElem("#site-logo", 2000)) != null;
    const activeAssignments = !document.body.textContent.includes(
      "0 Active assignments",
    );
    if (!activeAssignments && !loggedIn) location.reload();

    if ((await views.currentView()) == null) await views.switchTo("calendar");
  },
);

const modifyCalendarView = featureFlag(
  (s) => s.assignmentCenter.calendar.enabled,
  async () => {
    console.info("Modifying calendar view...");
    await fixCalendarHeaderOverflow();
  },
);

const modifyListView = featureFlag(
  (s) => s.assignmentCenter.list.enabled,
  async () => {
    console.info("Modifying list view...");
  },
);

const modifyFilters = featureFlag(
  (s) => s.assignmentCenter.filter.enabled,
  async () => {
    console.info("Modifying filters...");
    await filterByNotCompleted();
  },
);

/** @param {View} view */
const modifyView = async (view) => {
  switch (view) {
    case "calendar":
      await modifyCalendarView();
      break;
    case "list":
      await modifyListView();
      break;
  }
};

promiseError(
  featureFlag(
    (s) => s.assignmentCenter.enabled,
    async () => {
      // needs to go first, bc everything else will fail if it is broken
      await assignmentCenterBroken();

      // this should run regardless of whether or not the custom UI is enabled
      await hideLowerNavbar();

      if ((await settings()).assignmentCenter.customUi.enabled) {
        await createCustomUi();
      } else {
        // These are seperate bc filters don't get reset on view change
        await modifyFilters();

        views.onChange(modifyView);
        await modifyView(NonNull(await views.currentView()));
      }
    },
  ),
  reportError,
)();
