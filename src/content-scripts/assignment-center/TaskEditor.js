/** @import { Assignment } from "./assignment.js" */

import api from "/src/util/api.js";
import { assertHTMLElem } from "/src/util/assertHtmlElem.js";
import Calendar from "/src/util/Calendar.util.js";
import { NonNull } from "/src/util/NonNull.js";

import { getStudentUserId } from "../student-user-id.js";

import CreateTaskEvent from "./events/CreateTaskEvent.js";

const PLACEHOLDERS = [
  "Complain about admin",
  "Procrastinate the FLE",
  "Sneak in the main entrance",
  "Sign up for HawkHacks",
  "Submit a new funny placeholder",
  'Look up how to pronounce "indict"',
  "Figure out what Blackbaud broke",
  "Go to Sing's (or is it Singh's?)",
  "Be held 5min late after 9th period",
  "Cram before 3rd period Spanish",
  "Ignore the term paper due tomorrow",
  "Give Gavin feedback on Orion",
  "Do transgender operations on illegal aliens in prison",
  "Create concepts of a plan",
];
const randomPlaceholder = () =>
  PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];

/**
 * @typedef {Object} BlackbaudTask
 * @property {string} AssignedDate
 * @property {string} DueDate
 * @property {string} ShortDescription
 * @property {number} TaskStatus
 * @property {string?} SectionId
 * @property {string?} UserId
 * @property {number?} UserTaskId
 */

export default class TaskEditor extends HTMLElement {
  /** @type {Assignment?} */
  #task;

  /**
   * @typedef {Object} TaskEditorElems
   * @prop {HTMLInputElement} title
   * @prop {HTMLDialogElement} modal
   * @prop {HTMLButtonElement} cancel
   * @prop {HTMLFormElement} form
   * @prop {HTMLSelectElement} classSelect
   * @prop {HTMLInputElement} id
   * @prop {HTMLInputElement} dueDate */

  /** @type {TaskEditorElems} */
  #elems;

  /** @type {(assignment: Assignment) => void} */
  updateAssignment;

  /** @type {() => void} */
  showModal;

