import { useState, useEffect } from 'preact/hooks';
import { Card, Button } from '../components/ui/index';
import { compareSession } from '../services/api/localApi';
import type { SessionInfo, CompareResponse } from '../types';

interface ComparisonViewProps {
  sessionId: string;
  session: SessionInfo;
  onBack: () => void;
}

export function ComparisonView({ sessionId, session, onBack }: ComparisonViewProps) {
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComparison();
  }, [sessionId]);

  async function loadComparison() {
    try {
      setLoading(true);
      setError(null);
      const result = await compareSession(sessionId);
      setComparison(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Vergleich');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="wrap">
        <Card>
          <p>Lädt Vergleich...</p>
        </Card>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="wrap">
        <Card>
          <div className="msg err">{error || 'Vergleich nicht verfügbar'}</div>
          <Button onClick={onBack}>Zurück</Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <div className="row space">
          <h2>Vergleich: {session.name}</h2>
          <Button onClick={onBack}>Zurück</Button>
        </div>

        <div className="compare-summary">
          <div className="summary-card status-match">
            <div className="summary-label">Match</div>
            <div className="summary-value">
              {comparison.items?.filter((i) => i.pair_status === 'MATCH').length || 0}
            </div>
          </div>
          <div className="summary-card status-explore">
            <div className="summary-label">Explore</div>
            <div className="summary-value">
              {comparison.items?.filter((i) => i.pair_status === 'EXPLORE').length || 0}
            </div>
          </div>
          <div className="summary-card status-boundary">
            <div className="summary-label">Boundary</div>
            <div className="summary-value">
              {comparison.items?.filter((i) => i.pair_status === 'BOUNDARY').length || 0}
            </div>
          </div>
        </div>

        <div className="compare-list">
          {comparison.items?.map((item) => {
            const statusClass =
              item.pair_status === 'MATCH'
                ? 'status-match'
                : item.pair_status === 'EXPLORE'
                  ? 'status-explore'
                  : 'status-boundary';
            return (
              <div key={item.question_id} className={`compare-item-card ${statusClass}`}>
                <div className="compare-item-header">
                  <div className="compare-item-title">{item.label || item.question_id}</div>
                  <div className="compare-item-meta">
                    <span className={`status-badge ${statusClass}`}>{item.pair_status}</span>
                    {item.risk_level === 'C' && (
                      <span className="badge risk-badge-C">RISK C</span>
                    )}
                  </div>
                </div>

                <div className="compare-answers">
                  <div className="compare-answer-block">
                    <div className="compare-answer-title">Person A</div>
                    <div className="compare-answer-body">
                      {item.status_a && (
                        <div>
                          <strong>Status:</strong> {item.status_a}
                        </div>
                      )}
                      {item.interest_a !== null && (
                        <div>
                          <strong>Interesse:</strong> {item.interest_a}/4
                        </div>
                      )}
                      {item.comfort_a !== null && (
                        <div>
                          <strong>Komfort:</strong> {item.comfort_a}/4
                        </div>
                      )}
                      {!item.status_a && item.interest_a === null && item.comfort_a === null && (
                        <div>Nicht beantwortet</div>
                      )}
                    </div>
                  </div>
                  <div className="compare-answer-block">
                    <div className="compare-answer-title">Person B</div>
                    <div className="compare-answer-body">
                      {item.status_b && (
                        <div>
                          <strong>Status:</strong> {item.status_b}
                        </div>
                      )}
                      {item.interest_b !== null && (
                        <div>
                          <strong>Interesse:</strong> {item.interest_b}/4
                        </div>
                      )}
                      {item.comfort_b !== null && (
                        <div>
                          <strong>Komfort:</strong> {item.comfort_b}/4
                        </div>
                      )}
                      {!item.status_b && item.interest_b === null && item.comfort_b === null && (
                        <div>Nicht beantwortet</div>
                      )}
                    </div>
                  </div>
                </div>

                {item.flags && item.flags.length > 0 && (
                  <div className="compare-prompts">
                    <div className="compare-prompts-list">
                      {item.flags.map((flag, idx) => (
                        <div key={idx} className="compare-prompt-item">
                          {flag}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {(!comparison.items || comparison.items.length === 0) && (
          <div className="compare-empty">Keine Vergleichsdaten verfügbar</div>
        )}
      </Card>
    </div>
  );
}

