import { NonNull } from "/src/util/NonNull.js";

import { BannerAlert } from "./banner-alert.js";
import { waitForElem } from "./common.js";

// From <https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string>
/** @param {string} message */
const hash = async (message) => {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
};

const checkForBdays = async () => {
  try {
    /** @type {{ [key: string]: { [key: string]: { first: string, last: string }[] } }} */
    const bdays = await fetch(
      "https://gavinmorrow.github.io/orion/birthdays.json",
    ).then((r) => r.json());

    const date = new Date();
    const month = date.getMonth() + 1; // stupid 0-based month indexing
    const day = date.getDate();

    const people = bdays?.[`${month}`]?.[`${day}`] ?? [];
    for (const { first, last } of people) {
      // check if this is the person
      const names = NonNull(await waitForElem("#account-nav .title"));
      const firstElem = NonNull(names.firstElementChild).textContent.trim();
      const lastElem = NonNull(names.lastElementChild).textContent.trim();

      const firstHashed = await hash(firstElem.toLowerCase());
      const lastHashed = await hash(lastElem.toLowerCase());

      if (first !== firstHashed || last !== lastHashed) continue;

      BannerAlert.createBanner(`HAPPY BIRTHDAY ${firstElem.toUpperCase()}!!!!`);
    }
  } catch (err) {
    console.error("Error while checking for birthdays.", err);
  }
};

export default checkForBdays;
