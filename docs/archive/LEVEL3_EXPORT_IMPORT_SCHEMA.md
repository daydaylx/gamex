# Level 3: Export/Import Schema (Zukunftssicher für QR-Code-Transfer)

## Version-Proof JSON Export/Import Schema

Dieses Schema ermöglicht es, Sessions zwischen Geräten zu übertragen (z.B. via QR-Code), während es gleichzeitig zukunftssicher ist (Schema-Evolution).

---

## Export Schema v1.0.0

### Vollständiges Schema

```typescript
interface ExportSchema {
  // Schema-Metadaten
  version: string; // "1.0.0" - Schema-Version (nicht App-Version!)
  export_date: string; // ISO 8601: "2025-01-15T14:30:00Z"
  schema_format: "gamex_session_export"; // Identifikator für Validierung
  
  // App-Metadaten
  metadata: {
    app_version: string; // "2.1.3" - Version der App, die exportiert hat
    app_name: "gamex"; // Konstante
    export_origin: "web" | "android" | "ios"; // Plattform
    device_id?: string; // Optional: Für Multi-Device-Sync
  };
  
  // Session-Daten
  sessions: SessionExport[];
}

interface SessionExport {
  // Session-Metadaten
  id: string; // Original Session-ID (wird bei Import neu generiert)
  name: string;
  template_id: string;
  template_version?: number; // Optional: Template-Version zum Zeitpunkt der Erstellung
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  
  // Responses
  responses_a?: ResponseMap;
  responses_b?: ResponseMap;
  
  // Optional: Vergleichs-Ergebnisse (falls bereits berechnet)
  comparison?: {
    generated_at: string; // ISO 8601
    summary: {
      total: number;
      match: number;
      explore: number;
      boundary: number;
    };
    // Vergleichs-Details werden nicht exportiert (zu groß, können neu berechnet werden)
  };
}

// ResponseMap wie in types/form.ts definiert
type ResponseMap = Record<string, ResponseValue>;
type ResponseValue = string | number | ConsentRating | string[];

interface ConsentRating {
  self: number; // 0-5
  partner: number; // 0-5
  give: number; // 0-5 (optional, wenn has_dom_sub: true)
  receive: number; // 0-5 (optional, wenn has_dom_sub: true)
}
```

---

## Beispiel Export JSON

```json
{
  "version": "1.0.0",
  "export_date": "2025-01-15T14:30:00Z",
  "schema_format": "gamex_session_export",
  "metadata": {
    "app_version": "2.1.3",
    "app_name": "gamex",
    "export_origin": "web",
    "device_id": "device-abc123"
  },
  "sessions": [
    {
      "id": "session-xyz789",
      "name": "Erste Session",
      "template_id": "comprehensive_v1",
      "template_version": 2,
      "created_at": "2025-01-10T10:00:00Z",
      "updated_at": "2025-01-15T14:25:00Z",
      "responses_a": {
        "SOFT01": "Unser erster Kuss",
        "SOFT02": "Dein Humor",
        "SOFT03": 8,
        "FRA001": {
          "self": 5,
          "partner": 4,
          "give": 5,
          "receive": 4
        }
      },
      "responses_b": {
        "SOFT01": "Als wir zusammen gezogen sind",
        "SOFT02": "Deine Fürsorge",
        "SOFT03": 9
      },
      "comparison": {
        "generated_at": "2025-01-15T14:20:00Z",
        "summary": {
          "total": 150,
          "match": 45,
          "explore": 80,
          "boundary": 25
        }
      }
    }
  ]
}
```

---

## Versionsmanagement & Migration

### Schema-Evolution-Strategie

**Regeln:**
1. **Backward Compatible:** Neue Versionen müssen alte Daten importieren können
2. **Forward Compatible:** Alte Versionen sollten neue Daten ignorieren (unknown fields)
3. **Version String:** Semantic Versioning (MAJOR.MINOR.PATCH)

### Migration Function Pattern

