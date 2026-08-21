#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::process::Command;
use std::fs;
use tauri::{Manager, menu::{MenuBuilder, MenuItemBuilder}, tray::TrayIconBuilder};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
use tauri_plugin_opener::OpenerExt;

#[derive(serde::Serialize, Clone)]
struct DetectedApp {
    id: String, name: String, category: String, app_type: String, path: String,
}

fn dirs_home() -> Option<std::path::PathBuf> {
    std::env::var("USERPROFILE").ok().map(std::path::PathBuf::from)
}

// Windows-Ballast, der über Get-StartApps auftaucht, aber keine echte App ist.
// Match über den Paket-Namensteil (vor dem '_') → sprach- und versionsunabhängig.
const BLOCKED_PACKAGES: &[&str] = &[
    "MicrosoftWindows.Client.CBS",        // "Erste Schritte", "Windows-Sicherung"
    "MicrosoftWindows.Client.CoreAI",     // "Klick-und-Los"
    "Microsoft.GetHelp",                  // "Hilfe anfordern"
    "MicrosoftCorporationII.QuickAssist", // "Remotehilfe"
    "windows.immersivecontrolpanel",      // "Einstellungen"
    "Microsoft.XboxGamingOverlay",        // "Game Bar"
    "Microsoft.SecHealthUI",              // "Windows-Sicherheit"
];

// Grobe Kategorisierung anhand von Schlüsselwörtern in Anzeigename + Paketname.
// Erste passende Regel gewinnt; ohne Treffer "Sonstige".
fn categorize_app(name: &str, family: &str) -> &'static str {
    let s = format!("{} {}", name, family).to_lowercase();
    let any = |kws: &[&str]| kws.iter().any(|k| s.contains(k));
    if any(&["claude", "codex", "openai", "copilot", "chatgpt", "gemini", "perplexity"]) { return "KI"; }
    if any(&["edge", "chrome", "firefox", "brave", "opera", "browser"]) { return "Browser"; }
    if any(&["vscode", "vs code", "terminal", "powershell", "devhome", "python", "git ", "docker", "wsl", "android studio"]) { return "Entwicklung"; }
    if any(&["teams", "whatsapp", "telegram", "discord", "slack", "outlook", "mail", "communicationsapps", "zoom", "skype", "signal", "yourphone", "phone"]) { return "Kommunikation"; }
    if any(&["spotify", "netflix", "zunemusic", "zunevideo", "filme", "video", "music", "minecraft", "xbox", "gaming", "steam", "clipchamp", "media", "wiedergabe", "photos", "foto"]) { return "Unterhaltung"; }
    if any(&["todo", "stickynotes", "note", "kalender", "calendar", "onenote", "office", "word", "excel", "powerpoint", "powerautomate", "alarms", "uhr", "clock"]) { return "Produktivität"; }
    if any(&["calculator", "paint", "screensketch", "snipping", "camera", "soundrecorder", "weather", "news", "store", "nvidia", "realtek", "dts", "armoury", "aura", "translucent", "control"]) { return "Tools"; }
    "Sonstige"
}

