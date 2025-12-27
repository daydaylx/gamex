/**
 * Storage Migration Service
 * Handles bulk export/import of all application data from localStorage
 */

const STORAGE_PREFIXES = ['gamex:', 'gamex_interview_v1'];

export interface ExportData {
  version: number;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Exports all data matching our storage prefixes into a single JSON object
 */
export function exportAllData(): string {
  const result: ExportData = {
    version: 1,
    timestamp: new Date().toISOString(),
    data: {}
  };

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && STORAGE_PREFIXES.some(prefix => key.startsWith(prefix))) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          result.data[key] = JSON.parse(value);
        }
      } catch (e) {
        console.warn(`Could not export key ${key}:`, e);
      }
    }
  }

  return JSON.stringify(result, null, 2);
}

/**
 * Imports data from a JSON string back into localStorage
 * Returns true if successful
 */
export function importAllData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString) as ExportData;
    
    // Basic validation
    if (!parsed.version || !parsed.data || typeof parsed.data !== 'object') {
      throw new Error('Ungültiges Datenformat');
    }

    // Clear existing data (optional, but safer for full restore)
    // We only clear our own prefixes
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && STORAGE_PREFIXES.some(prefix => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Import new data
    Object.entries(parsed.data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });

    return true;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

/**
 * Helper to download a string as a file
 */
export function downloadFile(content: string, fileName: string, contentType: string) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}
