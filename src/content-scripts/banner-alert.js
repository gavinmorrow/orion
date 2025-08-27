import { createOrionMain } from "./assignment-center/create-orion-main.js";
import { promiseError } from "./common.js";

const bannersWrapper = document.createElement("div");
const bannersWrapperShadowRoot = bannersWrapper.attachShadow({ mode: "open" });

// For dark reader, put in shadow root
const banners = document.createElement("div");
bannersWrapperShadowRoot.appendChild(banners);
banners.id = "banners";

const style = document.createElement("style");
bannersWrapperShadowRoot.appendChild(style);
style.innerHTML = `
  #banners {
    background-color: #111;
    padding: 1em;
    padding-bottom: 0;

    display: flex;
    flex-direction: column;
    gap: 0.25em;
  }

  #banners:not(:has(> *)) {
    display: none;
  }
`;

promiseError(async () => {
  // Keep it on top of the assignment center
  const root = await createOrionMain();
  root.prepend(bannersWrapper);
})();

export class BannerAlert extends HTMLElement {
  /** @returns {BannerAlert} */
  static createBanner(
    /** @type {string} */ message,
    /** @type {"info"|"warning"} */ type = "info",
    /** @type {Action[]} */ actions = [],
  ) {
    const banner = new BannerAlert();

    banner.setAttribute("type", type);
    banner.setAttribute("message", message);
    banner.setAttribute("actions", JSON.stringify(actions));

    banner.addEventListener("banner-alert-close", () => banner.remove());
    banners.appendChild(banner);

    return banner;
  }

  #wrapper;
  #message;
  #closeBtn;

  constructor() {
    super();
    this.close = this.#close;

    const shadowRoot = this.attachShadow({ mode: "open" });
    // Prevent blackbaud from throwing a fit in the console
    shadowRoot.addEventListener("click", (e) => e.stopPropagation());
    shadowRoot.addEventListener("mousedown", (e) => e.stopPropagation());

    const style = document.createElement("style");
    style.innerHTML = BannerAlert.#stylesheet;
    shadowRoot.appendChild(style);

    this.#wrapper = document.createElement("div");
    this.#wrapper.id = "wrapper";
    shadowRoot.appendChild(this.#wrapper);

    this.#message = document.createElement("span");
    this.#wrapper.appendChild(this.#message);

    this.#closeBtn = document.createElement("button");
    this.#closeBtn.addEventListener("click", () =>
      this.dispatchEvent(new BannerAlert.CloseEvent()),
    );
    this.#closeBtn.textContent = "Close";
    this.#wrapper.appendChild(this.#closeBtn);
  }

  connectedCallback() {
    // Set type on wrapper
    const type = this.getAttribute("type");
    if (type == null)
      console.error("Type not set on banner alert. Defaulting to `info`.");
    this.#wrapper.classList.add(type ?? "info");

    // Load message
    const message = this.getAttribute("message") ?? "";
    this.#message.innerHTML = message;

    // Actions
    /** @type {Action[]} */
    const actions = JSON.parse(this.getAttribute("actions") ?? "[]");
    for (const action of actions) {
      const btn = document.createElement("button");
      btn.innerHTML = action.displayText;
      btn.addEventListener("click", () =>
        this.dispatchEvent(new BannerAlert.ActionEvent(action.name)),
      );
      this.#wrapper.insertBefore(btn, this.#closeBtn);
    }
  }

  #close() {
    this.dispatchEvent(new BannerAlert.CloseEvent());
  }

  static #stylesheet = `
    #wrapper {
      padding: 0.25em;

      --hue-dark-yellow: 91.09;
      --hue-dark-purple: 308.98;
      --color-bg: oklch(0.32 0.0651 var(--hue));

      &.info    { --hue: var(--hue-dark-purple); }
      &.warning { --hue: var(--hue-dark-yellow); }

      background-color: var(--color-bg);
      color: white;
      border: 1px solid oklch(from var(--color-bg) 0.4 c h);

      display: flex;
      gap: 0.25em;
      justify-content: space-between;
      align-items: center;

      & > span {
        flex-grow: 1;
      }

      & > button {
        border-radius: 0;
        --l: 0.22;
        background-color: oklch(from var(--color-bg) var(--l) c h);
        border: 1px solid oklch(from var(--color-bg) 0.4 c h);

        &:hover  { --l: 0.3; }
        &:active { --l: 0.4; }
      }
    }
  `;

  /**
   * @typedef {Object} Action
   * @prop {string} name
   * @prop {string} displayText
   */

  static ActionEvent = class extends Event {
    /** @param {string} name */
    constructor(name) {
      super(`banner-alert-action-${name}`);
    }
  };

  static CloseEvent = class extends Event {
    constructor() {
      super("banner-alert-close");
    }
  };
}

if (customElements.get("banner-alert") == null) {
  customElements.define("banner-alert", BannerAlert);
}
