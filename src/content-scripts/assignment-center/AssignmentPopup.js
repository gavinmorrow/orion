import Calendar from "/src/util/Calendar.util.js";
import { NonNull } from "/src/util/NonNull.js";

import AssignmentUtil from "./assignment.js";
import ChangeAssignmentEvent from "./events/ChangeAssignmentEvent.js";

/** @import { Assignment, Status } from "./assignment.js"; */

export default class AssignmentPopup extends HTMLElement {
  /** @type {Assignment} */
  assignment;

  /** @type {HTMLButtonElement} */
  #statusBtn;
  /** @type {HTMLButtonElement} */
  #submitBtn;
  /** @type {HTMLButtonElement} */
  #deleteBtn;
  /** @type {HTMLButtonElement} */
  #gradedBtn;

  /** @type {HTMLElement} */
  #title;
  /** @type {HTMLElement} */
  #desc;
  /** @type {HTMLElement} */
  #class;

  /** @type {HTMLElement} */
  #attachments;
  /** @type {HTMLUListElement} */
  #attachmentsList;

  constructor(/** @type {Assignment} */ assignment) {
    super();
    this.assignment = assignment;

    this.updateAssignment = this.#updateAssignment.bind(this);

    // create DOM
    const shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = AssignmentPopup.#stylesheet;
    shadow.appendChild(style);

    const root = document.createElement("article");
    root.id = "popup-root";

    // prevent the card from closing when text inside it is selected
    document.addEventListener("selectionchange", () => {
      const selection = document.getSelection();

      // Don't use selection.containsNode() b/c it doesn't work w/ shadow roots
      let selected =
        selection != null &&
        (root.contains(selection.anchorNode) ||
          root.contains(selection.focusNode) ||
          selection.anchorNode?.contains(root) ||
          selection.focusNode?.contains(root));

      const selectionHasText = selection?.toString() != "";

      if (selected && selectionHasText)
        this.classList.add("contains-selection");
      else this.classList.remove("contains-selection");
    });

    // assignment status
    const actionsMenu = document.createElement("div");
    actionsMenu.id = "actions-menu";

    const statusBtn = document.createElement("button");
    statusBtn.id = "status-btn";
    statusBtn.addEventListener("click", this.#handleChangeStatus.bind(this));
    this.#statusBtn = statusBtn;
    const submitBtn = document.createElement("button");
    submitBtn.id = "submit-btn";
    submitBtn.addEventListener("click", this.#handleSubmit.bind(this));
    this.#submitBtn = submitBtn;
    const deleteBtn = document.createElement("button");
    deleteBtn.id = "delete-btn";
    deleteBtn.addEventListener("click", this.#handleDelete.bind(this));
    this.#deleteBtn = deleteBtn;
    const gradedBtn = document.createElement("button");
    gradedBtn.id = "gradedBtn";
    gradedBtn.disabled = true;
    this.#gradedBtn = gradedBtn;

    actionsMenu.append(statusBtn, submitBtn, deleteBtn, gradedBtn);
    root.appendChild(actionsMenu);

    // assignment title
    this.#title = document.createElement("h2");
    this.#title.id = "title";
    root.appendChild(this.#title);

    // assignment description
    this.#desc = document.createElement("div");
    this.#desc.id = "desc";
    root.appendChild(this.#desc);

    // assignment attachments
    this.#attachments = document.createElement("aside");
    this.#attachments.id = "attachments";
    const attachmentsHeading = document.createElement("h3");
    attachmentsHeading.textContent = "Attachments";
    this.#attachmentsList = document.createElement("ul");
    this.#attachments.append(attachmentsHeading, this.#attachmentsList);
    root.appendChild(this.#attachments);

    // class name
    this.#class = document.createElement("p");
    this.#class.id = "class-name";
    root.appendChild(this.#class);

    shadow.appendChild(root);
  }

  connectedCallback() {
    this.#updateAssignment(this.assignment);
  }

  #hydrateStatus() {
    this.#statusBtn.textContent = "Mark as ";
    if (this.#nextStatus() == null) this.#statusBtn.hidden = true;
    else this.#statusBtn.textContent += this.#nextStatus();
  }

  #hydrateSubmitBtn() {
    if (
      this.assignment.isTask ||
      !AssignmentUtil.requiresSubmission(this.assignment)
    ) {
      this.#submitBtn.hidden = true;
    } else {
      let txt = "Submit";
      // special cases for submission methods
      switch (this.assignment.submissionMethod) {
        case "turnitin":
          txt += " on Turnitin";
          break;
        case "googleAssignments":
          txt += " on Google Assignments";
          break;
      }

      this.#submitBtn.textContent = txt;
      this.#submitBtn.hidden = false;
    }
  }

  #hydrateDeleteBtn() {
    if (!this.assignment.isTask) this.#deleteBtn.hidden = true;
    this.#deleteBtn.textContent = "Delete task";
  }

  #hydrateGradedBtn() {
    if (this.assignment.status !== "Graded") this.#gradedBtn.hidden = true;
    const value = this.assignment.grade.value?.toString() ?? "unknown";
    const max = this.assignment.grade.max?.toString() ?? "unknown";

    this.#gradedBtn.textContent = `Graded (${value} / ${max})`;
  }

  #hydrateTitle() {
    this.#title.innerHTML = this.assignment.title;
  }

  #hydrateDescription() {
    // get assignment description, if available
    // do NOT escape, b/c this content is taken directly from the innerHTML
    // of the full description page
    this.#desc.innerHTML = this.#getDesc();
  }

  #hydrateAttachments() {
    const lis = this.assignment.attachments?.map((attachment) => {
      const existing = this.#attachmentsList.querySelector(
        `[data-attachment-url="${attachment.url}"]`,
      );
      if (existing != null) return existing;

      const li = document.createElement("li");
      li.className = "attachment";
      li.setAttribute("data-attachment-url", attachment.url);

      const a = document.createElement("a");
      if (!attachment.expired) a.href = attachment.url;
      a.textContent = attachment.name;
      a.target = "_blank";

      li.appendChild(a);
      return li;
    });
    if (lis != null && lis.length > 0) {
      this.#attachmentsList.append(...lis);
      this.#attachments.style.display = "block";
    } else this.#attachments.style.display = "none";
  }

