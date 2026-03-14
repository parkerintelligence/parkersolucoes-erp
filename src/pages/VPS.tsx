import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { HostingerDashboard } from '@/components/HostingerDashboard';
import { SnapshotsGrid } from '@/components/SnapshotsGrid';
import { Server, Camera, Activity } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'VPS', icon: Server },
  { id: 'snapshots', label: 'Snapshots', icon: Camera },
] as const;

type TabId = typeof TABS[number]['id'];

const VPS = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  return (
    <div className="space-y-3 p-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
            <Server className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Hostinger VPS</h1>
            <p className="text-[10px] text-muted-foreground">Infraestrutura Principal</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
            <Activity className="h-2.5 w-2.5 mr-1" />
            Online
          </Badge>
        </div>
      </div>

      {/* Pill Tabs */}
      <div className="flex gap-0.5 p-1 bg-muted/50 border border-border rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 py-1 px-3 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && <HostingerDashboard />}
      {activeTab === 'snapshots' && <SnapshotsGrid />}
    </div>
  );
};

export default VPS;
