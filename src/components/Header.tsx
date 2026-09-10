import { FileDown, Printer } from 'lucide-react';
import { downloadExecBriefMarkdown, openExecBriefPrint } from '../lib/execBrief';

export function Header() {
  return (
    <header className="sk-header">
      <div className="sk-header-brand">
        <span className="sk-logo">SK</span>
        <div className="sk-header-titles">
          <h1>SiteKick</h1>
          <span className="sk-subtitle">Site Survey Index</span>
        </div>
      </div>
      <div className="sk-header-actions">
        <div className="sk-header-scenario">
          <span className="sk-badge">SIM</span>
          <span>Highmark Hybrid (SIM)</span>
        </div>
        <div className="sk-export-group">
          <button
            type="button"
            className="sk-btn sk-btn-primary"
            onClick={() => openExecBriefPrint()}
            title="Open printable exec one-pager"
          >
            <Printer size={15} strokeWidth={2} />
            Export exec brief
          </button>
          <button
            type="button"
            className="sk-btn sk-btn-ghost"
            onClick={() => downloadExecBriefMarkdown()}
            title="Download Markdown brief"
          >
            <FileDown size={15} strokeWidth={2} />
            .md
          </button>
        </div>
      </div>
    </header>
  );
}
