import { ApiError } from "/src/util/api.js";
import { NonNull } from "/src/util/NonNull.js";

import { memo, waitFor, waitForElem } from "./common.js";

/**
 * Run a function with the profile subnav open, and automatically close it when you're finished.
 * @template T
 * @param {(profileNav: HTMLElement) => Promise<T>} fn
 * @returns {Promise<T?>} */
const inProfileSubnav = async (fn) => {
  const profileNav = await waitForElem("a#account-nav");
  if (profileNav == null) return null;

  profileNav.click();

  const res = await fn(profileNav);

  // click outside to close
  document.body.click();

  return res;
};

/**
 * Find the link to the user's profile.
 * @param {HTMLElement} profileNav
 * @returns {Promise<string?>} */
const findProfileHref = async (profileNav) => {
  const subnav = profileNav?.nextElementSibling?.nextElementSibling;
  const profileLink = await waitFor(
    () => /** @type {HTMLAnchorElement?} */ (subnav?.querySelector("li a")),
  ); // the first one
  return profileLink?.href ?? null;
};

/** @param {string?} href @returns {string?} */
const parseProfileLinkHref = (href) => {
  const regexp = /#profile\/(?<id>\d+)/;
  const userId = NonNull(href?.match(regexp)?.groups).id;

  if (userId == null) {
    reportError(new ApiError("getStudentUserId"));
  }

  return userId;
};

/** Scrape the page for the student user id. */
const [getStudentUserId, _updateStudentUserIdCache] = memo(
  /** @returns {Promise<string?>} The student user id, or null. */
  async () => inProfileSubnav(findProfileHref).then(parseProfileLinkHref),
);

export { getStudentUserId };
