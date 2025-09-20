import meshObjects from "../util/meshObjects.js";

import meshAssignmentsArray from "./mesh-assignments-array.js";

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

const getSettings = async () =>
  meshObjects(defaultSettings, (await browser.storage.local.get()).settings);

const setSettings = async (newValue) =>
  browser.storage.local.set({
    settings: newValue,
  });

const updateSettings = async (partial) =>
  browser.storage.local.get().then(({ settings: current }) => {
    console.log({ current, partial });
    setSettings(meshObjects(current, partial));
  });

const resetSettings = async () => setSettings({});

const settingsListener = async (msg, sender) => {
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
const whatsNewListener = async (msg, sender) => {
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
const updateRemindersListener = async (msg, sender) => {
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

///=========================///
///=== ASSIGNMENTS CACHE ===///
///=========================///
const assignmentsCache = async (msg, _sender) => {
  const get = async () =>
    (await browser.storage.local.get()).assignmentsCache ?? [];
  switch (msg.type) {
    case `assignmentsCache.set`:
      const curr = await get();
      const newValue = meshAssignmentsArray(curr, msg.data);
      await browser.storage.local.set({ assignmentsCache: newValue });
      break;
    case `assignmentsCache.get`:
      return get();
    case `assignmentsCache.clear`:
      await browser.storage.local.set({ assignmentsCache: [] });
      break;
    default:
      console.error(`Unknown message type ${msg.type}`);
  }
};

///=================///
///=== LISTENERS ===///
///=================///
browser.runtime.onMessage.addListener(async (msg, sender) => {
  const type = msg.type.split(".")[0];
  switch (type) {
    case "settings":
      return settingsListener(msg, sender);
    case "whatsNew":
      return whatsNewListener(msg, sender);
    case "updateReminders":
      return updateRemindersListener(msg, sender);
    case "assignmentsCache":
      return assignmentsCache(msg, sender);
    default:
      console.error(`Unknown message type ${msg.type}`);
  }
});
