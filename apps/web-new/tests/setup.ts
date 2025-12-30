import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Capacitor plugins globally for tests
vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: vi.fn().mockResolvedValue(undefined),
    notification: vi.fn().mockResolvedValue(undefined),
    vibrate: vi.fn().mockResolvedValue(undefined),
    selectionStart: vi.fn().mockResolvedValue(undefined),
    selectionChanged: vi.fn().mockResolvedValue(undefined),
    selectionEnd: vi.fn().mockResolvedValue(undefined),
  },
  ImpactStyle: {
    Heavy: 'Heavy',
    Medium: 'Medium',
    Light: 'Light',
  },
  NotificationType: {
    Success: 'Success',
    Warning: 'Warning',
    Error: 'Error',
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    exitApp: vi.fn().mockResolvedValue(undefined),
  },
}));
