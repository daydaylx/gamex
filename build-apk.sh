#!/bin/bash
# ============================================================================
# Build APK Script for Intimacy Tool
# Usage: ./build-apk.sh [debug|release]
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
WEB_NEW="$PROJECT_ROOT/apps/web-new"
ANDROID="$PROJECT_ROOT/android"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Intimacy Tool APK Builder          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

# Determine build type
BUILD_TYPE="${1:-release}"
echo -e "${YELLOW}Build type: $BUILD_TYPE${NC}"

# Step 1: Build web app
echo -e "\n${GREEN}[1/4] Building web app...${NC}"
cd "$WEB_NEW"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi
npm run build:mobile

# Step 2: Copy to android assets
echo -e "\n${GREEN}[2/4] Syncing to Android assets...${NC}"
ASSETS_PUBLIC="$ANDROID/app/src/main/assets/public"

# Clear old assets
rm -rf "$ASSETS_PUBLIC"
mkdir -p "$ASSETS_PUBLIC"

# Copy new build
cp -r "$WEB_NEW/dist/"* "$ASSETS_PUBLIC/"

# Update capacitor config in assets
echo -e "${YELLOW}Updating capacitor.config.json...${NC}"
cat > "$ANDROID/app/src/main/assets/capacitor.config.json" << 'EOF'
{
  "appId": "com.intimacytool.app",
  "appName": "Intimacy Tool",
  "webDir": "public",
  "bundledWebRuntime": false,
  "server": {
    "cleartext": true
  },
  "android": {},
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 0,
      "launchAutoHide": true,
      "backgroundColor": "#0f0a0f",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false,
      "splashFullScreen": true,
      "splashImmersive": true
    }
  }
}
EOF

# Step 3: Build APK
echo -e "\n${GREEN}[3/4] Building APK...${NC}"
cd "$ANDROID"

if [ "$BUILD_TYPE" = "release" ]; then
    ./gradlew assembleRelease
    APK_PATH="$ANDROID/app/build/outputs/apk/release/app-release.apk"
else
    ./gradlew assembleDebug
    APK_PATH="$ANDROID/app/build/outputs/apk/debug/app-debug.apk"
fi

# Step 4: Copy APK to apks folder
echo -e "\n${GREEN}[4/4] Copying APK...${NC}"
mkdir -p "$PROJECT_ROOT/apks"
VERSION=$(date +"%Y.%m.%d")
APK_NAME="intimacy-tool-v${VERSION}.apk"
cp "$APK_PATH" "$PROJECT_ROOT/apks/$APK_NAME"

echo -e "\n${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║             BUILD COMPLETE             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo -e "${BLUE}APK location: $PROJECT_ROOT/apks/$APK_NAME${NC}"
echo -e "${BLUE}Size: $(du -h "$PROJECT_ROOT/apks/$APK_NAME" | cut -f1)${NC}"

