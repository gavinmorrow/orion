import Calendar from "./Calendar.util.js";

const BlackbaudDate = {
  /**
   * Parse a blackbaud date string into a javascript `Date`.
   * @param {String} str A date in the format `mm/dd/yyyy hh:mm AM`.
   * @returns {Date}
   */
  parse(str) {
    const [date, time, amPm] = str.split(" ");
    const [month, day, year] = date.split("/").map(Number);
    const [hour12, min] = time.split(":").map(Number);
    if (amPm !== "AM" && amPm !== "PM")
      throw new Error(`Time is not AM or PM: "${amPm}"`);
    const hour24 = Calendar.hour12ToHour24(hour12, amPm);

    return new Date(year, month - 1, day, hour24, min);
  },

  /**
   * Create a blackbaud date string from a javascript `Date`.
   * @param {Date} date
   * @returns {String}
   */
  from(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const hour24 = date.getHours();
    const hour12 = hour24 % 12 || 12;
    const min = date.getMinutes();
    const amPm = hour24 < 12 ? "AM" : "PM";

    return `${month}/${day}/${year} ${hour12}:${min} ${amPm}`;
  },
};
export default BlackbaudDate;
