# Orbit Day Launcher – Session-Handover

> Einstiegspunkt für eine neue Claude-Code-Sitzung an diesem Projekt.
> Stand: 2026-06-23 · Stack: Tauri 2 (Rust-Backend) + Vanilla JS/HTML/CSS (kein Framework, kein Build-Step)

---

## So startest du eine neue Session

1. Terminal: `cd "C:\Users\phleh\orbit-day-launcher"` → `claude`
2. Erster Satz: **„Lies HANDOVER.md, dann machen wir weiter mit \<konkrete Aufgabe\>."**
3. `git checkout main && git pull` (neuesten Stand holen).

---

## Was das ist

Windows-Desktop-App, die mehrere KI-Tools/Programme gleichzeitig über eine animierte
**Orbit-UI** startet und gebündelt wieder schließt.

- **Ziel:** Nebeneinkommen. Erst Gratis-Release (Nachfrage validieren), dann Free + Pro
  (Einmalkauf), Abo erst mit Cloud-Sync.
- **Status:** Funktionsfähig, pre-release.

### Implementierte Features
Orbit-UI mit konfigurierbaren Programm-Slots · System-Tray · Autostart (Toggle + Wochentage) ·
Bundle-System mit Startverzögerung · Multi-Orbit & Profile mit zeitbasiertem Auto-Switch ·
Schließen-Modus (alle Programme gebündelt schließen) · Light/Dark/System-Theme + Akzentfarbe
(inkl. 2 frei speicherbare Custom-Slots) · frei belegbarer Hotkey (Strg+Alt+Taste) ·
Drag & Drop der Programmkarten · Internet-Statussymbol · Onboarding-Flow (`src/onboarding.html`).

---

## Repo-Lage (wichtig, nicht verwechseln)

| Repo | Ort | Inhalt |
|------|-----|--------|
| **orbit-day-launcher** (dieses) | `C:\Users\phleh\orbit-day-launcher` = GitHub `PhillipLeh/orbit-day-launcher` (privat) | Der echte **App-Code** |
| ai-os (Vault) | `…\OneDrive\Dokumente\Workspace` = GitHub `PhillipLeh/ai-os` | Planung + ausführliche **Doku** |

→ **Coden hier. Planen/Doku im Vault** (`…\Workspace\02 Projekte\Orbit-Day_Launcher\`:
`PROJECT_STATE.md`, `architecture.md`, `decisions.md`, `coding-standards.md`,
`ENGINEERING_AUDIT.md`, `MONETIZATION_ROADMAP.md`).

---

## Code-Struktur (was wo liegt)

- `src/main.js` — gesamte Frontend-Logik & State (Orbit, Bundles, Profile, Settings, Theme).
- `src/styles.css` — gesamtes Styling inkl. Theme-Variablen.
- `src/index.html` / `src/onboarding.html` — Markup.
- `src-tauri/src/main.rs` — **die echte Rust-Binary** (alle Commands + Tray + Shortcut).
  ⚠️ `src-tauri/src/lib.rs` ist ungenutztes Tauri-Boilerplate (`greet`) — nicht editieren.

### Wichtige Architektur-Fakten
- **Persistenz-Schema lebt NUR im Frontend** (`main.js`, `saveAll`/`loadSettings`). Rust
  kennt es nicht — `save_settings` schreibt nur den JSON-String (mit Read-Back-Verify) nach
  `app_data_dir()/settings.json`.
- **Neues persistentes Feld → IMMER an beiden Stellen ergänzen:** `saveAll`-Objekt UND
  `loadSettings`-Restore (mit Default). Sonst stiller Datenverlust nach Neustart.
- **Orbit-Position = Reihenfolge in `ALL_PROGRAMS`** (3/5/7-Verteilung). Farbe ist ID-gebunden
  (`getColor(id)` / `appColors`), nicht positionsgebunden. Persistente Reihenfolge via `programOrder`.
- **DOM-Selektor-Kollision vermeiden:** wiederkehrende Klassen (`.day-btn`) brauchen
  Container-Selektor (`#autostartDays .day-btn` vs `#profileDays .day-btn`).
- **`launch_app`-Sicherheit:** Pfade/URLs als Array-Argumente übergeben, nie in Shell-String
  konkatenieren (Injection-Schutz strukturell). `settings.json` ist die Trust-Boundary
  (lokal, Single-User).
- **14 Rust-Commands** registriert: launch_app, close_app, close_window, quit_app,
  open_main_window, save_settings, load_settings, check_internet, set_always_on_top,
  set_fullscreen, set_window_size, set_autostart, detect_installed_apps, set_shortcut.

### Theme-System (Light/Dark) — Stand 2026-06-23
- Theme-Variablen oben in `styles.css` (`:root` = Dark, `[data-theme="light"]` = Light).
- **Regel Light-Mode: aller Text grau** (`--ui-text-rgb`, im Dark = Akzent, im Light = dunkles
  Grau-Blau). Farbe bleibt nur auf **Orbit** (SVG `fill`/`stroke`) und **Flächen/Rändern**
  ausgewählter/aktiver Felder. Programm-Kartenfarbe via `--ki-color`/`--ki-rgb`; Bundle-Tag-Farbe
  via `--bc`/`--bc-rgb` (in JS gesetzt, damit CSS pro Theme entscheidet). Raster im Light-Mode
  bewusst etwas deutlicher (`[data-theme="light"] body::before`).
- **Akzent-Override:** `applyAccent()` setzt `--accent-rgb` inline → überschreibt die
  Theme-Defaults. Im Light-Mode färbt der Akzent nur Ränder/Flächen, nicht den Text.

---

## In dieser Session erledigt (2026-06-23) — alles auf `main` gemerged

Pro Aufgabe ein Branch → PR → squash-merge:

- **PR #1** `chore`: tote `hideCard`-Funktion entfernt.
- **PR #2** `fix(light-mode)`: Light-Mode komplett überarbeitet — gedämpfte Palette,
  **aller Text grau** (dunkles Grau-Blau, gut lesbar), Farbe nur auf Orbit + Feldern,
  Raster grau & sichtbarer, Timer-/Swatch-/Platzhalter-Farbbugs behoben.
- **PR #3** `fix(close)`: Store-/UWP-Apps schließen jetzt über den **Installpfad**
  (`\WindowsApps\<Name>_`, via `Get-CimInstance`) statt über den Prozessnamen — behebt
  „Prozessname ≠ Paketname" (Spotify, WhatsApp, …).
- **PR #4** `feat(detect)`: `detect_installed_apps` findet **alle** installierten Store-/UWP-Apps
  dynamisch via `Get-StartApps` (statt fester AUMID-Liste, die veraltet war). „Suchen" öffnet
  einen **Auswahl-Dialog** (`openAppPicker`) mit Häkchen statt alles automatisch hinzuzufügen.
- **PR #5** `feat(detect)`: Kategorisierung der gefundenen Apps (KI, Entwicklung, Browser,
  Kommunikation, Unterhaltung, Produktivität, Tools, Sonstige) + **Blockliste** für
  Windows-Ballast (Erste Schritte, Hilfe anfordern, Klick-und-Los, Einstellungen, Game Bar,
  Remotehilfe, Windows-Sicherheit). Picker gruppiert nach Kategorie.
  → Gemerged. **Real per E2E getestet am 2026-06-25** (`npm run tauri dev` + Computer-Use):
  „Neu suchen" → 38 gefundene Apps korrekt nach Kategorie gruppiert, keine Windows-Ballast-Einträge
  sichtbar, Checkbox-Auswahl + „Hinzufügen" legt neue Karte im Orbit an, Entfernen über die
  Programme-Liste funktioniert ebenfalls.