#[tauri::command]
fn detect_installed_apps() -> Vec<DetectedApp> {
    let mut apps: Vec<DetectedApp> = Vec::new();
    // Alle installierten Store-/UWP-Apps dynamisch über den Windows-"Apps-Ordner"
    // (Get-StartApps = shell:AppsFolder) ermitteln — statt einer festen, schnell
    // veraltenden Liste. Ausgabe je Zeile als "Name<TAB>AppID" (UTF-8 erzwingen,
    // sonst werden Umlaute zerstört).
    let output = Command::new("powershell")
        .args(["-NoProfile", "-WindowStyle", "Hidden", "-Command",
            "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-StartApps | ForEach-Object { \"$($_.Name)`t$($_.AppID)\" }"])
        .output();
    if let Ok(out) = output {
        let text = String::from_utf8_lossy(&out.stdout);
        for line in text.lines() {
            let line = line.trim_end_matches('\r');
            let mut it = line.splitn(2, '\t');
            let name = it.next().unwrap_or("").trim();
            let app_id = it.next().unwrap_or("").trim();
            if name.is_empty() || app_id.is_empty() { continue; }
            // Echte AUMID = "<PaketFamilie>!<AppId>"; die Paketfamilie enthält
            // immer einen '_' (Publisher-Hash). So fallen Falschtreffer raus,
            // deren '!' nur Teil des Anzeigenamens ist (z.B. "avast! Antivirus").
            let family = app_id.split('!').next().unwrap_or("");
            if !app_id.contains('!') || !family.contains('_') { continue; }
            // Klar erkennbarer Windows-Ballast (Stubs/Overlays/Einstellungen), der
            // keine echte App ist — über den sprachunabhängigen Paket-Namensteil
            // (vor dem '_') ausschließen.
            let name_part = family.split('_').next().unwrap_or("");
            if BLOCKED_PACKAGES.contains(&name_part) { continue; }
            apps.push(DetectedApp {
                id: app_id.to_string(),
                name: name.to_string(),
                category: categorize_app(name, family).to_string(),
                app_type: "store".to_string(),
                path: format!("shell:AppsFolder\\{}", app_id),
            });
        }
    }
    let exe_apps = vec![
        ("firefox.exe",  "Firefox",  "Browser",       r"Mozilla Firefox\firefox.exe"),
        ("chrome.exe",   "Chrome",   "Browser",       r"Google\Chrome\Application\chrome.exe"),
        ("msedge.exe",   "Edge",     "Browser",       r"Microsoft\Edge\Application\msedge.exe"),
        ("Code.exe",     "VS Code",  "Entwicklung",   r"Microsoft VS Code\Code.exe"),
        ("EXCEL.EXE",    "Excel",    "Office",        r"Microsoft Office\root\Office16\EXCEL.EXE"),
        ("WINWORD.EXE",  "Word",     "Office",        r"Microsoft Office\root\Office16\WINWORD.EXE"),
        ("Spotify.exe",  "Spotify",  "Unterhaltung",  r"Spotify\Spotify.exe"),
        ("Discord.exe",  "Discord",  "Kommunikation", r"Discord\Discord.exe"),
        ("slack.exe",    "Slack",    "Kommunikation", r"Slack\slack.exe"),
        ("steam.exe",    "Steam",    "Gaming",        r"Steam\steam.exe"),
    ];
    let dirs = vec![
        std::path::PathBuf::from(r"C:\Program Files"),
        std::path::PathBuf::from(r"C:\Program Files (x86)"),
        dirs_home().map(|h| h.join("AppData\\Local\\Programs")).unwrap_or_default(),
        dirs_home().map(|h| h.join("AppData\\Roaming")).unwrap_or_default(),
    ];
    for (exe, name, category, rel) in &exe_apps {
        if apps.iter().any(|a| a.name == *name) { continue; }
        for dir in &dirs {
            let full = dir.join(rel);
            if full.exists() {
                apps.push(DetectedApp { id: exe.to_string(), name: name.to_string(), category: category.to_string(), app_type: "exe".to_string(), path: full.to_string_lossy().to_string() });
                break;
            }
        }
    }
    apps
}

