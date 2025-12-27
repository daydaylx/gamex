# GameX APK-Only Conversion Plan

## 1. Tech-Stack Analyse & Finaler Build-Weg

### Aktuelle Struktur (Vor Umbau)
Das Repository enthält aktuell **drei verschiedene App-Varianten**:

1. **`mobile/`** - Kivy-basierte native Android App (Python)
   - ✅ **Buildozer** + Kivy Framework
   - ✅ Komplett offline-fähig
   - ✅ SQLite für lokalen Storage
   - ✅ Nutzt Backend-Logik als Library (keine Server)

2. **`apps/web-new/`** - Moderne Web-App
   - ❌ Vite + Preact + TypeScript
   - ❌ Tailwind CSS, Routing, etc.
   - ❌ Nur für Browser

3. **`apps/mobile/`** - Capacitor Hybrid App
   - ❌ Web-Wrapper mit Capacitor
   - ❌ Basiert auf Web-Code, nur verpackt als APK

4. **`backend/`** - FastAPI Web-Server
   - ⚠️ Teilweise: Enthält wiederverwendbare Business-Logik
   - ❌ FastAPI/Uvicorn Server-Code (nur für Web)

### Finale Entscheidung: **Kivy + Buildozer (APK-only)**

**Begründung:**
- ✅ Kivy-Struktur (`mobile/`) ist bereits vollständig implementiert
- ✅ Echte native Android-App, kein Web-Wrapper
- ✅ Python-basiert mit klarer Architektur (Screens, Services, Storage)
- ✅ Buildozer.spec ist konfiguriert und bereit für APK-Build
- ✅ Offline-First Design bereits umgesetzt (SQLite)
- ✅ Nutzt Backend-Logik als importierte Module (kein Server nötig)
- ✅ Keine Web-Dependencies, keine Browser-UI

**Alternative Optionen (verworfen):**
- ❌ Capacitor: Ist nur Web-Wrapper, widerspricht "APK-only" Anforderung
- ❌ React Native/Flutter: Müsste komplett neu entwickelt werden
- ❌ Kotlin/Android Studio: Müsste komplett neu entwickelt werden

---

## 2. Web-Komponenten - Kompletter Removal Plan

### Ordner komplett löschen:
```
apps/
├── web/              # Alte Web-App
├── web-new/          # Neue Web-App (Vite + Preact)
└── mobile/           # Capacitor Hybrid-App
```

### Backend bereinigen:
```
backend/app/
├── routes.py         # ENTFERNEN - FastAPI Web-Routen
├── main.py           # ENTFERNEN - FastAPI Server Entry
├── __main__.py       # ENTFERNEN - Server Launcher
├── ai.py             # PRÜFEN - OpenAI Integration (ggf. später für Mobile?)
├── backup.py         # PRÜFEN - Backup-Logik
├── keychain.py       # PRÜFEN - Verschlüsselung
└── crypto.py         # PRÜFEN - Encryption

BEHALTEN:
├── models.py         # Data Models (von Mobile genutzt)
├── config.py         # Configuration
├── core/
│   ├── compare.py    # Vergleichslogik (von Mobile importiert)
│   ├── validation.py # Validierung
│   └── types.py      # Type definitions
└── templates/        # JSON Templates + Loader
```

### Root-Level bereinigen:
- ❌ `package.json`, `package-lock.json` (Node.js nicht mehr nötig)
- ❌ `.nvmrc` (Node Version Manager)
- ⚠️ Dokumentation prüfen und aufräumen:
  - Behalten: `README.md` (neu schreiben für APK)
  - Entfernen: Web-spezifische Docs

---

## 3. Dependencies Bereinigung

### Mobile Requirements (minimal halten):
```python
# mobile/requirements.txt
kivy==2.3.0          # UI Framework
pydantic>=2.0.0      # Data validation
sqlite3              # Local storage (Standard Library)
```

**Zu entfernen aus Backend:**
```python
fastapi              # Web-Framework ❌
uvicorn              # Web-Server ❌
httpx                # HTTP Client ❌
python-multipart     # File uploads ❌
```

**Behalten (falls gebraucht von core/):**
```python
pydantic             # Data models ✅
cryptography         # Encryption ⚠️ (prüfen ob Mobile nutzt)
```

---

## 4. Projektstruktur (Final - APK-only)

