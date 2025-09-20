import { NonNull } from "/src/util/NonNull.js";
import { trimHTML } from "/src/util/trimHTML.js";

import { conditionalClass } from "../common.js";

import AssignmentUtil from "./assignment.js";
import AssignmentPopup from "./AssignmentPopup.js";
import TaskEditor from "./TaskEditor.js";

/** @import { Assignment, Status } from "./assignment.js"; */
/** @import { Settings } from "../common.js"; */

export default class AssignmentBox extends HTMLElement {
  /** @type {Assignment} */
  assignment;

  /** @type {Settings} */
  #settings;

  /** @type {AssignmentPopup} */
  #popup;

  /** Doesn't exist when not a task. @type {TaskEditor?} */
  #taskEditor = null;

  /** @type {HTMLElement} */
  #wrapper;

  /** @type {HTMLElement} */
  #root;

  /** @type {HTMLStyleElement} */
  #style;

  /** @type {HTMLAnchorElement} */
  #link;

  /**
   * @param {Assignment} assignment
   * @param {Settings} settings
   */
  constructor(assignment, settings) {
    super();
    this.assignment = assignment;
    this.#settings = settings;
    this.#popup = new AssignmentPopup(this.assignment);
    this.updateAssignment = this.#updateAssignment.bind(this);

    // create DOM
    // Create a shadow root
    const shadow = this.attachShadow({ mode: "open" });

    this.#style = document.createElement("style");
    shadow.appendChild(this.#style);

    this.#wrapper = document.createElement("article");

    const root = document.createElement("div");
    root.id = "root";
    this.#root = root;

    if (this.assignment.isTask) {
      this.#taskEditor = new TaskEditor(this.assignment);
      this.#wrapper.appendChild(this.#taskEditor);
    }

    // make entire card clickable to open link
    // see <https://inclusive-components.design/cards/> and
    // <https://css-tricks.com/block-links-the-search-for-a-perfect-solution/>.
    root.style.cursor = "pointer";
    root.addEventListener("click", (e) => {
      if (this.assignment.isTask) {
        NonNull(this.#taskEditor).showModal();
      } else {
        if (
          e.target === this.#link ||
          document.getSelection()?.toString() !== ""
        )
          return;
        else this.#link.click();
      }
    });

    // add the element for assignment title
    this.#link = document.createElement("a");
    root.appendChild(this.#createTitleElem(this.#link));

    this.#wrapper.appendChild(root);

    // add popup
    this.#wrapper.appendChild(this.#popup);

    shadow.appendChild(this.#wrapper);
  }

  connectedCallback() {
    this.#updateAssignment(this.assignment);
  }

  /** @param {Assignment} assignment */
  #updateAssignment(assignment) {
    this.assignment = assignment;
    this.#taskEditor?.updateAssignment(assignment);
    this.#hydrateStyles();
    this.#hydrateTitleElem();
    this.#popup.updateAssignment(assignment);
  }

  #hydrateStyles() {
    // add classes for majors and completed assignments
    conditionalClass(this.#root, "type-major", this.#isMajor());
    conditionalClass(
      this.#root,
      "requires-submission",
      this.#requiresSubmission(),
    );
    conditionalClass(this.#root, "status-graded", this.#isGraded());
    conditionalClass(this.#root, "collapse", this.#shouldCollapse());
    conditionalClass(
      NonNull(this.#root.parentElement),
      "popup-left",
      this.#shouldPopupLeft(),
    );

    this.#style.textContent = AssignmentBox.#stylesheet;
    this.#refreshColors();
  }

  #createTitleElem(/** @type {HTMLAnchorElement} */ link) {
    const e = document.createElement("p");
    e.id = "title";
    e.appendChild(link);
    return e;
  }

  #hydrateTitleElem() {
    const titleElem = this.#link;

    titleElem.innerHTML = this.assignment.title;
    trimHTML(titleElem);
    if (this.#shouldCollapse()) {
      // Force no line breaks
      titleElem.textContent = titleElem.textContent.replaceAll("\n", "");
    }

    // tasks don't have links
    if (!this.assignment.isTask)
      titleElem.href = this.assignment.link ?? "javascript:void";
  }

  #refreshColors() {
    const style = this.#wrapper.style;

    style.setProperty("--color-status", this.#assignmentStatusColor());
    style.setProperty("--color-class", this.#assignmentClassColor());
  }

  #assignmentClassColor() {
    if (this.assignment.color === "") {
      return "oklch(from var(--color-bg-box) calc(l*200%) c h)";
    } else {
      return this.assignment.color;
    }
  }

  #assignmentStatusColor() {
    /** @param {Status} status */
    const camelCaseStatus = (status) => {
      switch (status) {
        case "To do":
          return "toDo";
        case "In progress":
          return "inProgress";
        default:
          return status.toLowerCase();
      }
    };
    const status = camelCaseStatus(this.assignment.status);
    const colors = this.#settings.assignmentCenter.customUi.statusColors;

    return colors[status] ?? "oklch(from var(--color-bg-box) calc(l*150%) c h)";
  }

  #shouldCollapse() {
    return AssignmentUtil.isCompleted(this.assignment);
  }

  #isMajor() {
    return AssignmentUtil.isMajor(this.assignment);
  }

  #requiresSubmission() {
    return AssignmentUtil.requiresSubmission(this.assignment);
  }

