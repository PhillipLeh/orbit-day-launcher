// ── i18n: zentrale Übersetzungstabelle (de/en/es/hi/fr) ──
// data-day-Werte ("Mo","Di",...) bleiben als Persistenz-Schlüssel IMMER deutsch/kanonisch,
// nur die Anzeige (day.* Keys) wird übersetzt — sonst brechen gespeicherte Bundles/Profile.
const SUPPORTED_LANGS = ['de', 'en', 'es', 'hi', 'fr'];

const DICT = {
  'menu.title': { de: 'EINSTELLUNGEN', en: 'SETTINGS', es: 'AJUSTES', hi: 'सेटिंग्स', fr: 'PARAMÈTRES' },
  'tabs.display': { de: 'Anzeige', en: 'Display', es: 'Pantalla', hi: 'डिस्प्ले', fr: 'Affichage' },
  'tabs.programs': { de: 'Programme', en: 'Programs', es: 'Programas', hi: 'प्रोग्राम', fr: 'Programmes' },
  'tabs.bundles': { de: 'Bundles', en: 'Bundles', es: 'Paquetes', hi: 'बंडल', fr: 'Ensembles' },
  'tabs.profiles': { de: 'Profile', en: 'Profiles', es: 'Perfiles', hi: 'प्रोफाइल', fr: 'Profils' },

  'settings.appearance': { de: 'Erscheinungsbild', en: 'Appearance', es: 'Apariencia', hi: 'दिखावट', fr: 'Apparence' },
  'theme.system': { de: 'System', en: 'System', es: 'Sistema', hi: 'सिस्टम', fr: 'Système' },
  'theme.dark': { de: 'Dunkel', en: 'Dark', es: 'Oscuro', hi: 'डार्क', fr: 'Sombre' },
  'theme.light': { de: 'Hell', en: 'Light', es: 'Claro', hi: 'लाइट', fr: 'Clair' },

  'settings.language': { de: 'Sprache', en: 'Language', es: 'Idioma', hi: 'भाषा', fr: 'Langue' },

  'settings.accentColor': { de: 'Akzentfarbe', en: 'Accent Color', es: 'Color de acento', hi: 'एक्सेंट रंग', fr: 'Couleur d’accent' },
  'accent.cyan': { de: 'Cyan', en: 'Cyan', es: 'Cian', hi: 'सायन', fr: 'Cyan' },
  'accent.green': { de: 'Grün', en: 'Green', es: 'Verde', hi: 'हरा', fr: 'Vert' },
  'accent.orange': { de: 'Orange', en: 'Orange', es: 'Naranja', hi: 'नारंगी', fr: 'Orange' },
  'accent.default': { de: 'Standard', en: 'Default', es: 'Predeterminado', hi: 'डिफ़ॉल्ट', fr: 'Par défaut' },

  'settings.windowSize': { de: 'Fenstergröße', en: 'Window Size', es: 'Tamaño de ventana', hi: 'विंडो आकार', fr: 'Taille de la fenêtre' },
  'size.small': { de: 'Klein', en: 'Small', es: 'Pequeño', hi: 'छोटा', fr: 'Petit' },
  'size.medium': { de: 'Mittel', en: 'Medium', es: 'Mediano', hi: 'मध्यम', fr: 'Moyen' },
  'size.large': { de: 'Groß', en: 'Large', es: 'Grande', hi: 'बड़ा', fr: 'Grand' },
  'size.fullscreen': { de: 'Vollbild', en: 'Fullscreen', es: 'Pantalla completa', hi: 'फुल स्क्रीन', fr: 'Plein écran' },
  'settings.autoSize': { de: 'Auto-Größe', en: 'Auto Size', es: 'Tamaño automático', hi: 'ऑटो आकार', fr: 'Taille automatique' },

  'settings.contentZoom': { de: 'Inhalts-Zoom', en: 'Content Zoom', es: 'Zoom de contenido', hi: 'सामग्री ज़ूम', fr: 'Zoom du contenu' },
  'zoom.small': { de: 'Klein', en: 'Small', es: 'Pequeño', hi: 'छोटा', fr: 'Petit' },
  'zoom.medium': { de: 'Mittel', en: 'Medium', es: 'Mediano', hi: 'मध्यम', fr: 'Moyen' },
  'zoom.large': { de: 'Groß', en: 'Large', es: 'Grande', hi: 'बड़ा', fr: 'Grand' },

  'settings.alwaysOnTop': { de: 'Immer im Vordergrund', en: 'Always on Top', es: 'Siempre visible', hi: 'हमेशा सबसे ऊपर', fr: 'Toujours au premier plan' },
  'settings.autostartWindows': { de: 'Autostart mit Windows', en: 'Start with Windows', es: 'Iniciar con Windows', hi: 'Windows के साथ शुरू करें', fr: 'Démarrer avec Windows' },
  'settings.onboardingAlways': { de: 'Setup-Assistent bei jedem Start', en: 'Show setup wizard on every start', es: 'Asistente de configuración en cada inicio', hi: 'हर बार शुरू होने पर सेटअप विज़ार्ड', fr: 'Assistant de configuration à chaque démarrage' },
  'settings.onboardingHint': { de: 'Normalerweise erscheint die Programmsuche nur beim allerersten Start. Aktiviere dies, um sie bei jedem Start zu sehen.', en: 'Normally the program search only appears on the very first start. Enable this to see it every time.', es: 'Normalmente la búsqueda de programas solo aparece en el primer inicio. Actívalo para verla siempre.', hi: 'आम तौर पर प्रोग्राम खोज केवल पहली बार शुरू होने पर दिखती है। इसे हर बार देखने के लिए सक्षम करें।', fr: 'Normalement, la recherche de programmes n\'apparaît qu\'au tout premier démarrage. Activez ceci pour la voir à chaque fois.' },
  'settings.weekdays': { de: 'Wochentage', en: 'Weekdays', es: 'Días de la semana', hi: 'सप्ताह के दिन', fr: 'Jours de la semaine' },

  'day.mo': { de: 'Mo', en: 'Mon', es: 'Lu', hi: 'सोम', fr: 'Lu' },
  'day.di': { de: 'Di', en: 'Tue', es: 'Ma', hi: 'मंगल', fr: 'Ma' },
  'day.mi': { de: 'Mi', en: 'Wed', es: 'Mi', hi: 'बुध', fr: 'Me' },
  'day.do': { de: 'Do', en: 'Thu', es: 'Ju', hi: 'गुरु', fr: 'Je' },
  'day.fr': { de: 'Fr', en: 'Fri', es: 'Vi', hi: 'शुक्र', fr: 'Ve' },
  'day.sa': { de: 'Sa', en: 'Sat', es: 'Sá', hi: 'शनि', fr: 'Sa' },
  'day.so': { de: 'So', en: 'Sun', es: 'Do', hi: 'रवि', fr: 'Di' },

  'settings.orbitCount': { de: 'Orbit-Anzahl', en: 'Orbit Count', es: 'Número de órbitas', hi: 'ऑर्बिट संख्या', fr: 'Nombre d’orbites' },
  'settings.orbitSizes': { de: 'Orbit-Größen (Radius)', en: 'Orbit Sizes (Radius)', es: 'Tamaños de órbita (radio)', hi: 'ऑर्बिट आकार (रेडियस)', fr: 'Tailles des orbites (rayon)' },
  'orbit.label': { de: 'Orbit', en: 'Orbit', es: 'Órbita', hi: 'ऑर्बिट', fr: 'Orbite' },
  'settings.orbitSpeed': { de: 'Orbit-Geschwindigkeit', en: 'Orbit Speed', es: 'Velocidad de órbita', hi: 'ऑर्बिट गति', fr: 'Vitesse des orbites' },

  'settings.programView': { de: 'Programmansicht', en: 'Program Layout', es: 'Vista de programas', hi: 'प्रोग्राम लेआउट', fr: 'Disposition des programmes' },
  'layout.pyramid': { de: 'Pyramide', en: 'Pyramid', es: 'Pirámide', hi: 'पिरामिड', fr: 'Pyramide' },
  'layout.grid': { de: 'Rechteck', en: 'Grid', es: 'Cuadrícula', hi: 'ग्रिड', fr: 'Grille' },
  'settings.programsPerRow': { de: 'Programme pro Reihe (max. 7)', en: 'Programs per Row (max. 7)', es: 'Programas por fila (máx. 7)', hi: 'प्रति पंक्ति प्रोग्राम (अधिकतम 7)', fr: 'Programmes par rangée (max. 7)' },

  'settings.startDelaySingle': { de: 'Startverzögerung Einzelprogramme', en: 'Start Delay (Single Programs)', es: 'Retraso de inicio (programas individuales)', hi: 'प्रारंभ विलंब (एकल प्रोग्राम)', fr: 'Délai de démarrage (programmes individuels)' },
  'settings.startDelayHint': { de: 'Pause zwischen einzeln gestarteten Programmen. Bundles nutzen ihren eigenen Wert.', en: 'Pause between individually started programs. Bundles use their own value.', es: 'Pausa entre programas iniciados individualmente. Los paquetes usan su propio valor.', hi: 'अलग-अलग शुरू किए गए प्रोग्राम के बीच रुकें। बंडल का अपना मान होता है।', fr: 'Pause entre les programmes lancés individuellement. Les ensembles utilisent leur propre valeur.' },

  'settings.shortcut': { de: 'Tastenkürzel (Öffnen/Verstecken)', en: 'Shortcut (Show/Hide)', es: 'Atajo (mostrar/ocultar)', hi: 'शॉर्टकट (दिखाएँ/छुपाएँ)', fr: 'Raccourci (afficher/masquer)' },
  'shortcut.ctrl': { de: 'Strg', en: 'Ctrl', es: 'Ctrl', hi: 'Ctrl', fr: 'Ctrl' },
  'shortcut.alt': { de: 'Alt', en: 'Alt', es: 'Alt', hi: 'Alt', fr: 'Alt' },
  'shortcut.assign': { de: 'Belegen', en: 'Set', es: 'Asignar', hi: 'सेट करें', fr: 'Définir' },
  'shortcut.hint': { de: 'Dritte Taste frei wählbar: Buchstabe oder Zahl 1–9', en: 'Third key is freely choosable: letter or number 1–9', es: 'La tercera tecla es libre: letra o número 1–9', hi: 'तीसरी कुंजी स्वतंत्र है: अक्षर या संख्या 1–9', fr: 'Troisième touche libre : lettre ou chiffre 1 à 9' },

  'common.saveSettings': { de: 'Einstellungen speichern', en: 'Save Settings', es: 'Guardar ajustes', hi: 'सेटिंग्स सहेजें', fr: 'Enregistrer les paramètres' },
  'common.saveChanges': { de: 'Änderungen speichern', en: 'Save Changes', es: 'Guardar cambios', hi: 'परिवर्तन सहेजें', fr: 'Enregistrer les modifications' },
  'common.cancel': { de: 'Abbrechen', en: 'Cancel', es: 'Cancelar', hi: 'रद्द करें', fr: 'Annuler' },
  'common.close': { de: 'Schließen', en: 'Close', es: 'Cerrar', hi: 'बंद करें', fr: 'Fermer' },
  'common.store': { de: 'Store', en: 'Store', es: 'Store', hi: 'स्टोर', fr: 'Store' },

  'programs.installed': { de: 'Installierte Programme', en: 'Installed Programs', es: 'Programas instalados', hi: 'इंस्टॉल किए गए प्रोग्राम', fr: 'Programmes installés' },
  'programs.rescan': { de: '↻ Neu suchen', en: '↻ Rescan', es: '↻ Buscar de nuevo', hi: '↻ फिर से खोजें', fr: '↻ Nouvelle recherche' },
  'programs.rescanning': { de: '⌛ Suche...', en: '⌛ Scanning...', es: '⌛ Buscando...', hi: '⌛ खोज रहे हैं...', fr: '⌛ Recherche...' },
  'programs.rescanNone': { de: '↻ keine neuen', en: '↻ none new', es: '↻ sin novedades', hi: '↻ कुछ नया नहीं', fr: '↻ aucun nouveau' },
  'programs.rescanError': { de: '↻ Fehler', en: '↻ Error', es: '↻ Error', hi: '↻ त्रुटि', fr: '↻ Erreur' },
  'programs.addManually': { de: 'Manuell hinzufügen', en: 'Add Manually', es: 'Añadir manualmente', hi: 'मैन्युअल रूप से जोड़ें', fr: 'Ajouter manuellement' },
  'programs.namePlaceholder': { de: 'Name (z.B. Firefox)', en: 'Name (e.g. Firefox)', es: 'Nombre (p. ej. Firefox)', hi: 'नाम (जैसे Firefox)', fr: 'Nom (p. ex. Firefox)' },
  'programs.pathPlaceholder': { de: 'Pfad zur .exe', en: 'Path to .exe', es: 'Ruta al .exe', hi: '.exe का पथ', fr: 'Chemin du .exe' },
  'programs.add': { de: '+ Hinzufügen', en: '+ Add', es: '+ Añadir', hi: '+ जोड़ें', fr: '+ Ajouter' },

  'bundles.mine': { de: 'Meine Bundles', en: 'My Bundles', es: 'Mis paquetes', hi: 'मेरे बंडल', fr: 'Mes ensembles' },
  'bundles.none': { de: 'Noch keine Bundles', en: 'No bundles yet', es: 'Aún no hay paquetes', hi: 'अभी कोई बंडल नहीं', fr: 'Aucun ensemble pour le moment' },
  'bundles.createFirst': { de: 'Erst Bundle erstellen', en: 'Create a bundle first', es: 'Crea primero un paquete', hi: 'पहले बंडल बनाएँ', fr: 'Créez d’abord un ensemble' },
  'bundles.color': { de: 'Farbe', en: 'Color', es: 'Color', hi: 'रंग', fr: 'Couleur' },
  'bundles.colorLabel': { de: 'Bundle-Farbe', en: 'Bundle Color', es: 'Color del paquete', hi: 'बंडल रंग', fr: 'Couleur de l’ensemble' },
  'bundles.programsInBundle': { de: 'Programme im Bundle', en: 'Programs in Bundle', es: 'Programas en el paquete', hi: 'बंडल में प्रोग्राम', fr: 'Programmes dans l’ensemble' },
  'bundles.startDelayInBundle': { de: 'Startverzögerung im Bundle', en: 'Start Delay in Bundle', es: 'Retraso de inicio en el paquete', hi: 'बंडल में प्रारंभ विलंब', fr: 'Délai de démarrage dans l’ensemble' },
  'bundles.namePlaceholder': { de: 'Bundle-Name...', en: 'Bundle name...', es: 'Nombre del paquete...', hi: 'बंडल का नाम...', fr: 'Nom de l’ensemble...' },
  'bundles.programsOrder': { de: 'Programme & Reihenfolge', en: 'Programs & Order', es: 'Programas y orden', hi: 'प्रोग्राम और क्रम', fr: 'Programmes et ordre' },
  'bundles.orderHint': { de: 'In Startreihenfolge anklicken · letztes = vorderstes Fenster', en: 'Click in start order · last = front window', es: 'Haz clic en orden de inicio · el último = ventana frontal', hi: 'प्रारंभ क्रम में क्लिक करें · अंतिम = सामने वाली विंडो', fr: 'Cliquez dans l’ordre de démarrage · le dernier = fenêtre au premier plan' },
  'bundles.save': { de: 'Bundle speichern', en: 'Save Bundle', es: 'Guardar paquete', hi: 'बंडल सहेजें', fr: 'Enregistrer l’ensemble' },
  'bundles.new': { de: '+ Neues Bundle', en: '+ New Bundle', es: '+ Nuevo paquete', hi: '+ नया बंडल', fr: '+ Nouvel ensemble' },
  'bundles.colors': { de: 'Bundle-Farben', en: 'Bundle Colors', es: 'Colores de paquetes', hi: 'बंडल रंग', fr: 'Couleurs des ensembles' },

  'profiles.mine': { de: 'Meine Profile', en: 'My Profiles', es: 'Mis perfiles', hi: 'मेरी प्रोफाइलें', fr: 'Mes profils' },
  'profiles.none': { de: 'Noch keine Profile', en: 'No profiles yet', es: 'Aún no hay perfiles', hi: 'अभी कोई प्रोफाइल नहीं', fr: 'Aucun profil pour le moment' },
  'profiles.hint': { de: 'Startet ein Bundle automatisch zur eingestellten Uhrzeit.', en: 'Starts a bundle automatically at the set time.', es: 'Inicia un paquete automáticamente a la hora establecida.', hi: 'निर्धारित समय पर स्वचालित रूप से बंडल शुरू करता है।', fr: 'Démarre un ensemble automatiquement à l’heure définie.' },
  'profiles.namePlaceholder': { de: 'Profil-Name (z.B. Arbeit)...', en: 'Profile name (e.g. Work)...', es: 'Nombre del perfil (p. ej. Trabajo)...', hi: 'प्रोफ़ाइल नाम (जैसे काम)...', fr: 'Nom du profil (p. ex. Travail)...' },
  'profiles.chooseBundle': { de: 'Bundle wählen', en: 'Choose Bundle', es: 'Elegir paquete', hi: 'बंडल चुनें', fr: 'Choisir un ensemble' },
  'profiles.time': { de: 'Uhrzeit', en: 'Time', es: 'Hora', hi: 'समय', fr: 'Heure' },
  'profiles.activeDays': { de: 'Aktiv an Tagen', en: 'Active on Days', es: 'Activo en días', hi: 'सक्रिय दिन', fr: 'Actif les jours' },
  'profiles.save': { de: 'Profil speichern', en: 'Save Profile', es: 'Guardar perfil', hi: 'प्रोफाइल सहेजें', fr: 'Enregistrer le profil' },
  'profiles.daily': { de: 'täglich', en: 'daily', es: 'diario', hi: 'दैनिक', fr: 'quotidien' },
  'profiles.bundleMissing': { de: 'Bundle fehlt', en: 'Bundle missing', es: 'Falta el paquete', hi: 'बंडल गायब है', fr: 'Ensemble manquant' },

  'countdown.title': { de: 'PROFIL WIRD GESTARTET', en: 'STARTING PROFILE', es: 'INICIANDO PERFIL', hi: 'प्रोफ़ाइल शुरू हो रही है', fr: 'DÉMARRAGE DU PROFIL' },
  'countdown.now': { de: 'Jetzt starten', en: 'Start Now', es: 'Iniciar ahora', hi: 'अभी शुरू करें', fr: 'Démarrer maintenant' },

  'mode.start': { de: '▶ Starten', en: '▶ Start', es: '▶ Iniciar', hi: '▶ शुरू करें', fr: '▶ Démarrer' },
  'mode.close': { de: '■ Schließen', en: '■ Close', es: '■ Cerrar', hi: '■ बंद करें', fr: '■ Fermer' },
  'sys.initialize': { de: 'SYSTEM INITIALIZE', en: 'SYSTEM INITIALIZE', es: 'INICIO DEL SISTEMA', hi: 'सिस्टम इनिशियलाइज़', fr: 'INITIALISATION SYSTÈME' },
  'sys.shutdown': { de: 'SYSTEM SHUTDOWN', en: 'SYSTEM SHUTDOWN', es: 'APAGADO DEL SISTEMA', hi: 'सिस्टम शटडाउन', fr: 'ARRÊT SYSTÈME' },
  'headline.start': { de: 'Was soll heute starten?', en: 'What should start today?', es: '¿Qué debería iniciarse hoy?', hi: 'आज क्या शुरू करें?', fr: 'Que faut-il démarrer aujourd’hui ?' },
  'headline.close': { de: 'Was soll geschlossen werden?', en: 'What should be closed?', es: '¿Qué debería cerrarse?', hi: 'क्या बंद करना है?', fr: 'Que faut-il fermer ?' },
  'btn.startAll': { de: 'ALLES STARTEN', en: 'START ALL', es: 'INICIAR TODO', hi: 'सभी शुरू करें', fr: 'TOUT DÉMARRER' },
  'btn.closeAllSelected': { de: 'AUSGEWÄHLTE SCHLIESSEN', en: 'CLOSE SELECTED', es: 'CERRAR SELECCIONADOS', hi: 'चयनित बंद करें', fr: 'FERMER LA SÉLECTION' },
  'btn.closeAll': { de: 'ALLES SCHLIESSEN', en: 'CLOSE ALL', es: 'CERRAR TODO', hi: 'सभी बंद करें', fr: 'TOUT FERMER' },
  'btn.closingAll': { de: '■ SCHLIESSE ALLE…', en: '■ CLOSING ALL…', es: '■ CERRANDO TODO…', hi: '■ सभी बंद हो रहे हैं…', fr: '■ FERMETURE EN COURS…' },

  'status.initializing': { de: 'Initialisiere', en: 'Initializing', es: 'Inicializando', hi: 'शुरू हो रहा है', fr: 'Initialisation' },
  'ready.systemsOnline': { de: '✦  SYSTEMS ONLINE  ✦', en: '✦  SYSTEMS ONLINE  ✦', es: '✦  SISTEMAS LISTOS  ✦', hi: '✦  सिस्टम ऑनलाइन  ✦', fr: '✦  SYSTÈMES EN LIGNE  ✦' },

  'title.save': { de: 'Speichern', en: 'Save', es: 'Guardar', hi: 'सहेजें', fr: 'Enregistrer' },
  'title.quit': { de: 'Beenden', en: 'Quit', es: 'Salir', hi: 'बाहर निकलें', fr: 'Quitter' },
  'title.internet': { de: 'Internetverbindung', en: 'Internet Connection', es: 'Conexión a internet', hi: 'इंटरनेट कनेक्शन', fr: 'Connexion internet' },
  'net.connected': { de: 'Internet verbunden', en: 'Internet connected', es: 'Internet conectado', hi: 'इंटरनेट कनेक्ट है', fr: 'Internet connecté' },
  'net.disconnected': { de: 'Keine Internetverbindung', en: 'No internet connection', es: 'Sin conexión a internet', hi: 'इंटरनेट कनेक्शन नहीं है', fr: 'Aucune connexion internet' },

  'picker.title': { de: 'Apps gefunden', en: 'Apps Found', es: 'Aplicaciones encontradas', hi: 'ऐप्स मिलीं', fr: 'Applications trouvées' },
  'picker.subtitle': { de: '{count} neue App(s) — wähle aus, was in den Orbit soll.', en: '{count} new app(s) — choose what goes into the orbit.', es: '{count} aplicación(es) nueva(s) — elige qué va a la órbita.', hi: '{count} नई ऐप्स मिलीं — चुनें कि ऑर्बिट में क्या जाना चाहिए।', fr: '{count} nouvelle(s) application(s) — choisissez ce qui rejoint l’orbite.' },
  'picker.selectAll': { de: 'Alle', en: 'All', es: 'Todos', hi: 'सभी', fr: 'Tous' },
  'picker.selectNone': { de: 'Keine', en: 'None', es: 'Ninguno', hi: 'कोई नहीं', fr: 'Aucun' },
  'picker.add': { de: 'Hinzufügen', en: 'Add', es: 'Añadir', hi: 'जोड़ें', fr: 'Ajouter' },

  'close.failedCount': { de: '✕ {n} fehlgeschlagen', en: '✕ {n} failed', es: '✕ {n} fallido(s)', hi: '✕ {n} विफल', fr: '✕ {n} échoué(s)' },
  'close.closed': { de: '✓ GESCHLOSSEN', en: '✓ CLOSED', es: '✓ CERRADO', hi: '✓ बंद हो गया', fr: '✓ FERMÉ' },

  'capture.pressKey': { de: 'Drücke Taste…', en: 'Press a key…', es: 'Pulsa una tecla…', hi: 'एक कुंजी दबाएँ…', fr: 'Appuyez sur une touche…' },
  'capture.onlyAZ09': { de: 'Nur A–Z / 1–9', en: 'Only A–Z / 1–9', es: 'Solo A–Z / 1–9', hi: 'केवल A–Z / 1–9', fr: 'Uniquement A–Z / 1–9' },

  'saved.label': { de: '✓ GESPEICHERT', en: '✓ SAVED', es: '✓ GUARDADO', hi: '✓ सहेजा गया', fr: '✓ ENREGISTRÉ' },

  'start.startingApp': { de: '{name} wird gestartet', en: '{name} is starting', es: '{name} se está iniciando', hi: '{name} शुरू हो रहा है', fr: '{name} démarre' },
  'start.readyApp': { de: '{name} bereit', en: '{name} ready', es: '{name} listo', hi: '{name} तैयार', fr: '{name} prêt' },
  'start.systemsOnline': { de: 'Systems online', en: 'Systems online', es: 'Sistemas listos', hi: 'सिस्टम ऑनलाइन', fr: 'Systèmes en ligne' },
  'start.notStarted': { de: '{n} nicht gestartet:', en: '{n} not started:', es: '{n} no iniciado(s):', hi: '{n} शुरू नहीं हुए:', fr: '{n} non démarré(s) :' },

  'cat.ai': { de: 'KI', en: 'AI', es: 'IA', hi: 'एआई', fr: 'IA' },
  'cat.browser': { de: 'Browser', en: 'Browser', es: 'Navegador', hi: 'ब्राउज़र', fr: 'Navigateur' },
  'cat.dev': { de: 'Entwicklung', en: 'Development', es: 'Desarrollo', hi: 'डेवलपमेंट', fr: 'Développement' },
  'cat.office': { de: 'Office', en: 'Office', es: 'Ofimática', hi: 'ऑफिस', fr: 'Bureautique' },
  'cat.communication': { de: 'Kommunikation', en: 'Communication', es: 'Comunicación', hi: 'संचार', fr: 'Communication' },
  'cat.entertainment': { de: 'Unterhaltung', en: 'Entertainment', es: 'Entretenimiento', hi: 'मनोरंजन', fr: 'Divertissement' },
  'cat.productivity': { de: 'Produktivität', en: 'Productivity', es: 'Productividad', hi: 'उत्पादकता', fr: 'Productivité' },
  'cat.tools': { de: 'Tools', en: 'Tools', es: 'Herramientas', hi: 'टूल्स', fr: 'Outils' },
  'cat.other': { de: 'Sonstige', en: 'Other', es: 'Otros', hi: 'अन्य', fr: 'Autres' },
  'cat.gaming': { de: 'Gaming', en: 'Gaming', es: 'Videojuegos', hi: 'गेमिंग', fr: 'Jeux' },
  'cat.media': { de: 'Medien', en: 'Media', es: 'Multimedia', hi: 'मीडिया', fr: 'Médias' },
  'cat.web': { de: 'Web', en: 'Web', es: 'Web', hi: 'वेब', fr: 'Web' },
  'cat.shortcut': { de: 'Verknüpfung', en: 'Shortcut', es: 'Acceso directo', hi: 'शॉर्टकट', fr: 'Raccourci' },
  'cat.custom': { de: 'Eigene', en: 'Custom', es: 'Personalizado', hi: 'कस्टम', fr: 'Personnalisé' },

  'onboarding.welcome': { de: 'Willkommen', en: 'Welcome', es: 'Bienvenido', hi: 'स्वागत है', fr: 'Bienvenue' },
  'onboarding.subtitle': { de: 'Wir suchen nach installierten Programmen auf deinem PC.', en: 'We’re scanning your PC for installed programs.', es: 'Buscamos programas instalados en tu PC.', hi: 'हम आपके पीसी पर इंस्टॉल किए गए प्रोग्राम खोज रहे हैं।', fr: 'Nous recherchons les programmes installés sur votre PC.' },
  'onboarding.scanning': { de: 'Durchsuche deinen PC...', en: 'Scanning your PC...', es: 'Buscando en tu PC...', hi: 'आपका पीसी स्कैन हो रहा है...', fr: 'Analyse de votre PC...' },
  'onboarding.noneFound': { de: 'Keine bekannten Programme gefunden. Manuell hinzufügen im Reiter Programme.', en: 'No known programs found. Add manually in the Programs tab.', es: 'No se encontraron programas conocidos. Añádelos manualmente en la pestaña Programas.', hi: 'कोई ज्ञात प्रोग्राम नहीं मिला। प्रोग्राम टैब में मैन्युअल रूप से जोड़ें।', fr: 'Aucun programme connu trouvé. Ajoutez-le manuellement dans l’onglet Programmes.' },
  'onboarding.noneFoundShort': { de: 'Keine Programme gefunden.', en: 'No programs found.', es: 'No se encontraron programas.', hi: 'कोई प्रोग्राम नहीं मिला।', fr: 'Aucun programme trouvé.' },
  'onboarding.searchFailed': { de: 'Suche fehlgeschlagen.', en: 'Search failed.', es: 'Error en la búsqueda.', hi: 'खोज विफल हुई।', fr: 'La recherche a échoué.' },
  'onboarding.foundCount': { de: '{count} Programme gefunden', en: '{count} programs found', es: '{count} programas encontrados', hi: '{count} प्रोग्राम मिले', fr: '{count} programmes trouvés' },
  'onboarding.selectAll': { de: 'Alle auswählen', en: 'Select all', es: 'Seleccionar todo', hi: 'सभी चुनें', fr: 'Tout sélectionner' },
  'onboarding.deselectAll': { de: 'Alle abwählen', en: 'Deselect all', es: 'Deseleccionar todo', hi: 'सभी अचयनित करें', fr: 'Tout désélectionner' },
  'onboarding.go': { de: 'LOS GEHT’S', en: 'LET’S GO', es: 'EMPEZAR', hi: 'शुरू करें', fr: 'C’EST PARTI' },
  'onboarding.skip': { de: 'Überspringen – später hinzufügen', en: 'Skip – add later', es: 'Omitir – añadir más tarde', hi: 'छोड़ें – बाद में जोड़ें', fr: 'Ignorer – ajouter plus tard' }
};

