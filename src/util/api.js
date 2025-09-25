import AssignmentUtil from "../content-scripts/assignment-center/assignment.js";
import Task from "../content-scripts/assignment-center/Task.js";
import { memo, setAssignmentsCache } from "../content-scripts/common.js";
import { getStudentUserId } from "../content-scripts/student-user-id.js";

import { assertIsClass } from "./assertIsClass.js";
import BlackbaudDate from "./BlackbaudDate.js";

/** @import { Assignment, Status } from "../content-scripts/assignment-center/assignment.js" */
/** @import { BlackbaudTask } from "../content-scripts/assignment-center/TaskEditor.js" */

/**
 * @typedef {Object} BlackbaudAssignmentPreview
 * @property {number|0} AssignmentId The ID if it is an assignment. You probably want the AssignmentIndexId. Idk when this is used.
 * @property {number} AssignmentIndexId The ID of the assignment for use in links (eg in the new https://hunterschools.myschoolapp.com/lms-assignment/assignment/assignment-student-view/<ID>). Might be used for other things too idk.
 * @property {number|0} UserTaskId The ID if it is a task.
 * @property {string} ShortDescription The title of the assignment
 * @property {string} GroupName	The name of the class.
 * @property {number} SectionId The ID of the class.
 * @property {string} AssignmentType eg "Homework (Minor)"
 * @property {string} DateAssigned (or might be AssignedDate?)
 * @property {string} DateDue (or might be DueDate?)
 * @property {string} AssignedDate (or might be DateAssigned?)
 * @property {string} DueDate (or might be DateDue?)
 * @property {-1|0|1|2|4} AssignmentStatusType As far as I can tell: -1 -> Todo, 0 -> In progress, 1 -> Compeleted/Graded, 2 -> Missing/Overdue, 4 -> Graded.
 * @property {-1|0|1|2|4} TaskStatus (maybe make optional?) As far as I can tell: -1 -> Todo, 0 -> In progress, 1 -> Compeleted/Graded, 2 -> Missing/Overdue, 4 -> Graded.
 * @property {number} MaxPoints
 * @property {boolean} ExtraCredit
 * @property {number?} MaxPoints
 */
/**
 * @typedef {Object} BlackbaudAssignment
 * @property {String} LongDescription
 *
 * @property {1} LtiProviderId Seemingly the id of an external assignment submission(?) service. Unclear why it is always 1.
 * @property {""|"Turnitin (HS Only)"} LtiProviderName The name for an external assignment submission(?) service.
 * @property {boolean} DropboxInd Whether or not the Blackbaud file submission is used.
 * @property {number} DropboxNumFiles The maximum number of files that can be submitted through Blackbaud Dropbox.
 * @property {BlackbaudSubmissionResult[]} SubmissionResults The files that the user has submitted through Blackbaud Dropbox.
 *
 * @property {BlackbaudDownloadItem[]} DownloadItems
 * @property {BlackbaudLinkItem[]} LinkItems
 * @property {{ GradebookGrade: number? }} AssignmentGrade
 */ // lots of other things too but i'm too lazy to list them, add more as needed
/**
 * @typedef {Object} BlackbaudDownloadItem
 * @property {String} DownloadUrl The URL of the file. An absolute link for `https://hunterschools.myschoolapp.com/`.
 * @property {boolean} Expired (Maybe) Whether or not the file is still availble for download??
 * @property {String} FileName The raw file name as stored on the server.
 * @property {String} FriendlyFileName A file name intended for viewing by a user. Unclear why both it and `ShortDescription` exist. Prefer `ShortDescription` in most cases.
 * @property {String} ShortDescription The title of the file to display to the user.
 */ // lots of other things too but i'm too lazy to list them, add more as needed
/**
 * @typedef {Object} BlackbaudLinkItem
 * @property {String} Url The URL of the link.
 * @property {String} UrlDisplay Unclear why it exists. A prettier URL in some cases perhaps? It looks exactly the same.
 * @property {boolean} Expired (Maybe) Whether or not the link has been marked as expired by someone??
 * @property {String} ShortDescription The name to show to the user.
 */ // lots of other things too but i'm too lazy to list them, add more as needed
/**
 * @typedef {Object} BlackbaudSubmissionResult
 * @property {String} DownloadUrl The URL of the file. An absolute link for `https://hunterschools.myschoolapp.com/`.
 * @property {String} FileName The file name as submitted by the user.
 */ // lots of other things too but i'm too lazy to list them, add more as needed

