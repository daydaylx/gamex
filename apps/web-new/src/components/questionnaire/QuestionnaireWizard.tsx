import { useState, useEffect } from 'preact/hooks';
import { Card, Button } from '../ui/index';
import { loadResponses, saveResponses } from '../../services/api/localApi';
import type { SessionInfo } from '../../types';
import type { ResponseMap } from '../../types/form';
import { QuestionForm } from './QuestionForm';

interface QuestionnaireWizardProps {
  sessionId: string;
  session: SessionInfo;
  person: 'A' | 'B';
  onBack: () => void;
}

export function QuestionnaireWizard({ sessionId, session, person, onBack }: QuestionnaireWizardProps) {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [responses, setResponses] = useState<ResponseMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [sessionId, person]);

  async function loadData() {
    try {
      setLoading(true);
      const result = await loadResponses(sessionId, person);
      setResponses(result.responses || {});
    } catch (err) {
      console.error('Error loading responses:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSaveStatus(null);
      await saveResponses(sessionId, person, { responses });
      setSaveStatus('Gespeichert');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  function handleResponseChange(questionId: string, value: unknown) {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleNext() {
    if (currentModuleIndex < session.template.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    }
  }

  function handlePrevious() {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
    }
  }

  function calculateProgress() {
    const totalQuestions = session.template.modules.reduce(
      (sum, mod) => sum + mod.questions.length,
      0
    );
    const answeredQuestions = Object.keys(responses).filter(
      (key) => responses[key] !== null && responses[key] !== undefined
    ).length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
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

  const currentModule = session.template.modules[currentModuleIndex];
  const progress = calculateProgress();

  return (
    <div>
      <Card>
        <div className="row space">
          <div>
            <h2>
              {session.name} - Person {person}
            </h2>
            <p className="sub">
              Modul {currentModuleIndex + 1} von {session.template.modules.length}: {currentModule?.name}
            </p>
          </div>
          <Button onClick={onBack}>Zurück</Button>
        </div>

        <div className="progress-bar">
          <div className="progress-info">
            <span>{Math.round(progress)}% beantwortet</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {currentModule && (
          <div>
            <div className="module-info-card">
              <div className="module-info-icon">📋</div>
              <div>
                <div className="module-info-title">{currentModule.name}</div>
                {currentModule.description && (
                  <div className="module-info-mindset">{currentModule.description}</div>
                )}
              </div>
            </div>

            <div className="space-y">
              {currentModule.questions.map((question) => (
                <QuestionForm
                  key={question.id}
                  question={question}
                  value={responses[question.id]}
                  onChange={(value) => handleResponseChange(question.id, value)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="form-footer" style={{ marginTop: '24px' }}>
          <div className="row" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div className="row">
              <Button onClick={handlePrevious} disabled={currentModuleIndex === 0}>
                Zurück
              </Button>
              <Button onClick={handleNext} disabled={currentModuleIndex === session.template.modules.length - 1}>
                Weiter
              </Button>
            </div>
            <div className="row">
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Speichere...' : 'Speichern'}
              </Button>
              {saveStatus && (
                <span className={`save-status ${saveStatus === 'Gespeichert' ? 'ok' : 'err'}`}>
                  {saveStatus}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

