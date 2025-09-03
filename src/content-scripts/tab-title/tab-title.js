import { promiseError, waitFor, waitForElem } from "../common.js";

const getTabTitle = async () => {
  const url = location.href;
  console.log("Setting title for", url);
  if (url.includes("lms-assignment/assignment-center"))
    return "Assignment Center";
  if (url.includes("lms-assignment/assignment")) {
    // Parse assignment title from html
    const header = await waitForElem("h1");
    const title = header?.querySelector("span");
    if (title != null) return `Assignment: ${title.textContent}`;
    else return "Assignment";
  }
  if (url.includes("/app/student#activitystream")) {
    return "Recent Activity";
  }
};

const getTitleElem = async () => {
  const titleElem = await waitForElem("title");
  if (titleElem == null) return null;

  await waitFor(() => titleElem.textContent != "");
  return titleElem;
};

const updateTitle = promiseError(async () => {
  const title = await getTabTitle();
  if (title == null) return console.warn("No updated title for this page.");

  const elem = (await getTitleElem()) ?? document.createElement("title");
  elem.textContent = title;
  console.log(`Set title to "${title}"`);
  document.head.appendChild(elem);
});

updateTitle();
addEventListener("hashchange", updateTitle);
