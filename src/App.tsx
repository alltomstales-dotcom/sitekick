import { useCallback, useState } from 'react';
import { Header } from './components/Header';
import { TabNav } from './components/TabNav';
import { ResidencyMap } from './components/ResidencyMap';
import { AccessMatrix } from './components/AccessMatrix';
import { FeedHealth } from './components/FeedHealth';
import { GapBoard } from './components/GapBoard';
import type { ViewId } from './data/types';
import { getNarrativeById } from './data/narratives';
import './App.css';

export default function App() {
  const [view, setView] = useState<ViewId>('map');
  const [activePathId, setActivePathId] = useState<string | null>(null);

  const activePath = activePathId ? (getNarrativeById(activePathId) ?? null) : null;

  const clearPath = useCallback(() => setActivePathId(null), []);

  const activatePath = useCallback((narrativeId: string) => {
    setActivePathId(narrativeId);
    setView('map');
  }, []);

  return (
    <div className="sk-app">
      <Header />
      <TabNav active={view} onChange={setView} />
      <main className="sk-main">
        {view === 'map' && (
          <ResidencyMap activePath={activePath} onClearPath={clearPath} />
        )}
        {view === 'matrix' && <AccessMatrix />}
        {view === 'feeds' && <FeedHealth />}
        {view === 'gaps' && (
          <GapBoard onActivatePath={activatePath} activePathId={activePathId} />
        )}
      </main>
      <footer className="sk-footer">
        SiteKick · Site Survey Index · All data is synthetic (SIM) — no PHI · V0 concept demo
      </footer>
    </div>
  );
}
