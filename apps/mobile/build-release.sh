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

# Keystore-Pfad prüfen
KEYSTORE_PATH="secure/intimacy-tool.keystore"
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo -e "${YELLOW}Keystore nicht gefunden: $KEYSTORE_PATH${NC}"
    echo -e "${YELLOW}Neuen Keystore erstellen? (j/n)${NC}"
    read -r CREATE_KEYSTORE
    
    if [ "$CREATE_KEYSTORE" = "j" ] || [ "$CREATE_KEYSTORE" = "J" ]; then
        mkdir -p secure
        echo -e "${GREEN}Erstelle neuen Keystore...${NC}"
        keytool -genkey -v \
            -keystore "$KEYSTORE_PATH" \
            -alias intimacy \
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

# Version erhöhen
if [ -f "android/app/build.gradle" ]; then
    echo -e "${GREEN}Version automatisch erhöhen...${NC}"
    # Version Logik könnte hier implementiert werden
    VERSION_DATE=$(date +%Y%m%d)
else
    echo -e "${YELLOW}Android Projekt noch nicht initialisiert${NC}"
    echo -e "${YELLOW}Führe zuerst 'npm install' und 'npx cap add android' aus${NC}"
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

# Build mit Passwörtern
./gradlew assembleRelease \
    -PkeystorePassword="$KEYSTORE_PASSWORD" \
    -PkeyPassword="$KEY_PASSWORD"

# APK kopieren und umbenennen
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    VERSION="v$(date +%Y.%m.%d)"
    APK_NAME="intimacy-tool-$VERSION.apk"
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
echo "4. Backend starten: python -m app"