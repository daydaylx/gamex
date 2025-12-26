import { useState, useEffect } from 'preact/hooks';
import { Link } from 'wouter-preact';
import { Card, Button } from '../components/ui';
import { listSessions, listTemplates, createSession } from '../services/api/localApi';
import type { SessionListItem, TemplateListItem } from '../types';

export function HomeView() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [sessionsData, templatesData] = await Promise.all([
        listSessions(),
        listTemplates(),
      ]);
      setSessions(sessionsData);
      setTemplates(templatesData);
      if (templatesData.length > 0) {
        setSelectedTemplate(templatesData[0]!.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSession() {
    if (!newSessionName.trim() || !selectedTemplate) {
      setError('Bitte Name und Template auswählen');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const session = await createSession({
        name: newSessionName.trim(),
        template_id: selectedTemplate,
      });
      setSessions([session, ...sessions]);
      setNewSessionName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    } finally {
      setCreating(false);
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

  return (
    <div>
      <Card>
        <h2>Neue Session</h2>
        <div className="grid2">
          <div>
            <label>
              Name
              <input
                type="text"
                value={newSessionName}
                onInput={(e) => setNewSessionName((e.target as HTMLInputElement).value)}
                placeholder="z.B. Dez 2025"
              />
            </label>
          </div>
          <div>
            <label>
              Template
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate((e.target as HTMLSelectElement).value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="row" style={{ marginTop: '16px' }}>
          <Button
            variant="primary"
            onClick={handleCreateSession}
            disabled={creating || !newSessionName.trim() || !selectedTemplate}
          >
            {creating ? 'Erstelle...' : 'Erstellen'}
          </Button>
          <span className="hint">
            Hinweis: Daten liegen lokal im Klartext vor (Gerätezugriff = Datenzugriff).
          </span>
        </div>
        {error && <div className="msg err">{error}</div>}
      </Card>

      <Card>
        <div className="row space">
          <h2>Sessions</h2>
          <Button onClick={loadData}>Aktualisieren</Button>
        </div>
        {sessions.length === 0 ? (
          <p className="hint">Noch keine Sessions vorhanden.</p>
        ) : (
          <div className="list">
            {sessions.map((session) => (
              <Link key={session.id} href={`/sessions/${session.id}`}>
                <div className="item" style={{ cursor: 'pointer' }}>
                  <div className="title">{session.name}</div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {session.has_a && <span className="badge">Person A</span>}
                    {session.has_b && <span className="badge">Person B</span>}
                    {!session.has_a && !session.has_b && (
                      <span className="hint">Noch nicht ausgefüllt</span>
                    )}
                  </div>
                  <div className="session-progress" style={{ marginTop: '12px' }}>
                    <div className="session-progress-bar">
                      <div
                        className="session-progress-fill"
                        style={{
                          width: `${((session.has_a ? 1 : 0) + (session.has_b ? 1 : 0)) * 50}%`,
                        }}
                      />
                    </div>
                    <div className="session-progress-text">
                      {new Date(session.created_at).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

