import { NonNull } from "/src/util/NonNull.js";

import {
  buttonStylesInner,
  featureFlag,
  promiseError,
  settings,
  updateSettings,
  updateSettingsCache,
  waitForElem,
} from "./common.js";

const settingsOptions = {
  loginAutomatically: {
    desc: "Automatically click the buttons required to login.",
    type: {
      hunter: "Automatically login to the hunter website.",
      blackbaud: "Automatically login on blackbaud.",
      google: {
        desc: "",
        type: {
          email:
            "Automatically select your email in the google login page when logging in to hunter.",
          password:
            "Automatically press the next button on the google login page (after your password is autofilled) when logging into hunter.",
        },
      },
    },
  },
  assignmentCenter: {
    desc: "Tweaks and improvements to the assignment center!",
    type: {
      enabled: "Enable assignment center improvements.",
      reloadOnBroken:
        "Automatically reload the page when the assignment center is broken (ie blank).",
      hideLowerNavbar: "Hide the bottommost navigation bar (it's redundant).",

      customUi: {
        desc: "An entirely new (and significantly better) user interface for the assignment center!",
        type: {
          enabled: "Enable the new UI.",
          statusColors: {
            desc: "The color for each assignment status. Can be any valid CSS color.",
            type: {
              overdue: { type: "text", desc: "" },
              missing: { type: "text", desc: "" },
              toDo: { type: "text", desc: "" },
              inProgress: { type: "text", desc: "" },
              completed: { type: "text", desc: "" },
              graded: { type: "text", desc: "" },
            },
          },
          saturation: {
            desc: "Change the saturation of all the colors. Type: A number in the range [0, 1] where 0 is B&W and 1 is full color.",
            type: "number",
          },
        },
      },
      calendar: {
        desc: "Bug fixes for your good ol' calendar view.",
        type: {
          fixCalendarHeaderOverflow:
            "Prevents the date in the calendar header from becoming partially hidden when the line wraps.",
        },
      },
      filter: {
        desc: "Automatically change your filters for you. Note: this does not affect the custom UI.",
        type: {
          enabled: "",
          autoNotCompleted: "Automatically hide completed assignments.",
        },
      },
    },
  },
  keepWorking: {
    desc: "",
    type: {
      clickAutomatically:
        'Automatically click the "Keep Working" button when it pops up.',
      showBanner:
        "Show a banner to notify you when the button is clicked automatically.",
    },
  },
};

export default class SettingsMenu extends HTMLElement {
  #shadowRoot;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    this.#shadowRoot = shadow;
    shadow.appendChild(document.createElement("style"));

    // Prevent blackbaud from throwing a fit in the console
    shadow.addEventListener("click", (e) => e.stopPropagation());
    shadow.addEventListener("mousedown", (e) => e.stopPropagation());

    const modal = document.createElement("dialog");
    modal.id = "modal";
    modal.append(...this.#createModalElements());
    shadow.appendChild(modal);

    const btnSlot = document.createElement("slot");
    btnSlot.name = "show-modal";
    shadow.appendChild(btnSlot);

    // Add default button
    const settingsBtn = document.createElement("button");
    settingsBtn.textContent = "Settings";
    btnSlot.appendChild(settingsBtn);
  }
  async connectedCallback() {
    this.#hydrateStyles();

    this.#hydrateToggleModalBtn();

    // It's okay to leave the Promise hanging here, bc we don't need its
    // result. We're just doing it for the side effects.
    this.#hydrateModal();
  }

  #createModalElements() {
    const toTitleCase = (/** @type {string} */ camelCase) =>
      camelCase.charAt(0).toUpperCase() +
      camelCase.replaceAll(/([A-Z])/g, " $1").slice(1);

