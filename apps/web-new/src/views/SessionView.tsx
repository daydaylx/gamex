import { useState, useEffect } from 'preact/hooks';
import { useRoute } from 'wouter-preact';
import { Link } from 'wouter-preact';
import { Card, Button } from '../components/ui/index';
import { getSessionInfo, loadResponses, saveResponses, compareSession } from '../services/api/localApi';
import type { SessionInfo } from '../types';
import { QuestionnaireWizard } from '../components/questionnaire/QuestionnaireWizard';
import { ComparisonView } from './ComparisonView';

type ViewMode = 'overview' | 'form-a' | 'form-b' | 'compare';

export function SessionView() {
  const [, params] = useRoute<{ id: string }>('/sessions/:id');
  const sessionId = params?.id || '';

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>('overview');
  const [person, setPerson] = useState<'A' | 'B'>('A');

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  async function loadSession() {
    try {
      setLoading(true);
      setError(null);
      const data = await getSessionInfo(sessionId);
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartForm(p: 'A' | 'B') {
    setPerson(p);
    setMode(`form-${p.toLowerCase()}` as ViewMode);
  }

  async function handleCompare() {
    try {
      setMode('compare');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Vergleich');
    }
  }

  if (loading) {
    return (
      <div className="wrap">
        <Card>
          <p>Lädt...</p>
        </Card>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="wrap">
        <Card>
          <div className="msg err">{error || 'Session nicht gefunden'}</div>
          <Link href="/">
            <Button>Zurück zur Startseite</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (mode === 'form-a' || mode === 'form-b') {
    return (
      <QuestionnaireWizard
        sessionId={sessionId}
        session={session}
        person={person}
        onBack={() => setMode('overview')}
      />
    );
  }

  if (mode === 'compare') {
    return (
      <ComparisonView
        sessionId={sessionId}
        session={session}
        onBack={() => setMode('overview')}
      />
    );
  }

  return (
    <div>
      <Card>
        <div className="row space">
          <div>
            <h2>{session.name}</h2>
            <p className="sub">
              Template: {session.template.name} • Erstellt: {new Date(session.created_at).toLocaleDateString('de-DE')}
            </p>
          </div>
          <Link href="/">
            <Button>Zurück</Button>
          </Link>
        </div>

        <div className="row" style={{ marginTop: '20px', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => handleStartForm('A')}>
            Ausfüllen: Person A
          </Button>
          <Button variant="primary" onClick={() => handleStartForm('B')}>
            Ausfüllen: Person B
          </Button>
          <Button
            onClick={handleCompare}
            disabled={!session.has_a || !session.has_b}
          >
            Vergleich anzeigen
          </Button>
        </div>

        <div className="divider" />

        <div className="row space">
          <div>
            <h3>Status</h3>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              {session.has_a ? (
                <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                  Person A ausgefüllt
                </span>
              ) : (
                <span className="badge">Person A fehlt</span>
              )}
              {session.has_b ? (
                <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                  Person B ausgefüllt
                </span>
              ) : (
                <span className="badge">Person B fehlt</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