/** Everything involving the Blackbaud API. */
const api = {
  /**
   * Fetch an assignment from the Blackbaud API.
   * @param {number} assignmentIndexId Can be found in the link of an assignment.
   * @param {string} studentUserId Can be found in the user's "Profile" link.
   * @returns {Promise<BlackbaudAssignment>} Direct response from a Blackbaud API.
   */
  async fetchAssignment(assignmentIndexId, studentUserId) {
    return ApiError.wrapFetch(
      "fetchAssignment",
      fetch(
        `https://hunterschools.myschoolapp.com/api/assignment2/UserAssignmentDetailsGetAllStudentData?assignmentIndexId=${assignmentIndexId}&studentUserId=${studentUserId}&personaId=2`,
      ),
    ).then((r) => r.json());
  },

  /** @type {{ [key in Status]: number }} */
  statusNumMap: {
    Missing: 2,
    Overdue: 2,
    "To do": -1,
    // FIXME: figure out what is going on w/ in progress
    "In progress": 0, // just mark it same as todo
    Completed: 1,
    Graded: 1,
  },

  /**
   * @param {number} assignmentIndexId
   * @param {Status} status
   */
  async updateAssignmentStatus(assignmentIndexId, status) {
    const assignmentStatus = api.statusNumMap[status];
    console.log(
      `Setting status to ${assignmentStatus} for assignment ${assignmentIndexId}`,
    );

    return ApiError.wrapFetch(
      "updateAssignmentStatus",
      fetch(
        `https://hunterschools.myschoolapp.com/api/assignment2/assignmentstatusupdate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignmentIndexId,
            assignmentStatus,
          }),
        },
      ),
    );
  },

  /** @param {any} task */
  nullifyIfZeroTaskSectionId(task) {
    return {
      ...task,
      SectionId:
        Number(task.SectionId ?? 0) === 0 ? null : String(task.SectionId),
    };
  },
  /** @param {Assignment} task */
  async updateTaskStatus(task) {
    const statusNum = api.statusNumMap[task.status];
    console.log(`Setting status to ${statusNum} for task ${task.id}`);

    return ApiError.wrapFetch(
      "updateTaskStatus",
      fetch(`https://hunterschools.myschoolapp.com/api/UserTask/Edit/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          api.nullifyIfZeroTaskSectionId({
            AssignedDate: BlackbaudDate.from(task.assignedDate),
            DueDate: BlackbaudDate.from(task.dueDate),
            SectionId: task.class.id,
            ShortDescription: task.title,
            TaskStatus: statusNum,
            UserId: await getStudentUserId(),
            UserTaskId: task.id,
          }),
        ),
      }),
    );
  },
  /** @param {Assignment["id"]} id */
  async deleteTask(id) {
    console.log(`Deleting task ${id}`);
    return ApiError.wrapFetch(
      "deleteTask",
      fetch("https://hunterschools.myschoolapp.com/api/UserTask/Edit/", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }),
    );
  },
  /** @param {BlackbaudTask} task */
  async createTask(task) {
    console.log(`Creating task ${task.ShortDescription}`);
    const id = await ApiError.wrapFetch(
      "createTask",
      fetch("https://hunterschools.myschoolapp.com/api/UserTask/Edit/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(api.nullifyIfZeroTaskSectionId(task)),
      }),
    ).then((r) => r.text());

    if (/\D/.test(id)) {
      throw new ApiError(
        "createTaskInvalidResponse",
        new Error(
          `Invalid response to create task: "${id}". (Expected an id, ie number.)`,
        ),
      );
    }

    return id;
  },
  /** @param {BlackbaudTask} task */
  async updateTask(task) {
    console.log(`Updating task ${task.UserTaskId}`);
    return ApiError.wrapFetch(
      "updateTask",
      fetch("https://hunterschools.myschoolapp.com/api/UserTask/Edit/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(api.nullifyIfZeroTaskSectionId(task)),
      }),
    );
  },

  getClassColors: memo(
    /** @returns {Promise<Map<number, string>>} */
    async () =>
      ApiError.wrapFetch(
        "getClassColors",
        fetch(
          "https://hunterschools.myschoolapp.com/api/AssignmentCenter/StudentAssignmentCenterSettingsGet?displayByDueDate=true",
        ),
      )
        .then(
          /** @returns { Promise<{ SectionColors: { LeadSectionId: number, HexColor: string }[] }> }*/
          (r) => r.json(),
        )
        .then((r) => r.SectionColors)
        .then((colors) =>
          colors.reduce(
            (map, { LeadSectionId, HexColor }) =>
              map.set(LeadSectionId, HexColor),
            new Map(),
          ),
        ),
  )[0],

  getAllAssignmentData: () =>
    ApiError.wrapFetch(
      "getAllAssignmentData",
      fetch(
        "https://hunterschools.myschoolapp.com/api/assignment2/StudentAssignmentCenterGet?displayByDueDate=true",
      ),
    ).then((r) => r.json()),

  /**
    * @param {{ [key in
        "Missing"
        |"Overdue"
        |"DueToday"
        |"DueTomorrow"
        |"DueThisWeek"
        |"DueNextWeek"
        |"DueAfterNextWeek"
        |"PastThisWeek"
        |"PastLastWeek"
        |"PastBeforeLastWeek"
      ]: BlackbaudAssignmentPreview[] }} assignments
    */
  parseAssignments: (assignments) =>
    Promise.all(
      assignments.Missing.concat(
        assignments.Overdue,
        assignments.DueToday,
        assignments.DueTomorrow,
        assignments.DueThisWeek,
        assignments.DueNextWeek,
        assignments.DueAfterNextWeek,
        assignments.PastThisWeek,
        assignments.PastLastWeek,
        assignments.PastBeforeLastWeek,
      ).map((assignment) => {
        console.debug("Parsing assignment...");
        if (assignment.UserTaskId !== 0) {
          return Task.addColor(Task.parse(assignment));
        } else {
          return AssignmentUtil.addColor(AssignmentUtil.parse(assignment));
        }
      }),
    ).then((assignments) => (setAssignmentsCache(assignments), assignments)),

  getClasses: memo(
    /** @returns {Promise<Map<number, string>>} */
    async () =>
      api.getAllAssignmentData().then(
        (
          /** @type {{ Sections: { LeadSectionId: number, GroupName: string }[] }} */ {
            Sections: sections,
          },
        ) =>
          sections.reduce(
            (map, { LeadSectionId: id, GroupName: name }) => map.set(id, name),
            new Map(),
          ),
        (err) => {
          throw new ApiError("getClasses", err);
        },
      ),
  )[0],
};

