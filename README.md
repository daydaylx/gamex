# GameX (Intimacy Tool)

**Offline-first PWA + Android APK für Paare**

GameX ist eine lokale, datenschutzfreundliche App zur Erkundung von Intimität, Kommunikation und Beziehungsthemen. Der aktuelle Fokus liegt auf der Preact/Vite App in `apps/web-new/` und dem Android-Wrapper in `android/`.

---

## ✅ Aktueller Stand

- `apps/web-new/`: aktive PWA (Preact/Vite/TypeScript/Tailwind)
- `android/`: native Android-App (Capacitor)
- `build-apk.sh`: Build-Script (Web-Build → APK)
- `legacy/` und `docs/archive/`: ältere Implementierungen (Referenz)

---

## ✨ Features

- Interview-Modus mit Fragebögen und Szenarien-Decks
- Vergleichsreport für Person A/B (Matches, Explore, Boundaries)
- Offline-first & installierbar als PWA
- Lokale Speicherung (localStorage), kein eigener Backend-Server
- Optional KI-Insights via OpenRouter (opt-in, API-Key in Settings)

---

## 🧰 Tech-Stack

- Preact + Vite 7 + TypeScript
- Tailwind CSS v4
- Capacitor (Android)
- Vitest + Testing Library
- ESLint + Prettier

---

## 🚀 Schnellstart (Web/PWA)

```bash
cd apps/web-new
npm install
npm run dev
```

Weitere nützliche Commands:

```bash
npm run build
npm run preview
npm test
npm run typecheck
```

---

## 📦 APK bauen (Android)

```bash
./build-apk.sh release
# oder:
./build-apk.sh debug
```

Outputs:

- `apks/` (dateibasierte Releases)
- `android/app/build/outputs/apk/...` (Gradle-Outputs)

Detaillierte Voraussetzungen & Setup: `docs/APK_BUILD_GUIDE_V2.md`.

---

## 📁 Projektstruktur

```
gamex/
├── apps/web-new/          # Preact PWA (aktiv)
│   ├── src/               # UI & Logik
│   └── public/data/       # Templates & Szenarien
├── android/               # Capacitor Android-Projekt
├── build-apk.sh           # Build-Script (Web → APK)
├── apks/                  # Erzeugte APKs
├── docs/                  # Dokumentation
└── legacy/                # Alte Implementierungen (archiviert)
```

---

## 🔒 Datenschutz

- Alle Daten bleiben lokal auf dem Gerät (localStorage)
- Keine Server-Kommunikation (außer optionaler KI-Funktionen)
- KI-Features sind opt-in und senden Daten nur an den konfigurierten Provider

---

## 📚 Weitere Doku

- `apps/web-new/README.md` (Web/PWA Details)
- `docs/APK_BUILD_GUIDE_V2.md` (Android Build Guide)

---

## 🤝 Beitragen

Pull Requests willkommen! Siehe `CONTRIBUTING.md`.

---

## 📞 Support

Fragen oder Probleme? Bitte ein Issue auf GitHub erstellen.