  #isGraded() {
    return AssignmentUtil.isGraded(this.assignment);
  }

  #shouldPopupLeft() {
    const leftEdge = this.getBoundingClientRect().left;
    const percentToEdge = leftEdge / window.innerWidth;
    return percentToEdge > 0.5;
  }

  static #stylesheet = `\
article {
  position: relative;

  --base-padding: 0.25em;
  --width-class-color-base: 0.5em;
  --width-class-color: 0.5em;

  --border-width: 0.15em;
  --inner-border-width: calc(var(--border-radius) - var(--border-width));
  --border-radius: var(--base-padding);

  --color-status: oklch(from var(--color-bg-box) calc(l*150%) c h);
  --color-class: oklch(from var(--color-bg-box) calc(l*200%) c h);

  &>div {
    position: relative;
    background-color: var(--color-status);
    box-sizing: border-box;

    /* Wrap text */
    overflow-wrap: break-word;

    padding: var(--base-padding);
    padding-left: calc(var(--base-padding) + var(--width-class-color));
    padding-right: calc(var(--base-padding) + var(--width-class-color));

    border-radius: var(--border-radius);
    --border-radius-class-color: var(--border-radius);

    &::before, &::after {
      content: "";
      background-color: var(--color-class);
      position: absolute;
      top: 0;
      bottom: 0;
      width: var(--width-class-color);
    }
    &::before { left: 0; border-radius: var(--border-radius-class-color) 0 0 var(--border-radius-class-color); }
    &::after { right: 0; border-radius: 0 var(--border-radius-class-color) var(--border-radius-class-color) 0; }

    &.type-major          { --border-color: yellow; }
    &.requires-submission { --border-color: oklch(78% 0.17 214); }
    &.status-graded       { --border-color: oklch(78% 0.17 146); }
    &.type-major, &.requires-submission, &.status-graded {
      --border-radius-class-color: var(--inner-border-width);
      --width-class-color: calc(var(--width-class-color-base) - var(--border-width));
      border: var(--border-width) solid var(--border-color);
    }

    &.collapse #title {
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;

      & br {
        display: none;
      }
    }
  }

  &:focus-within, &:hover, &:has(.contains-selection) {
    & > div {
      background-color: oklch(from var(--color-status) calc(l + 0.07) c h);
    }
  }

  &:not(:hover, :focus-within) assignment-popup:not(.contains-selection) {
    display: none;
  }

  & assignment-popup {
    position: absolute;
    top: 100%;
    z-index: 5;
  }
  &:not(.popup-left) assignment-popup {
    left: var(--width-class-color);
  }
  &.popup-left assignment-popup {
    right: var(--width-class-color);
  }
}

p {
  margin: 0;
}

a {
  color: var(--color-text-link);
  text-decoration: none;

  &:hover, &:focus {
    text-decoration: underline;
    outline: none;
  }
}
`;
}

if (!customElements.get("assignment-box")) {
  customElements.define("assignment-box", AssignmentBox);
}