// Ermittelt die .exe des als Standard gesetzten Browsers (für https) aus der Registry.
// So können wir ALLE Web-URLs in einem einzigen Browser-Aufruf öffnen (statt vier
// Einzelstarts, die einen noch bootenden Browser überfordern → leerer Tab).
fn default_browser_exe() -> Option<String> {
    // 1) ProgId der https-Verknüpfung (z.B. "FirefoxURL-308046B0..." / "ChromeHTML" / "MSEdgeHTM")
    let hkcu = winreg::RegKey::predef(winreg::enums::HKEY_CURRENT_USER);
    let progid: String = hkcu
        .open_subkey(r"Software\Microsoft\Windows\Shell\Associations\UrlAssociations\https\UserChoice")
        .ok()?
        .get_value("ProgId")
        .ok()?;
    // 2) Zugehöriges Öffnen-Kommando: `"C:\...\browser.exe" -osint -url "%1"`
    let hkcr = winreg::RegKey::predef(winreg::enums::HKEY_CLASSES_ROOT);
    let cmd: String = hkcr
        .open_subkey(format!(r"{}\shell\open\command", progid))
        .ok()?
        .get_value("")
        .ok()?;
    // 3) Reinen .exe-Pfad herauslösen (erstes Token in Anführungszeichen, sonst erstes Wort)
    let exe = if cmd.starts_with('"') {
        cmd[1..].split('"').next()?.to_string()
    } else {
        cmd.split_whitespace().next()?.to_string()
    };
    if exe.is_empty() { None } else { Some(exe) }
}

#[tauri::command]
fn launch_urls(app: tauri::AppHandle, urls: Vec<String>) -> Result<(), String> {
    if urls.is_empty() { return Ok(()); }
    // Protokoll-URIs (steam://, discord://, …) gehören NICHT in den Browser → einzeln
    // über den Standard-Handler. Nur echte http(s)-URLs werden gebündelt.
    let (web, other): (Vec<String>, Vec<String>) = urls.into_iter().partition(|u| {
        let l = u.to_lowercase();
        l.starts_with("http://") || l.starts_with("https://")
    });
    for u in &other {
        let _ = app.opener().open_url(u.as_str(), None::<&str>);
    }
    if !web.is_empty() {
        // Alle Web-URLs in EINEM Aufruf an den Standardbrowser → er öffnet sie als Tabs
        // in einem Fenster, egal ob kalt oder warm. Kein Race, keine verschluckten URLs.
        if let Some(exe) = default_browser_exe() {
            if Command::new(&exe).args(&web).spawn().is_ok() {
                return Ok(());
            }
        }
        // Fallback (Browser nicht ermittelbar): einzeln über den Standard-Handler
        for u in &web {
            let _ = app.opener().open_url(u.as_str(), None::<&str>);
        }
    }
    Ok(())
}

