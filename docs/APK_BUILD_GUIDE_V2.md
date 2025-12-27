# APK Build Guide für Intimacy Tool (v2)

Vollständige Anleitung für die Erstellung signierter Android APKs.

## 📋 Übersicht

| Aspekt | Details |
|--------|---------|
| **Projekt-Typ** | Capacitor Web-App (Preact + FastAPI) |
| **Min. Android** | 7.0 (API 24) |
| **Target Android** | 14 (API 34) |
| **Compile SDK** | 15 (API 35) |
| **Distribution** | Sideloading (ohne Play Store) |

---

## 🛠️ Voraussetzungen

### Software-Versionen

```bash
# Prüfen:
java -version          # JDK 17+ erforderlich
node -v                # Node.js 20+ LTS empfohlen
npm -v                 # NPM 10+
```

### Android SDK Installation

```bash
# Option 1: Android Studio (empfohlen für Debugging)
# Download: https://developer.android.com/studio

# Option 2: Command Line Tools
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
mkdir -p ~/Android/cmdline-tools
unzip commandlinetools-linux-*.zip -d ~/Android/cmdline-tools
mv ~/Android/cmdline-tools/cmdline-tools ~/Android/cmdline-tools/latest

# Umgebungsvariablen (~/.bashrc oder ~/.zshrc)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/build-tools/35.0.0

# SDK-Komponenten installieren
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
```

---

## 🚀 Schnellstart

### Einmalige Einrichtung

```bash
# Repository klonen
git clone https://github.com/daydaylx/gamex.git
cd gamex

# Mobile-App vorbereiten
cd apps/mobile
npm install
npx cap sync android
cd ../..
```

### APK bauen

```bash
# Methode 1: Automatisches Build-Script (empfohlen)
cd apps/mobile
export KEYSTORE_PASSWORD='dein_password'
export KEY_PASSWORD='dein_key_password'
./build-release-v2.sh

# Methode 2: Manuell
cd android
./gradlew assembleRelease \
    -PkeystorePassword="$KEYSTORE_PASSWORD" \
    -PkeyPassword="$KEY_PASSWORD"
```

---

## 🔐 Keystore-Management

### Neuen Keystore erstellen

```bash
mkdir -p android/keystore
keytool -genkey -v \
    -keystore android/keystore/release.keystore \
    -alias release \
    -keyalg RSA \
    -keysize 4096 \
    -validity 10000 \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "CN=Intimacy Tool, OU=Dev, O=Intimacy Tool, L=Berlin, C=DE"
```

### ⚠️ Sicherheitshinweise

1. **Keystore sicher aufbewahren** - Bei Verlust können Updates nicht mehr signiert werden
2. **Passwörter nie im Code speichern** - Nur Umgebungsvariablen oder CI/CD Secrets
3. **Backup erstellen** - Keystore und Passwörter an sicherem Ort speichern

### Passwort-Management

```bash
# Option 1: Umgebungsvariablen (lokal)
export KEYSTORE_PASSWORD='...'
export KEY_PASSWORD='...'

# Option 2: GitHub Actions Secrets (CI/CD)
# Repository → Settings → Secrets and variables → Actions
# - KEYSTORE_BASE64 (base64 -w0 release.keystore)
# - KEYSTORE_PASSWORD
# - KEY_PASSWORD

# Option 3: Interaktiv (Build-Script fragt nach)
./build-release-v2.sh
```

---

## 📦 Build-Varianten

### Debug APK (für Entwicklung)

```bash
cd android
./gradlew assembleDebug

# APK: app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (für Distribution)

```bash
./build-release-v2.sh

# APK: apps/mobile/releases/intimacy-tool-vX.Y.Z-N.apk
```

### Clean Build (bei Problemen)

```bash
CLEAN_BUILD=true ./build-release-v2.sh
```

---

## 📱 Installation auf Gerät

### Via ADB (Entwickler)

```bash
# Gerät verbinden, USB-Debugging aktivieren
adb devices  # Gerät sollte erscheinen
adb install apps/mobile/releases/intimacy-tool-v*.apk
```

### Via Dateitransfer (Endnutzer)

1. APK auf Gerät kopieren (USB, Cloud, E-Mail)
2. Auf Gerät: **Einstellungen → Sicherheit → Unbekannte Quellen erlauben**
3. APK-Datei öffnen und installieren

### SHA256-Verifizierung

```bash
# Auf Build-Maschine:
sha256sum intimacy-tool-v*.apk

# Auf Gerät (Termux oder ähnlich):
sha256sum /sdcard/Download/intimacy-tool-*.apk

# Checksummen müssen übereinstimmen!
```

---

## 🔄 CI/CD mit GitHub Actions

Automatische Builds bei Tag-Erstellung:

```bash
# Tag erstellen für Release
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3

# GitHub Action baut automatisch und erstellt Release
```

### Erforderliche Secrets

| Secret | Beschreibung |
|--------|--------------|
| `KEYSTORE_BASE64` | `base64 -w0 release.keystore` |
| `KEYSTORE_PASSWORD` | Keystore-Passwort |
| `KEY_PASSWORD` | Key-Passwort |

---

## 🐛 Troubleshooting

### "SDK location not found"

```bash
# android/local.properties erstellen
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

### "Keystore not found"

```bash
# Pfad prüfen
ls -la android/keystore/release.keystore

# Oder alternativen Pfad verwenden
ls -la secure/intimacy-tool.keystore
```

### Gradle-Fehler

```bash
# Gradle-Cache leeren
cd android
./gradlew clean
rm -rf ~/.gradle/caches

# Erneut bauen
./gradlew assembleRelease
```

### APK-Größe optimieren

Die `build.gradle` enthält bereits:
- `minifyEnabled true` - Code-Shrinking
- `shrinkResources true` - Ressourcen-Shrinking
- ProGuard-Optimierungen

Zusätzlich möglich:
```gradle
// In android/app/build.gradle
android {
    bundle {
        language { enableSplit = true }
        density { enableSplit = true }
        abi { enableSplit = true }
    }
}
```

---

## 📊 Build-Metriken

Das Build-Script protokolliert:
- Build-Dauer
- APK-Größe
- Version (Name + Code)
- SHA256-Checksumme

Log-Datei: `apps/mobile/build.log`

---

## 🔗 Nützliche Links

- [Capacitor Android Docs](https://capacitorjs.com/docs/android)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [ProGuard Manual](https://www.guardsquare.com/manual/configuration/usage)
