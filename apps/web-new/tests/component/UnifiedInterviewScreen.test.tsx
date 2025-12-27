import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { UnifiedInterviewScreen } from '../../src/screens/UnifiedInterviewScreen';
import * as api from '../../src/services/api';
import * as storage from '../../src/services/interview-storage';

// Mock dependencies
vi.mock('../../src/services/api', () => ({
  loadScenarios: vi.fn(),
  loadTemplate: vi.fn(),
  loadResponses: vi.fn().mockResolvedValue({}), // needed by QuestionnaireForm
}));

vi.mock('../../src/services/interview-storage', () => ({
  loadInterviewScenarios: vi.fn(),
  getInterviewAnswer: vi.fn(),
}));

// Mock child components to simplify integration test
// We want to test the UnifiedScreen logic, not the children again
vi.mock('../../src/components/ScenariosView', () => ({
  ScenariosView: ({ onClose, initialDeckIndex }: any) => (
    <div data-testid="scenarios-view">
      Scenarios View (Deck {initialDeckIndex})
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

vi.mock('../../src/components/form/QuestionnaireForm', () => ({
  QuestionnaireForm: ({ onComplete, initialModuleId }: any) => (
    <div data-testid="questionnaire-form">
      Questionnaire Form (Mod {initialModuleId})
      <button onClick={onComplete}>Finish</button>
    </div>
  )
}));

describe('UnifiedInterviewScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.loadScenarios as any).mockResolvedValue({ decks: [{ id: 'd1', name: 'Deck 1', scenarios: [] }] });
    (api.loadTemplate as any).mockResolvedValue({ modules: [{ id: 'm1', name: 'Module 1' }] });
    (storage.loadInterviewScenarios as any).mockResolvedValue([{ id: 'c1', title: 'Checkin 1' }]);
  });

  it('should render dashboard by default', async () => {
    render(<UnifiedInterviewScreen sessionId="123" person="A" />);
    
    // Wait for loading to finish
    await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument(); // assuming spinner has role status or just wait for text
        expect(screen.getByText('Themen-Wahl')).toBeInTheDocument();
    });

    expect(screen.getByText('Deck 1')).toBeInTheDocument();
    expect(screen.getByText('Module 1')).toBeInTheDocument();
  });

  it('should navigate to ScenariosView when deck selected', async () => {
    render(<UnifiedInterviewScreen sessionId="123" person="A" />);
    await waitFor(() => screen.getByText('Deck 1'));

    fireEvent.click(screen.getByText('Deck 1').closest('div')!); // Assuming click on container

    expect(screen.getByTestId('scenarios-view')).toBeInTheDocument();
    expect(screen.getByText('Scenarios View (Deck 0)')).toBeInTheDocument();
  });

  it('should return to dashboard from ScenariosView', async () => {
    render(<UnifiedInterviewScreen sessionId="123" person="A" />);
    await waitFor(() => screen.getByText('Deck 1'));
    fireEvent.click(screen.getByText('Deck 1').closest('div')!);
    
    fireEvent.click(screen.getByText('Close'));
    expect(screen.getByText('Themen-Wahl')).toBeInTheDocument();
  });

  it('should navigate to QuestionnaireForm when module selected', async () => {
    render(<UnifiedInterviewScreen sessionId="123" person="A" />);
    await waitFor(() => screen.getByText('Module 1'));

    fireEvent.click(screen.getByText('Module 1').closest('div')!);

    expect(screen.getByTestId('questionnaire-form')).toBeInTheDocument();
    expect(screen.getByText('Questionnaire Form (Mod m1)')).toBeInTheDocument();
  });

  it('should navigate to Check-in', async () => {
    render(<UnifiedInterviewScreen sessionId="123" person="A" />);
    await waitFor(() => screen.getByText('Check-in starten'));

    fireEvent.click(screen.getByText('Check-in starten').closest('div')!);

    expect(screen.getByText('Checkin 1')).toBeInTheDocument();
  });
});
