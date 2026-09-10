import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Mic, MicOff, Search, X } from 'lucide-react';
import {
  EXAMPLE_PROMPTS,
  executeMapTools,
  routeMapQuery,
  type MapQueryEffects,
} from '../lib/mapQuery';

interface Props {
  onEffects: (effects: MapQueryEffects) => void;
  /** Optional: switch to Geo when filter_layers succeeds */
  onPreferGeo?: () => void;
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function MapQueryBar({ onEffects, onPreferGeo }: Props) {
  const [query, setQuery] = useState('');
  const [hud, setHud] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setVoiceSupported(getSpeechRecognition() != null);
  }, []);

  const runQuery = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      const plan = routeMapQuery(text);
      const execution = executeMapTools(plan);
      if (execution.effects.geoLayers && onPreferGeo) {
        onPreferGeo();
      }
      onEffects(execution.effects);
      setHud(execution.hud);
      setQuery(text);
    },
    [onEffects, onPreferGeo],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setVoiceSupported(false);
      setVoiceHint('Voice not supported in this browser — type a query instead.');
      return;
    }
    setVoiceHint(null);
    try {
      const rec = new Ctor();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;
      rec.onresult = (ev) => {
        const transcript = ev.results[0]?.[0]?.transcript?.trim() ?? '';
        if (transcript) runQuery(transcript);
      };
      rec.onerror = (ev) => {
        if (ev.error === 'not-allowed') {
          setVoiceHint('Microphone permission denied — type a query instead.');
        } else if (ev.error !== 'aborted') {
          setVoiceHint(`Voice error: ${ev.error}. Try typing instead.`);
        }
        setListening(false);
        recognitionRef.current = null;
      };
      rec.onend = () => {
        setListening(false);
        recognitionRef.current = null;
      };
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setVoiceHint('Could not start Voice — type a query instead.');
      setListening(false);
    }
  }, [runQuery]);

  useEffect(() => () => stopListening(), [stopListening]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    runQuery(query);
  };

  return (
    <div className="sk-map-query" role="search" aria-label="Ask the map">
      <div className="sk-map-query-row">
        <span className="sk-map-query-mode" title="GEV-inspired Voice / query mode">
          Voice
        </span>
        <form className="sk-map-query-form" onSubmit={onSubmit}>
          <Search size={15} strokeWidth={2} className="sk-map-query-icon" aria-hidden />
          <input
            type="search"
            className="sk-map-query-input"
            placeholder="Ask the map…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Ask the map"
            autoComplete="off"
          />
          <button type="submit" className="sk-btn sk-btn-ghost sk-map-query-go">
            Ask
          </button>
        </form>
        <button
          type="button"
          className={`sk-map-query-mic${listening ? ' listening' : ''}${!voiceSupported ? ' unsupported' : ''}`}
          aria-pressed={listening}
          aria-label={listening ? 'Stop voice input' : 'Voice input'}
          title={
            voiceSupported
              ? listening
                ? 'Listening… click to stop'
                : 'Voice — Web Speech API'
              : 'Voice not supported in this browser'
          }
          onClick={() => (listening ? stopListening() : startListening())}
          disabled={!voiceSupported && !listening}
        >
          {listening ? <MicOff size={16} strokeWidth={2} /> : <Mic size={16} strokeWidth={2} />}
          <span>{listening ? 'Listening' : 'Mic'}</span>
        </button>
      </div>

      {!voiceSupported || voiceHint ? (
        <div className="sk-map-query-hint" role="status">
          {voiceHint ??
            'Voice (Web Speech API) is not available here — use the query bar or example chips.'}
        </div>
      ) : null}

      <div className="sk-map-query-chips" aria-label="Example prompts">
        {EXAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            className="sk-map-query-chip"
            onClick={() => runQuery(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {hud ? (
        <div className="sk-map-query-hud" role="status" aria-live="polite">
          <span className="sk-badge">ANSWER</span>
          <span className="sk-map-query-hud-text">{hud}</span>
          <button
            type="button"
            className="sk-map-query-hud-dismiss"
            aria-label="Dismiss answer"
            onClick={() => setHud(null)}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
