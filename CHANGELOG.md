# Changelog

## v0.7.5

_released 00 September 2025_

- Features:
  - Assignments that have titles that start or end with newlines will get those
    trimmed. No more needless empty lines! (looking at you, $GUSH_TEACHER)
  - Add a button to reset all settings.
- Improvements:
  - Graded assignments will have a green outline around them. The default
    background color for graded assignments is reverted to be the same as
    "completed".

## v0.7.4

_released 20 September 2025_

- Features:
  - View the full date for a day by hovering over the number in the calendar.
  - When an assignment is graded, the grade is shown in the assignment popup.
    - NOTE: The default color of graded assignments has been changed to a
            slightly lighter green than completed assignments. If you want to
            restore the previous color, you can do so in settings.
    - (Also, I'm not fully satisfied with the contrast of text w/ that color,
       so if you have any suggestions for colors/how to fix that, tell me!!)
- Bug Fixes:
  - Fixes some styling bugs in the toolbar.
  - Assignment boxes keep their focus styling (lighter background color) when
    the mouse is moved out of a popup kept open by selecting text.

## v0.7.3

_released 06 September 2025_

- Bug Fixes:
  - Okay sorry for this one. I forgot to bump the version number in one place so
    the update notifier will just bug you incorrectly. idk how, bc I have a
    whole checklist and everything?? somehow missed the step.

## v0.7.2

_released 06 September 2025_

- Bug Fixes:
  - Fix notify update not showing. (same issue as what's new lol)

## v0.7.1

_released 05 September 2025_

- Bug Fixes:
  - Fix what's new not showing.

## v0.7.0

_released 05 September 2025_

Welcome to the 2025-26 school year! With the new year comes a major refactor and
a handful of bug fixes. This release may not look like much, but I've added a
lot of typechecking and linting under the hood to make sure I'm less likely to
introduce bugs when making changes.

(Ironically, in the process of doing that, I may have introduced some bugs that
will need to be ironed out. I won't be able to do that until some assignments
are posted, so stay tuned for a v0.7.1 and report all bugs!)

- Features:
  - There's a surprise hidden in there. :] (sorry it's late)
- Improvements:
  - The task editor no longer complains about an empty title when you first open
    it. (It will still complain if you try to create a task without a title, or
    click into the title input and then click out. Everybody say thank you to
    `:user-invaid`.)
- Bug Fixes:
  - Adopted to changes Blackbaud made over the summer.
  - Fix a crash when there are no assignments posted. (I think this has existed
    for quite a while, but I didn't notice because I made this after assignments
    had already been posted.)

## v0.6.1

_released 05 June 2025_

- Bug Fixes:
  - Hopefully prevents the stupid "#orion-main not found" message from
    appearing so often / at all.

## v0.6.0

_released 23 May 2025_

- Features:
  - Allow extending the calendar into the past/future.
  - Add a setting to modify the saturation of all colors.
  - Modify the tab title to reflect what the page actually is. (wtf blackbaud
    this isn't that hard how did you mess it up???)
- Bug Fixes:
  - Hide weekends after deleting the last task for it.
  - Attempt to make errors display better after opening computer (this may not
    work. I am still testing it. Please tell me whether or not it fixes things.)

## v0.5.0

_released 14 May 2025_

Bumped version b/c I'm feeling festive 🎉 and there's still so many numbers left
so really why not. This is my project, if I want to bump the version I can >:]

- Features:
  - More errors (the vast majority) will now appear as banners instead of as
    alerts.
  - Suggest reloading the page when attempting actions while logged out. (This
    usually happens when first opening your computer.)
  - Automatically click the "Keep working" button. (btw this is like. *so*
    annoying to test. if there are any bugs please please please tell me.)
- Bug Fixes/Improvements:
  - Detect when to autologin more reliably, and remove all host permissions.

## v0.4.5

_released 10 May 2025_

- Bug Fixes:
  - When using Chrome, prevent assignment popup from closing when text is
    selected inside of it.

## v0.4.4

_released 07 May 2025_

- Features:
  - There's a cute little icon now!

## v0.4.3

_released 07 May 2025_

- Bug Fixes:
  - Prevent what's new and notify update from failing on Chrome.

## v0.4.2

_released 07 May 2025_

- Bug Fixes:
  - Make the page automatically reload when Orion is updated, instead of
    erroring.
  - Fix some links that still pointed to the old github repo.

## v0.4.1

_released 07 May 2025_

I finally came up with a somewhat-halfway-decent name: Orion. Also, I'm finally
putting this thing on the chrome web store.

## v0.4.0

_released 06 May 2025_

This release doesn't have too many new features, but I decided to bump it
anyways because I finally got the what's new stuff (incl. banners!) out the door
and why not. It's been a while since I've actually added a new feature.

- Features:
  - A banner will show after the extension updates.
  - Use banners for error reporting instead of popups.
    - Add option to email me the details of the error.
  - Show a banner when an update is released.
- Bug Fixes:
  - Remove the title text when hovering over an assignment link, as it is
    completely redundant and displayed raw HTML.

