import meshObjects from "../util/meshObjects.js";

import meshAssignmentsArray from "./mesh-assignments-array.js";

/** @typedef {(msg: { type: string, data: any }, sender: unknown) => Promise<any> } Listener */

///================///
///=== SETTINGS ===///
///================///
const defaultSettings = {
  loginAutomatically: {
    hunter: true,
    blackbaud: true,
    google: {
      email: true,
      password: true,
    },
  },
  assignmentCenter: {
    enabled: true,
    customUi: {
      enabled: true,
      statusColors: {
        // "To do": "oklch(42% 0.07 86)" /* yellow */,
        toDo: "oklch(42% 0.17 214)" /* blue */,
        inProgress: "oklch(42% 0.17 214)" /* blue */,
        completed: "oklch(42% 0.17 146)" /* green */,
        graded: "oklch(42% 0.17 146)" /* green */,
        missing: "oklch(42% 0.17 0)" /* red */,
        overdue: "oklch(42% 0.17 0)" /* red */,
      },
      saturation: 1,
    },
    calendar: {
      enabled: true,
      fixCalendarHeaderOverflow: true,
    },
    list: {
      enabled: true,
    },
    filter: {
      enabled: true,
      autoNotCompleted: true,
    },
    reloadOnBroken: true,
    hideLowerNavbar: true,
    keyboardShortcut: true,
    statusColors: {
      todo: "blue",
      inProgress: "yellow",
      completed: "green",
    },
  },
  keepWorking: {
    clickAutomatically: true,
    showBanner: false,
  },
};
/** @typedef {typeof defaultSettings} Settings */

const getSettings = async () =>
  meshObjects(defaultSettings, (await browser.storage.local.get()).settings);

/** @param {Partial<Settings>} newValue @returns {Promise<undefined>} */
const setSettings = async (newValue) =>
  browser.storage.local.set({
    settings: newValue,
  });

/** @param {Partial<Settings>} partial @returns {Promise<undefined>} */
const updateSettings = async (partial) =>
  browser.storage.local
    .get()
    .then(
      (
        /** @type {{ settings: Partial<Settings> }} */ { settings: current },
      ) => {
        console.log({ current, partial });
        setSettings(meshObjects(current, partial));
      },
    );

const resetSettings = async () => setSettings({});

/** @type {Listener} */
const settingsListener = async (msg, _sender) => {
  switch (msg.type) {
    case "settings.get":
      return getSettings();
    case "settings.set":
      await setSettings(msg.data);
      return getSettings();
    case "settings.update":
      await updateSettings(msg.data);
      return getSettings();
    case "settings.reset":
      await resetSettings();
      return getSettings();
    default:
      console.error(`Unknown message type ${msg.type}`);
  }
};

///=================///
///=== WHATS NEW ===///
///=================///
/** @returns {Promise<Set<string>>} */
const getViewedVersions = async () =>
  (await browser.storage.local.get()).whatsNewViewed;
/** @type {Listener} */
const whatsNewListener = async (msg, _sender) => {
  switch (msg.type) {
    case "whatsNew.setVersionViewed": {
      const viewedVersions = new Set(await getViewedVersions());
      viewedVersions.add(msg.data);

      // It is unsafe to store `Set`s in the storage
      // <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/set#keys>
      await browser.storage.local.set({
        whatsNewViewed: Array.from(viewedVersions),
      });
      break;
    }
    case "whatsNew.getViewedVersions":
      return await getViewedVersions();
    default:
      console.error(`Unknown message type ${msg.type}`);
  }
};

///=======================///
///=== UPDATE REMINDER ===///
///=======================///
// TODO: this is almost identical to the whats new stuff, try to consolidate?
/** @returns {Promise<Set<string>>} */
const getIgnoredUpdates = async () =>
  (await browser.storage.local.get()).ignoredUpdates;
/** @type {Listener} */
const updateRemindersListener = async (msg, _sender) => {
  switch (msg.type) {
    case "updateReminders.ignoreUpdate": {
      const ignoredUpdates = new Set(await getIgnoredUpdates());
      ignoredUpdates.add(msg.data);

      // It is unsafe to store `Set`s in the storage
      // <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/set#keys>
      await browser.storage.local.set({
        ignoredUpdates: Array.from(ignoredUpdates),
      });
      break;
    }
    case "updateReminders.getIgnoredUpdates":
      return await getIgnoredUpdates();
    default:
      console.error(`Unknown message type ${msg.type}`);
  }
};

///=============================///
///=== EXTRA ASSIGNMENT DATA ===///
///=============================///
/** @param {string} assignmentId @returns {Promise<object>} */
const getExtraAssignmentData = (assignmentId) =>
  browser.storage.local
    .get()
    .then(
      (/** @type {any} */ data) => data[`extraAssignmentData-${assignmentId}`],
    );
/** @param {String} assignmentId @param {object} data @returns {Promise<undefined>} */
const setExtraAssignmentData = (assignmentId, data) =>
  browser.storage.local.set({ [`extraAssignmentData-${assignmentId}`]: data });
/** @type {Listener} */
const extraAssignmentDataListener = async (msg, _sender) => {
  switch (msg.type) {
    case "extraAssignmentData.update": {
      const { assignmentId, props } = msg.data;
      const current = await getExtraAssignmentData(assignmentId);
      const updated = meshObjects(current, props);
      return await setExtraAssignmentData(assignmentId, updated);
    }
    case "extraAssignmentData.get": {
      const { assignmentId } = msg.data;
      return await getExtraAssignmentData(assignmentId);
    }
    default:
      console.error(`Unknown message type ${msg.type}`);
  }
};

///=========================///
///=== ASSIGNMENTS CACHE ===///
///=========================///
/** @type {Listener} */
const assignmentsCache = async (msg, _sender) => {
  const get = async () =>
    (await browser.storage.local.get()).assignmentsCache ?? [];
  switch (msg.type) {
    case `assignmentsCache.set`: {
      const curr = await get();
      const newValue = meshAssignmentsArray(curr, msg.data);
      await browser.storage.local.set({ assignmentsCache: newValue });
      break;
    }
    case `assignmentsCache.get`: {
      return get();
    }
    case `assignmentsCache.clear`: {
      await browser.storage.local.set({ assignmentsCache: [] });
      break;
    }
    default:
      console.error(`Unknown message type ${msg.type}`);
  }
};

///=================///
///=== LISTENERS ===///
///=================///
browser.runtime.onMessage.addListener(
  /** @type {Listener} */
  async (msg, sender) => {
    const type = msg.type.split(".")[0];
    switch (type) {
      case "settings":
        return settingsListener(msg, sender);
      case "whatsNew":
        return whatsNewListener(msg, sender);
      case "updateReminders":
        return updateRemindersListener(msg, sender);
      case "extraAssignmentData":
        return extraAssignmentDataListener(msg, sender);
      case "assignmentsCache":
        return assignmentsCache(msg, sender);
      default:
        console.error(`Unknown message type ${msg.type}`);
    }
  },
);
