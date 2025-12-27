import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as storage from '../../../src/services/interview-storage';
import type { InterviewSession, InterviewAnswer } from '../../../src/types/interview';

describe('Interview Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Session Creation & Loading', () => {
    it('should create a new session if none exists', () => {
      const session = storage.createInterviewSession('sess1', ['s1', 's2']);
      
      expect(session.session_id).toBe('sess1');
      expect(session.scenario_order).toEqual(['s1', 's2']);
      expect(session.answers).toEqual([]);
      expect(session.progress.current_index).toBe(0);
    });

    it('should save and load a session', () => {
      const session = storage.createInterviewSession('sess1', []);
      storage.saveInterviewSession(session, 'A');

      const loaded = storage.loadInterviewSession('sess1', 'A');
      expect(loaded).toBeDefined();
      expect(loaded?.session_id).toBe('sess1');
    });

    it('should return null for non-existent session', () => {
      const loaded = storage.loadInterviewSession('unknown', 'A');
      expect(loaded).toBeNull();
    });
  });

  describe('Answer Management', () => {
    it('should save an answer to a session', () => {
      // Create initial session
      const session = storage.createInterviewSession('sess1', []);
      storage.saveInterviewSession(session, 'A');

      const answer: InterviewAnswer = {
        scenario_id: 's1',
        person: 'A',
        primary: 5,
        timestamp: new Date().toISOString()
      };

      storage.saveInterviewAnswer('sess1', 'A', answer);

      const loaded = storage.loadInterviewSession('sess1', 'A');
      expect(loaded?.answers).toHaveLength(1);
      expect(loaded?.answers[0].primary).toBe(5);
    });

    it('should update an existing answer', () => {
      // Create session with answer
      const session = storage.createInterviewSession('sess1', []);
      storage.saveInterviewSession(session, 'A');

      const answer1: InterviewAnswer = {
        scenario_id: 's1',
        person: 'A',
        primary: 3,
        timestamp: new Date().toISOString()
      };
      storage.saveInterviewAnswer('sess1', 'A', answer1);

      // Update answer
      const answer2: InterviewAnswer = {
        ...answer1,
        primary: 5
      };
      storage.saveInterviewAnswer('sess1', 'A', answer2);

      const loaded = storage.loadInterviewSession('sess1', 'A');
      expect(loaded?.answers).toHaveLength(1);
      expect(loaded?.answers[0].primary).toBe(5);
    });
  });

  describe('Combined Session', () => {
    it('should combine answers from A and B', () => {
      // Setup A
      const sessionA = storage.createInterviewSession('sess1', []);
      storage.saveInterviewSession(sessionA, 'A');
      storage.saveInterviewAnswer('sess1', 'A', { 
        scenario_id: 's1', person: 'A', primary: 1, timestamp: '' 
      });

      // Setup B
      const sessionB = storage.createInterviewSession('sess1', []);
      storage.saveInterviewSession(sessionB, 'B');
      storage.saveInterviewAnswer('sess1', 'B', { 
        scenario_id: 's1', person: 'B', primary: 2, timestamp: '' 
      });

      const combined = storage.getCombinedSession('sess1');
      expect(combined).not.toBeNull();
      // Should have 2 answers: 1 from A, 1 from B
      expect(combined?.answers).toHaveLength(2);
      expect(combined?.answers.find(a => a.person === 'A')?.primary).toBe(1);
      expect(combined?.answers.find(a => a.person === 'B')?.primary).toBe(2);
    });
  });
});