```typescript
type MigrationFunction = (data: any) => any;

const migrations: Record<string, MigrationFunction> = {
  "1.0.0": (data) => data, // No migration needed for v1.0.0
  "1.1.0": (data) => {
    // Example: Add new optional field
    return {
      ...data,
      metadata: {
        ...data.metadata,
        device_id: data.metadata.device_id || null,
      }
    };
  },
  "2.0.0": (data) => {
    // Example: Breaking change - migrate responses format
    return {
      ...data,
      sessions: data.sessions.map(session => ({
        ...session,
        responses_a: migrateResponsesFormat(session.responses_a),
        responses_b: migrateResponsesFormat(session.responses_b),
      }))
    };
  }
};

function migrateExportData(data: any, targetVersion: string): ExportSchema {
  let currentData = data;
  let currentVersion = data.version || "1.0.0";
  
  // Get all versions between current and target
  const versions = Object.keys(migrations).sort();
  const currentIndex = versions.indexOf(currentVersion);
  const targetIndex = versions.indexOf(targetVersion);
  
  if (currentIndex === -1) {
    throw new Error(`Unknown version: ${currentVersion}`);
  }
  if (targetIndex === -1) {
    throw new Error(`Unknown target version: ${targetVersion}`);
  }
  
  // Apply migrations sequentially
  for (let i = currentIndex + 1; i <= targetIndex; i++) {
    const version = versions[i];
    currentData = migrations[version](currentData);
    currentData.version = version;
  }
  
  return currentData as ExportSchema;
}
```

---

## QR-Code Transfer Implementation

### Encoding Strategy

**Problem:** QR-Codes haben Limitierungen
- Typisch: ~3KB Daten (version 40, error correction L)
- Mit Kompression: ~10-15KB möglich

**Lösung:**
1. JSON komprimieren (pako/deflate)
2. Base64 encode
3. QR-Code generieren
4. Bei Import: Umgekehrt

### Code-Implementation

```typescript
import pako from 'pako';
import QRCode from 'qrcode.react';

// Export zu QR-Code
async function exportToQRCode(sessions: SessionExport[]): Promise<string> {
  const exportData: ExportSchema = {
    version: "1.0.0",
    export_date: new Date().toISOString(),
    schema_format: "gamex_session_export",
    metadata: {
      app_version: "2.1.3",
      app_name: "gamex",
      export_origin: "web",
    },
    sessions,
  };
  
  // 1. JSON stringify
  const jsonString = JSON.stringify(exportData);
  
  // 2. Komprimieren (deflate)
  const compressed = pako.deflate(jsonString);
  
  // 3. Base64 encode
  const base64 = btoa(String.fromCharCode(...compressed));
  
  // 4. QR-Code URL (oder direkt anzeigen)
  return base64;
}

// Import von QR-Code
async function importFromQRCode(base64String: string): Promise<ExportSchema> {
  // 1. Base64 decode
  const binaryString = atob(base64String);
  const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
  
  // 2. Dekomprimieren
  const decompressed = pako.inflate(bytes, { to: 'string' });
  
  // 3. JSON parse
  const data = JSON.parse(decompressed);
  
  // 4. Migrieren auf aktuelle Version
  const currentVersion = "1.0.0"; // Oder aus App-Version ableiten
  return migrateExportData(data, currentVersion);
}
```

### Multi-Page QR-Codes (für große Exports)

**Wenn Export zu groß für einen QR-Code:**

```typescript
interface MultiPageQRCode {
  total_pages: number;
  current_page: number;
  data: string; // Base64 compressed chunk
}

function splitExportIntoPages(exportData: ExportSchema, maxSizePerPage: number = 3000): MultiPageQRCode[] {
  const jsonString = JSON.stringify(exportData);
  const compressed = pako.deflate(jsonString);
  const base64 = btoa(String.fromCharCode(...compressed));
  
  // Split into chunks
  const pages: MultiPageQRCode[] = [];
  const totalPages = Math.ceil(base64.length / maxSizePerPage);
  
  for (let i = 0; i < totalPages; i++) {
    const start = i * maxSizePerPage;
    const end = Math.min(start + maxSizePerPage, base64.length);
    pages.push({
      total_pages: totalPages,
      current_page: i + 1,
      data: base64.substring(start, end),
    });
  }
  
  return pages;
}

function combinePagesIntoExport(pages: MultiPageQRCode[]): Promise<ExportSchema> {
  // Sort by page number
  pages.sort((a, b) => a.current_page - b.current_page);
  
  // Combine
  const combinedBase64 = pages.map(p => p.data).join('');
  
  // Import
  return importFromQRCode(combinedBase64);
}
```

