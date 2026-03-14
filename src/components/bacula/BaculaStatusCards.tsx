import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface BaculaStatusCardsProps {
  jobStats: {
    totalJobs: number;
    completedJobs: number;
    errorJobs: number;
    runningJobs: number;
    totalBytes: number;
    totalFiles: number;
  };
  pieData: Array<{ name: string; value: number; color: string }>;
  clientStats: Array<{ name: string; jobs: number; bytes: number; avgSize: number }>;
  formatBytes: (bytes: number) => string;
}

export const BaculaStatusCards: React.FC<BaculaStatusCardsProps> = ({
  jobStats,
  pieData,
  clientStats,
  formatBytes
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
      {/* Jobs Ativos */}
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border">
        <div className="min-w-0">
          <span className="text-sm font-bold text-purple-400">0</span>
          <div className="text-[10px] text-muted-foreground leading-tight">Jobs Ativos</div>
        </div>
      </div>

      {/* Volume Size */}
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border">
        <div className="min-w-0">
          <span className="text-sm font-bold text-purple-400">247</span>
          <div className="text-[10px] text-muted-foreground leading-tight">GB Total</div>
        </div>
      </div>

      {/* Pie Chart */}
      <Card className="border-border bg-card col-span-2">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-foreground text-xs">Status dos Jobs</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="h-20 mb-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={pieData} cx="50%" cy="50%" outerRadius={28} innerRadius={14}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-0.5 text-[10px]">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground truncate">{item.name}</span>
                </div>
                <span className="text-foreground font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Clients */}
      <Card className="border-border bg-card col-span-2">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-foreground text-xs">Top Clientes por Tamanho</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {clientStats.slice(0, 4).map((client, index) => (
              <div key={index} className="flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-sm"
                    style={{ backgroundColor: index % 2 === 0 ? '#22c55e' : '#3b82f6' }}
                  />
                  <span className="text-muted-foreground">{client.name.toUpperCase()}</span>
                </div>
                <span className="text-foreground font-mono font-medium">{formatBytes(client.bytes)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
