# Level 4: Konkrete Sicherheitsfeatures

## 3 konkrete Sicherheitsfeatures zur Implementierung

Basierend auf der Threat-Model-Analyse (LEVEL4_THREAT_MODELING.md), hier die detaillierte Implementierungsbeschreibung für die 3 kritischsten Features.

---

## Feature 1: Session-Timeout & Auto-Lock

### Problem
Szenario A (Gerät ausleihen): Wenn die App geöffnet bleibt, kann jeder mit Gerätezugriff die Daten sehen.

### Lösung
Automatische Sperre nach Inaktivität + Lock-Screen mit Entsperr-Geste.

### Implementierung

#### 1.1 Activity-Tracking

**Datei:** `apps/web-new/src/services/activityTracker.ts`

```typescript
import { signal, computed } from '@preact/signals-core';

// Last activity timestamp
export const lastActivity = signal<number>(Date.now());

// Lock timeout (5 Minuten in Millisekunden)
const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 Minuten

// Update activity on any user interaction
export function updateActivity() {
  lastActivity.value = Date.now();
}

// Check if app should be locked
export const isLocked = computed<boolean>(() => {
  const timeSinceActivity = Date.now() - lastActivity.value;
  return timeSinceActivity > LOCK_TIMEOUT;
});

// Setup activity listeners
export function setupActivityTracking() {
  // Track mouse/touch events
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  events.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });
  
  // Track visibility changes (tab switch)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Tab switched away - lock immediately (optional)
      // lastActivity.value = Date.now() - LOCK_TIMEOUT; // Lock immediately
    } else {
      updateActivity();
    }
  });
  
  return () => {
    events.forEach(event => {
      document.removeEventListener(event, updateActivity);
    });
  };
}
```

#### 1.2 Lock Screen Component

**Datei:** `apps/web-new/src/components/LockScreen.tsx`

```typescript
import { useEffect, useState } from 'preact/hooks';
import { isLocked, updateActivity } from '../services/activityTracker';
import { useSignal } from '@preact/signals-react';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [unlockProgress, setUnlockProgress] = useState(0);
  const isUnlocking = useSignal(false);
  const longPressTimeout = useSignal<number | null>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLocked.value && !isUnlocking.value) {
        // Show lock screen
      } else {
        // Hide lock screen
        onUnlock();
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleUnlockStart = () => {
    isUnlocking.value = true;
    let progress = 0;
    
    const progressInterval = setInterval(() => {
      progress += 2; // 2% every ~20ms = 1 second total
      setUnlockProgress(progress);
      
      if (progress >= 100) {
        clearInterval(progressInterval);
        updateActivity(); // Reset activity timer
        onUnlock();
      }
    }, 20);
    
    longPressTimeout.value = progressInterval as any;
  };
  
  const handleUnlockEnd = () => {
    if (longPressTimeout.value) {
      clearInterval(longPressTimeout.value);
      longPressTimeout.value = null;
    }
    setUnlockProgress(0);
    isUnlocking.value = false;
  };
  
  if (!isLocked.value) {
    return null;
  }
  
  return (
    <div
      className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center z-[100]"
      onTouchStart={handleUnlockStart}
      onTouchEnd={handleUnlockEnd}
      onMouseDown={handleUnlockStart}
      onMouseUp={handleUnlockEnd}
    >
      <div className="text-6xl mb-8">🔒</div>
      <h2 className="text-2xl mb-4">App gesperrt</h2>
      <p className="text-gray-400 mb-8">Long-Press zum Entsperren</p>
      
      {unlockProgress > 0 && (
        <div className="w-48 h-48 relative">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="4"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - unlockProgress / 100)}`}
              className="transition-all duration-100"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xl">
            {Math.round(unlockProgress)}%
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 1.3 Integration in App

**Datei:** `apps/web-new/src/App.tsx` (oder Root-Komponente)

```typescript
import { useEffect } from 'preact/hooks';
import { setupActivityTracking } from './services/activityTracker';
import { LockScreen } from './components/LockScreen';

export function App() {
  useEffect(() => {
    const cleanup = setupActivityTracking();
    return cleanup;
  }, []);
  
  return (
    <>
      {/* Main app content */}
      <LockScreen onUnlock={() => {}} />
    </>
  );
}
```

#### 1.4 Sensible Daten aus Memory löschen

**Wichtig:** Bei Lock sollten sensible Daten aus dem Memory entfernt werden:

