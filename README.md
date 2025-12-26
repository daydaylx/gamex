# GameX Mobile - Android APK

**Intimate Communication & Relationship Exploration Tool**

GameX ist eine **native Android-App** (APK-only) für Paare, die ihre Kommunikation, Intimität und gemeinsamen Interessen auf spielerische, strukturierte Weise erkunden möchten.

---

## 🎯 Was ist GameX?

Eine **offline-first Android-App** mit:

- ✅ **Fragebogen-basierte Sessions** - Strukturierte Fragen zu Intimität, Kommunikation, Beziehungsdynamik
- ✅ **Vergleichsreport** - Zeigt Übereinstimmungen, Unterschiede und Gesprächsanlässe
- ✅ **Szenarien-Explorer** - Erkunde hypothetische Situationen gemeinsam
- ✅ **Lokale Datenspeicherung** - Alle Daten bleiben auf dem Gerät (SQLite)
- ✅ **Keine Server, kein Internet nötig** - Komplett offline nutzbar

---

## 📱 Tech-Stack (APK-only)

- **Framework:** Kivy (Python-basiert, native Android)
- **Build-Tool:** Buildozer
- **Datenbank:** SQLite (lokal auf Gerät)
- **State Management:** Zustand Store (In-Memory)
- **Business Logic:** Python (wiederverwendbar aus `backend/app/core/`)

**Keine Web-Komponenten** - Das Projekt wurde komplett auf APK-only umgestellt.

---

## 🚀 APK bauen (Linux)

### Voraussetzungen installieren

```bash
# Python 3.9+ und pip
sudo apt-get update
sudo apt-get install python3 python3-pip

# Android Build-Dependencies
sudo apt-get install -y \
    build-essential \
    git \
    python3-dev \
    ffmpeg \
    libsdl2-dev \
    libsdl2-image-dev \
    libsdl2-mixer-dev \
    libsdl2-ttf-dev \
    libportmidi-dev \
    libswscale-dev \
    libavformat-dev \
    libavcodec-dev \
    zlib1g-dev \
    libgstreamer1.0 \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good

# Buildozer und Cython
pip3 install --user buildozer cython
```

### APK bauen

```bash
# In das Projekt-Verzeichnis wechseln
cd gamex/mobile

# Debug-APK bauen (für Tests)
buildozer android debug

# Release-APK bauen (für Produktion)
buildozer android release
```

**Achtung:** Der erste Build dauert **30-60 Minuten**, da Android SDK/NDK heruntergeladen werden.

### APK finden

```
mobile/bin/
├── gamex-1.0.0-armeabi-v7a-debug.apk     # Debug-Version
└── gamex-1.0.0-armeabi-v7a-release.apk   # Release-Version
```

### APK installieren

```bash
# Via ADB (wenn Gerät per USB verbunden)
adb install mobile/bin/gamex-1.0.0-armeabi-v7a-debug.apk

# Oder: APK manuell auf Gerät kopieren und über Dateimanager installieren
```

---

## 📂 Projektstruktur

```
gamex/
├── mobile/                    # Hauptprojekt (Kivy Android App)
│   ├── main.py               # App Entry Point
│   ├── gamex.kv              # Kivy UI Definition
│   ├── buildozer.spec        # Android Build Config
│   ├── requirements.txt      # Python Dependencies (minimal)
│   ├── screens/              # Screen Definitions
│   │   ├── dashboard.py      # Hauptmenü
│   │   ├── session_form.py   # Fragebogen-Session
│   │   ├── compare_report.py # Vergleichsreport
│   │   ├── scenarios.py      # Szenarien-Explorer
│   │   └── settings.py       # Einstellungen
│   ├── services/             # Business Logic
│   │   ├── compare_service.py    # Vergleichslogik
│   │   ├── template_loader.py    # Template-Manager
│   │   └── export_service.py     # Export-Funktionen
│   ├── storage/              # Data Persistence
│   │   └── sqlite_adapter.py # SQLite-Integration
│   ├── widgets/              # Custom UI Components
│   └── store.py              # State Management
│
├── backend/app/              # Wiederverwendbare Logik (als Library)
│   ├── models.py             # Pydantic Data Models
│   ├── config.py             # Configuration
│   ├── core/                 # Business Logic (von Mobile importiert)
│   │   ├── compare.py        # Vergleichsalgorithmus
│   │   ├── validation.py     # Validierung
│   │   └── types.py          # Type Definitions
│   └── templates/            # JSON Templates (Fragebogen)
│       ├── default_template.json
│       ├── comprehensive_v1.json
│       └── ...
│
├── Makefile                  # Build-Shortcuts
├── README.md                 # Diese Datei
└── APK_CONVERSION_PLAN.md    # Technische Dokumentation der Conversion
```

---

## 🛠️ Entwicklung

### Lokale Entwicklung (Desktop)

```bash
cd mobile
python3 main.py
```

**Hinweis:** Auf Desktop wird die App in einem Fenster (360x640) simuliert.

### Dependencies aktualisieren

```bash
cd mobile
pip3 install -r requirements.txt
```

### Makefile-Shortcuts

```bash
make install       # Buildozer installieren
make clean         # Build-Artefakte löschen
make build-debug   # Debug-APK bauen
make build-release # Release-APK bauen
```

---

## 📋 Features

### ✅ Implementiert (APK-ready)

- **Fragebogen-Sessions** - Strukturierte Fragen zu verschiedenen Themen
- **Vergleichsreport** - Zeigt Übereinstimmungen und Unterschiede
- **Szenarien-Explorer** - Hypothetische Situationen erkunden
- **Lokale Speicherung** - SQLite-basiert, alle Daten bleiben auf Gerät
- **Offline-First** - Funktioniert komplett ohne Internet
- **Native Android UI** - Kivy-basiert, kein Web-Wrapper

### 🔜 Geplant (Optional)

- Cloud-Backup/Sync (opt-in)
- Export zu PDF
- Mehr Template-Varianten
- Gamification-Elemente

---

## ⚠️ Wichtige Prinzipien

- **"NEIN" ist final** - Kein Diskutieren oder Überreden
- **"VIELLEICHT" gilt nur unter Bedingungen**
- **Fantasie ≠ Wunsch ≠ Identität**

---

## 🔒 Datenschutz

- **Speicherung:** SQLite-Datenbank lokal auf dem Gerät
- **Kein Cloud-Upload:** Alle Daten bleiben auf dem Gerät
- **Keine Authentifizierung:** Gerätezugriff = Datenzugriff
- **Empfehlung:** Gerät mit Bildschirmsperre sichern

---

## 📄 Lizenz

MIT License - Siehe LICENSE-Datei

---

## 🤝 Beitragen

Pull Requests willkommen! Siehe `CONTRIBUTING.md` für Details.

---

## 📞 Support

Bei Fragen oder Problemen bitte ein Issue auf GitHub erstellen.

---

**Gebaut mit ❤️ für bessere Kommunikation in Beziehungen**