#[tauri::command]
fn launch_app(app: tauri::AppHandle, app_id: String, app_type: String, path: String) -> Result<(), String> {
    if app_type == "url" {
        // Web-URL oder Protokoll-URI (steam://, discord://) über den Windows-Standard-Handler.
        // NICHT über `cmd /C start`: cmd behandelt `&` (und `|`, `^`, …) als Metazeichen und
        // zerschneidet URLs mit Query-Parametern (z.B. YouTube ...?v=x&list=y) → kaputter/leerer
        // Tab + verschluckte URL. Der Opener ruft ShellExecute direkt auf und übergibt die URL
        // unverändert an den Standardbrowser → sauberer Tab, alle Parameter intakt.
        app.opener().open_url(path.as_str(), None::<&str>).map_err(|e| e.to_string())?;
    } else if app_type == "store" && app_id.contains('!') {
        // Echte Store-App mit AUMID
        Command::new("explorer.exe").arg(format!("shell:AppsFolder\\{}", app_id)).spawn().map_err(|e| e.to_string())?;
    } else {
        // .exe, .lnk, .url-Datei: alle über die Shell starten.
        // cmd /C start "" "<pfad>" verhält sich wie ein Doppelklick im Explorer:
        // löst Verknüpfungen samt Argumenten auf, respektiert UAC (MSI Afterburner),
        // setzt korrekten App-Kontext (Electron/Discord). Pfad als separates Argument
        // → korrektes Quoting bei Leerzeichen.
        Command::new("cmd").args(["/C", "start", "", &path]).spawn().map_err(|e| format!("Start fehlgeschlagen: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn check_internet() -> bool {
    // Leichter Verbindungstest: TCP-Connect mit kurzem Timeout.
    // Zuverlässiger als Ping (kein ICMP-Blocking), prüft echte Erreichbarkeit.
    use std::net::{TcpStream, ToSocketAddrs};
    use std::time::Duration;
    for target in &["1.1.1.1:53", "8.8.8.8:53"] {
        if let Ok(mut addrs) = target.to_socket_addrs() {
            if let Some(addr) = addrs.next() {
                if TcpStream::connect_timeout(&addr, Duration::from_millis(1200)).is_ok() {
                    return true;
                }
            }
        }
    }
    false
}

#[tauri::command]
fn close_app(app_id: String, app_type: String, path: String) -> Result<(), String> {
    if app_type == "url" { return Ok(()); } // URL/Protokoll-Einträge haben keinen eigenen Prozess
    if app_type == "store" || app_id.contains('!') {
        // Store-/UWP-App: Der Prozessname weicht oft vom Paketnamen ab
        // (z.B. Paket "5319275A.WhatsAppDesktop" -> Prozess "WhatsApp"), daher
        // NICHT über den Namen matchen. UWP-Apps liegen immer unter
        // C:\Program Files\WindowsApps\<Name>_<Version>_<Arch>__<Publisher> —
        // der Installpfad enthält also den Paket-Namensteil. Wir beenden alle
        // Prozesse, deren Executable unter \WindowsApps\<Name> liegt.
        //
        // app_id ist die AUMID "<PackageFamilyName>!<AppId>". PackageFamilyName
        // = "<Name>_<PublisherHash>"; der WindowsApps-Ordner beginnt mit <Name>.
        let package = app_id.split('!').next().unwrap_or(&app_id);
        let name_part = package.split('_').next().unwrap_or(package);
        // Single Quotes im Paketnamen entschärfen (PowerShell-String-Sicherheit).
        let safe = name_part.replace('\'', "''");
        // Get-CimInstance liefert ExecutablePath zuverlässiger als Get-Process.Path
        // (auch für Prozesse, deren .Path im WebView-Kontext null wäre).
        // Anker am Versions-Trenner: der WindowsApps-Ordner heißt <Name>_<Version>…,
        // also matcht "<Name>_" exakt dieses Paket und nicht Geschwister wie
        // "<Name>Preview". (${{p}} statt $p_, sonst läse PowerShell die Variable "p_".)
        let ps = format!(
            "$p='{}'; Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | \
             Where-Object {{ $_.ExecutablePath -like \"*\\WindowsApps\\${{p}}_*\" }} | \
             ForEach-Object {{ Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }}",
            safe
        );
        Command::new("powershell")
            .args(["-NoProfile", "-WindowStyle", "Hidden", "-Command", &ps])
            .spawn().map_err(|e| e.to_string())?;
    } else {
        // .exe: Prozessnamen aus Pfad ableiten und per taskkill beenden
        let exe_name = std::path::Path::new(&path)
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| app_id.clone());
        Command::new("taskkill")
            .args(["/IM", &exe_name, "/F"])
            .spawn().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn close_window(window: tauri::WebviewWindow) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
fn quit_app(app: tauri::AppHandle) { app.exit(0); }

#[tauri::command]
fn open_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("onboarding") { let _ = w.hide(); }
    if let Some(w) = app.get_webview_window("main") { let _ = w.show(); let _ = w.set_focus(); }
    Ok(())
}

#[tauri::command]
fn save_settings(app: tauri::AppHandle, settings: String) -> Result<(), String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?.join("settings.json");
    fs::create_dir_all(path.parent().unwrap()).map_err(|e| e.to_string())?;
    // Atomar schreiben: erst in eine temporäre Datei im selben Verzeichnis, verifizieren,
    // dann per Rename ersetzen (Windows: MoveFileEx mit Replace-Semantik). So bleibt
    // settings.json bei einem Absturz/Stromausfall mitten im Schreiben unversehrt —
    // statt halb geschrieben/leer und damit unlesbar.
    let tmp = path.with_extension("tmp");
    fs::write(&tmp, &settings).map_err(|e| e.to_string())?;
    // Read-Back-Verify auf der temporären Datei, bevor sie das Original ersetzt.
    let written = fs::read_to_string(&tmp).map_err(|e| e.to_string())?;
    if written != settings {
        let _ = fs::remove_file(&tmp);
        return Err("Verify failed".to_string());
    }
    fs::rename(&tmp, &path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_settings(app: tauri::AppHandle) -> Result<String, String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?.join("settings.json");
    if path.exists() { fs::read_to_string(path).map_err(|e| e.to_string()) } else { Ok("{}".to_string()) }
}

#[tauri::command]
fn set_always_on_top(window: tauri::WebviewWindow, value: bool) -> Result<(), String> {
    window.set_always_on_top(value).map_err(|e| e.to_string())
}
#[tauri::command]
fn set_fullscreen(window: tauri::WebviewWindow, value: bool) -> Result<(), String> {
    window.set_fullscreen(value).map_err(|e| e.to_string())
}
#[tauri::command]
fn set_window_size(window: tauri::WebviewWindow, width: u32, height: u32) -> Result<(), String> {
    window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: width as f64, height: height as f64 })).map_err(|e| e.to_string())?;
    window.center().map_err(|e| e.to_string())
}
#[tauri::command]
fn set_autostart(enable: bool, days: Vec<String>) -> Result<(), String> {
    let hkcu = winreg::RegKey::predef(winreg::enums::HKEY_CURRENT_USER);
    let key = hkcu.open_subkey_with_flags("Software\\Microsoft\\Windows\\CurrentVersion\\Run", winreg::enums::KEY_SET_VALUE | winreg::enums::KEY_QUERY_VALUE).map_err(|e| e.to_string())?;
    if enable {
        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        key.set_value("OrbitDayLauncher", &format!("\"{}\" --autostart --days={}", exe.display(), days.join(","))).map_err(|e| e.to_string())?;
    } else {
        let _ = key.delete_value("OrbitDayLauncher");
    }
    Ok(())
}

