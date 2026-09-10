import type { ViewId } from '../data/types';
import { Network, Grid3X3, Activity, DollarSign } from 'lucide-react';

const TABS: { id: ViewId; label: string; icon: typeof Network }[] = [
  { id: 'map', label: 'Residency Map', icon: Network },
  { id: 'matrix', label: 'Access Matrix', icon: Grid3X3 },
  { id: 'feeds', label: 'Feed Health', icon: Activity },
  { id: 'gaps', label: 'Gap / $$ Board', icon: DollarSign },
];

interface Props {
  active: ViewId;
  onChange: (id: ViewId) => void;
}

export function TabNav({ active, onChange }: Props) {
  return (
    <nav className="sk-tabs" role="tablist">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={active === id}
          className={`sk-tab ${active === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon size={16} strokeWidth={2} />
          {label}
        </button>
      ))}
    </nav>
  );
}