---

## Offene Punkte / Backlog

### Real zu testen (E2E im laufenden Programm)
- Store-App schließen (PR #3): App starten → Schließen-Modus → geht wirklich zu?
- App finden + Picker (PR #4/#5): „Neu suchen" → Dialog → anhaken → Hinzufügen ✅ getestet
  (2026-06-25). Offen: ob eine hinzugefügte Store-App über die Karte auch wirklich
  startet/schließt (echter Programmstart wurde im Test nicht ausgelöst).

### Bekannte kleinere Punkte
- **`detect_installed_apps`** deckt **Store-/UWP-Apps** dynamisch ab; rein klassische `.exe`
  ohne Store-Eintrag laufen weiter über den festen Pfad-Scan. Optionaler Ausbau: auch klassische
  Get-StartApps-Einträge (mit exe-Ableitung für Start/Schließen) aufnehmen.
- **App-Kategorien sind heuristisch** (Schlüsselwörter); Unbekanntes landet in „Sonstige".
- **`lib.rs`** ist totes Boilerplate — bei Gelegenheit entfernen.

### Strukturelle Verbesserungen (mittelfristig)
- **State-Robustheit:** viele globale State-Variablen, Speichern hängt an manuellem
  `markDirty()`/`saveAll`. Vergessenes `markDirty()` = stiller Datenverlust. Zentrales
  `state`-Objekt mit Auto-Save wäre robuster.
- **XSS-Altlast:** mehrere `innerHTML` mit teils interpolierten Programmnamen. Neue Handler
  (Drag, Picker) nutzen korrekt `addEventListener`/`textContent`; bestehende Inline-`onclick`
  mit interpolierter `id` bleiben Altlast. Relevant bei künftigem Sync/Sharing.

### Produkt (aus Roadmap)
- **Code-Signing** — behebt den Antivirus-/SmartScreen-Scan beim ersten Start.
- **Release-Build** (signiert/installierbar) · **Landing Page / Beschreibungstext**.

---

## Arbeitsweise (vereinbart)

Pro abgegrenzter Aufgabe ein eigener Branch → PR gegen `main` → squash-mergen. So bleibt `main`
jederzeit lauffähig.

```bash
git checkout -b fix/<thema>
# ... arbeiten, committen ...
git push -u origin fix/<thema>
gh pr create        # PR aufmachen → reviewen → mergen
```

**Tooling-Hinweise:**
- `gh` ist installiert, aber **nicht im PATH der Tool-Shell**. Voll aufrufen:
  `& "C:\Program Files\GitHub CLI\gh.exe" ...`. Mehrzeilige PR-Bodies via `--body-file`
  (sonst Quoting-Probleme).
- **Mergen nur mit ausdrücklicher Freigabe des Nutzers** (Auto-Merge wird sonst geblockt).
- Verifizieren vor Commit: `node --check src/main.js` (JS) und `cargo check` in `src-tauri/`
  (Rust). PowerShell-Logik (Store-Suche/-Schließen) lässt sich gefahrlos per Trockenlauf prüfen
  (Stop-Process durch Get-… ersetzen).
- App-Start-Kommando: `npm run tauri dev` (kompiliert Rust + lädt Frontend).

---

*Letzte Aktualisierung: 2026-06-25 — PR #5 (App-Kategorisierung + Blockliste) real per E2E getestet, Stand nach PRs #1–#5 (alle gemerged).*