#[tauri::command]
fn set_shortcut(app: tauri::AppHandle, ctrl: bool, shift: bool, alt: bool, key: String) -> Result<(), String> {
    app.global_shortcut().unregister_all().map_err(|e| e.to_string())?;
    let mut mods = Modifiers::empty();
    if ctrl  { mods |= Modifiers::CONTROL; }
    if shift { mods |= Modifiers::SHIFT; }
    if alt   { mods |= Modifiers::ALT; }
    let code = match key.to_lowercase().as_str() {
        "space" => Code::Space,
        "f1"=>Code::F1,"f2"=>Code::F2,"f3"=>Code::F3,"f4"=>Code::F4,
        "f5"=>Code::F5,"f6"=>Code::F6,"f7"=>Code::F7,"f8"=>Code::F8,
        "f9"=>Code::F9,"f10"=>Code::F10,"f11"=>Code::F11,"f12"=>Code::F12,
        "a"=>Code::KeyA,"b"=>Code::KeyB,"c"=>Code::KeyC,"d"=>Code::KeyD,
        "e"=>Code::KeyE,"f"=>Code::KeyF,"g"=>Code::KeyG,"h"=>Code::KeyH,
        "i"=>Code::KeyI,"j"=>Code::KeyJ,"k"=>Code::KeyK,"l"=>Code::KeyL,
        "m"=>Code::KeyM,"n"=>Code::KeyN,"o"=>Code::KeyO,"p"=>Code::KeyP,
        "q"=>Code::KeyQ,"r"=>Code::KeyR,"s"=>Code::KeyS,"t"=>Code::KeyT,
        "u"=>Code::KeyU,"v"=>Code::KeyV,"w"=>Code::KeyW,"x"=>Code::KeyX,
        "y"=>Code::KeyY,"z"=>Code::KeyZ,
        _ => Code::Space,
    };
    let shortcut = Shortcut::new(if mods.is_empty() { None } else { Some(mods) }, code);
    app.global_shortcut().on_shortcut(shortcut, |app, _s, _e| {
        if let Some(w) = app.get_webview_window("main") {
            if w.is_visible().unwrap_or(false) { let _ = w.hide(); }
            else { let _ = w.show(); let _ = w.set_focus(); }
        }
    }).map_err(|e| e.to_string())
}

