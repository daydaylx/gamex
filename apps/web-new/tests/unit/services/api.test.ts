import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as api from '../../../src/services/api';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('API Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('Session Management', () => {
    it('should create a new session', async () => {
      const sessionData = {
        name: 'Test Session',
        template_id: 'default_template.json',
      };

      // Mock listSessions to return empty
      // Mock getSessionInfo needs to mock loadBundledTemplates which calls fetch
      
      // Mock fetch for template loading (looping through files)
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'default_template.json', name: 'Default' }),
      });

      const session = await api.createSession(sessionData);

      expect(session.name).toBe(sessionData.name);
      expect(session.id).toBeDefined();
      expect(session.has_a).toBe(false);
      
      // Verify storage
      const stored = JSON.parse(localStorage.getItem('gamex:sessions') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe(sessionData.name);
    });

    it('should load session info with template', async () => {
      // Setup storage
      const sessions = [{
        id: '123',
        name: 'Existing Session',
        template_id: 'default_template.json', // Use same ID as previous test to handle caching
        created_at: new Date().toISOString(),
        has_a: false, 
        has_b: false
      }];
      localStorage.setItem('gamex:sessions', JSON.stringify(sessions));

      // Mock fetch for template (might be skipped if cached)
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'default_template.json', name: 'Test Template' }),
      });

      const session = await api.getSessionInfo('123');
      expect(session.id).toBe('123');
      // Name might be 'Default' from cache or 'Test Template' if fetched
      expect(session.template.id).toBe('default_template.json');
    });
  });

  describe('Scenarios Loading', () => {
    it('should load scenarios from JSON', async () => {
      const mockData = {
        decks: [{ id: 'd1', name: 'Deck 1' }],
        scenarios: [{ id: 's1', title: 'Scenario 1' }]
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const data = await api.loadScenarios();
      expect(data).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith('/data/scenarios.json');
    });
  });

  describe('Response Management', () => {
    it('should save responses and update session status', async () => {
      // Setup session
      const sessions = [{
        id: '123',
        name: 'Test',
        template_id: 't1',
        has_a: false,
        has_b: false
      }];
      localStorage.setItem('gamex:sessions', JSON.stringify(sessions));

      const responses = { 'q1': { value: 5 } };
      await api.saveResponses('123', 'A', responses as any);

      // Verify response storage
      const storedResp = JSON.parse(localStorage.getItem('gamex:responses:123:A') || '{}');
      expect(storedResp).toEqual(responses);

      // Verify session update
      const storedSessions = JSON.parse(localStorage.getItem('gamex:sessions') || '[]');
      expect(storedSessions[0].has_a).toBe(true);
      expect(storedSessions[0].has_b).toBe(false);
    });
  });
});
