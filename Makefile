# Makefile for GameX Mobile (APK-only)

.PHONY: help clean install build-debug build-release test

# Default target
help:
	@echo "GameX Mobile - APK Build Targets"
	@echo ""
	@echo "Available targets:"
	@echo "  install       - Install buildozer and dependencies"
	@echo "  clean         - Clean build artifacts and cache"
	@echo "  build-debug   - Build debug APK"
	@echo "  build-release - Build release APK"
	@echo "  test          - Run mobile app tests (if any)"
	@echo ""
	@echo "APK Output: mobile/bin/"

# Installation
install:
	@echo "Installing buildozer and dependencies..."
	pip3 install --user buildozer cython
	@echo ""
	@echo "Make sure you have Android build dependencies installed:"
	@echo "  sudo apt-get install -y build-essential git python3-dev \\"
	@echo "    libsdl2-dev libsdl2-image-dev libsdl2-mixer-dev libsdl2-ttf-dev \\"
	@echo "    libportmidi-dev libswscale-dev libavformat-dev libavcodec-dev zlib1g-dev"

# Cleaning
clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf mobile/.buildozer mobile/bin 2>/dev/null || true
	@echo "Clean complete!"

# Building
build-debug:
	@echo "Building debug APK..."
	cd mobile && buildozer android debug
	@echo ""
	@echo "APK built: mobile/bin/gamex-1.0.0-armeabi-v7a-debug.apk"

build-release:
	@echo "Building release APK..."
	cd mobile && buildozer android release
	@echo ""
	@echo "APK built: mobile/bin/gamex-1.0.0-armeabi-v7a-release.apk"
	@echo "Note: Release APK needs to be signed before distribution"

# Testing
test:
	@echo "Running mobile app tests..."
	@echo "No tests configured yet"
