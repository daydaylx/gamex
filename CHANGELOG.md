# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (2025-12-26)

#### Development Infrastructure
- **CI/CD Pipeline**: GitHub Actions für automatisierte Tests, Linting und Security-Scans
  - Backend-Tests mit Python 3.10, 3.11, 3.12
  - Coverage-Reporting (Minimum: 60%)
  - Security-Scans mit Bandit und Safety
  - Dependency-Review für Pull Requests
- **Dependabot**: Automatische Dependency-Updates (wöchentlich)
- **Development-Tools**:
  - `requirements-dev.txt` für Test- und Dev-Dependencies
  - `pyproject.toml` für Python-Tool-Konfiguration (black, isort, mypy, pytest)
  - `.flake8` für Linting-Regeln
  - `.editorconfig` für konsistente Code-Formatierung
  - `Makefile` für häufige Dev-Tasks (test, lint, format, security)
- **Dokumentation**:
  - `CONTRIBUTING.md` mit Setup- und Workflow-Anleitung
  - `IMPLEMENTIERUNGSPLAN.md` mit 5-Phasen-Roadmap
  - `CHANGELOG.md` (diese Datei)

#### Code Quality
- Type-Checking mit mypy
- Code-Formatierung mit black (120 Zeichen/Zeile)
- Import-Sortierung mit isort
- Linting mit flake8 (max-complexity: 15)

#### Security
- Bandit-Scans für Python-Code
- Safety-Checks für bekannte Vulnerabilities in Dependencies
- Extended `.gitignore` für Security-Reports und Credentials

### Changed
- `.gitignore` erweitert um mypy-cache, security-reports, temp-files

### Infrastructure
- Node.js Version gepinnt auf v20 (`.nvmrc`)

---

## Geplant (siehe IMPLEMENTIERUNGSPLAN.md)

### Phase 1: Foundation ✅ COMPLETED
- [x] CI/CD Pipeline
- [x] Dependency Management
- [x] Development-Dokumentation

### Phase 2: Security (Wochen 3-5)
- [ ] Verschlüsselung (SQLCipher, Secure Storage)
- [ ] Biometric Authentication (Mobile)
- [ ] OWASP Security Audit

### Phase 3: Frontend Refactoring (Wochen 6-8)
- [ ] Vite Build-System
- [ ] Code-Modularisierung (app.js → Module)
- [ ] Frontend-Tests (Vitest)

### Phase 4: Template-System (Wochen 9-10)
- [ ] Naming-Konvention vereinheitlichen
- [ ] Versioning-System

### Phase 5: Production-Readiness (Wochen 11-12)
- [ ] Docker-Setup
- [ ] Monitoring & Logging
- [ ] Mobile APK Build-Pipeline

---

## Version History

### [0.1.0] - 2024 (Pre-Release)
Initial development version with:
- FastAPI Backend mit SQLite
- Vanilla JS Frontend mit IndexedDB
- Capacitor Mobile App (Android)
- Psychologisch fundierte Templates
- Local-first Architektur
