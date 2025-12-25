#!/bin/bash

# Android SDK Installation Script
set -e

ANDROID_HOME="$HOME/Android/Sdk"
CMDLINE_TOOLS="$ANDROID_HOME/cmdline-tools/latest"

# Lizenzen automatisch akzeptieren
echo "Akzeptiere Android SDK Lizenzen..."
mkdir -p "$ANDROID_HOME/licenses"
echo "24333f8a63b6825ea9c5514f83c2829b004d1ee" > "$ANDROID_HOME/licenses/android-sdk-license"
echo "84831b9409646a918e30573bab4c9c91346d8abd" > "$ANDROID_HOME/licenses/android-sdk-preview-license"
echo "d56f51874794513e8f984bed6fe80f6737651472" > "$ANDROID_HOME/licenses/google-android-ndk-license"
echo "33b6a2b64607e8e9708180517c0f3b6d2aa604f9" > "$ANDROID_HOME/licenses/google-android-studio-license"
echo "b6029e08f1a93c7050f972cdd587c03b6c39469" > "$ANDROID_HOME/licenses/intel-android-extra-license"

echo "Lizenzen akzeptiert."

# SDK Pakete installieren
echo "Installiere Android SDK Pakete..."
$CMDLINE_TOOLS/bin/sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

echo ""
echo "=== Android SDK erfolgreich installiert ==="
echo "ANDROID_HOME: $ANDROID_HOME"
echo "PATH muss enthalten: $PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"
echo ""
echo "Füge dies zu ~/.bashrc oder ~/.zshrc hinzu:"
echo 'export ANDROID_HOME=$HOME/Android/Sdk'
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin'