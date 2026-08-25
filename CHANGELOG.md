# Changelog

## v0.1.0 — first public release

The first release of Orbit Day Launcher: pick the programs you need, start them with one
click, and close them together when the day is done.

### What's in it

- **Orbit selection** — your programs circle a central start button; the more you pick,
  the more orbits appear.
- **One click starts everything**, with an optional delay between programs so a VPN can
  connect before the browser opens.
- **Close mode** — the same button closes the selected programs as a group, including
  Microsoft Store/UWP apps that are otherwise awkward to shut down.
- **Bundles** — save fixed combinations ("Work", "Gaming", "Stream") and switch with one
  click.
- **Time-based profiles** — suggest a bundle at a set time on chosen weekdays, with a
  countdown you can cancel.
- **Web links open as tabs** — several links open together in one browser window.
- **Setup wizard** — finds your installed programs, sorts them by category and filters out
  Windows clutter. Runs on every start by default; switch it off under
  *Settings → Programs*.
- **Tray menu** — right-click the tray icon to start or close any bundle (or everything)
  without opening the window.
- **Delete protection** — the ✕ on a program card only reacts while you hold a key
  (Ctrl by default), so a fast click can't remove a program by accident.
- **Five languages** — German, English, Spanish, Hindi, French.
- **Made your own** — Light/Dark/System theme, custom accent colour, pyramid or grid
  layout, window size, and your own show/hide shortcut (default `Ctrl + Alt + O`).
- **Start with Windows** (optional, per weekday) and a system tray icon.

### Security

Settings are validated before they reach the system, and programs are launched through the
Windows shell rather than a command interpreter, so a path can never be interpreted as a
command. Program names are escaped before display. Nothing is uploaded anywhere — see the
Security section in the README.

### Known limitations

- **The installer isn't code-signed yet**, so Windows SmartScreen will warn about an
  unknown publisher on first run. Choose *More info → Run anyway*. Signing is planned.
- Classic `.exe` programs without a Start-menu entry aren't always found automatically —
  add them under *Settings → Programs → Add manually*.
- Windows only.

### Install

Download `orbit-day-launcher_0.1.0_x64-setup.exe` from the release assets and run it.
Alternatively build from source — see the README.
