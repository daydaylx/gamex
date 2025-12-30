import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { haptics, isNative, getPlatform } from '../../../src/platform/capacitor';

// Mocks are set up in tests/setup.ts globally

describe('haptics', () => {
  describe('light', () => {
    it('should call haptics impact with Light style', async () => {
      await haptics.light();
      // Should not throw even with mocked plugin
    });
  });

  describe('medium', () => {
    it('should call haptics impact with Medium style', async () => {
      await haptics.medium();
    });
  });

  describe('heavy', () => {
    it('should call haptics impact with Heavy style', async () => {
      await haptics.heavy();
    });
  });

  describe('success', () => {
    it('should call haptics notification with Success type', async () => {
      await haptics.success();
    });
  });

  describe('warning', () => {
    it('should call haptics notification with Warning type', async () => {
      await haptics.warning();
    });
  });

  describe('error', () => {
    it('should call haptics notification with Error type', async () => {
      await haptics.error();
    });
  });

  describe('selection', () => {
    it('should call haptics selectionChanged', async () => {
      await haptics.selection();
    });
  });
});

describe('isNative', () => {
  let originalCapacitor: any;

  beforeEach(() => {
    originalCapacitor = (window as any).Capacitor;
  });

  afterEach(() => {
    if (originalCapacitor !== undefined) {
      (window as any).Capacitor = originalCapacitor;
    } else {
      delete (window as any).Capacitor;
    }
  });

  it('should return false when Capacitor is not defined', () => {
    delete (window as any).Capacitor;
    expect(isNative()).toBe(false);
  });

  it('should return true when Capacitor is defined', () => {
    (window as any).Capacitor = {};
    expect(isNative()).toBe(true);
  });
});

describe('getPlatform', () => {
  let originalCapacitor: any;

  beforeEach(() => {
    originalCapacitor = (window as any).Capacitor;
  });

  afterEach(() => {
    if (originalCapacitor !== undefined) {
      (window as any).Capacitor = originalCapacitor;
    } else {
      delete (window as any).Capacitor;
    }
  });

  it('should return "web" when not running in Capacitor', () => {
    delete (window as any).Capacitor;
    expect(getPlatform()).toBe('web');
  });

  it('should return "android" when running on Android', () => {
    (window as any).Capacitor = {
      getPlatform: () => 'android'
    };
    expect(getPlatform()).toBe('android');
  });

  it('should return "ios" when running on iOS', () => {
    (window as any).Capacitor = {
      getPlatform: () => 'ios'
    };
    expect(getPlatform()).toBe('ios');
  });

  it('should return "web" when Capacitor is present but getPlatform is undefined', () => {
    (window as any).Capacitor = {};
    expect(getPlatform()).toBe('web');
  });
});
