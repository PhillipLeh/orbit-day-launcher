#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::process::Command;
use std::fs;
use tauri::{Manager, menu::{MenuBuilder, MenuItemBuilder}, tray::TrayIconBuilder};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

#[derive(serde::Serialize, Clone)]
struct DetectedApp {
    id: String, name: String, category: String, app_type: String, path: String,
}

fn dirs_home() -> Option<std::path::PathBuf> {
    std::env::var("USERPROFILE").ok().map(std::path::PathBuf::from)
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
            apps.push(DetectedApp {
                id: app_id.to_string(),
                name: name.to_string(),
                category: "Store-Apps".to_string(),
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

#[tauri::command]
fn launch_app(app_id: String, app_type: String, path: String) -> Result<(), String> {
    if app_type == "url" {
        // Web-URL oder Protokoll-URI (steam://, discord://) über Windows-Standard-Handler
        Command::new("cmd").args(["/C", "start", "", &path]).spawn().map_err(|e| e.to_string())?;
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
        // Store-App: Paketname (Teil vor '!') ermitteln und zugehörige Prozesse beenden
        let package = app_id.split('!').next().unwrap_or(&app_id);
        let family = package.split('_').next().unwrap_or(package);
        let ps = format!(
            "Get-Process | Where-Object {{ $_.Path -like '*{}*' -or $_.Name -like '*{}*' }} | Stop-Process -Force -ErrorAction SilentlyContinue",
            family, family
        );
        Command::new("powershell")
            .args(["-WindowStyle", "Hidden", "-Command", &ps])
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
    fs::write(&path, &settings).map_err(|e| e.to_string())?;
    // Verifizieren dass wirklich geschrieben wurde
    let written = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    if written != settings { return Err("Verify failed".to_string()); }
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
            launch_app, close_app, close_window, quit_app, open_main_window,
            save_settings, load_settings, check_internet,
            set_always_on_top, set_fullscreen, set_window_size,
            set_autostart, detect_installed_apps, set_shortcut
        ])
        .run(tauri::generate_context!())
        .expect("error");
}