---

## Validierung

### Schema-Validierung

```typescript
import { z } from 'zod'; // Oder eigene Validierung

const ExportSchemaSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  export_date: z.string().datetime(),
  schema_format: z.literal("gamex_session_export"),
  metadata: z.object({
    app_version: z.string(),
    app_name: z.literal("gamex"),
    export_origin: z.enum(["web", "android", "ios"]),
    device_id: z.string().optional(),
  }),
  sessions: z.array(z.object({
    id: z.string(),
    name: z.string(),
    template_id: z.string(),
    template_version: z.number().optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    responses_a: z.record(z.any()).optional(),
    responses_b: z.record(z.any()).optional(),
    comparison: z.object({
      generated_at: z.string().datetime(),
      summary: z.object({
        total: z.number(),
        match: z.number(),
        explore: z.number(),
        boundary: z.number(),
      }),
    }).optional(),
  })),
});

function validateExportData(data: any): ExportSchema {
  try {
    return ExportSchemaSchema.parse(data) as ExportSchema;
  } catch (error) {
    throw new Error(`Invalid export data: ${error.message}`);
  }
}
```

---

## Import-Strategie

### Import-Flow

```typescript
async function importSessions(
  exportData: ExportSchema,
  options: {
    mergeWithExisting?: boolean;
    overwriteDuplicates?: boolean;
  } = {}
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const result = { imported: 0, skipped: 0, errors: [] };
  
  // Validate
  try {
    validateExportData(exportData);
  } catch (error) {
    result.errors.push(`Validation failed: ${error.message}`);
    return result;
  }
  
  // Migrate to current version
  let migratedData: ExportSchema;
  try {
    migratedData = migrateExportData(exportData, "1.0.0");
  } catch (error) {
    result.errors.push(`Migration failed: ${error.message}`);
    return result;
  }
  
  // Import each session
  for (const sessionExport of migratedData.sessions) {
    try {
      // Check if session already exists
      const existingSessions = await listSessions();
      const exists = existingSessions.some(s => 
        s.name === sessionExport.name && 
        s.template_id === sessionExport.template_id
      );
      
      if (exists && !options.overwriteDuplicates) {
        result.skipped++;
        continue;
      }
      
      // Create new session (with new ID)
      const newSession = await createSession({
        name: sessionExport.name,
        template_id: sessionExport.template_id,
      });
      
      // Import responses
      if (sessionExport.responses_a) {
        await saveResponses(newSession.id, 'A', { responses: sessionExport.responses_a });
      }
      if (sessionExport.responses_b) {
        await saveResponses(newSession.id, 'B', { responses: sessionExport.responses_b });
      }
      
      result.imported++;
    } catch (error) {
      result.errors.push(`Failed to import session ${sessionExport.name}: ${error.message}`);
    }
  }
  
  return result;
}
```

---

## Zusammenfassung

**Schema-Features:**
- ✅ Versions-Management (Schema-Evolution)
- ✅ Backward/Forward Compatible
- ✅ Kompression für QR-Code-Transfer
- ✅ Multi-Page QR-Codes für große Exports
- ✅ Validierung & Fehlerbehandlung

**Nächste Schritte:**
1. Schema in TypeScript-Definitionen auslagern (`src/types/export.ts`)
2. Export/Import-Funktionen implementieren (`src/services/exportImport.ts`)
3. QR-Code-Komponente erstellen (`src/components/QRCodeExport.tsx`)
4. UI für Export/Import hinzufügen


