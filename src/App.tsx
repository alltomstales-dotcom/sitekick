import { useCallback, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { TabNav } from './components/TabNav';
import { ResidencyMap } from './components/ResidencyMap';
import { AccessMatrix } from './components/AccessMatrix';
import { FeedHealth } from './components/FeedHealth';
import { GapBoard } from './components/GapBoard';
import { Day1Interview } from './components/Day1Interview';
import type { InterviewAnswer, ViewId } from './data/types';
import { getNarrativeById } from './data/narratives';
import {
  emptyInterviewAnswers,
  interviewedEdgeIds,
  interviewedNodeIds,
} from './data/interview';
import './App.css';

export default function App() {
  const [view, setView] = useState<ViewId>('map');
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [interviewAnswers, setInterviewAnswers] =
    useState<Record<string, InterviewAnswer>>(emptyInterviewAnswers);

  const activePath = activePathId ? (getNarrativeById(activePathId) ?? null) : null;

  const interviewedNodes = useMemo(
    () => interviewedNodeIds(interviewAnswers),
    [interviewAnswers],
  );
  const interviewedEdges = useMemo(
    () => interviewedEdgeIds(interviewAnswers),
    [interviewAnswers],
  );

  const clearPath = useCallback(() => setActivePathId(null), []);

  const activatePath = useCallback((narrativeId: string) => {
    setActivePathId(narrativeId);
    setView('map');
  }, []);

  const patchInterview = useCallback((questionId: string, patch: Partial<InterviewAnswer>) => {
    setInterviewAnswers((prev) => {
      const cur = prev[questionId] ?? { status: 'unanswered', notes: '' };
      return { ...prev, [questionId]: { ...cur, ...patch } };
    });
  }, []);

  const resetInterview = useCallback(() => {
    setInterviewAnswers(emptyInterviewAnswers());
  }, []);

  return (
    <div className="sk-app">
      <Header />
      <TabNav active={view} onChange={setView} />
      <main className="sk-main">
        {view === 'map' && (
          <ResidencyMap
            activePath={activePath}
            onClearPath={clearPath}
            interviewedNodes={interviewedNodes}
            interviewedEdges={interviewedEdges}
          />
        )}
        {view === 'matrix' && <AccessMatrix />}
        {view === 'feeds' && (
          <FeedHealth onActivatePath={activatePath} activePathId={activePathId} />
        )}
        {view === 'gaps' && (
          <GapBoard onActivatePath={activatePath} activePathId={activePathId} />
        )}
        {view === 'interview' && (
          <Day1Interview
            answers={interviewAnswers}
            onChange={patchInterview}
            onReset={resetInterview}
            onViewMap={() => setView('map')}
          />
        )}
      </main>
      <footer className="sk-footer">
        SiteKick · Site Survey Index · All data is synthetic (SIM) — no PHI · V0 concept demo
      </footer>
    </div>
  );
}
