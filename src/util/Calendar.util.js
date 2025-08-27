/**
 * Safe wrapper around JS `Date` for some common util methods.
 */
const Calendar = {
  /**
   * @param {Date} date
   * @param {Number} offset a number in days
   * @returns {Date}
   */
  offsetFromDay(date, offset) {
    // MAKE SURE TO HANDLE DATES CORRECTLY!!
    // **Be careful when doing custom date manipulation.**

    date = Calendar.resetDate(date);
    const dayInMonth = date.getDate();
    const dayWithOffset = dayInMonth + offset;

    // See https://stackoverflow.com/a/315767
    const numDaysInCurrentMonth = Calendar.numDaysInMonth(
      date.getMonth(),
      date.getFullYear(),
    );
    if (dayWithOffset > numDaysInCurrentMonth) {
      // roll over to next month

      // minus one because it goes to the end of the current month, then one
      // more day to roll over to the next month.
      const remainingOffset = dayWithOffset - numDaysInCurrentMonth - 1;

      // handle rolling over years too
      // remember that months are 0-indexed (so 0-11)
      const newYear = date.getFullYear() + (date.getMonth() === 11 ? 1 : 0);
      const newMonth = (date.getMonth() + 1) % 12;
      const newDay = 1;
      const newDate = new Date(newYear, newMonth, newDay);

      // be recursive to handle rolling over multiple months
      return Calendar.offsetFromDay(newDate, remainingOffset);
    } else if (dayWithOffset < 1) {
      // roll over to previous month

      // handle rolling over years too
      // remember that months are 0-indexed (so 0-11)
      const newYear = date.getFullYear() - (date.getMonth() === 0 ? 1 : 0);
      // `%` in js isn't modulo, it's remainder. https://stackoverflow.com/a/4467559
      // This does modulo, so eg -2 -> 10
      const newMonth = (((date.getMonth() - 1) % 12) + 12) % 12;

      const numDaysInPrevMonth = Calendar.numDaysInMonth(newMonth, newYear);

      const newDay = numDaysInPrevMonth;
      /** the end on the month */
      const newDate = new Date(newYear, newMonth, newDay);

      // dayWithOffset is negative or 0
      // this is fine because this is setting the newDate to be the end of the month
      const remainingOffset = dayWithOffset;

      // be recursive to handle rolling over multiple months
      return Calendar.offsetFromDay(newDate, remainingOffset);
    } else {
      // oh my god finally the day is within the current month
      // 1 <= dayWithOffset <= numDaysInCurrentMonth
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = dayWithOffset;

      return new Date(year, month, day);
    }
  },

  /**
   * Get the number of days in a given month.
   * @param {Number} month from 0-11 (Jan-Dec)
   * @param {Number} year defaults to the current year
   * @link https://stackoverflow.com/a/315767
   */
  numDaysInMonth(month, year = new Date().getFullYear()) {
    // setting the day to 0 gets the last day of the previous month
    return new Date(year, month + 1, 0).getDate();
  },

  /**
   * Reset a date to 00:00.00 on the day.
   * @param {Date} date
   */
  resetDate(date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    );
  },

  /**
   * Checks if two dates are on the same day.
   * @param {Date} a
   * @param {Date} b
   */
  datesAreSameDay(a, b) {
    // Erase the time component from both, then compare.
    const aErased = Calendar.resetDate(a);
    const bErased = Calendar.resetDate(b);

    return aErased.getTime() === bErased.getTime();
  },

  /**
   * Find the next day that is a weekday.
   * @param {Date=} a Defaults to the current date.
   */
  nextWeekday(a = new Date()) {
    const tomorrow = Calendar.offsetFromDay(a, 1);

    // Continually add one day until the day is a weekday.
    let day = tomorrow;
    while (!Calendar.dateIsWeekday(day)) {
      day = Calendar.offsetFromDay(day, 1);
    }

    return day;
  },

  /**
   * Checks if a date falls on Monday-Friday.
   * @param {Date} a
   */
  dateIsWeekday(a) {
    const monday = 1,
      friday = 5;

    // Returns 0-6, where 0 is Sunday.
    const day = a.getDay();
    return day >= monday && day <= friday;
  },

  /**
   * Convert a time from 12-hour time to 24-hour time.
   * @param {Number} hour The 12-hour hour.
   * @param {"AM"|"PM"} amPm
   * @returns {Number}
   */
  hour12ToHour24(hour, amPm) {
    switch (amPm) {
      case "AM":
        // 12AM, ie midnight, is 00:00
        if (hour === 12) return 0;
        return hour;
      case "PM":
        // 12PM, ie noon, is 12:00
        if (hour === 12) return 12;
        return hour + 12;
    }
  },

  /** @param {Date} date @returns {Date} */
  dateForSundayOfWeek(date) {
    // MAKE SURE TO HANDLE DATES CORRECTLY!!
    // **Be careful when doing custom date manipulation.**

    /** number from 0-6 (sunday-saturday) */
    const dayOfWeek = date.getDay();
    /** how much to add to current date to get the sunday in the week */
    const offsetFromSunday = 0 - dayOfWeek;
    return Calendar.offsetFromDay(date, offsetFromSunday);
  },

  /**
   * Convert a date to yyyy-mm-dd format.
   * @param {Date} date
   * @returns {String}
   */
  asInputValue(date) {
    const year = String(date.getFullYear()).padStart(4, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },
  /**
   * Convert a yyyy-mm-dd string to a Date object.
   * @param {String} value
   * @returns {Date}
   */
  fromInputValue(value) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setFullYear(year);
    return date;
  },
  /**
   * Date as mm/dd/yyyy
   * @param {Date} date */
  asBlackbaudDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}/${year}`;
  },

  /**
   * Convert a 24 hour time to 12 hour time.
   * @param {Number} hour24
   * @returns {[Number, "AM"|"PM"]}
   */
  to12HourTime(hour24) {
    const hour12 = hour24 % 12 || 12;
    const amPm = hour24 < 12 ? "AM" : "PM";
    return [hour12, amPm];
  },
  /**
   * Convert an input time to a Blackbaud time.
   * @param {String} hour24InputValue hh:mm 24-hour time
   * @returns {String} hh:mm AM/PM 12-hour time
   */
  to12HourTimeInputValue(hour24InputValue) {
    const [hour24, min] = hour24InputValue.split(":").map(Number);
    const [hour12, amPm] = Calendar.to12HourTime(hour24);
    return `${hour12}:${String(min).padStart(2, "0")} ${amPm}`;
  },
};
export default Calendar;

/** @param {{ eq: [unknown, unknown] }[]} os */
const __assert = (...os) => {
  for (const o of os) {
    if (o.eq != null) {
      const [a, b] = o.eq;
      const res = a === b;
      if (!res) {
        console.error(`Assertion failed! ${a} !== ${b}`);
        return false;
      } else {
        return true;
      }
    }
  }
};
const __calendarUnitTests = [
  function oneDayForwardNoRollover() {
    const day = new Date(2024, 3, 22);
    const nextDay = Calendar.offsetFromDay(day, 1);
    return __assert({ eq: [nextDay.getDate(), 23] });
  },
  function oneDayBackNoRollover() {
    const day = new Date(2024, 3, 22);
    const nextDay = Calendar.offsetFromDay(day, -1);
    return __assert({ eq: [nextDay.getDate(), 21] });
  },

  function manyDayForwardNoRollover() {
    const day = new Date(2024, 3, 22);
    const nextDay = Calendar.offsetFromDay(day, 7);
    return __assert({ eq: [nextDay.getDate(), 29] });
  },
  function manyDayBackNoRollover() {
    const day = new Date(2024, 3, 22);
    const nextDay = Calendar.offsetFromDay(day, -7);
    return __assert({ eq: [nextDay.getDate(), 15] });
  },

  function handlesMonthRolloverForward() {
    const day = new Date(2024, 9, 3);
    const nextDay = Calendar.offsetFromDay(day, 30);
    return __assert(
      { eq: [nextDay.getDate(), 2] },
      { eq: [nextDay.getMonth(), 10] },
    );
  },
  function handlesMonthRolloverBack() {
    const day = new Date(2024, 9, 3);
    const nextDay = Calendar.offsetFromDay(day, -7);
    return __assert(
      { eq: [nextDay.getDate(), 26] },
      { eq: [nextDay.getMonth(), 8] },
    );
  },

  function handlesYearRolloverForward() {
    const day = new Date(2024, 9, 3);
    const nextDay = Calendar.offsetFromDay(day, 91);
    return __assert(
      { eq: [nextDay.getDate(), 2] },
      { eq: [nextDay.getMonth(), 0] },
    );
  },
  function handlesYearRolloverBack() {
    const day = new Date(2024, 1, 18);
    const nextDay = Calendar.offsetFromDay(day, -55);
    return __assert(
      { eq: [nextDay.getDate(), 25] },
      { eq: [nextDay.getMonth(), 11] },
    );
  },

  function handlesLeapYear() {
    const day = new Date(2024, 1, 28);
    const nextDay = Calendar.offsetFromDay(day, 1);
    return __assert({ eq: [nextDay.getDate(), 29] });
  },
  function handlesNoLeapYear() {
    const day = new Date(2023, 1, 28);
    const nextDay = Calendar.offsetFromDay(day, 1);
    return __assert(
      { eq: [nextDay.getDate(), 1] },
      { eq: [nextDay.getMonth(), 2] },
    );
  },

  function nextWeekday() {
    // Monday, 03 March 2025
    const base = new Date(2025, 3, 3);

    const dates = [...Array(10)].map((_, i) => {
      const date = Calendar.offsetFromDay(base, i);
      const nextWeekday = Calendar.nextWeekday(date);
      return nextWeekday.getDate();
    });
    const correctDateMap = [4, 5, 6, 7, 10, 10, 10, 11];

    const assertions = dates.map(
      /** @returns {{ eq: [number, number]}} */ (date, i) => ({
        eq: [date, correctDateMap[i]],
      }),
    );
    return __assert(...assertions, {
      eq: [dates.length, correctDateMap.length],
    });
  },

  function asInputValue() {
    const date = new Date(2009, 3, 22);
    const res = Calendar.asInputValue(date);
    return __assert({ eq: [res, "2009-04-22"] });
  },
  function asInputValueSmallYear() {
    const date = new Date(42, 11, 7);
    date.setFullYear(42);
    const res = Calendar.asInputValue(date);
    return __assert({ eq: [res, "0042-12-07"] });
  },
  function fromInputValue() {
    const res = Calendar.fromInputValue("2009-04-22");
    const expected = new Date(2009, 3, 22);
    return __assert({ eq: [res.getTime(), expected.getTime()] });
  },
  function fromInputValueSmallYear() {
    const res = Calendar.fromInputValue("9-10-3");
    const expected = new Date(9, 9, 3);
    expected.setFullYear(9);
    return __assert({ eq: [res.getTime(), expected.getTime()] });
  },
  function roundtripInputValue() {
    const date = new Date(2009, 3, 22);
    const res = Calendar.fromInputValue(Calendar.asInputValue(date));
    return __assert({ eq: [res.getTime(), date.getTime()] });
  },

  function to12HourTimeMorning() {
    const res = Calendar.to12HourTime(9);
    return __assert({ eq: [res.join(" "), "9 AM"] });
  },
  function to12HourTimeAfternoon() {
    const res = Calendar.to12HourTime(13);
    return __assert({ eq: [res.join(" "), "1 PM"] });
  },
  function to12HourTimeMidnight() {
    const res = Calendar.to12HourTime(0);
    return __assert({ eq: [res.join(" "), "12 AM"] });
  },
  function to12HourTimeNoon() {
    const res = Calendar.to12HourTime(12);
    return __assert({ eq: [res.join(" "), "12 PM"] });
  },
];
function __calendarUnitTestsRunAll() {
  for (const test of __calendarUnitTests) {
    const res = test();
    if (res == false) console.error("Test failed!", test.toString());
  }
  console.info("Unit tests finished.");
}
__calendarUnitTestsRunAll();
