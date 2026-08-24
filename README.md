# Orbit Day Launcher

**One click. All your programs. Launched together — and closed together just as easily.**

Orbit Day Launcher is a lightweight Windows desktop app for anyone who opens (and later
closes) the same handful of programs every day: developers with their AI tool + editor +
terminal, remote workers with mail + Teams + browser, streamers with OBS + Discord + Spotify.
Instead of hunting for each program in the Start menu one by one, you pick a combination
once — and Orbit Day Launcher takes care of the rest.

![Orbit Day Launcher – main view](Dateien/Screenshots/Frontend_Start.png)

---

## Who is this for?

- You have a fixed routine ("same 5 programs every morning") and don't want to click them
  together by hand every time.
- You juggle multiple AI tools/assistants and often switch between different program
  combinations (work, learning, gaming, streaming).
- You want to **close everything at once** at the end of the day, instead of clicking
  every window shut individually.

## Features

- **Orbit selection** — programs appear as cards that orbit around a central start button;
  the more you select, the more orbits become visible.
- **One click starts everything** — with an optional delay between programs (so, e.g., the
  VPN connects before the browser opens).
- **Web URLs open as tabs** — select several web links and they open together as tabs in
  your default browser, in one window.
- **Close mode** — the same button instead closes all selected programs as a group,
  including Microsoft Store/UWP apps, which are normally tricky to close programmatically.
- **Bundles** — save fixed program combinations ("Work", "Gaming", "Stream") and switch
  between them with one click.
- **Time-based profiles** — automatically suggest a bundle at set times/weekdays (with a
  countdown you can cancel).
- **Automatic program detection** — finds installed Store/UWP apps, categorizes them
  (AI, Browser, Development, Communication, …) and filters out Windows system clutter.
  Runs in the setup wizard on every start (can be switched off) and any time you ask for
  it via **Rescan** — see
  [First run & finding your programs](#first-run--finding-your-programs).
- **Multi-language UI** — German, English, Spanish, Hindi, and French, switchable anytime.
- **Fully customizable** — Light/Dark/System theme, custom accent color, layout
  (pyramid/grid), window size, and your own keyboard shortcut to show/hide the window
  (default `Ctrl + Alt + O`).
- **Start with Windows** (optional, with weekday selection) and a system tray icon.

## First run & finding your programs

When you start Orbit Day Launcher, a setup wizard opens and scans your PC for installed
programs. Found apps are grouped by category — tick the ones you want and click
**Let's go**, or skip the step and add programs later.

By default this wizard runs on **every** start, so newly installed software always gets
picked up. If you'd rather go straight to the launcher, turn it off:

| What you want | Where |
|---|---|
| Skip the wizard from now on | **Settings → Programs → "Show setup wizard on every start"** → off |
| Search once, on demand | **Settings → Programs → ↻ Rescan** — opens the same picker with everything newly found |

With the toggle off, the wizard only ever appears on the very first start after
installation. You can switch it back on at any time.

Programs that aren't detected automatically can be added by hand under
**Settings → Programs → Add manually** — either a path to an `.exe`/shortcut, or a web
address, which then opens as a browser tab.

## Screenshots

### Start & close modes

<table>
<tr>
<td width="58%"><img src="Dateien/Screenshots/Frontend_Start.png" alt="Start mode"></td>
<td><b>Start mode</b><br>Pick the programs (or a saved bundle) and launch them all with a single click. The orbit reflects your current selection; each program keeps its own colour.</td>
</tr>
<tr>
<td width="58%"><img src="Dateien/Screenshots/Frontend_Close.png" alt="Close mode"></td>
<td><b>Close mode</b><br>The same button switches to closing the selected programs as a group — including Store/UWP apps that are otherwise awkward to shut down.</td>
</tr>
</table>

### Settings

All four settings tabs — Display, Programs, Bundles, and Profiles:

![Settings](Dateien/Screenshots/Settings_Combined.png)

## Tech stack

Built with [Tauri 2](https://tauri.app/) (Rust backend, ~2–3 MB instead of the
100+ MB typical of Electron apps) and plain HTML/CSS/JavaScript on the frontend —
no build step, no framework.

## Build from source

> A signed installer download is planned. Until then, build it locally.

**Requirements:** [Rust](https://www.rust-lang.org/tools/install) and
[Node.js](https://nodejs.org/).

```bash
git clone https://github.com/PhillipLeh/orbit-day-launcher.git
cd orbit-day-launcher
npm install

# Run in development
npm run tauri dev

# Build a standalone app + installer (output under src-tauri/target/release)
npm run tauri build
```

## Your settings

Everything you configure — programs, bundles, profiles, colours, theme, language,
shortcut — is stored in a single file on your own machine:

```
%APPDATA%\com.luxosofficial.orbit-day-launcher\settings.json
```

Nothing is uploaded anywhere; the app works fully offline. Copy that file to back your
setup up or move it to another PC. Deleting it resets the app to a clean state (the
setup wizard will greet you again on the next start).

> The file is written atomically (write to a temp file, verify, then replace), so a
> crash or power loss mid-save cannot leave you with a corrupted configuration.

## Troubleshooting

**"Windows protected your PC" when installing.**
The installer isn't code-signed yet, so Windows SmartScreen shows a warning for unknown
publishers. Click **More info → Run anyway**. Code signing is planned.

**A program won't close in close mode.**
Store/UWP apps are closed via their install path rather than their process name, because
the two often differ. If a specific app resists, please open an issue with its name.

**A program wasn't found by the scan.**
Classic `.exe` programs without a Start-menu entry aren't always detected. Add them by
hand under **Settings → Programs → Add manually**.

## Status

Functional, currently in pre-release. Feedback and issues are welcome.

## License

[MIT](LICENSE) © 2026 Phillip Lehmann
