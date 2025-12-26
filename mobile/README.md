# GameX Mobile - Kivy Android App

A native Android application for relationship communication and intimacy exploration, built with Kivy and Python.

## Features

- **Offline-First**: All data stored locally in SQLite
- **Native Performance**: Built with Kivy for smooth mobile experience
- **Privacy-Focused**: No cloud dependencies, data stays on device
- **Complete Workflow**: Session creation, questionnaires, comparison, scenarios
- **Export/Backup**: JSON and Markdown export functionality

## Architecture

```
mobile/
├── main.py                 # Kivy app entry point
├── store.py                # Central state management
├── screens/                # Screen implementations
│   ├── dashboard.py        # Main screen
│   ├── session_form.py     # Questionnaire interface
│   ├── compare_report.py   # Comparison results
│   ├── scenarios.py        # Scenario explorer
│   └── settings.py         # App settings
├── widgets/                # Reusable UI components
├── services/               # Business logic layer
│   ├── template_loader.py  # Template management
│   ├── compare_service.py  # Comparison logic
│   └── export_service.py   # Export functionality
├── storage/                # Data persistence
│   └── sqlite_adapter.py   # SQLite storage layer
└── assets/                 # Static resources
    ├── templates/          # Template JSON files
    └── icons/              # App icons
```

## Development Setup

### Prerequisites

1. **Python 3.11+**
   ```bash
   python --version  # Should be 3.11 or higher
   ```

2. **Install Buildozer** (for Android builds)
   ```bash
   # On Ubuntu/Debian
   sudo apt update
   sudo apt install -y git zip unzip openjdk-17-jdk python3-pip autoconf libtool pkg-config zlib1g-dev libncurses5-dev libncursesw5-dev libtinfo5 cmake libffi-dev libssl-dev

   pip install --user buildozer cython
   ```

3. **Install Development Dependencies**
   ```bash
   cd mobile
   pip install -r requirements.txt
   ```

### Running Locally (Desktop)

For development and testing, you can run the app on your desktop:

```bash
cd mobile
python main.py
```

Note: Desktop mode is for development only. Some mobile-specific features may not work.

## Building for Android

### First-Time Setup

1. **Configure Buildozer**

   The `buildozer.spec` file is pre-configured, but you may want to customize:
   - `title` - App display name
   - `package.name` - Package identifier
   - `package.domain` - Your domain (reverse DNS)
   - `version` - App version number

2. **Prepare Assets**

   Copy template files to mobile assets:
   ```bash
   # From project root
   cp -r backend/templates/*.json mobile/assets/templates/
   ```

3. **Add App Icon** (optional)

   Place your app icon at `mobile/assets/icon.png` (recommended: 512x512px)

### Build Commands

#### Debug Build (for testing)

```bash
cd mobile
buildozer android debug
```

This creates an APK in `mobile/bin/` that you can install on any Android device.

#### Release Build (for distribution)

```bash
cd mobile
buildozer android release
```

**Note**: Release builds need to be signed. See [Android Release Signing](#android-release-signing) below.

### Installing on Device

#### Via USB (ADB)

```bash
# Install debug build
buildozer android debug deploy run

# Or manually
adb install -r bin/gamex-1.0.0-debug.apk
```

#### Via File Transfer

1. Copy `bin/gamex-1.0.0-debug.apk` to your phone
2. Open the file on your phone
3. Allow installation from unknown sources if prompted
4. Install the app

## Android Release Signing

For Google Play or production distribution:

1. **Create a Keystore**

   ```bash
   keytool -genkey -v -keystore gamex-release-key.keystore -alias gamex -keyalg RSA -keysize 2048 -validity 10000
   ```

   **Important**: Keep this keystore file and password secure!

2. **Sign the APK**

   ```bash
   # Build unsigned release
   buildozer android release

   # Sign it
   jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore gamex-release-key.keystore bin/gamex-1.0.0-release-unsigned.apk gamex

   # Align the APK
   zipalign -v 4 bin/gamex-1.0.0-release-unsigned.apk bin/gamex-1.0.0-release.apk
   ```

## Configuration

### App Settings

Edit `buildozer.spec` to configure:

- **Permissions**: `android.permissions` (currently: INTERNET for optional sync)
- **Orientation**: `orientation` (currently: portrait)
- **API Level**: `android.api` and `android.minapi`
- **Architectures**: `android.archs` (currently: armeabi-v7a, arm64-v8a)

### Dependencies

Add Python packages to `requirements` in `buildozer.spec`:

```ini
requirements = python3,kivy==2.3.0,sqlite3,pydantic,requests
```

## Troubleshooting

### Build Errors

1. **"Command failed: ./distribute.sh"**

   Clean the build and try again:
   ```bash
   buildozer android clean
   buildozer android debug
   ```

2. **"SDK/NDK not found"**

   Buildozer will auto-download these. Ensure you have ~5GB free space and good internet.

3. **"Python 3.11 not found"**

   Check `buildozer.spec` and ensure your system Python matches the version specified.

### Runtime Errors

1. **"Template not found"**

   Ensure templates are in `mobile/assets/templates/`. Check file permissions.

2. **"Database locked"**

   SQLite issue - ensure only one instance of the app is running.

3. **App crashes on startup**

   Check logs:
   ```bash
   adb logcat | grep python
   ```

## Performance Optimization

### Reducing APK Size

1. Remove unused architectures from `android.archs`
2. Exclude unnecessary files in `source.exclude_patterns`
3. Use ProGuard (advanced)

### Improving Startup Time

1. Reduce number of modules in `requirements`
2. Lazy-load templates
3. Use binary formats instead of JSON where possible

## Data Migration

### From Web App (IndexedDB)

1. Export data from web app (JSON)
2. Transfer file to device
3. Use Settings → Restore Backup
4. Select the JSON file

### Between Devices

1. Settings → Create Backup
2. Transfer `backup.json` to new device
3. Settings → Restore Backup

## Contributing

This mobile app reuses backend logic from the main GameX project. When adding features:

1. Reuse backend modules where possible (templates, compare, validation)
2. Keep UI lightweight and mobile-optimized
3. Test on both phone and tablet screen sizes
4. Ensure offline functionality works

## License

Same license as main GameX project.

## Support

For issues specific to the mobile app:
1. Check this README's Troubleshooting section
2. Review buildozer logs in `.buildozer/`
3. Check adb logs: `adb logcat | grep python`
4. Open an issue in the main GameX repository

## Roadmap

- [ ] Add custom KV layouts for better UI
- [ ] Implement scenario deck viewer
- [ ] Add data sync capability (optional)
- [ ] Implement encryption support
- [ ] Add AI analysis integration
- [ ] Create tablet-optimized layouts
- [ ] Add dark mode support
- [ ] Implement gesture navigation
