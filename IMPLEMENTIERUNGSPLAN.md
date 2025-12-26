# Implementierungsplan: Kritische Verbesserungen

**Erstellt:** 2025-12-26
**Basierend auf:** Code-Analyse Feedback

## Executive Summary

Dieser Plan adressiert die kritischsten Probleme aus der Code-Analyse:
1. **Sicherheit** (fehlende Verschlüsselung)
2. **Code-Qualität** (Frontend-Monolith)
3. **Development-Prozess** (fehlende CI/CD)

---

## Phase 1: Foundation & Quick Wins (Woche 1-2)

### ✅ 1.1 CI/CD Pipeline einrichten
**Priorität:** KRITISCH
**Aufwand:** 4-6h
**Impact:** Hoch

**Aufgaben:**
- [ ] GitHub Actions Workflow für Backend-Tests
- [ ] Linting & Type-Checking (mypy, flake8)
- [ ] Security Scanning (bandit, safety)
- [ ] Frontend-Linting Setup (eslint)
- [ ] Automated Test-Coverage Reports

**Akzeptanzkriterien:**
- Tests laufen automatisch bei jedem PR
- Coverage-Report wird generiert
- Security-Scans blocken bei High-Severity Findings

---

### ✅ 1.2 Dependency Management verbessern
**Priorität:** HOCH
**Aufwand:** 2-3h
**Impact:** Mittel

**Aufgaben:**
- [ ] `requirements-dev.txt` erstellen (Test-Dependencies trennen)
- [ ] `requirements.lock` für reproduzierbare Builds
- [ ] Dependabot/Renovate konfigurieren
- [ ] `package.json` für Frontend-Tooling erstellen
- [ ] `.nvmrc` für Node-Version

**Akzeptanzkriterien:**
- Dev- und Prod-Dependencies getrennt
- Automatische Security-Updates via Dependabot
- Reproduzierbare Builds

---

### ✅ 1.3 Development-Dokumentation
**Priorität:** MITTEL
**Aufwand:** 2h
**Impact:** Mittel

**Aufgaben:**
- [ ] `CONTRIBUTING.md` mit Setup-Anleitung
- [ ] `.editorconfig` für konsistente Formatierung
- [ ] Pre-commit hooks Setup (optional)

---

## Phase 2: Security Hardening (Woche 3-5)

### 🔒 2.1 Verschlüsselung - Konzept & Design
**Priorität:** KRITISCH
**Aufwand:** 8-12h (Design + Implementation)
**Impact:** SEHR HOCH

**Optionen evaluieren:**

#### Option A: Session-basierte Verschlüsselung (empfohlen)
- User erstellt Session mit Passwort
- Daten werden mit AES-256 verschlüsselt
- Key-Derivation via PBKDF2/Argon2
- **Pro:** Einfach, keine Master-Keys
- **Contra:** Passwort vergessen = Daten weg

#### Option B: Master-Passwort
- Einmaliges Master-Passwort für alle Sessions
- Verschlüsselte Keychain
- **Pro:** Zentrale Kontrolle
- **Contra:** Single Point of Failure

#### Option C: Hybrid (empfohlen für Production)
- Master-Passwort entsperrt Keychain
- Pro Session ein abgeleiteter Key
- **Pro:** Sicher + Flexibel
- **Contra:** Komplex

**Aufgaben:**
- [ ] Encryption-Strategie finalisieren (User-Input?)
- [ ] SQLCipher für SQLite evaluieren
- [ ] Crypto-Library auswählen (cryptography.py)
- [ ] Key-Management-System designen
- [ ] Migration-Plan für existierende Daten

**Akzeptanzkriterien:**
- Daten at-rest verschlüsselt
- OWASP-konform
- Audit-Log für Zugriffe

---

### 🔒 2.2 Mobile App - Secure Storage
**Priorität:** HOCH
**Aufwand:** 4-6h
**Impact:** Hoch

**Aufgaben:**
- [ ] Capacitor Secure Storage Plugin integrieren
- [ ] Biometric Authentication (Face ID/Fingerprint)
- [ ] iOS Keychain / Android Keystore nutzen
- [ ] Encryption-Keys sicher speichern

---

### 🔒 2.3 Security Audit & Fixes
**Priorität:** HOCH
**Aufwand:** 6-8h
**Impact:** Hoch

**Aufgaben:**
- [ ] OWASP Top 10 Check durchführen
- [ ] CSP Headers konfigurieren
- [ ] CORS richtig konfigurieren
- [ ] Input Validation härten
- [ ] SQL Injection Tests (bereits Parameterized Queries ✓)
- [ ] XSS-Prävention prüfen

---

## Phase 3: Frontend Refactoring (Woche 6-8)

### 🎨 3.1 Build-System Setup
**Priorität:** HOCH
**Aufwand:** 4-6h
**Impact:** Hoch

**Aufgaben:**
- [ ] Vite als Build-Tool integrieren
- [ ] ES Modules Setup
- [ ] Hot Module Replacement (HMR)
- [ ] Production-Build optimieren (Minify, Tree-Shaking)

---

### 🎨 3.2 Code-Modularisierung
**Priorität:** HOCH
**Aufwand:** 12-16h
**Impact:** SEHR HOCH