  #hydrateClassName() {
    this.#class.textContent = this.assignment.class.name;
  }

  /** @param {Assignment} assignment */
  #updateAssignment(assignment) {
    this.assignment = assignment;
    this.#hydrateStatus();
    this.#hydrateSubmitBtn();
    this.#hydrateDeleteBtn();
    this.#hydrateGradedBtn();
    this.#hydrateTitle();
    this.#hydrateDescription();
    this.#hydrateAttachments();
    this.#hydrateClassName();
  }

  /**
   * Dispatch an event to change the assignment.
   * @param {Partial<Assignment?>} changes */
  #setAssignment(changes) {
    const event = new ChangeAssignmentEvent(
      this.assignment.id,
      this.assignment.isTask,
      changes,
    );
    this.dispatchEvent(event);
  }

  /** @param {Event} _e */
  #handleChangeStatus(_e) {
    this.#setAssignment({ status: this.#nextStatus() });
    this.#statusBtn.blur();
  }

  /** @param {Event} _e */
  #handleSubmit(_e) {
    if (this.assignment.isTask) {
      alert(
        "Cannot submit to a custom task.\n\nThis is a bug. If this is shown, please report it.",
      );
    } else {
      window.location.assign(NonNull(this.assignment.link));
    }
  }

  /** @param {Event} _e */
  #handleDelete(_e) {
    if (this.assignment.isTask) {
      this.#setAssignment(null);
    } else {
      alert(
        "Sorry, you're gonna have to do it. (You can't delete an assignment.)\n\nThis is a bug. If this is shown, please report it.",
      );
    }
  }

  #getDesc() {
    if (this.assignment.isTask) return "<i>Custom task</i>";

    const rawDesc = this.assignment.description;
    if (rawDesc === null || rawDesc === undefined) return "<i>Loading...</i>";
    else if (rawDesc === "") return "<i>No description</i>";
    else return rawDesc;
  }

  /** @returns {Status|undefined} The status to toggle to, or null if the status should not be toggled. */
  #nextStatus() {
    switch (this.assignment.status) {
      case "Overdue":
      case "Missing":
      case "To do":
      case "In progress":
        return "Completed";
      case "Completed":
        if (
          Calendar.resetDate(this.assignment.dueDate).getTime() <
          Calendar.resetDate(new Date()).getTime()
        )
          return "Overdue";
        else return "To do";
      case "Graded":
        return undefined;
      default:
        console.warn(`Unknown status: ${this.assignment.status}`);
        return undefined;
    }
  }

  static #stylesheet = `\
#popup-root {
  --color-bg: oklch(from var(--color-bg-box) calc(l*150%) c h / 88%);
  --len-padding: calc(var(--base-padding) + var(--width-class-color));

  min-width: 22em;
  box-sizing: border-box;

  background-color: var(--color-bg);
  box-shadow: 0 0.5em 1em 0 black;
  backdrop-filter: blur(0.5em);

  padding: var(--len-padding);
  border-radius: var(--len-padding);

  & #actions-menu {
    display: flex;
    gap: 0.25em;

    & > * {
      flex-grow: 1;
    }
  }

  & #title {
    font-size: medium;
    margin: 0;
    margin-top: 0.5em;
    margin-bottom: 0.25em;
  }
  & #desc > p:first-of-type {
    margin-top: 0;
  }
  & #desc > p:last-of-type {
    margin-bottom: 0;
  }

  & #attachments {
    & > h3 {
      margin-bottom: 0;
      font-size: medium;
    }
    & > ul {
      margin-top: 0;
      margin-bottom: 0;
      padding-left: 1em;

      list-style-type: "– "; /* en-dash bc hyphen is too short and em-dash too long */
    }
  }

  & #class-name {
    font-size: small;
    opacity: 0.75;
    margin-bottom: 0;
  }
}

a {
  /* Prevent the color from being unreadable */
  --l: 82%;
  color: oklch(var(--l) 0.2 262);

  &:hover, &:focus {
    --l: 90%;
  }
}
`;
}

if (!customElements.get("assignment-popup")) {
  customElements.define("assignment-popup", AssignmentPopup);
}
