# APK Build Guide für Intimacy Tool

Dies ist eine Schritt-für-Schritt Anleitung, um eine signierte Android APK für Sideloading (ohne Google Play Store) zu erstellen.

## Übersicht

- **Projekt-Typ:** Python/FastAPI Web-Anwendung mit statischem Frontend
- **Verpackung:** Capacitor (empfohlen für Web-Apps)
- **Signierung:** Keystore-basierte Signierung für Release APKs
- **Distribution:** Sideloading (direkte APK-Installation)

## Voraussetzungen

### Betriebssystem
- Linux (Ubuntu 22.04+ empfohlen), macOS oder Windows mit WSL2

### Installierte Software

```bash
# Prüfen der Versionen
java -version              # JDK 17 empfohlen
node -v                    # Node.js 18+ oder 20+ LTS
npm -v                     # NPM 9+
python3 --version          # Python 3.10+
```

### Android SDK Setup

```bash
# 1. Android Command Line Tools herunterladen
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip

# 2. Installieren
mkdir -p ~/Android/cmdline-tools
unzip commandlinetools-linux-9477386_latest.zip -d ~/Android/cmdline-tools
mv ~/Android/cmdline-tools/cmdline-tools ~/Android/cmdline-tools/latest

# 3. Umgebungsvariablen setzen (in ~/.bashrc oder ~/.zshrc hinzufügen)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# 4. Lizenzen akzeptieren und SDK installieren
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

### ADB (Android Debug Bridge)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install android-tools-adb

# macOS
brew install android-platform-tools
```

## Schnellstart

### 1. Projekt initialisieren

```bash
# Repository klonen
git clone https://github.com/daydaylx/gamex.git
cd gamex

# Python Environment setup
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Node.js Abhängigkeiten installieren
npm install

# Capacitor initialisieren
npx cap init "Intimacy Tool" "com.intimacytool.app"

# Android Plattform hinzufügen
npx cap add android
```

### 2. Debug APK erstellen (für Tests)

```bash
# Backend lokal starten (in separatem Terminal)
python -m app

# Web-Dateien syncen
npx cap sync android

# Android Projekt öffnen (öffnet Android Studio)
npx cap open android

# In Android Studio:
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

Oder über CLI:

```bash
cd android
./gradlew assembleDebug

# Debug APK finden
ls app/build/outputs/apk/debug/app-debug.apk
```

### 3. Release APK erstellen (signiert)

**WICHTIG:** Für Release APKs muss ein Keystore erstellt werden.

```bash
# Methode 1: Automatisch mit build-release.sh
export KEYSTORE_PASSWORD='dein_sicheres_password'
export KEY_PASSWORD='dein_sicheres_key_password'
./build-release.sh

# Methode 2: Manuelles Vorgehen
# Keystore erstellen (einmalig)
mkdir -p secure
keytool -genkey -v \
    -keystore secure/intimacy-tool.keystore \
    -alias intimacy \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000

# signingConfigs in android/app/build.gradle konfigurieren
# (siehe unten: "Signing Konfiguration")

# Release Build
cd android
./gradlew assembleRelease

# Release APK finden
ls app/build/outputs/apk/release/app-release.apk
```

## Signing Konfiguration

### build.gradle anpassen

Öffne `android/app/build.gradle` und füge die signingConfigs hinzu:

```gradle
android {
    // ... andere Konfigurationen ...

    signingConfigs {
        release {
            storeFile file("../../secure/intimacy-tool.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: project.hasProperty("keystorePassword") ? project.keystorePassword : ""
            keyAlias "intimacy"
            keyPassword System.getenv("KEY_PASSWORD") ?: project.hasProperty("keyPassword") ? project.keyPassword : ""
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            signingConfig signingConfigs.debug
        }
    }
}
```

### Sichere Passwort-Verwaltung

```bash
# Methode 1: Umgebungsvariablen (empfohlen)
export KEYSTORE_PASSWORD='password123'
export KEY_PASSWORD='keypass123'

# Methode 2: Gradle Properties (nicht committen!)
# android/gradle.properties erstellen
keystorePassword=password123
keyPassword=keypass123

# Methode 3: Interaktiv während Build
./build-release.sh  # fragt nach Passwörtern
```

**WICHTIG:** Keystore und Passwörter niemals in Git committen! Siehe `.gitignore`.

## APK auf Gerät installieren

### Via ADB (für Entwicklung)

```bash
# Gerät per USB verbinden
# USB-Debugging auf Gerät aktivieren

# Installieren
adb install app-debug.apk         # für Debug
adb install app-release.apk        # für Release

# Prüfen ob installiert
adb shell pm list packages | grep intimacy
```

### Via Dateitransfer (für Distribution)

1. APK auf Gerät kopieren (z.B. per Email, Cloud, USB)
2. APK auf Gerät öffnen
3. "Unbekannte Quellen" in Einstellungen erlauben:
   - Einstellungen > Sicherheit > Unbekannte Quellen
4. APK installieren
5. App öffnen

## Versionierung und Updates

### Version Code/Name

In `android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId "com.intimacytool.app"
    minSdkVersion 26
    targetSdkVersion 34
    versionCode 1        // Ganzzahl, bei jedem Release erhöhen
    versionName "1.0.0"  // Menschenlesbar (MAJOR.MINOR.PATCH)
}
```

### Update-Strategie ohne Play Store

1. **In-App Update-Check** (optional):
   - API-Endpoint `/api/version` hinzufügen
   - App prüft beim Start
   - Zeigt Download-Link für neue Version

2. **Benachrichtigungen**:
   - E-Mail-Newsletter
   - Release-Notes auf GitHub
   - Web-Seite mit Download-Links

3. **APK-Namenskonvention**:
   ```
   intimacy-tool-v1.0.0.apk
   intimacy-tool-v1.1.0.apk
   intimacy-tool-v2.0.0.apk
   ```

## Fehlerbehebung

### Backend nicht erreichbar

**Symptom:** App zeigt "Verbindungsfehler"

**Lösung:**
```bash
# Backend muss laufen
python -m app

