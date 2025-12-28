/**
 * Input Validation & Sanitization Service
 * Prevents XSS, validates data integrity
 */

/**
 * Sanitize string input - removes potentially dangerous HTML/script content
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== "string") return "";

  return (
    input
      // Remove script tags and content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove HTML tags but keep content
      .replace(/<[^>]*>/g, "")
      // Escape HTML entities
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      // Trim whitespace
      .trim()
  );
}

/**
 * Sanitize for safe display (less aggressive, keeps formatting)
 */
export function sanitizeForDisplay(input: string): string {
  if (!input || typeof input !== "string") return "";

  return (
    input
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove event handlers
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")
      // Remove javascript: URLs
      .replace(/javascript:/gi, "")
      .trim()
  );
}

/**
 * Validate session name
 */
export function validateSessionName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Name ist erforderlich" };
  }

  const trimmed = name.trim();

  if (trimmed.length < 1) {
    return { valid: false, error: "Name ist erforderlich" };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: "Name darf maximal 100 Zeichen lang sein" };
  }

  // Check for suspicious patterns
  if (/<script/i.test(trimmed)) {
    return { valid: false, error: "Ungültige Zeichen im Namen" };
  }

  return { valid: true };
}

/**
 * Validate API key format
 */
export function validateApiKey(key: string): { valid: boolean; error?: string } {
  if (!key || typeof key !== "string") {
    return { valid: false, error: "API-Key ist erforderlich" };
  }

  const trimmed = key.trim();

  if (trimmed.length < 10) {
    return { valid: false, error: "API-Key ist zu kurz" };
  }

  // OpenRouter keys typically start with sk-or-
  if (!trimmed.startsWith("sk-or-")) {
    return { valid: false, error: "OpenRouter API-Key sollte mit 'sk-or-' beginnen" };
  }

  return { valid: true };
}

/**
 * Validate notes/text input
 */
export function validateTextInput(
  text: string,
  options: { maxLength?: number; required?: boolean } = {}
): { valid: boolean; error?: string; sanitized: string } {
  const { maxLength = 5000, required = false } = options;

  if (!text || typeof text !== "string") {
    if (required) {
      return { valid: false, error: "Text ist erforderlich", sanitized: "" };
    }
    return { valid: true, sanitized: "" };
  }

  const sanitized = sanitizeForDisplay(text);

  if (required && sanitized.trim().length === 0) {
    return { valid: false, error: "Text ist erforderlich", sanitized };
  }

  if (sanitized.length > maxLength) {
    return {
      valid: false,
      error: `Text darf maximal ${maxLength} Zeichen lang sein`,
      sanitized: sanitized.substring(0, maxLength),
    };
  }

  return { valid: true, sanitized };
}

/**
 * Validate number within range
 */
export function validateNumber(
  value: unknown,
  options: { min?: number; max?: number; required?: boolean } = {}
): { valid: boolean; error?: string; value: number | null } {
  const { min, max, required = false } = options;

  if (value === null || value === undefined || value === "") {
    if (required) {
      return { valid: false, error: "Wert ist erforderlich", value: null };
    }
    return { valid: true, value: null };
  }

  const num = typeof value === "number" ? value : Number(value);

  if (isNaN(num)) {
    return { valid: false, error: "Ungültige Zahl", value: null };
  }

  if (min !== undefined && num < min) {
    return { valid: false, error: `Wert muss mindestens ${min} sein`, value: null };
  }

  if (max !== undefined && num > max) {
    return { valid: false, error: `Wert darf maximal ${max} sein`, value: null };
  }

  return { valid: true, value: num };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "E-Mail ist erforderlich" };
  }

  const trimmed = email.trim().toLowerCase();

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Ungültiges E-Mail-Format" };
  }

  return { valid: true };
}

/**
 * Validate JSON string
 */
export function validateJSON(jsonString: string): {
  valid: boolean;
  error?: string;
  parsed: unknown;
} {
  if (!jsonString || typeof jsonString !== "string") {
    return { valid: false, error: "JSON ist erforderlich", parsed: null };
  }

  try {
    const parsed = JSON.parse(jsonString);
    return { valid: true, parsed };
  } catch {
    return { valid: false, error: "Ungültiges JSON-Format", parsed: null };
  }
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== "string") return false;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize object keys and values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeString(key);

    if (typeof value === "string") {
      sanitized[sanitizedKey] = sanitizeForDisplay(value);
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map((item) =>
        typeof item === "string"
          ? sanitizeForDisplay(item)
          : typeof item === "object" && item !== null
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    } else if (typeof value === "object" && value !== null) {
      sanitized[sanitizedKey] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }

  return sanitized as T;
}
