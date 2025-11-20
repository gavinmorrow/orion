import { featureFlag } from "../common.js";

/**
  @param {string} key from KeyboardEvent.code, e.g. "KeyA"
  @param {() => void} action */
export const altShortcut = (key, action) => {
  console.info(`Listening for keyboard shortcut \`alt-${key}\`...`);

  document.addEventListener("keydown", (event) => {
    // NOTE: KeyboardEvent.code does not work on many mobile browsers
    // <https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code#browser_compatibility>
    const activated =
      event.altKey &&
      event.code === key &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey;
    if (activated) action();
  });
};

await featureFlag(
  (s) => s.assignmentCenter.keyboardShortcut,
  () =>
    altShortcut(
      "KeyA",
      () => (location.href = "/lms-assignment/assignment-center/student"),
    ),
)();
