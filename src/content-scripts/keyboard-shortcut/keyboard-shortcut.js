import { featureFlag } from "../common.js";

await featureFlag(
  (s) => s.assignmentCenter.keyboardShortcut,
  () => {
    console.info("Listening for keyboard shortcut `alt-a`...");
    document.addEventListener("keydown", (event) => {
      // NOTE: KeyboardEvent.code does not work on many mobile browsers
      // <https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code#browser_compatibility>
      const activated =
        event.altKey &&
        event.code === "KeyA" &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey;
      if (activated)
        location.href = "/lms-assignment/assignment-center/student";
    });
  },
)();
