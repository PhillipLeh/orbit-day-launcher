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
- **Multi-language UI** — German, English, Spanish, Hindi, and French, switchable anytime.
- **Fully customizable** — Light/Dark/System theme, custom accent color, layout
  (pyramid/grid), window size, your own keyboard shortcut to show/hide the window.
- **Start with Windows** (optional, with weekday selection) and a system tray icon.

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

## Status

Functional, currently in pre-release. Feedback and issues are welcome.

## License

[MIT](LICENSE) © 2026 Phillip Lehmann