**Struktur (Vorschlag):**
```
apps/web/web/
├── src/
│   ├── main.js              # Entry Point
│   ├── state/
│   │   ├── store.js         # Global State
│   │   └── actions.js       # State Mutations
│   ├── api/
│   │   ├── client.js        # API Wrapper
│   │   ├── sessions.js      # Session Endpoints
│   │   └── templates.js     # Template Endpoints
│   ├── ui/
│   │   ├── components/      # Reusable Components
│   │   ├── views/           # Page Views
│   │   └── utils.js         # UI Helpers
│   ├── core/
│   │   ├── compare.js       # Business Logic
│   │   └── validation.js    # Validation
│   └── storage/
│       └── indexeddb.js     # Local Storage
├── public/
│   ├── index.html
│   └── styles.css
└── vite.config.js
```

**Migration-Strategie:**
1. Vite Setup (neue Struktur)
2. `app.js` schrittweise splitten (nicht Big Bang!)
3. Tests für jedes Modul
4. Legacy-Code parallel laufen lassen
5. Schrittweise Migration

**Akzeptanzkriterien:**
- Max. 300 Zeilen pro Datei
- Jedes Modul hat Single Responsibility
- Keine globalen Variablen
- Tree-Shaking funktioniert

---

### 🎨 3.3 Frontend-Tests
**Priorität:** MITTEL
**Aufwand:** 8-10h
**Impact:** Hoch

**Aufgaben:**
- [ ] Vitest Setup
- [ ] Unit-Tests für State-Management
- [ ] Unit-Tests für API-Client
- [ ] Integration-Tests für kritische Flows
- [ ] E2E-Tests mit Playwright (optional)

**Coverage-Ziel:** 70% für kritische Pfade

---

## Phase 4: Template-System Cleanup (Woche 9-10)

### 📋 4.1 Template-Naming vereinheitlichen
**Priorität:** MITTEL
**Aufwand:** 4-6h
**Impact:** Mittel

**Aufgaben:**
- [ ] Naming-Convention definieren
- [ ] Template-Metadaten konsolidieren
- [ ] Migration-Script für alte Templates
- [ ] Dokumentation aktualisieren

---

### 📋 4.2 Template-Versioning System
**Priorität:** NIEDRIG
**Aufwand:** 6-8h
**Impact:** Mittel

**Aufgaben:**
- [ ] Semantic Versioning für Templates
- [ ] Auto-Migration bei Breaking Changes
- [ ] Deprecation-Warnings
- [ ] Template-Schema-Validation

---

## Phase 5: Production-Readiness (Woche 11-12)

### 🚀 5.1 Deployment-Setup
**Priorität:** MITTEL
**Aufwand:** 6-8h
**Impact:** Hoch

**Aufgaben:**
- [ ] Docker-Setup für Backend
- [ ] Docker Compose für lokale Dev-Umgebung
- [ ] Environment-Config (12-Factor App)
- [ ] Health-Check Endpoints erweitern
- [ ] Logging strukturieren (JSON-Format)

---

### 🚀 5.2 Monitoring & Observability
**Priorität:** NIEDRIG
**Aufwand:** 4-6h
**Impact:** Mittel

**Aufgaben:**
- [ ] Structured Logging (JSON)
- [ ] Error-Tracking (Sentry/ähnlich)
- [ ] Performance-Metriken
- [ ] User-Analytics (privacy-friendly)

---

### 🚀 5.3 Mobile App - Build-Pipeline
**Priorität:** MITTEL
**Aufwand:** 4-6h
**Impact:** Mittel

**Aufgaben:**
- [ ] GitHub Actions für APK-Build
- [ ] Signing-Keys sicher verwalten
- [ ] Automated Release-Notes
- [ ] Beta-Distribution (Google Play Internal Testing)

---

## Zeitplan & Ressourcen

| Phase | Dauer | Aufwand (h) | Priorität |
|-------|-------|-------------|-----------|
| Phase 1: Foundation | 1-2 Wochen | 8-11h | KRITISCH |
| Phase 2: Security | 3-5 Wochen | 18-26h | KRITISCH |
| Phase 3: Frontend | 6-8 Wochen | 24-32h | HOCH |
| Phase 4: Templates | 9-10 Wochen | 10-14h | MITTEL |
| Phase 5: Production | 11-12 Wochen | 14-20h | MITTEL |

**Gesamt:** ~74-103 Stunden (ca. 2-3 Monate bei 10h/Woche)

---

## Success Metrics

### Nach Phase 1:
- ✅ CI/CD Pipeline läuft
- ✅ 100% Tests automatisiert
- ✅ Security-Scans aktiv

### Nach Phase 2:
- ✅ Alle Daten verschlüsselt
- ✅ OWASP Top 10 gecheckt
- ✅ Mobile App mit Secure Storage

### Nach Phase 3:
- ✅ Frontend modular (max. 300 LOC/Datei)
- ✅ 70% Test-Coverage Frontend
- ✅ Build-Zeit < 5s (Vite)

### Nach Phase 5:
- ✅ Production-ready
- ✅ Automatische Releases
- ✅ Monitoring aktiv

---

## Entscheidungen benötigt

**User-Input erforderlich für:**

1. **Verschlüsselungs-Strategie:** Option A, B oder C? (siehe Phase 2.1)
2. **Frontend-Framework:** Vanilla JS behalten oder zu Svelte/Vue wechseln?
3. **Deployment-Ziel:** Self-Hosted / Cloud / Beides?
4. **Mobile App:** Android + iOS oder nur Android?

---

## Nächste Schritte (JETZT)

Ich werde mit **Phase 1** beginnen:
1. CI/CD Pipeline einrichten
2. Dependency Management verbessern
3. Security Scans aktivieren

**Soll ich starten?**
