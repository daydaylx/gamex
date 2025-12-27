#!/bin/bash

# =============================================
# Intimacy Tool - APK Release Build Script v2
# =============================================
# Verbesserte Version mit:
# - CI/CD Unterstützung
# - Bessere Fehlerbehandlung
# - APK-Signatur-Verifizierung
# - Automatische Cleanup-Funktion
# - Build-Zeit-Tracking

set -euo pipefail  # Striktere Fehlerbehandlung

# =============================================
# KONFIGURATION
# =============================================
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$SCRIPT_DIR/../.."
readonly ANDROID_DIR="$PROJECT_ROOT/android"
readonly VERSION_FILE="$ANDROID_DIR/version.properties"
readonly OUTPUT_DIR="$SCRIPT_DIR/releases"
readonly LOG_FILE="$SCRIPT_DIR/build.log"

# Farben für Ausgabe
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Build-Zeit-Tracking
BUILD_START=$(date +%s)

# =============================================
# HILFSFUNKTIONEN
# =============================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        INFO)  echo -e "${GREEN}[INFO]${NC} $message" ;;
        WARN)  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} $message" ;;
        DEBUG) echo -e "${BLUE}[DEBUG]${NC} $message" ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

cleanup() {
    log INFO "Cleanup wird ausgeführt..."
    # Temporäre Dateien entfernen
    rm -f "$SCRIPT_DIR"/*.tmp 2>/dev/null || true
    
    # Build-Dauer berechnen
    local BUILD_END=$(date +%s)
    local BUILD_DURATION=$((BUILD_END - BUILD_START))
    log INFO "Build-Dauer: ${BUILD_DURATION}s"
}

trap cleanup EXIT

check_prerequisites() {
    log INFO "Prüfe Voraussetzungen..."
    
    local missing=()
    
    # Java prüfen
    if ! command -v java &> /dev/null; then
        missing+=("Java JDK")
    else
        local java_version=$(java -version 2>&1 | head -n1)
        log DEBUG "Java: $java_version"
    fi
    
    # Node.js prüfen
    if ! command -v node &> /dev/null; then
        missing+=("Node.js")
    else
        log DEBUG "Node.js: $(node -v)"
    fi
    
    # npx prüfen
    if ! command -v npx &> /dev/null; then
        missing+=("npx")
    fi
    
    # keytool prüfen (für Keystore)
    if ! command -v keytool &> /dev/null; then
        missing+=("keytool (JDK)")
    fi
    
    # jq prüfen (optional aber empfohlen)
    if ! command -v jq &> /dev/null; then
        log WARN "jq nicht installiert - Version-Sync eingeschränkt"
    fi
    
    # apksigner prüfen (für Signatur-Verifizierung)
    if ! command -v apksigner &> /dev/null && [ -z "${ANDROID_HOME:-}" ]; then
        log WARN "apksigner nicht gefunden - Signatur-Verifizierung übersprungen"
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        log ERROR "Fehlende Abhängigkeiten: ${missing[*]}"
        exit 1
    fi
    
    log INFO "Alle Voraussetzungen erfüllt ✓"
}

setup_keystore() {
    log INFO "Keystore-Konfiguration..."
    
    # Keystore-Pfade prüfen
    local keystore_paths=(
        "$ANDROID_DIR/keystore/release.keystore"
        "$PROJECT_ROOT/secure/intimacy-tool.keystore"
    )
    
    KEYSTORE_PATH=""
    for path in "${keystore_paths[@]}"; do
        if [ -f "$path" ]; then
            KEYSTORE_PATH="$path"
            log INFO "Keystore gefunden: $path"
            break
        fi
    done
    
    if [ -z "$KEYSTORE_PATH" ]; then
        log WARN "Kein Keystore gefunden"
        
        # CI-Modus: Abbruch wenn nicht interaktiv
        if [ "${CI:-false}" = "true" ]; then
            log ERROR "CI-Modus: Keystore muss existieren"
            exit 1
        fi
        
        echo -e "${YELLOW}Neuen Keystore erstellen? (j/n)${NC}"
        read -r CREATE_KEYSTORE
        
        if [[ "$CREATE_KEYSTORE" =~ ^[jJyY]$ ]]; then
            create_keystore
        else
            log ERROR "Build ohne Keystore nicht möglich"
            exit 1
        fi
    fi
    
    # Passwörter prüfen/einlesen
    if [ -z "${KEYSTORE_PASSWORD:-}" ] || [ -z "${KEY_PASSWORD:-}" ]; then
        if [ "${CI:-false}" = "true" ]; then
            log ERROR "CI-Modus: KEYSTORE_PASSWORD und KEY_PASSWORD müssen gesetzt sein"
            exit 1
        fi
        
        log INFO "Keystore-Passwörter eingeben:"
        read -s -p "Keystore Password: " KEYSTORE_PASSWORD
        echo
        read -s -p "Key Password: " KEY_PASSWORD
        echo
    fi
    
    export KEYSTORE_PASSWORD
    export KEY_PASSWORD
}

create_keystore() {
    mkdir -p "$ANDROID_DIR/keystore"
    KEYSTORE_PATH="$ANDROID_DIR/keystore/release.keystore"
    
    log INFO "Erstelle neuen Keystore..."
    
    if [ -z "${KEYSTORE_PASSWORD:-}" ]; then
        read -s -p "Neues Keystore-Passwort: " KEYSTORE_PASSWORD
        echo
        read -s -p "Neues Key-Passwort: " KEY_PASSWORD
        echo
    fi
    
    keytool -genkey -v \
        -keystore "$KEYSTORE_PATH" \
        -alias release \
        -keyalg RSA \
        -keysize 4096 \
        -validity 10000 \
        -storepass "$KEYSTORE_PASSWORD" \
        -keypass "$KEY_PASSWORD" \
        -dname "CN=Intimacy Tool, OU=Development, O=Intimacy Tool, L=Berlin, ST=Berlin, C=DE"
    
    log INFO "Keystore erstellt: $KEYSTORE_PATH"
    log WARN "WICHTIG: Keystore sicher aufbewahren! Bei Verlust können Updates nicht mehr signiert werden."
}

increment_version() {
    log INFO "Version inkrementieren..."
    
    # Version.properties erstellen falls nicht vorhanden
    if [ ! -f "$VERSION_FILE" ]; then
        cat > "$VERSION_FILE" << EOF
# Version Management für Intimacy Tool APK
# Format: Semantic Versioning (MAJOR.MINOR.PATCH)
versionCode=1
versionName=1.0.0
EOF
        log INFO "version.properties erstellt"
    fi
    
    # Aktuelle Version lesen
    local current_code=$(grep "^versionCode=" "$VERSION_FILE" | cut -d'=' -f2)
    local current_name=$(grep "^versionName=" "$VERSION_FILE" | cut -d'=' -f2)
    
    # Version Code erhöhen
    local new_code=$((current_code + 1))
    
    # Version Name erhöhen (Patch-Version)
    IFS='.' read -ra parts <<< "$current_name"
    local major=${parts[0]:-1}
    local minor=${parts[1]:-0}
    local patch=${parts[2]:-0}
    patch=$((patch + 1))
    local new_name="$major.$minor.$patch"
    
    # In Datei schreiben
    cat > "$VERSION_FILE" << EOF
# Version Management für Intimacy Tool APK
# Automatisch aktualisiert: $(date '+%Y-%m-%d %H:%M:%S')
# Build-System: $(hostname)
versionCode=$new_code
versionName=$new_name
EOF
    
    # Capacitor config.json aktualisieren
    if command -v jq &> /dev/null && [ -f "$SCRIPT_DIR/capacitor.config.json" ]; then
        jq ".version = \"$new_name\"" "$SCRIPT_DIR/capacitor.config.json" > "$SCRIPT_DIR/capacitor.config.json.tmp"
        mv "$SCRIPT_DIR/capacitor.config.json.tmp" "$SCRIPT_DIR/capacitor.config.json"
    fi
    
    log INFO "Version: $current_name (Code: $current_code) → $new_name (Code: $new_code)"
    
    export VERSION_NAME="$new_name"
    export VERSION_CODE="$new_code"
}

build_web() {
    log INFO "Web-Frontend synchronisieren..."
    
    cd "$SCRIPT_DIR"
    
    # Optional: Web-Build ausführen falls vorhanden
    if [ -f "$PROJECT_ROOT/apps/web-new/package.json" ]; then
        log INFO "Web-Frontend bauen..."
        cd "$PROJECT_ROOT/apps/web-new"
        npm ci --prefer-offline 2>/dev/null || npm install
        npm run build || log WARN "Web-Build fehlgeschlagen - verwende bestehende Dateien"
        cd "$SCRIPT_DIR"
    fi
    
    # Capacitor sync
    log INFO "Capacitor sync..."
    npx cap sync android
}

build_apk() {
    log INFO "APK bauen..."
    
    cd "$ANDROID_DIR"
    
    # Gradle Wrapper prüfen
    if [ ! -f "gradlew" ]; then
        log ERROR "Gradle Wrapper nicht gefunden"
        exit 1
    fi
    
    chmod +x gradlew
    
    # Clean Build (optional für sauberen Release)
    if [ "${CLEAN_BUILD:-false}" = "true" ]; then
        log INFO "Clean Build..."
        ./gradlew clean
    fi
    
    # Release Build
    ./gradlew assembleRelease \
        -PkeystorePassword="$KEYSTORE_PASSWORD" \
        -PkeyPassword="$KEY_PASSWORD" \
        -PkeystoreAlias="release" \
        -PkeystorePath="$KEYSTORE_PATH" \
        --no-daemon \
        --warning-mode all
    
    log INFO "Gradle Build abgeschlossen ✓"
}

verify_and_copy_apk() {
    log INFO "APK verifizieren und kopieren..."
    
    local apk_source="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
    
    if [ ! -f "$apk_source" ]; then
        log ERROR "APK nicht gefunden: $apk_source"
        exit 1
    fi
    
    # Output-Verzeichnis erstellen
    mkdir -p "$OUTPUT_DIR"
    
    # APK umbenennen und kopieren
    local apk_name="intimacy-tool-v${VERSION_NAME}-${VERSION_CODE}.apk"
    local apk_dest="$OUTPUT_DIR/$apk_name"
    cp "$apk_source" "$apk_dest"
    
    # APK auch ins Hauptverzeichnis kopieren (Kompatibilität)
    cp "$apk_source" "$SCRIPT_DIR/$apk_name"
    
    # Signatur verifizieren
    if command -v apksigner &> /dev/null; then
        log INFO "Signatur verifizieren..."
        apksigner verify --verbose "$apk_dest" 2>&1 | head -5 || log WARN "Signatur-Verifizierung fehlgeschlagen"
    elif [ -n "${ANDROID_HOME:-}" ] && [ -f "$ANDROID_HOME/build-tools/34.0.0/apksigner" ]; then
        "$ANDROID_HOME/build-tools/34.0.0/apksigner" verify "$apk_dest" && log INFO "Signatur OK ✓"
    fi
    
    # Checksummen erstellen
    sha256sum "$apk_dest" > "$apk_dest.sha256"
    sha256sum "$SCRIPT_DIR/$apk_name" > "$SCRIPT_DIR/$apk_name.sha256"
    
    # APK-Größe
    local apk_size=$(du -h "$apk_dest" | cut -f1)
    
    log INFO "═══════════════════════════════════════"
    log INFO "BUILD ERFOLGREICH"
    log INFO "═══════════════════════════════════════"
    log INFO "APK: $apk_name"
    log INFO "Größe: $apk_size"
    log INFO "Pfad: $apk_dest"
    log INFO "SHA256: $(cat "$apk_dest.sha256" | cut -d' ' -f1)"
    log INFO "═══════════════════════════════════════"
    
    export APK_PATH="$apk_dest"
}

# =============================================
# MAIN
# =============================================

main() {
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════╗"
    echo "║  Intimacy Tool - APK Release Build v2  ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Log-Datei initialisieren
    echo "=== Build gestartet: $(date) ===" > "$LOG_FILE"
    
    cd "$SCRIPT_DIR"
    
    check_prerequisites
    setup_keystore
    increment_version
    build_web
    build_apk
    verify_and_copy_apk
    
    echo ""
    echo -e "${GREEN}Nächste Schritte:${NC}"
    echo "  1. APK auf Android-Gerät übertragen: adb install $APK_PATH"
    echo "  2. Oder: APK per USB/Cloud auf Gerät kopieren"
    echo "  3. 'Unbekannte Quellen' in Android-Einstellungen erlauben"
    echo ""
}

# Script ausführen
main "$@"
