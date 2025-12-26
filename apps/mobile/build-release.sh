#!/bin/bash

# Intimacy Tool - APK Release Build Script
# Dieses Skript erstellt eine signierte Release APK für Sideloading

set -e  # Beenden bei Fehlern

# Farben für Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Intimacy Tool - APK Release Build ===${NC}"

# Prüfen ob Keystore-Passwörter gesetzt sind
if [ -z "$KEYSTORE_PASSWORD" ] || [ -z "$KEY_PASSWORD" ]; then
    echo -e "${RED}Fehler: Keystore-Passwörter nicht gesetzt${NC}"
    echo -e "${YELLOW}Bitte Umgebungsvariablen setzen:${NC}"
    echo "  export KEYSTORE_PASSWORD='dein_keystore_password'"
    echo "  export KEY_PASSWORD='dein_key_password'"
    echo ""
    echo -e "${YELLOW}Oder Passwörter interaktiv eingeben:${NC}"
    read -s -p "Keystore Password: " KEYSTORE_PASSWORD
    echo ""
    read -s -p "Key Password: " KEY_PASSWORD
    echo ""
fi

# Keystore-Pfad prüfen (konsistent mit build.gradle)
KEYSTORE_PATH="../../android/keystore/release.keystore"
if [ ! -f "$KEYSTORE_PATH" ]; then
    # Alternative: secure/intimacy-tool.keystore
    ALTERNATIVE_KEYSTORE="../../secure/intimacy-tool.keystore"
    if [ -f "$ALTERNATIVE_KEYSTORE" ]; then
        KEYSTORE_PATH="$ALTERNATIVE_KEYSTORE"
        echo -e "${GREEN}Verwende alternativen Keystore: $KEYSTORE_PATH${NC}"
    else
        echo -e "${YELLOW}Keystore nicht gefunden: $KEYSTORE_PATH${NC}"
        echo -e "${YELLOW}Neuen Keystore erstellen? (j/n)${NC}"
        read -r CREATE_KEYSTORE
        
        if [ "$CREATE_KEYSTORE" = "j" ] || [ "$CREATE_KEYSTORE" = "J" ]; then
            mkdir -p ../../android/keystore
            echo -e "${GREEN}Erstelle neuen Keystore...${NC}"
            keytool -genkey -v \
                -keystore "$KEYSTORE_PATH" \
                -alias release \
                -keyalg RSA \
                -keysize 2048 \
                -validity 10000 \
                -storepass "$KEYSTORE_PASSWORD" \
                -keypass "$KEY_PASSWORD" \
                -dname "CN=Intimacy Tool, OU=Development, O=Intimacy Tool, L=City, ST=State, C=DE"
            echo -e "${GREEN}Keystore erstellt: $KEYSTORE_PATH${NC}"
        else
            echo -e "${RED}Build abgebrochen${NC}"
            exit 1
        fi
    fi
fi

# Version automatisch erhöhen
VERSION_FILE="../../android/version.properties"
if [ ! -f "$VERSION_FILE" ]; then
    echo -e "${YELLOW}Version-Datei nicht gefunden, erstelle neue...${NC}"
    mkdir -p ../../android
    cat > "$VERSION_FILE" << EOF
# Version Management für Intimacy Tool APK
versionCode=1
versionName=1.0.0
EOF
fi

# Version aus Datei lesen und erhöhen
CURRENT_VERSION_CODE=$(grep "^versionCode=" "$VERSION_FILE" | cut -d'=' -f2)
CURRENT_VERSION_NAME=$(grep "^versionName=" "$VERSION_FILE" | cut -d'=' -f2)

# Version Code erhöhen
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))

# Version Name parsen und erhöhen (Semantic Versioning: MAJOR.MINOR.PATCH)
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION_NAME"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]:-0}

# Patch-Version erhöhen
PATCH=$((PATCH + 1))
NEW_VERSION_NAME="$MAJOR.$MINOR.$PATCH"

# Version in Datei schreiben
cat > "$VERSION_FILE" << EOF
# Version Management für Intimacy Tool APK
# Automatisch aktualisiert am $(date +%Y-%m-%d\ %H:%M:%S)
versionCode=$NEW_VERSION_CODE
versionName=$NEW_VERSION_NAME
EOF

echo -e "${GREEN}Version erhöht:${NC}"
echo -e "  Alte Version: $CURRENT_VERSION_NAME (Code: $CURRENT_VERSION_CODE)"
echo -e "  Neue Version: $NEW_VERSION_NAME (Code: $NEW_VERSION_CODE)"

# Capacitor config.json synchronisieren
CAPACITOR_CONFIG="capacitor.config.json"
if [ -f "$CAPACITOR_CONFIG" ]; then
    # Version in capacitor.config.json aktualisieren (nur versionName, nicht versionCode)
    if command -v jq &> /dev/null; then
        jq ".version = \"$NEW_VERSION_NAME\"" "$CAPACITOR_CONFIG" > "$CAPACITOR_CONFIG.tmp" && mv "$CAPACITOR_CONFIG.tmp" "$CAPACITOR_CONFIG"
        echo -e "${GREEN}Capacitor config.json aktualisiert${NC}"
    else
        echo -e "${YELLOW}jq nicht installiert, capacitor.config.json wird nicht aktualisiert${NC}"
        echo -e "${YELLOW}Bitte manuell aktualisieren: version = \"$NEW_VERSION_NAME\"${NC}"
    fi
fi

# Capacitor sync
echo -e "${GREEN}Capacitor sync ausführen...${NC}"
npx cap sync android

# Release Build
echo -e "${GREEN}Release APK erstellen...${NC}"
cd android

# Gradle Wrapper prüfen
if [ ! -f "gradlew" ]; then
    echo -e "${YELLOW}Gradle Wrapper nicht gefunden${NC}"
    echo -e "${YELLOW}Bitte 'gradle wrapper' ausführen oder Android Studio verwenden${NC}"
fi

# Build mit Passwörtern als Gradle-Properties
./gradlew assembleRelease \
    -PkeystorePassword="$KEYSTORE_PASSWORD" \
    -PkeyPassword="$KEY_PASSWORD" \
    -PkeystoreAlias="release" \
    -PkeystorePath="$KEYSTORE_PATH"

# APK kopieren und umbenennen
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    # Version aus version.properties lesen für Dateinamen
    APK_VERSION_NAME=$(grep "^versionName=" "$VERSION_FILE" | cut -d'=' -f2)
    APK_VERSION_CODE=$(grep "^versionCode=" "$VERSION_FILE" | cut -d'=' -f2)
    APK_NAME="intimacy-tool-v${APK_VERSION_NAME}-${APK_VERSION_CODE}.apk"
    cp app/build/outputs/apk/release/app-release.apk "../$APK_NAME"
    
    # Checksumme erstellen
    sha256sum "../$APK_NAME" > "../$APK_NAME.sha256"
    
    echo -e "${GREEN}=== Build erfolgreich ===${NC}"
    echo -e "${GREEN}APK: $APK_NAME${NC}"
    echo -e "${GREEN}SHA256: ${NC}"
    cat "../$APK_NAME.sha256"
else
    echo -e "${RED}Build fehlgeschlagen - APK nicht gefunden${NC}"
    exit 1
fi

cd ..

echo -e "${GREEN}=== Fertig ===${NC}"
echo -e "${YELLOW}Nächste Schritte:${NC}"
echo "1. APK auf Android-Gerät übertragen"
echo "2. 'Unbekannte Quellen' in Einstellungen erlauben"
echo "3. APK installieren"
echo "4. Backend starten: cd backend && python3 -m app"