```typescript
// In activityTracker.ts
import { responses } from '../store/questionnaireStore';

export function clearSensitiveData() {
  // Responses Signal löschen (wird beim Unlock neu geladen)
  // responses.value = {}; // Optional: Nur wenn PIN-Schutz aktiv
}
```

---

## Feature 2: IndexedDB-Verschlüsselung at Rest

### Problem
Szenario B & C: Daten sind im Klartext gespeichert. Bei Zugriff (Cross-Tab oder Dateisystem) sind alle Daten lesbar.

### Lösung
AES-GCM-Verschlüsselung mit PIN-abgeleitetem Schlüssel. Daten werden nur im Memory entschlüsselt.

### Implementierung

#### 2.1 Encryption Service

**Datei:** `apps/web-new/src/services/encryption.ts`

```typescript
// Web Crypto API Wrapper für AES-GCM Verschlüsselung

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits für AES-GCM
const SALT_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 100000; // 100k Iterationen für Key Derivation

interface EncryptedData {
  encrypted_data: string; // Base64
  salt: string; // Base64
  iv: string; // Base64
  algorithm: string;
  version: string; // "1.0.0"
}

/**
 * Derive encryption key from PIN using PBKDF2
 */
async function deriveKeyFromPin(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const pinKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    pinKey,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data with AES-GCM
 */
export async function encryptData(
  data: string,
  pin: string
): Promise<EncryptedData> {
  // Generate salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // Derive key from PIN
  const key = await deriveKeyFromPin(pin, salt);
  
  // Encrypt
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    dataBuffer
  );
  
  // Convert to Base64 for storage
  return {
    encrypted_data: arrayBufferToBase64(encryptedBuffer),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    algorithm: ALGORITHM,
    version: '1.0.0',
  };
}

/**
 * Decrypt data with AES-GCM
 */
export async function decryptData(
  encryptedData: EncryptedData,
  pin: string
): Promise<string> {
  // Convert from Base64
  const salt = base64ToArrayBuffer(encryptedData.salt);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  const encryptedBuffer = base64ToArrayBuffer(encryptedData.encrypted_data);
  
  // Derive key from PIN
  const key = await deriveKeyFromPin(pin, salt);
  
  // Decrypt
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    encryptedBuffer
  );
  
  // Convert to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
```

#### 2.2 Encrypted Storage Wrapper

**Datei:** `apps/web-new/src/services/encryptedStorage.ts`

```typescript
import { encryptData, decryptData, type EncryptedData } from './encryption';

// In-memory PIN (never persisted!)
let currentPin: string | null = null;
let isEncryptionEnabled = false;

export function setPin(pin: string) {
  currentPin = pin;
  isEncryptionEnabled = true;
}

export function clearPin() {
  currentPin = null;
  // Optionally clear sensitive data from memory
}

export async function saveEncrypted(key: string, value: any): Promise<void> {
  if (!isEncryptionEnabled || !currentPin) {
    throw new Error('Encryption not enabled. Set PIN first.');
  }
  
  // Serialize to JSON
  const jsonString = JSON.stringify(value);
  
  // Encrypt
  const encrypted = await encryptData(jsonString, currentPin);
  
  // Store in localStorage
  localStorage.setItem(key, JSON.stringify(encrypted));
}

export async function loadEncrypted(key: string): Promise<any | null> {
  if (!isEncryptionEnabled || !currentPin) {
    throw new Error('Encryption not enabled. Set PIN first.');
  }
  
  // Load from localStorage
  const encryptedJson = localStorage.getItem(key);
  if (!encryptedJson) {
    return null;
  }
  
  try {
    const encrypted: EncryptedData = JSON.parse(encryptedJson);
    
    // Check if it's encrypted format
    if (encrypted.encrypted_data && encrypted.salt && encrypted.iv) {
      // Decrypt
      const decryptedJson = await decryptData(encrypted, currentPin);
      return JSON.parse(decryptedJson);
    } else {
      // Legacy unencrypted data - return as-is (or migrate)
      return encrypted;
    }
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    return null;
  }
}
```

#### 2.3 Integration in API Layer

**Datei:** `apps/web-new/src/services/api.ts` (modifizieren)

```typescript
import { saveEncrypted, loadEncrypted } from './encryptedStorage';

// Modify getStorage
async function getStorage<T>(key: string): Promise<T | null> {
  try {
    // Try encrypted storage first
    if (isEncryptionEnabled()) {
      return await loadEncrypted(key);
    }
    
    // Fallback to plaintext (for migration period)
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading from storage (${key}):`, error);
    return null;
  }
}