# Prüfen ob Port 8000 erreichbar
curl http://127.0.0.1:8000
```

### CORS-Probleme

**Symptom:** API-Aufrufe scheitern in Konsole

**Lösung:** CORS-Middleware in `app/main.py` hinzufügen:

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=APP_TITLE)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Build-Fehler: Gradle

**Symptom:** Gradle Build schlägt fehl

**Lösung:**
```bash
# Gradle Wrapper neu generieren
cd android
gradle wrapper

# Android SDK prüfen
sdkmanager --list_installed

# Build-Cache löschen
./gradlew clean
```

### Signing-Fehler

**Symptom:** "Keystore password was incorrect"

**Lösung:**
```bash
# Passwörter prüfen
echo $KEYSTORE_PASSWORD
echo $KEY_PASSWORD

# Keystore prüfen
keytool -list -v -keystore secure/intimacy-tool.keystore
```

## Validierungs-Checkliste

Vor Release:

- [ ] App installiert sich ohne Fehler
- [ ] App startet in <5 Sekunden
- [ ] Backend-Verbindung funktioniert
- [ ] Sessions können erstellt werden
- [ ] Fragebogen kann ausgefüllt werden
- [ ] Vergleich wird angezeigt
- [ ] Export-Funktionen arbeiten
- [ ] App verhält sich korrekt ohne Backend (Fehlermeldung)
- [ ] Keine Memory Leaks (langlaufende Session testen)
- [ ] APK hat SHA-256 Checksumme

## Distribution

### Checksumme erstellen

```bash
sha256sum intimacy-tool-v1.0.0.apk > intimacy-tool-v1.0.0.apk.sha256

# Prüfen
sha256sum -c intimacy-tool-v1.0.0.apk.sha256
```

### Upload zu Cloud Storage

```bash
# Beispiel für verschiedene Cloud-Provider

# AWS S3
aws s3 cp intimacy-tool-v1.0.0.apk s3://my-bucket/

# Google Cloud Storage
gsutil cp intimacy-tool-v1.0.0.apk gs://my-bucket/

# GitHub Releases
gh release create v1.0.0 \
  --title "Intimacy Tool v1.0.0" \
  --notes "Release Notes hier..." \
  intimacy-tool-v1.0.0.apk
```

### Download-Link teilen

- E-Mail mit Download-Link
- Web-Seite mit Release-Notes
- QR-Code für schnellen Download

## Sicherheit

### Keystore Backup

```bash
# Keystore sicher aufbewahren!
cp secure/intimacy-tool.keystore ~/backup/
cp secure/intimacy-tool.keystore /path/to/secure/external/drive/

# Wenn Keystore verloren geht, können Updates nicht installiert werden!
```

### Passwörter

- Passwörter in Passwort-Manager speichern
- Niemals in Git committen
- Regelmäßig Passwörter ändern (bei Bedarf)

### APK Integrität

- Immer SHA-256 Checksumme bereitstellen
- APK von offiziellen Quellen laden
- Nur signierte APKs verteilen

## Zusätzliche Ressourcen

- [Capacitor Dokumentation](https://capacitorjs.com/docs)
- [Android Build Guide](https://developer.android.com/studio/build)
- [Keystore Best Practices](https://developer.android.com/studio/publish/app-signing#secure-key)

## Support

Bei Problemen:
1. Logs prüfen: `adb logcat`
2. Gradle Logs: `android/build/outputs/logs/`
3. Backend Logs: `logs/combined.log`

---

**Letztes Update:** 2025-12-23