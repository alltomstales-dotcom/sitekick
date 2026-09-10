import { useMemo } from 'react';
import { ClipboardList, RotateCcw, CheckCircle2, Circle, Map as MapIcon } from 'lucide-react';
import { SYSTEMS } from '../data/systems';
import {
  INTERVIEW_QUESTIONS,
  INTERVIEW_SECTIONS,
  interviewProgress,
} from '../data/interview';
import type { InterviewAnswer } from '../data/types';

interface Props {
  answers: Record<string, InterviewAnswer>;
  onChange: (questionId: string, patch: Partial<InterviewAnswer>) => void;
  onReset: () => void;
  onViewMap: () => void;
}

function systemLabel(id: string): string {
  return SYSTEMS.find((s) => s.id === id)?.shortName ?? id;
}

export function Day1Interview({ answers, onChange, onReset, onViewMap }: Props) {
  const progress = useMemo(() => interviewProgress(answers), [answers]);

  return (
    <div className="sk-interview">
      <header className="sk-interview-header">
        <div className="sk-interview-title">
          <ClipboardList size={20} strokeWidth={2} />
          <div>
            <h2>Day-1 Interview</h2>
            <p className="sk-muted">
              Guided site survey for the Highmark Hybrid world space (SIM). Answers flip linked
              systems on the Residency Map from <em>assumed</em> → <em>interviewed</em>.
            </p>
          </div>
        </div>
        <div className="sk-interview-actions">
          <div className="sk-interview-progress" aria-live="polite">
            <strong>
              {progress.answered}/{progress.total} questions
            </strong>
            <span className="sk-muted">·</span>
            <span>{progress.systemsConfirmed} systems confirmed</span>
          </div>
          <button type="button" className="sk-btn sk-btn-ghost" onClick={onViewMap}>
            <MapIcon size={15} strokeWidth={2} />
            View map
          </button>
          <button
            type="button"
            className="sk-btn sk-btn-ghost"
            onClick={onReset}
            title="Clear all answers for demo replay"
          >
            <RotateCcw size={15} strokeWidth={2} />
            Reset interview
          </button>
        </div>
      </header>

      <div className="sk-interview-progress-bar" aria-hidden>
        <div
          className="sk-interview-progress-fill"
          style={{
            width: `${progress.total ? (100 * progress.answered) / progress.total : 0}%`,
          }}
        />
      </div>

      <div className="sk-interview-sections">
        {INTERVIEW_SECTIONS.map((section) => {
          const qs = INTERVIEW_QUESTIONS.filter((q) => q.section === section.id);
          const done = qs.filter((q) => answers[q.id]?.status === 'answered').length;
          return (
            <section key={section.id} className="sk-interview-section">
              <div className="sk-interview-section-head">
                <h3>{section.label}</h3>
                <span className="sk-chip">
                  {done}/{qs.length}
                </span>
              </div>
              <p className="sk-interview-section-blurb">{section.blurb}</p>
              <ul className="sk-interview-list">
                {qs.map((q) => {
                  const ans = answers[q.id] ?? { status: 'unanswered' as const, notes: '' };
                  const answered = ans.status === 'answered';
                  return (
                    <li
                      key={q.id}
                      className={`sk-interview-q${answered ? ' answered' : ''}`}
                    >
                      <div className="sk-interview-q-top">
                        <button
                          type="button"
                          className={`sk-interview-toggle${answered ? ' on' : ''}`}
                          aria-pressed={answered}
                          onClick={() =>
                            onChange(q.id, {
                              status: answered ? 'unanswered' : 'answered',
                            })
                          }
                          title={answered ? 'Mark unanswered' : 'Mark answered'}
                        >
                          {answered ? (
                            <CheckCircle2 size={18} strokeWidth={2} />
                          ) : (
                            <Circle size={18} strokeWidth={2} />
                          )}
                          <span>{answered ? 'Answered' : 'Unanswered'}</span>
                        </button>
                        <div className="sk-interview-links">
                          {q.nodeIds.map((id) => (
                            <span key={id} className="sk-chip">
                              {systemLabel(id)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="sk-interview-q-text">{q.text}</p>
                      {q.why ? <p className="sk-interview-why">Why: {q.why}</p> : null}
                      <label className="sk-interview-notes">
                        <span>Notes (SIM)</span>
                        <textarea
                          rows={2}
                          value={ans.notes}
                          placeholder="Capture owner answers, caveats, product freeze…"
                          onChange={(e) => onChange(q.id, { notes: e.target.value })}
                          onBlur={(e) => {
                            if (e.target.value.trim() && ans.status !== 'answered') {
                              onChange(q.id, {
                                status: 'answered',
                                notes: e.target.value,
                              });
                            }
                          }}
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