let currentLang = 'de';

function detectLang() {
  const nav = ((navigator.language || 'en').slice(0, 2)).toLowerCase();
  return SUPPORTED_LANGS.includes(nav) ? nav : 'en';
}

function getLang() { return currentLang; }

function t(key, vars) {
  const entry = DICT[key];
  let str = entry ? (entry[currentLang] || entry.en || key) : key;
  if (vars) Object.keys(vars).forEach(k => { str = str.replace('{' + k + '}', vars[k]); });
  return str;
}

function applyStaticI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('.day-btn[data-day]').forEach(el => {
    const code = el.dataset.day.toLowerCase();
    if (DICT['day.' + code]) el.textContent = t('day.' + code);
  });
  document.querySelectorAll('.orbit-num-label[data-orbit-n]').forEach(el => {
    el.textContent = t('orbit.label') + ' ' + el.dataset.orbitN;
  });
}

function setLang(lang) {
  currentLang = SUPPORTED_LANGS.includes(lang) ? lang : 'en';
  document.documentElement.setAttribute('lang', currentLang);
  applyStaticI18n();
}

// Kanonische (deutsche, von Rust/Altdaten gelieferte) Kategorie-Strings -> Übersetzungs-Key
const CATEGORY_KEY_MAP = {
  'KI': 'ai', 'Browser': 'browser', 'Entwicklung': 'dev', 'Office': 'office',
  'Kommunikation': 'communication', 'Unterhaltung': 'entertainment', 'Produktivität': 'productivity',
  'Tools': 'tools', 'Sonstige': 'other', 'Gaming': 'gaming', 'Medien': 'media',
  'Web': 'web', 'Verknüpfung': 'shortcut', 'Eigene': 'custom'
};
function translateCategory(raw) {
  const key = CATEGORY_KEY_MAP[raw] || 'other';
  return t('cat.' + key);
}

window.I18N = { t, setLang, getLang, detectLang, applyStaticI18n, translateCategory, SUPPORTED_LANGS };