export class ApiError extends Error {
  static MESSAGES = {
    fetchAssignment: "could not fetch assignment",
    updateAssignmentStatus: "could not update assignment status",
    updateTaskStatus: "could not update task status",
    deleteTask: "could not delete task",
    createTask: "could not create task",
    createTaskInvalidResponse:
      "Blackbaud returned an invalid response when attempting to create a task",
    updateTask: "could not update task",
    getClassColors: "could not get class colors",
    getAllAssignmentData: "could not get all assignment data",
    getClasses: "could not get classes",
    getStudentUserId: "could not get student user id",
    checkForUpdates: "could not check for updates",
  };

  /**
   * @param {keyof typeof ApiError.MESSAGES} action
   * @param {Error?} cause
   * @param {boolean=} suggestReload Defaults to false
   */
  constructor(action, cause = null, suggestReload = false) {
    const msg = `${ApiError.MESSAGES[action] ?? action}${suggestReload ? ", try reloading the page" : ""} (${action})`;
    super(msg, { cause });

    this.name = "ApiError";
    this.action = action;
    this.suggestReload = suggestReload;
  }

  // TODO: make this work via .then()
  // ie `fetch("/whatever").then(ApiError.wrapFetch("doWhatever")).then(r => r.json())`
  /**
   * Wrap an api fetch call w/ an API error.
   * @param {keyof typeof ApiError.MESSAGES} action
   * @param {Promise<Response>} fetch
   */
  static async wrapFetch(action, fetch) {
    // Don't use Promise methods to avoid `InternalError: Promise rejection
    // value is a non-unwrappable cross-compartment wrapper.`
    // (see <https://bugzilla.mozilla.org/show_bug.cgi?id=1871516>)

    /** @type {number?} */
    let status = null;

    console.debug("Wrapping fetch...");
    try {
      const res = await fetch;
      status = res.status;
      console.debug("Fetched with status", status, res.ok);

      if (res.ok) return res;
      // Throw a `window` error so the type assert in the catch block works
      throw new window.Error(`api response not ok (${res.status})`);
    } catch (err) {
      // Catch `window.Error` b/c any `NetworkError`s/etc from `fetch` will be
      // from the `window` realm, not ours.
      assertIsClass(err, window.Error);
      throw new ApiError(action, err, status === 403);
    }
  }
}

export default api;