## v0.3.4

_released 09 April 2025_

- Features:
  - Prevent assignment popup from closing when text is selected inside of it.
- Bug Fixes:
  - Fix issue where Blackbaud changed a URL format for the student user id.

## v0.3.3

_released 18 March 2025_

- Bug Fixes:
  - Fully fix the assignment collapsing issue.

## v0.3.2

_released 18 March 2025_

- Features:
  - Add version text in toolbar.
  - Make tasks due on the next weekday. (ie if you create a task on Friday or
    over the weekend, it will \[by default] be due the following Monday.)
- Bug fixes:
  - Fully collapse assignments to one line when marking as done. (There was a
    problem with line breaks not collapsing before.)
  - Fix the Dark Reader extension overriding the colors in the task editor save
    button and making them look really bad.
    - btw, I highly recommend it! it forces sites into dark mode.
      <https://darkreader.org/>
  - Make toolbar wrap when the screen is too narrow rather than squish.

## v0.3.1

_released 28 February 2025_

- Features:
  - Add a button to open the changelog (this document) to the toolbar.
- Bug Fixes:
  - Fix the colors of some classes not displaying.

## v0.3.0

_released 23 February 2025_

(I decided to bump to v0.3 b/c I did a lot of work on the assignments loading
and it felt like it deserved a minor release and not a patch release.)

- Bug Fixes/Improvements:
  - Fix performance of loading assignments. This required a complete overhaul
    of the assignment loading system, so if there are any bugs please tell me!
  - Past assignments show up again!
  - Prevent the window from jittering up and down rapidly.
  - Calculate the header size from a different source so it is always correct.
  - Adjust the header spacer on window resize so it always remains correct.
  - Increase the timeout for google autologin, so it hopefully won't get stuck
    in a loop. (From 0.5sec -> 1sec. It shouldn't be very noticeable.)
- Known problems:
  - The colors of some classes are missing. This is because for some reason
    they're not included in the API response. I have a plan to fix it, I just
    don't want to delay this release any further.

## v0.2.10

_released 03 February 2025_

- **IMPORTANT:**
  - Performance of Blackbaud has gotten really bad, and the solution isn't done
    yet. In the meantime, **_past assignments will not be displayed._**
- Improvements:
  - Make action buttons (eg `Mark as Completed`) stretch horizontally to fill.
  - Make buttons and input fields inside of the custom UI dark themed.
  - Show attached links in the attachments section in the assignment popup.

## v0.2.9

_released 09 January 2025_

- Bug Fixes:
  - Don't show the whats new beta.

## v0.2.8

_released 09 January 2025_

- Bug Fixes:
  - Fix class name sometimes being the number of points.
  - Wrap long assignment titles (instead of overflow).
  - Remove extra files (.git, etc) from being included in Chrome release zip.

## v0.2.7

_released 18 December 2024_

- Features:
  - Report Blackbaud API failures when they happen, and don't completely crash.

## v0.2.6

_released 10 December 2024_

- Bug Fixes:
  - Custom UI is now fixed after being completely broken by Blackbaud API
    changes.

## v0.2.5

_released 17 November 2024_

- Features:
  - Downloads/attachments are shown in the assignment popup.
  - The name of the class is shown at the bottom of the assignment popup.
- Bug Fixes:
  - Assignments now have a total sort order (ie when you create a new task, it
    won't switch positions in the list after a reload. this is _very_ minor but
    was bothering me.)

## v0.2.4

_released 11 November 2024_

- Bug Fixes:
  - Fixes google autologin sometimes getting stuck in a loop.
  - Fixes Saturday assignments not displaying correctly.
  - Fixes weekends not displaying when a task is assigned to them.

## v0.2.3

_released 07 November 2024_

- Features:
  - Supports Google Assignments as an LTI provider. This doesn't actually change
    any functionality, but means that it will say "Submit on Google Assignments"
    instead of just "Submit".
- Bug Fixes:
  - Fixes task support being so buggy to the point of being unusable. I rushed
    it out and didn't test it enough, sorry. Tell me if I missed anything!
  - Fixes google autologin not always working.
  - Prevents styling from breaking when the Dark Reader extension is used.

## v0.2.2

_released 21 October 2024_

- Features:
  - You can now create and edit custom tasks!
  - Adds a central toolbar for actions (settings, toggle custom ui, new task)
- Bug Fixes:
  - Fixes a bug where sometimes Blackbaud autologin wouldn't work.

## v0.2.0

_released 19 October 2024_

- Features:
  - 🎆 **Custom tasks are now supported!!!** 🎉 If you find any bugs with them,
    please report them to me asap.
- Bug Fixes:
  - Don't crash if there's an assignment marked as extra credit.

## v0.1.5

_released 15 October 2024_

- Features:
  - Indicators when online submission is required (blue border + submit button)
- Bug Fixes:
  - Actually respect the `assignmentCenter.enabled` setting.
- Styling Changes:
  - Dates have padding (fa2faa1)
  - Fix some glitches with corners and border radii.

Next release there will be custom task support!