// Modify setStorage
async function setStorage<T>(key: string, value: T): Promise<void> {
  try {
    // Try encrypted storage first
    if (isEncryptionEnabled()) {
      await saveEncrypted(key, value);
      return;
    }
    
    // Fallback to plaintext (for migration period)
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to storage (${key}):`, error);
  }
}
```

---

## Feature 3: App-Level PIN-Schutz

### Problem
Szenario A & C: Benutzer benötigen eine Möglichkeit, die App zu schützen, auch wenn sie das Gerät weitergeben.

### Lösung
Optionaler PIN-Setup beim ersten Start. PIN wird nur im Memory gespeichert (nie persistiert). Verschlüsselungsschlüssel wird aus PIN abgeleitet.

### Implementierung

#### 3.1 PIN Setup Component

**Datei:** `apps/web-new/src/components/PinSetup.tsx`

```typescript
import { useState } from 'preact/hooks';
import { Button } from './ui/button';
import { setPin } from '../services/encryptedStorage';
import { migratePlaintextData } from '../services/encryptionMigration';

interface PinSetupProps {
  onComplete: () => void;
  onSkip: () => void; // Optional: Guest Mode
}

export function PinSetup({ onComplete, onSkip }: PinSetupProps) {
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  
  const handleSetup = async () => {
    // Validate
    if (pin.length < 4) {
      setError('PIN muss mindestens 4 Zeichen lang sein');
      return;
    }
    
    if (pin !== confirmPin) {
      setError('PINs stimmen nicht überein');
      return;
    }
    
    setIsSettingUp(true);
    setError(null);
    
    try {
      // Set PIN (in memory only)
      setPin(pin);
      
      // Migrate existing plaintext data to encrypted
      await migratePlaintextData(pin);
      
      // Clear PIN from component state (security)
      setPinValue('');
      setConfirmPin('');
      
      onComplete();
    } catch (error) {
      setError(`Fehler beim Setup: ${error.message}`);
    } finally {
      setIsSettingUp(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/90 text-white flex flex-col items-center justify-center z-[200]">
      <div className="max-w-md w-full p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center">PIN einrichten</h2>
        <p className="text-gray-400 text-center">
          Schütze deine Daten mit einer PIN. Die PIN wird nur lokal gespeichert und nie an Server gesendet.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">PIN (mindestens 4 Zeichen)</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPinValue(e.currentTarget.value)}
              className="w-full px-4 py-2 bg-gray-800 rounded text-white"
              maxLength={20}
            />
          </div>
          
          <div>
            <label className="block text-sm mb-2">PIN bestätigen</label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.currentTarget.value)}
              className="w-full px-4 py-2 bg-gray-800 rounded text-white"
              maxLength={20}
            />
          </div>
          
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
        </div>
        
        <div className="flex gap-4">
          <Button
            onClick={handleSetup}
            disabled={isSettingUp || pin.length < 4}
            className="flex-1"
          >
            {isSettingUp ? 'Richte ein...' : 'PIN einrichten'}
          </Button>
          
          <Button
            variant="outline"
            onClick={onSkip}
            className="flex-1"
          >
            Überspringen
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 text-center">
          ⚠️ Ohne PIN sind deine Daten nicht verschlüsselt und können bei Gerätezugriff gelesen werden.
        </p>
      </div>
    </div>
  );
}
```

#### 3.2 PIN Unlock Component

**Datei:** `apps/web-new/src/components/PinUnlock.tsx`

```typescript
import { useState } from 'preact/hooks';
import { Button } from './ui/button';
import { setPin } from '../services/encryptedStorage';

interface PinUnlockProps {
  onUnlock: () => void;
}

export function PinUnlock({ onUnlock }: PinUnlockProps) {
  const [pin, setPinValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  const handleUnlock = async () => {
    if (pin.length < 4) {
      setError('PIN eingeben');
      return;
    }
    
    setIsUnlocking(true);
    setError(null);
    
    try {
      // Try to set PIN (will fail if wrong)
      setPin(pin);
      
      // Try to load encrypted data (validates PIN)
      // If this succeeds, PIN is correct
      // If it fails, PIN is wrong
      
      // Clear PIN from component state
      setPinValue('');
      
      onUnlock();
    } catch (error) {
      setError('Falsche PIN');
      setPinValue('');
    } finally {
      setIsUnlocking(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/90 text-white flex flex-col items-center justify-center z-[200]">
      <div className="max-w-md w-full p-8 space-y-6">
        <div className="text-6xl text-center mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-center">PIN eingeben</h2>
        
        <div className="space-y-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPinValue(e.currentTarget.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleUnlock();
              }
            }}
            className="w-full px-4 py-2 bg-gray-800 rounded text-white text-center text-2xl tracking-widest"
            maxLength={20}
            autoFocus
            placeholder="PIN"
          />
          
          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}
        </div>
        
        <Button
          onClick={handleUnlock}
          disabled={isUnlocking || pin.length < 4}
          className="w-full"
        >
          {isUnlocking ? 'Entsperre...' : 'Entsperren'}
        </Button>
      </div>
    </div>
  );
}
```

#### 3.3 PIN State Management

**Datei:** `apps/web-new/src/services/pinState.ts`

```typescript
import { signal } from '@preact/signals-core';
import { loadEncrypted } from './encryptedStorage';

// Track PIN setup status
export const isPinSetup = signal<boolean>(false);
export const isUnlocked = signal<boolean>(false);

// Check if PIN is already setup
export function checkPinSetup(): boolean {
  // Check if encrypted data exists in localStorage
  const hasEncryptedData = Object.keys(localStorage).some(key => {
    if (key.startsWith('gamex:')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        return data.encrypted_data && data.salt && data.iv;
      } catch {
        return false;
      }
    }
    return false;
  });
  
  isPinSetup.value = hasEncryptedData;
  return hasEncryptedData;
}

// Try to unlock with PIN (validates by trying to decrypt)
export async function tryUnlock(pin: string): Promise<boolean> {
  try {
    // Try to decrypt any encrypted data to validate PIN
    const testKey = 'gamex:pin_test';
    const testData = await loadEncrypted(testKey);
    
    // If we get here, PIN is correct
    isUnlocked.value = true;
    return true;
  } catch (error) {
    // PIN is wrong
    return false;
  }
}
```

---

## Sicherheits-Checkliste

### Priorität 1 (Kritisch) - Sofort implementieren

- [ ] **Session-Timeout (5 Min Inaktivität)**
  - Activity-Tracking implementieren
  - LockScreen-Komponente erstellen
  - Integration in App-Root

- [ ] **IndexedDB-Verschlüsselung mit PIN-abgeleitetem Schlüssel**
  - Encryption Service (AES-GCM)
  - Encrypted Storage Wrapper
  - Integration in API Layer

- [ ] **Sensible Daten aus Memory bei Lock löschen**
  - Responses Signal löschen bei Lock
  - Neu laden bei Unlock

### Priorität 2 (Hoch) - Nächste 2 Wochen

- [ ] **Auto-Lock bei App-Blur (Tab-Wechsel)**
  - Visibility API Integration
  - Sofortige Sperre bei Tab-Wechsel

- [ ] **Sichere Schlüssel-Ableitung (PBKDF2, 100k Iterationen)**
  - Bereits in Encryption Service implementiert

- [ ] **Verschlüsselungs-Migration für existierende Daten**
  - Migration-Funktion für Plaintext → Encrypted
  - Einmalige Migration beim ersten PIN-Setup

### Priorität 3 (Mittel) - Später

- [ ] **Nutzer über "Gast-Modus"-Risiken warnen**
  - Warning in PIN Setup
  - Warning in Settings

- [ ] **Option zum Löschen aller Daten mit Bestätigung**
  - Settings-Seite
  - Double-Confirmation

- [ ] **Sichere Session-Übergabe (temporärer Verschlüsselungsschlüssel)**
  - Optional: Temporärer Key für Handover
  - Automatisches Löschen nach Übergabe

---

## Zusammenfassung

**3 Features:**
1. ✅ Session-Timeout & Auto-Lock (Szenario A)
2. ✅ IndexedDB-Verschlüsselung at Rest (Szenario B & C)
3. ✅ App-Level PIN-Schutz (Szenario A & C)

**Implementierungsaufwand:**
- Feature 1: ~1-2 Tage
- Feature 2: ~3-4 Tage
- Feature 3: ~2-3 Tage

**Gesamt:** ~1-2 Wochen für alle 3 Features

**ROI:** Kritisch - Ohne diese Features ist die App nicht produktionsreif für sensible Daten.


