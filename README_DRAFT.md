# Orbit Day Launcher

**One click. All your programs. Launched together — and closed together just as easily.**

Orbit Day Launcher is a lightweight Windows desktop app for anyone who opens (and later
closes) the same handful of programs every day: developers with their AI tool + editor +
terminal, remote workers with mail + Teams + browser, streamers with OBS + Discord + Spotify.
Instead of hunting for each program in the Start menu one by one, you pick a combination
once — and Orbit Day Launcher takes care of the rest.

![Orbit Day Launcher – main view](docs/screenshots/01-main-dark.png)

---

## Who is this for?

- You have a fixed routine ("same 5 programs every morning") and don't want to click them
  together by hand every time.
- You juggle multiple AI tools/assistants and often switch between different program
  combinations (work, learning, gaming, streaming).
- You want to **close everything at once** at the end of the day, instead of clicking
  every window shut individually.

## What it does

- **Orbit selection:** Programs appear as cards that orbit animatedly around a central
  start button — the more you select, the more orbits become visible.
- **One click starts everything** – with an optional delay between programs (so, e.g.,
  the VPN connects before the browser opens).
- **Close mode:** the same button instead closes all selected programs as a group –
  including Microsoft Store/UWP apps, which are normally tricky to close programmatically.
- **Bundles:** create multiple fixed program combinations ("Work", "Gaming", "Stream")
  and switch between them with one click.
- **Time-based profiles:** automatically suggest a bundle at set times/weekdays (with a
  countdown you can cancel if you don't want it).
- **Automatic program detection:** finds installed Store/UWP apps automatically,
  categorizes them (AI, Browser, Development, Communication, …) and filters out
  Windows system clutter (Settings, Get Help, Game Bar, …) on its own.
- **Fully customizable:** Light/Dark/System theme, custom accent color, layout
  (pyramid/grid), window size, your own keyboard shortcut to show/hide the window.
- **Multi-language UI:** German, English, Spanish, Hindi, and French — switchable
  anytime in Settings.
- **Start with Windows** (optional, with weekday selection) and a system tray icon.

## What it looks like

| Start view | Close mode |
|---|---|
| ![Start](docs/screenshots/01-main-dark.png) | ![Close](docs/screenshots/02-close-mode.png) |

| Settings | Light theme |
|---|---|
| ![Settings](docs/screenshots/03-settings.png) | ![Light](docs/screenshots/04-light-theme.png) |

## Why does this exist?

A small side project born out of not wanting to open the same 6 programs one by one every
morning and close them one by one every evening. Deliberately kept lean: no cloud, no
accounts, no telemetry – all settings live locally on your own machine.

## Tech stack

Built with [Tauri 2](https://tauri.app/) (Rust backend, ~2–3 MB instead of the
100+ MB typical of Electron apps) and plain HTML/CSS/JavaScript on the frontend –
no build step, no framework.

## Installation

> _Note: a release download is coming. Until then, build it locally:_

```bash
git clone https://github.com/PhillipLeh/orbit-day-launcher.git
cd orbit-day-launcher
npm install
npm run tauri build
```

Requirements: [Rust](https://www.rust-lang.org/tools/install) and
[Node.js](https://nodejs.org/) must be installed.

## Status

Functional, currently in pre-release. Feedback and issues are welcome.

## License

_TBD_
