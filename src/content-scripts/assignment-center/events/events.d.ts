import ChangeAssignmentEvent from "./ChangeAssignmentEvent.js";
import CreateTaskEvent from "./CreateTaskEvent.js";

// This is amazing <https://elfsternberg.com/blog/dont-use-custom-events/>
declare global {
  interface GlobalEventHandlersEventMap {
    "change-assignment": ChangeAssignmentEvent;
    "create-task": CreateTaskEvent;
  }
}
