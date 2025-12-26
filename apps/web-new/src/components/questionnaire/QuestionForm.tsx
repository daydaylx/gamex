import { useState } from 'preact/hooks';
import type { Question } from '../../types/template';
import type { ResponseValue, ConsentRatingValue } from '../../types/form';

interface QuestionFormProps {
  question: Question;
  value: ResponseValue | undefined;
  onChange: (value: ResponseValue) => void;
}

export function QuestionForm({ question, value, onChange }: QuestionFormProps) {
  const [showHelp, setShowHelp] = useState(false);

  function handleConsentRatingChange(field: string, val: unknown) {
    const current = (value as ConsentRatingValue) || {};
    onChange({ ...current, [field]: val });
  }

  function renderQuestion() {
    switch (question.schema) {
      case 'consent_rating':
        return renderConsentRating();
      case 'scale_0_10':
        return renderScale(0, 10);
      case 'scale_1_5':
        return renderScale(1, 5);
      case 'enum':
        return renderEnum();
      case 'multi':
        return renderMulti();
      case 'text':
        return renderText();
      case 'bool':
        return renderBool();
      default:
        return <p>Unbekannter Fragetyp: {question.schema}</p>;
    }
  }

  function renderConsentRating() {
    const current = (value as ConsentRatingValue) || {};
    return (
      <div className="consent-controls">
        <div className="role-block">
          <div className="role-title">Status</div>
          <div className="control-group">
            <select
              className="status-select"
              value={current.status || ''}
              onChange={(e) => handleConsentRatingChange('status', (e.target as HTMLSelectElement).value)}
            >
              <option value="">Bitte wählen</option>
              <option value="YES">Ja</option>
              <option value="MAYBE">Vielleicht</option>
              <option value="NO">Nein</option>
              <option value="HARD_LIMIT">Hard Limit</option>
            </select>
          </div>
        </div>

        <div className="role-block">
          <div className="role-title">Interesse (0-4)</div>
          <div className="control-group">
            <div className="rating-selector-container">
              <div className="rating-labels">
                <span>0</span>
                <span>4</span>
              </div>
              <div className="rating-btn-group">
                {[0, 1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    className={`rating-btn ${current.interest === num ? 'selected' : ''}`}
                    onClick={() => handleConsentRatingChange('interest', num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="role-block">
          <div className="role-title">Komfort (0-4)</div>
          <div className="control-group">
            <div className="rating-selector-container">
              <div className="rating-labels">
                <span>0</span>
                <span>4</span>
              </div>
              <div className="rating-btn-group">
                {[0, 1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    className={`rating-btn ${current.comfort === num ? 'selected' : ''}`}
                    onClick={() => handleConsentRatingChange('comfort', num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="role-block">
          <div className="role-title">Bedingungen (optional)</div>
          <div className="control-group">
            <textarea
              value={current.conditions || ''}
              onChange={(e) => handleConsentRatingChange('conditions', (e.target as HTMLTextAreaElement).value)}
              placeholder="Bedingungen oder Anmerkungen..."
              rows={3}
            />
          </div>
        </div>
      </div>
    );
  }

  function renderScale(min: number, max: number) {
    const numValue = typeof value === 'number' ? value : undefined;
    return (
      <div className="range-container">
        <div className="range-labels">
          <span>{min}</span>
          <span className="range-value-display">{numValue ?? '-'}</span>
          <span>{max}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={numValue ?? min}
          onChange={(e) => onChange(Number((e.target as HTMLInputElement).value))}
        />
      </div>
    );
  }

  function renderEnum() {
    return (
      <select
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
      >
        <option value="">Bitte wählen</option>
        {question.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  function renderMulti() {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="space-y">
        {question.options?.map((opt) => (
          <label key={opt} className="checkbox-label-large">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={(e) => {
                const checked = (e.target as HTMLInputElement).checked;
                if (checked) {
                  onChange([...selected, opt]);
                } else {
                  onChange(selected.filter((v) => v !== opt));
                }
              }}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    );
  }

  function renderText() {
    return (
      <textarea
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange((e.target as HTMLTextAreaElement).value)}
        placeholder="Ihre Antwort..."
        rows={4}
      />
    );
  }

  function renderBool() {
    const boolValue = typeof value === 'boolean' ? value : undefined;
    return (
      <div className="space-y">
        <label className="checkbox-label-large">
          <input
            type="radio"
            name={`bool-${question.id}`}
            checked={boolValue === true}
            onChange={() => onChange(true)}
          />
          <span>Ja</span>
        </label>
        <label className="checkbox-label-large">
          <input
            type="radio"
            name={`bool-${question.id}`}
            checked={boolValue === false}
            onChange={() => onChange(false)}
          />
          <span>Nein</span>
        </label>
      </div>
    );
  }

  return (
    <div className="item">
      <div className="title-row">
        <div className="title-text">
          {question.label}
          {question.risk_level === 'C' && <span className="risk-badge-C">RISK C</span>}
        </div>
        {question.help && (
          <button
            className="btn-info-toggle"
            onClick={() => setShowHelp(!showHelp)}
            aria-label="Hilfe anzeigen"
          >
            <span className="info-icon">ℹ️</span>
            <span className="info-text">Info</span>
          </button>
        )}
      </div>

      {question.help && showHelp && (
        <div className="info-details-box open">
          <div className="info-details-content">{question.help}</div>
        </div>
      )}

      {renderQuestion()}
    </div>
  );
}