fn register_default_shortcut(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyO);
    app.global_shortcut().on_shortcut(shortcut, |app, _s, _e| {
        if let Some(w) = app.get_webview_window("main") {
            if w.is_visible().unwrap_or(false) { let _ = w.hide(); }
            else { let _ = w.show(); let _ = w.set_focus(); }
        }
    })?;
    Ok(())
}

// Merkt dauerhaft, dass das Onboarding einmal gezeigt wurde. Wird aufgerufen,
// sobald das Fenster eingeblendet ist — unabhängig davon, wie der Nutzer es
// verlässt („Los geht's", „Überspringen" oder einfach zuklicken). Sonst käme
// die Programmsuche bei jedem Start erneut hoch. Manuell auslösen lässt sie
// sich weiterhin jederzeit über die Einstellungen ("Neu suchen").
// Bestehende Einstellungen werden dabei zusammengeführt, nicht überschrieben.
fn mark_onboarding_seen(path: &std::path::Path) {
    let mut v = fs::read_to_string(path).ok()
        .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok())
        .unwrap_or_else(|| serde_json::json!({}));
    if !v.is_object() { v = serde_json::json!({}); }
    v["onboardingDone"] = serde_json::Value::Bool(true);
    if let Some(dir) = path.parent() { let _ = fs::create_dir_all(dir); }
    if let Ok(s) = serde_json::to_string(&v) {
        // gleiche Atomarität wie save_settings: Temp-Datei + Rename
        let tmp = path.with_extension("tmp");
        if fs::write(&tmp, &s).is_ok() { let _ = fs::rename(&tmp, path); }
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Onboarding-Check
            let settings_path = app.path().app_data_dir()
                .map(|p| p.join("settings.json")).unwrap_or_default();
            let onboarding_done = if settings_path.exists() {
                fs::read_to_string(&settings_path).ok()
                    .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok())
                    .and_then(|v| v["onboardingDone"].as_bool())
                    .unwrap_or(false)
            } else { false };

            if onboarding_done {
                if let Some(w) = app.get_webview_window("main") { let _ = w.show(); }
                if let Some(w) = app.get_webview_window("onboarding") { let _ = w.hide(); }
            } else {
                if let Some(w) = app.get_webview_window("onboarding") { let _ = w.show(); }
                if let Some(w) = app.get_webview_window("main") { let _ = w.hide(); }
                // Sofort als gesehen markieren → erscheint ab dem zweiten Start nie wieder.
                mark_onboarding_seen(&settings_path);
            }

            // Tray
            let show = MenuItemBuilder::with_id("show", "Öffnen").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Beenden").build(app)?;
            let menu = MenuBuilder::new(app).items(&[&show, &quit]).build()?;
            TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("Orbit Day Launcher")
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => { if let Some(w) = app.get_webview_window("main") { let _ = w.show(); let _ = w.set_focus(); } }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            if w.is_visible().unwrap_or(false) { let _ = w.hide(); }
                            else { let _ = w.show(); let _ = w.set_focus(); }
                        }
                    }
                })
                .build(app)?;

            // Standard-Shortcut registrieren
            let _ = register_default_shortcut(app);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            launch_app, launch_urls, close_app, close_window, quit_app, open_main_window,
            save_settings, load_settings, check_internet,
            set_always_on_top, set_fullscreen, set_window_size,
            set_autostart, detect_installed_apps, set_shortcut
        ])
        .run(tauri::generate_context!())
        .expect("error");
}