  constructor(/** @type {Assignment?} */ task) {
    super();
    this.#task = task;
    this.updateAssignment = this.#updateAssignment.bind(this);
    this.showModal = this.#showModal.bind(this);

    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `\
<style>
  ${TaskEditor.#stylesheet}
</style>
<dialog id="modal">
  <form id="task-form" method="dialog">
    <input id="id" type="hidden" name="id">
    <label>
      Title
      <input required autofocus id="title" type="text" name="title">
    </label>
    <label>
      Class
      <select required name="class" id="class-select">
        <option value="0">None</option>
      </select>
    </label>
    <label>
      Due Date
      <input required id="due-date" type="date" name="dueDate">
    </label>
    <div id="btns">
      <button type="submit" id="save" value="Save">Save</button>
      <button type="button" id="cancel">Cancel</button>
    </div>
  </form>
</dialog>`;

    /** @type {{[key in keyof TaskEditorElems]: string}} */
    const ids = {
      title: "title",
      modal: "modal",
      cancel: "cancel",
      form: "task-form",
      classSelect: "class-select",
      id: "id",
      dueDate: "due-date",
    };
    // Type cast b/c the element types don't line up
    // This is essentially an object map
    this.#elems = /** @type {TaskEditorElems} */ (
      Object.fromEntries(
        Object.entries(ids).map(([k, id]) => [
          k,
          NonNull(assertHTMLElem(shadow.getElementById(id))),
        ]),
      )
    );
  }

  connectedCallback() {
    this.#addClassesToSelect();
    this.#hydrateFormSubmit();
    this.#hydrateCancel();

    this.#updateAssignment(this.#task);
  }

  /** @param {Assignment?} assignment */
  #updateAssignment(assignment) {
    this.#task = assignment;

    this.#refreshId();
    this.#refreshTitle();
    this.#refreshClassSelectSelectedOption();
    this.#refreshDueDate();
  }

  #showModal() {
    // I'm not sure why it's not, but the date input gets reset to blank after
    // closing the new task dialog and reopening it. So refresh it here.
    this.#refreshDueDate();

    this.#elems.title.placeholder = randomPlaceholder();
    this.#elems.modal.showModal();
  }

  async #addClassesToSelect() {
    try {
      const classes = await api.getClasses();
      for (const [id, name] of classes.entries()) {
        const option = document.createElement("option");
        option.value = String(id);
        option.textContent = name;
        this.#elems.classSelect.appendChild(option);
      }
      this.#refreshClassSelectSelectedOption();
    } catch (err) {
      reportError(err);
    }
  }

  #refreshId() {
    this.#elems.id.value = String(this.#task?.id ?? "");
  }

  #refreshTitle() {
    this.#elems.title.value = this.#task?.title ?? "";
  }

  #refreshDueDate() {
    this.#elems.dueDate.value = Calendar.asInputValue(
      this.#task?.dueDate ?? Calendar.nextWeekday(),
    );
  }

  #refreshClassSelectSelectedOption() {
    const options = Array.from(
      this.#elems.classSelect.querySelectorAll("option"),
    );
    for (const option of options) {
      const shouldSelect = option.value === String(this.#task?.class.id);
      option.selected = shouldSelect;
    }
  }

  #hydrateFormSubmit() {
    this.#elems.modal.addEventListener("close", async () => {
      // FIXME: pressing <esc> still creates the task
      if (this.#elems.modal.returnValue === "Save") {
        // create task
        const formData = new FormData(this.#elems.form);
        const taskRaw = Object.fromEntries(
          // This works, but typescript doesn't think FormData is iterable
          // See <https://stackoverflow.com/a/57714704/>
          Array.from(/** @type {any} */ (formData)),
        );
        const dueDate = `${Calendar.asBlackbaudDate(
          Calendar.fromInputValue(taskRaw.dueDate),
        )} 8:08 AM`;
        const status =
          this.#task?.status != undefined
            ? api.statusNumMap[this.#task.status]
            : -1;
        /** @type {BlackbaudTask} */
        const task = {
          // Use the same value b/c that's how Blackbaud does it
          AssignedDate: dueDate,
          DueDate: dueDate,
          ShortDescription: taskRaw.title,
          TaskStatus: status,
          SectionId: taskRaw.class,
          UserId: await getStudentUserId(),
          UserTaskId: taskRaw.id === "" ? null : Number(taskRaw.id),
        };
        this.#addTask(task);
      }

      // If the task isn't null, resetting will make the editor blank the next
      // time it's opened (when it should be showing the task)
      // ie only reset for the new task form
      if (this.#task == null) this.#elems.form.reset();
    });
  }

  #hydrateCancel() {
    this.#elems.cancel.addEventListener("click", () =>
      this.#elems.modal.close("Cancel"),
    );
  }

  /**
   * Dispatch an event to add a task.
   * @param {BlackbaudTask} task
   */
  #addTask(task) {
    const event = new CreateTaskEvent(task);
    this.dispatchEvent(event);
  }

  static #stylesheet = `\
input, select {
  border: 1px solid transparent;
  max-width: 100%;
}
/* :user-invalid became baseline in 2023, so check if it exists first */
@supports not selector(:user-invalid) {
  :invalid {
    border-color: red;
  }
}
@supports selector(:user-invalid) {
  :user-invalid {
    border-color: red;
  }
}
#title, #class-select {
  width: 40ch;
}

label {
  display: block;
}

#btns {
  display: flex;
  gap: 0.5ch;
}

button {
  border: none;
  flex-grow: 1;
}

#save       { background-color: oklch(35% 0.1 283); }
#save:hover { background-color: oklch(45% 0.1 283); }
#save:focus { background-color: oklch(50% 0.1 283); }
`;
}

if (!customElements.get("task-editor")) {
  customElements.define("task-editor", TaskEditor);
}
