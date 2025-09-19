import api from "/src/util/api.js";
import BlackbaudDate from "/src/util/BlackbaudDate.js";
import { NonNull } from "/src/util/NonNull.js";
import { sortForArray } from "/src/util/sort.js";

import { getStudentUserId } from "../student-user-id.js";

import { scrapeClassColors } from "./scrape-colors.js";

/** @import {
      BlackbaudAssignmentPreview,
      BlackbaudAssignment,
      BlackbaudDownloadItem,
      BlackbaudLinkItem,
    } from "../../util/api.js" */

/**
 * @typedef {String} Color Either a CSS color in `rgb(<r>,<g>,<b>)` format, or the empty string `""`.
 * @typedef {String} Link
 * @typedef {"To do"|"In progress"|"Completed"|"Graded"|"Missing"|"Overdue"} Status
 * @typedef {null|"bbDropbox"|"turnitin"|"googleAssignments"|"unknownLti"} SubmissionMethod
 */

/**
 * @typedef {Object} Assignment
 * @property {Number} id
 * @property {Color?} color
 * @property {String} title
 * @property {Link?} link
 * @property {String?} description an innerHTML string.
 * @property {Status} status
 * @property {Date} dueDate
 * @property {Date} assignedDate
 * @property {Number?} maxPoints
 * @property {boolean} isExtraCredit
 * @property {{ id?: number, name: String, link?: Link }} class
 * @property {String} type
 * @property {boolean} isTask
 * @property {SubmissionMethod?} submissionMethod
 * @property {AssignmentAttachment[]} attachments Both download and link items.
 * @property {object} grade
 * @property {number?} grade.value
 * @property {number?} grade.max
 */

/**
 * @typedef {Object} AssignmentAttachment
 * @property {string} url
 * @property {boolean} expired
 * @property {string} name The name to show to the user. *Not* a filename. Equivalent to `ShortDescription`.
 */