    // TODO: remove any
    /** @param {String[]} path @param {[String, any]} _ */
    const createOptionElem = (path, [name, value]) => {
      const newPath = path.concat(name);
      const readableName = toTitleCase(name);
      const description = value.desc ?? value;

      if (typeof value === "string" || typeof value?.type === "string") {
        // final version, don't recurse
        const label = document.createElement("label");

        const nameElem = document.createElement("span");
        nameElem.classList.add("name");
        nameElem.textContent = readableName;

        const descElem = document.createElement("span");
        descElem.classList.add("description");
        descElem.textContent = description;

        const input = document.createElement("input");
        input.name = this.#idForPath(newPath);
        input.type = value?.type ?? "checkbox"; // default to bool
        input.addEventListener("change", () => {
          const newValue =
            input.type === "checkbox" ? input.checked : input.value;
          const partial = this.#constructFromPath(newPath, newValue);
          updateSettings(partial).then(
            (newSettings) => {
              updateSettingsCache(newSettings);
              this.#hydrateModal();
              alert("Settings updated. Refresh the page.");
              // FIXME: rest of the page doesn't dynamically update w/ settings change
            },
            (err) => {
              alert("Error updating settings: " + err);
              console.error("Error updating settings:", err);
            },
          );
        });

        label.append(nameElem, descElem, input);
        return label;
      } else {
        const fieldset = document.createElement("fieldset");
        fieldset.id = this.#idForPath(newPath);

        const legend = document.createElement("legend");
        legend.textContent = readableName;

        const descElem = document.createElement("p");
        descElem.textContent = description;

        const inputs = Object.entries(value.type ?? value).map(
          createOptionElem.bind(this, newPath),
        );

        fieldset.append(legend, descElem, ...inputs);
        return fieldset;
      }
    };

    // Object.entires preserves insertion order
    // <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries#description>
    return Object.entries(settingsOptions).map(createOptionElem.bind(this, []));
  }
  async #hydrateModal() {
    // TODO: remove any
    /** @param {String[]} path @param {[String, any]} _ @returns {Promise<void>}*/
    const hydrate = async (path, [name, value]) => {
      const fullPath = path.concat(name);

      if (typeof value === "string" || typeof value?.type === "string") {
        // final value, there should be an input for this
        const settingValue = await this.#getValueFromPath(fullPath);

        const elem = /** @type {HTMLInputElement} */ (
          this.#shadowRoot.querySelector(
            `input[name="${this.#idForPath(fullPath)}"]`,
          )
        );

        if (elem.type === "checkbox") {
          if (settingValue === true) elem.checked = true;
          else elem.checked = false;
        } else elem.value = settingValue;
      } else {
        // a subcategory, recurse further
        const subPaths = value.type ?? value;
        return Object.entries(subPaths).forEach(hydrate.bind(this, fullPath));
      }
    };

    return await Promise.all(
      Object.entries(settingsOptions).map(hydrate.bind(this, [])),
    );
  }

  #hydrateToggleModalBtn() {
    /** @type {HTMLSlotElement} */
    const slot = NonNull(
      this.#shadowRoot.querySelector("slot[name='show-modal']"),
    );
    const [btn] = slot.assignedElements({ flatten: true });

    const modal = /** @type {HTMLDialogElement} */ (
      NonNull(this.#shadowRoot.getElementById("modal"))
    );
    btn.addEventListener("click", () => modal.showModal());
  }

  #hydrateStyles() {
    NonNull(this.#shadowRoot.querySelector("style")).textContent =
      this.#getStylesheet();
  }

  /** @param {String[]} path */
  async #getValueFromPath(path) {
    // TODO: remove any
    /** @type {any} */
    let o = await settings();
    for (const segment of path) {
      if (o == null) return null;
      //@ts-ignore only assigning keys of settings
      o = o[segment];
    }
    return o;
  }

  // TODO: remove any
  /** @param {string[]} path @param {any} value */
  #constructFromPath(path, value) {
    if (path.length === 0) return value;

    const outer = {};
    //@ts-ignore only assigning keys
    outer[path[0]] = this.#constructFromPath(path.slice(1), value);
    return outer;
  }

  /** @param {string[]} path */
  #idForPath(path) {
    return path.join(".");
  }

  #getStylesheet() {
    return `\
label {
  display: block;

  & .description {
    font-size: smaller;
    color: grey;
    margin-left: 1em;
  }
}

button { ${buttonStylesInner} }
`;
  }
}

if (!customElements.get("settings-menu")) {
  customElements.define("settings-menu", SettingsMenu);
}

promiseError(
  // run only when assignment center isn't enabled, bc if it is a settings
  // button is shown in the toolbar
  featureFlag(
    (s) => !s.assignmentCenter.customUi.enabled,
    async () => {
      await waitForElem("#site-logo");

      // this wrapper is needed bc otherwise the framework blackbaud is using
      // throws a fit about not being able to access the attributes of
      // <settings-menu /> (ie throws an error and breaks page functionality).
      const wrapper = document.createElement("div");
      wrapper.appendChild(new SettingsMenu());
      document.body.appendChild(wrapper);
    },
  ),
)();
