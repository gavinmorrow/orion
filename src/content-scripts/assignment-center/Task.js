import api from "/src/util/api.js";
import BlackbaudDate from "/src/util/BlackbaudDate.js";

import AssignmentUtil from "./assignment.js";

/** @import { BlackbaudAssignmentPreview } from "/src/util/api.js" */
/** @import { BlackbaudTask } from "./TaskEditor.js" */
/** @import { Assignment, Status } from "./assignment.js" */

const Task = {
  /** @param {Assignment[]} assignments */
  async populateAllIn(assignments) {
    const tasks = await api.getAllAssignmentData().then(
      (assignments) =>
        Promise.all(
          assignments.DueToday.concat(
            assignments.DueTomorrow,
            assignments.DueThisWeek,
            assignments.DueNextWeek,
            assignments.DueAfterNextWeek,
            assignments.PastThisWeek,
            assignments.PastLastWeek,
            assignments.PastBeforeLastWeek,
          )
            .filter((/** @type {BlackbaudTask} */ a) => a.UserTaskId != 0)
            .map(Task.parse)
            .map(Task.addColor),
        ),
      (err) => {
        reportError(err);
        // Allow the rest of the UI to work, just without tasks.
        return [];
      },
    );
    return assignments.filter((a) => !a.isTask).concat(tasks);
  },

  // TODO: figure out the type
  /** @param {BlackbaudAssignmentPreview} t @returns {Assignment} */
  parse(t) {
    return {
      id: Number(t.UserTaskId),
      color: null,
      title: t.ShortDescription,
      link: null,
      description: null,
      status: /** @type {Status} */ (
        Object.keys(api.statusNumMap).find(
          (k) => api.statusNumMap[/** @type {Status} */ (k)] === t.TaskStatus,
        )
      ),
      // duplicated to handle both bc I can't figure out which one blackbaud
      // uses. It might be both???
      dueDate: BlackbaudDate.parse(t.DueDate ?? t.DateDue),
      assignedDate: BlackbaudDate.parse(t.AssignedDate ?? t.DateAssigned),
      maxPoints: null,
      isExtraCredit: false,
      class: {
        name: t.GroupName,
        id: Number(t.SectionId),
        link: `https://hunterschools.myschoolapp.com/app/student#academicclass/${t.SectionId}/0/bulletinboard`,
      },
      type: "My task",
      isTask: true,
      submissionMethod: null,
      attachments: [],
      grade: { value: null, max: null },
    };
  },

  /** @param {Assignment} t */
  async addColor(t) {
    return AssignmentUtil.addColor(t);
  },
};

export default Task;
