# Orion

_v0.8.1_

This project aims to fix as much of the Hunter website as possible. It does this
through a browser extension. To report problems or request a feature, please
email gavinmorrow (at) hunterschools (dot) org or gavinmorrow.dev@gmail.com.

## Features

- **Custom UI**: Make an actually good assignment center calendar view!!
- **Login automatically**: Automatically press the various "next" buttons when
  you want to log in.
- Automatically deselect "Completed", so you don't need to manually do it (only
  activated when the custom ui is not active).
- Other miscellaneous bug and styling fixes.

[Full Changelog]

## Installation

If your browser of choice is not supported yet, send me a feature request to
support it and I'll do my best. Please note that at the moment, this is only
available for desktop (not mobile).

Safari is also not supported at the moment, although I'm working on it. If you
use Safari (like me), send me an email and I'll prioritize it!

### Firefox

Click [here][firefox] to install. (You should use firefox!!)

### Chrome

Go to the [Chrome Web Store listing][chrome] and click "Add to Chrome".

## Updating

### Firefox

Firefox will usually automatically update for you.
To update manually, see the [Mozilla help page].

### Chrome

Chrome will usually automatically update for you.
To update manually, you will have to [enable developer mode][ChromeUpdateHelp].

## Permissions

- It will ask for permissions on `hunterschools.myschoolapp.com`,
  `app.blackbaud.com`, and `accounts.google.com`.
  - hunterschools: This is the Hunter website.
  - app.blackbaud: This is a domain used by Blackbaud to log you in. If you
    don't use the autologin feature, you can safely disable this.
  - accounts.google: This is a domain used by Google to log you in. If you
    don't use the autologin feature, you can safely disable this.

---

The source code for [this project][github] is available on github!

[Full changelog]: https://gavinmorrow.github.io/orion/CHANGELOG
[latest]: https://github.com/gavinmorrow/orion/releases/latest
[firefox]: https://github.com/gavinmorrow/orion/releases/download/v0.8.1/65a14653bc7c4e6ab617.xpi
[chrome]: https://chromewebstore.google.com/detail/gdcpndjlfcnjjchcomdgkpkjncoacdlf
[Mozilla help page]: https://support.mozilla.org/en-US/kb/how-update-add-ons
[github]: https://github.com/gavinmorrow/orion/
[ChromeUpdateHelp]: https://support.cloudhq.net/how-to-manually-update-chrome-extensions/
