# Orbit Day Launcher – Session-Handover

> Einstiegspunkt für eine neue Claude-Code-Sitzung an diesem Projekt.
> Stand: 2026-06-22

---

## So startest du eine neue Session

1. Terminal: `cd "C:\Users\phleh\orbit-day-launcher"` → `claude`
2. Erster Satz an Claude: **„Lies HANDOVER.md, dann machen wir weiter mit \<konkrete Aufgabe\>."**
3. Session-Start: `git pull` (neuesten Stand holen).

---

## Was das ist

Windows-Desktop-App, die mehrere KI-Tools/Programme gleichzeitig über eine
animierte **Orbit-UI** startet und gebündelt wieder schließt.

- **Stack:** Tauri 2 (Rust-Backend) + Vanilla JS/HTML/CSS im Frontend — **kein Framework, kein Build-Step**
- **Ziel:** Nebeneinkommen. Erst Gratis-Release (Nachfrage validieren), dann Free + Pro (Einmalkauf), Abo erst mit Cloud-Sync
- **Status:** Funktionsfähig, pre-release

### Implementierte Features
Orbit-UI mit konfigurierbaren Programm-Slots · System-Tray · Autostart ·
Bundle-System mit Startverzögerung · Multi-Orbit & Profile mit zeitbasiertem
Auto-Switch · Schließen-Modus (alle Programme bündeln schließen) ·
Light/Dark/System-Theme + Akzentfarbe · frei belegbarer Hotkey (Strg+Alt+Taste) ·
Onboarding-Flow (`src/onboarding.html`)

---

## Repo-Lage (wichtig, nicht verwechseln)

| Repo | Ort | Inhalt |
|------|-----|--------|
| **orbit-day-launcher** (dieses) | `C:\Users\phleh\orbit-day-launcher` = GitHub `PhillipLeh/orbit-day-launcher` (privat) | Der echte **App-Code** |
| ai-os (Vault) | `…\OneDrive\Dokumente\Workspace` = GitHub `PhillipLeh/ai-os` | Planung + ausführliche **Doku** |

→ **Coden hier. Planen/Doku im Vault.**

### Vertiefende Doku (im Vault, vor größeren Änderungen lesen)
Pfad: `…\Workspace\02 Projekte\Orbit-Day_Launcher\`
- `PROJECT_STATE.md` — detaillierter Projektstand (autoritativ)
- `architecture.md` — Architektur
- `decisions.md` — getroffene Entscheidungen
- `coding-standards.md` — Code-Konventionen
- `ENGINEERING_AUDIT.md` — Audit-Findings
- `MONETIZATION_ROADMAP.md` — Monetarisierungsstrategie

---

## In dieser Session erledigt (2026-06-22)

- **Erster Commit der Projekthistorie überhaupt** (`546ff82`) — der gesamte App-Code war vorher nur lokal gespeichert, nie versioniert
- Privates GitHub-Repo erstellt und gepusht, `main` ↔ `origin/main` synchron
- `target/` und `node_modules/` korrekt aus dem Repo ausgeschlossen (nur Quellcode versioniert)

---

## Offene Punkte / nächste Schritte

> Quelle: Projekt-Doku. Vor Beginn in `PROJECT_STATE.md` auf Aktualität prüfen.

- [ ] **Store-App-Schließen testen und fixen** (HOCH) — Schließen-Modus bei aus dem Microsoft Store installierten Apps
- [ ] **Light-Mode: Restfehler beheben** (HOCH)
- [ ] **Release-Build vorbereiten** — signierter/installierbarer Build
- [ ] **Landing Page / Beschreibungstext** für den Gratis-Release

---

## Arbeitsweise (vereinbart)

Pro abgegrenzter Aufgabe ein eigener Branch → PR gegen `main` → mergen.
So bleibt `main` jederzeit lauffähig.

```bash
git checkout -b fix/store-app-schliessen   # Branch für die Aufgabe
# ... arbeiten, committen ...
git push -u origin fix/store-app-schliessen
gh pr create                                # PR aufmachen → reviewen → mergen
```

*Letzte Aktualisierung: 2026-06-22 — Handover initial, Repo versioniert*
