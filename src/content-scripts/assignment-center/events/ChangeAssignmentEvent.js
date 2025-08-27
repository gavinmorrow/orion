/** @import { Assignment } from "../assignment.js" */

/**
 * An event that indicates that an assignment has changes that should be applied.
 *
 * Dispatched from a child of <assignment-center>, and handled by <assignment-center>.
 */
export default class ChangeAssignmentEvent extends Event {
  /**
   * The assignment or task id.
   * @type {number}
   */
  id;
  /** @type {boolean} */
  isTask;
  /** @type {Partial<Assignment?>} */
  changes;

  constructor(
    /** @type {number} */ id,
    /** @type {boolean} */ isTask,
    /** @type {Partial<Assignment?>} */ changes,
  ) {
    super("change-assignment", { bubbles: true, composed: true });
    this.id = id;
    this.isTask = isTask;
    this.changes = changes;
  }
}