```
gamex/
├── mobile/                    # Hauptprojekt (Kivy App)
│   ├── main.py               # App Entry Point
│   ├── gamex.kv              # Kivy UI Definition
│   ├── buildozer.spec        # Android Build Config
│   ├── requirements.txt      # Python Dependencies
│   ├── screens/              # Screen Definitions
│   │   ├── dashboard.py
│   │   ├── session_form.py
│   │   ├── compare_report.py
│   │   ├── scenarios.py
│   │   └── settings.py
│   ├── services/             # Business Logic
│   │   ├── compare_service.py
│   │   ├── template_loader.py
│   │   └── export_service.py
│   ├── storage/              # Data Persistence
│   │   └── sqlite_adapter.py
│   ├── widgets/              # Custom UI Components
│   ├── store.py              # State Management
│   └── assets/               # Images, Icons, etc.
│
├── backend/app/              # Wiederverwendbare Logik (als Library)
│   ├── models.py
│   ├── config.py
│   ├── core/
│   │   ├── compare.py        # Import von Mobile
│   │   ├── validation.py
│   │   └── types.py
│   └── templates/            # JSON Templates
│       ├── *.json
│       └── loader.py
│
├── .git/
├── .gitignore
├── README.md                 # Neu: APK Build-Anleitung
└── BUILD_APK.md              # Build-Dokumentation
```

---

## 5. Offline-First Architektur

**Status:** ✅ Bereits implementiert in Kivy-App

- **Local Storage:** SQLite Datenbank (`mobile/storage/sqlite_adapter.py`)
- **Templates:** Lokal eingebettet als JSON-Dateien
- **State Management:** In-Memory Store (`mobile/store.py`)
- **Keine Server-Abhängigkeiten:** Backend-Module werden als Python-Imports genutzt

**Kein Netzwerk nötig**, außer für zukünftige Features:
- Backup/Sync (optional)
- AI-Features (optional)

---

## 6. Build-Prozess (Definition of Done)

### Voraussetzungen (Linux):
```bash
# Python 3.9+
sudo apt-get install python3 python3-pip

# Buildozer Dependencies
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

# Buildozer installieren
pip3 install --user buildozer
pip3 install --user cython
```

### APK Build:
```bash
cd gamex/mobile

# Debug APK (für Tests)
buildozer android debug

# Release APK (für Produktion)
buildozer android release

# APK-Dateien finden:
# Debug:   mobile/bin/gamex-1.0.0-armeabi-v7a-debug.apk
# Release: mobile/bin/gamex-1.0.0-armeabi-v7a-release.apk
```

### Testen:
```bash
# APK auf Gerät installieren (ADB)
adb install mobile/bin/gamex-1.0.0-armeabi-v7a-debug.apk

# Oder: APK manuell auf Gerät kopieren und installieren
```

---

## 7. Änderungslog (Was wurde entfernt)

### Komplett gelöscht:
- ❌ `apps/web/` - Alte Web-App
- ❌ `apps/web-new/` - Neue Web-App (Vite, Preact, TypeScript, Tailwind)
- ❌ `apps/mobile/` - Capacitor Hybrid-App
- ❌ `backend/app/routes.py` - FastAPI Web-API
- ❌ `backend/app/main.py` - FastAPI Server
- ❌ `backend/app/__main__.py` - Server Entry Point
- ❌ `package.json`, `package-lock.json` - Node.js Dependencies
- ❌ `.nvmrc` - Node Version Manager Config

### Bereinigt:
- ✅ `backend/requirements.txt` - FastAPI/Uvicorn entfernt
- ✅ `mobile/requirements.txt` - Minimal Dependencies
- ✅ Root-Level Dokumentation - Web-Referenzen entfernt

### Behalten (wiederverwendbar):
- ✅ `mobile/` - Komplette Kivy-App
- ✅ `backend/app/core/` - Vergleichs- und Validierungslogik
- ✅ `backend/app/templates/` - JSON Templates
- ✅ `backend/app/models.py` - Data Models

---

## 8. Nächste Schritte (nach Conversion)

1. ✅ Build testen: `buildozer android debug`
2. ✅ APK auf Test-Gerät installieren
3. ✅ Alle Features testen (Offline-Modus)
4. ⚠️ UI/UX Mobile-Optimierung prüfen:
   - Touch-Targets groß genug?
   - Navigation klar?
   - Buttons beschriftet?
5. 🔄 Performance-Test auf echtem Android-Gerät

---

**Status:** Bereit für Implementierung ✅
**Build-Weg:** Kivy + Buildozer (APK-only) ✅
**Keine Web-Dependencies mehr:** Garantiert ✅
