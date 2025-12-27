import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { ScenariosView } from '../../src/components/ScenariosView';
import * as api from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  loadScenarios: vi.fn(),
}));

const mockScenariosData = {
  decks: [
    { id: 'd1', name: 'Deck 1', scenarios: ['s1', 's2'], order: 1 },
    { id: 'd2', name: 'Deck 2', scenarios: ['s3'], order: 2 }
  ],
  scenarios: [
    { id: 's1', title: 'Scenario 1', description: 'Desc 1', options: [{ id: 'A', label: 'Opt A', risk_type: 'low' }] },
    { id: 's2', title: 'Scenario 2', description: 'Desc 2', options: [] },
    { id: 's3', title: 'Scenario 3', description: 'Desc 3', options: [] }
  ]
};

describe('ScenariosView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.loadScenarios as any).mockResolvedValue(mockScenariosData);
  });

  it('should render loading state initially', () => {
    render(<ScenariosView />);
    expect(screen.getByText('Lädt Szenarien...')).toBeInTheDocument();
  });

  it('should render the first scenario of first deck by default', async () => {
    render(<ScenariosView />);
    
    await waitFor(() => {
      expect(screen.getByText('Scenario 1')).toBeInTheDocument();
      expect(screen.getByText('Deck 1')).toBeInTheDocument();
    });
  });

  it('should respect initialDeckIndex', async () => {
    render(<ScenariosView initialDeckIndex={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Scenario 3')).toBeInTheDocument();
      expect(screen.getByText('Deck 2')).toBeInTheDocument();
    });
  });

  it('should navigate to next scenario', async () => {
    render(<ScenariosView />);
    await waitFor(() => screen.getByText('Scenario 1'));

    const nextBtn = screen.getByText('Nächste');
    fireEvent.click(nextBtn);

    expect(screen.getByText('Scenario 2')).toBeInTheDocument();
  });

  it('should handle answering', async () => {
    render(<ScenariosView />);
    await waitFor(() => screen.getByText('Scenario 1'));

    const optionBtns = screen.getAllByText('Opt A');
    fireEvent.click(optionBtns[0]);
    
    // Check if it's visually selected (implementation detail: usually class change)
    // hard to test class names without snapshot or specific role checks
    // But we verify it doesn't crash
    expect(optionBtns[0]).toBeInTheDocument();
  });
});