const Assignment = {
  /**
   * Parse an assignment from its BB API representation.
   * @template {BlackbaudAssignmentPreview?} T
   * @param {T} blackbaudRepr
   * @returns {T extends null ? null : Assignment}
   */
  parse(blackbaudRepr) {
    if (blackbaudRepr == null) return /** @type {any} */ (null);

    return /** @type {T extends null ? null : Assignment} */ (
      /** @type {Assignment} */ ({
        // I'm not sure when the AssignmentId is used, but I'm also not sure if the AssignmentIndexId always exists.
        id: blackbaudRepr.AssignmentIndexId ?? blackbaudRepr.AssignmentId,
        // Color will be added later
        color: null,
        // color: api.getClassColors()[blackbaudRepr.SectionId],
        title: blackbaudRepr.ShortDescription,
        link:
          blackbaudRepr.AssignmentIndexId != null
            ? `https://hunterschools.myschoolapp.com/lms-assignment/assignment/assignment-student-view/${blackbaudRepr.AssignmentIndexId}`
            : ``,
        description: null,
        status: Assignment.getStatusText(blackbaudRepr),
        dueDate: BlackbaudDate.parse(blackbaudRepr.DateDue),
        assignedDate: BlackbaudDate.parse(blackbaudRepr.DateAssigned),
        maxPoints: blackbaudRepr.MaxPoints,
        isExtraCredit: blackbaudRepr.ExtraCredit,
        class: { id: blackbaudRepr.SectionId, name: blackbaudRepr.GroupName },
        type: blackbaudRepr.AssignmentType,
        // tasks are parsed elsewhere
        isTask: false,
        submissionMethod: null,
        attachments: [],
        grade: {
          value: null,
          max: blackbaudRepr.MaxPoints ?? null,
        },
      })
    );
  },

  getStatusText(/** @type {BlackbaudAssignmentPreview} */ blackbaudRepr) {
    switch (blackbaudRepr.AssignmentStatusType) {
      // These are all just best guesses. They could totally all be wrong.
      case -1:
        return "To do";
      case 0:
        return "In progress";
      case 1:
        return "Completed";
      // FIXME: could also be missing.
      case 2:
        return "Overdue";
      case 4:
        return "Graded";
      default:
        console.error(
          "Unkonwn status",
          blackbaudRepr.AssignmentStatusType,
          `for assignment ${blackbaudRepr.ShortDescription}`,
          `in class ${blackbaudRepr.GroupName}`,
        );
        return "To do";
    }
  },

  // A seperate function so that `parse` can be non-async.
  /** @param {Assignment} a @returns {Promise<Assignment & { color: Color }>} */
  async addColor(a) {
    console.debug("Adding color...");
    try {
      const apiColors = await api.getClassColors();
      let color = apiColors.get(Number(a.class.id));

      if (color == undefined) {
        console.debug("Couldn't get color from API.");
        const htmlColors = await scrapeClassColors();
        color = htmlColors.get(a.class.name);
      }

      if (color == undefined) {
        console.debug("Couldn't get color from HTML.");
        // Don't throw error because it's not serious enough to alert user.
        console.error(
          `Color for class ${a.class.id} (${a.class.name}) not found.`,
        );
        color = "#111";
      }

      return { ...a, color };
    } catch (err) {
      reportError(err);
      return { ...a, color: "#111" };
    }
  },

  /**
   * Sort two assignments by status (ascending) and then by type (descending).
   * @param {Assignment} a
   * @param {Assignment} b
   * @returns {number}
   */
  sort(a, b) {
    // If statuses are equal, it will be 0 and || will select the other branch
    const res =
      Assignment.sortStatuses(a.status, b.status) ||
      Assignment.sortTypes(a.type, b.type) ||
      sortForArray(a.class.name, b.class.name) ||
      sortForArray(a.title, b.title) ||
      // fallback to sorting by link, so that there is a total sort order
      sortForArray(a.link, b.link);
    if (res === 0) console.error("Two assignments compared as equal!", a, b);
    return res;
  },

  /**
   * Sort statuses in ascending order.
   * Missing < Overdue < To do < In progress < Completed < Graded
   * @param {Status} a
   * @param {Status} b
   * @returns {number}
   */
  sortStatuses(a, b) {
    // TODO: treat "To do" and "In progress" as equal?
    const order = [
      "Missing",
      "Overdue",
      "To do",
      "In progress",
      "Completed",
      "Graded",
    ];
    return order.indexOf(a) - order.indexOf(b);
  },

  /**
   * Sort assignment types in descending order. Majors are the greatest, and
   * everything else is equal.
   * @param {String} a
   * @param {String} b
   * @returns {number}
   */
  sortTypes(a, b) {
    const aIsMajor = Assignment.typeIsMajor(a) ? 1 : 0;
    const bIsMajor = Assignment.typeIsMajor(b) ? 1 : 0;
    // Sort in descending order
    return bIsMajor - aIsMajor;
  },

  /** @param {Assignment} assignment */
  async getBlackbaudReprFor(assignment) {
    if (assignment.isTask) {
      console.warn(
        "Tried to get Blackbaud representation for custom task. Custom tasks do not have a Blackbaud representation.",
      );
      return undefined;
    }

    const studentUserId = NonNull(await getStudentUserId());
    return api.fetchAssignment(assignment.id, studentUserId);
  },

  /**
   * @param {BlackbaudAssignment | undefined} blackbaudRepr
   * @returns A list of properties to add to the assignment.
   */
  async parseBlackbaudRepr(blackbaudRepr) {
    return {
      description: blackbaudRepr?.LongDescription,
      submissionMethod:
        blackbaudRepr && Assignment.getSubmissionMethod(blackbaudRepr),
      attachments: Assignment.parseBlackbaudAttachments(blackbaudRepr),
      grade: {
        value: blackbaudRepr?.AssignmentGrade.GradebookGrade,
      },
    };
  },

  /**
   * Parse into the `assignment.attachments`.
   * @template {BlackbaudAssignment | undefined} T
   * @param {T} blackbaudRepr
   * @returns {T extends undefined ? undefined : AssignmentAttachment[]}
   */
  parseBlackbaudAttachments(blackbaudRepr) {
    if (blackbaudRepr == undefined) return /** @type {any} */ (undefined);

    const downloadItems = blackbaudRepr.DownloadItems.map(
      Assignment.parseBlackbaudDownloadItem,
    );
    const linkItems = blackbaudRepr.LinkItems.map(
      Assignment.parseBlackbaudLinkItem,
    );
    return /** @type {T extends undefined ? undefined : AssignmentAttachment[]} */ (
      downloadItems.concat(linkItems)
    );
  },

  /** @returns {AssignmentAttachment} */
  parseBlackbaudDownloadItem(/** @type {BlackbaudDownloadItem} */ item) {
    return {
      url: item.DownloadUrl,
      expired: item.Expired,
      name: item.ShortDescription,
    };
  },

  /** @returns {AssignmentAttachment} */
  parseBlackbaudLinkItem(/** @type {BlackbaudLinkItem} */ item) {
    return {
      url: item.Url,
      expired: item.Expired,
      name: item.ShortDescription,
    };
  },

  /** @param {BlackbaudAssignment} blackbaudRepr @returns {SubmissionMethod} */
  getSubmissionMethod(blackbaudRepr) {
    const ltiProvider = blackbaudRepr.LtiProviderName.toLowerCase();
    if (ltiProvider.includes("turnitin")) return "turnitin";
    else if (ltiProvider.includes("google assignments"))
      return "googleAssignments";
    else if (ltiProvider === "") {
      if (blackbaudRepr.DropboxInd) return "bbDropbox";
      else return null;
    } else {
      console.warn(`Unknown LTI provider: ${ltiProvider}`);
      return "unknownLti";
    }
  },

  /** @param {Assignment} a */
  isCompleted(a) {
    return a.status === "Completed" || a.status === "Graded";
  },

  /** @param {String} type */
  typeIsMajor(type) {
    return type.indexOf("Major") > -1;
  },

  /** @param {Assignment} a */
  isMajor(a) {
    return Assignment.typeIsMajor(a.type);
  },

  /** @param {Assignment} a */
  requiresSubmission(a) {
    return a.submissionMethod != null;
  },
};

export default Assignment;
