/** @import { BlackbaudAssignmentPreview } from "src/util/api.js" */
/** @import { BlackbaudTask } from "../TaskEditor.js" */

/**
 * An event that indicates a new task should be created.
 *
 * Dispatched from a child of \<assignment-center>, and handled by \<assignment-center>.
 */
export default class CreateTaskEvent extends Event {
  /** @type {BlackbaudTask & BlackbaudAssignmentPreview} */
  task;

  /** @param {typeof this.task} task */
  constructor(task) {
    super("create-task", { bubbles: true, composed: true });
    this.task = task;
  }
}
