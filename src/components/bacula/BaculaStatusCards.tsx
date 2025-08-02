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
  pieData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  clientStats: Array<{
    name: string;
    jobs: number;
    bytes: number;
    avgSize: number;
  }>;
  formatBytes: (bytes: number) => string;
}

export const BaculaStatusCards: React.FC<BaculaStatusCardsProps> = ({
  jobStats,
  pieData,
  clientStats,
  formatBytes
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      {/* Jobs Ativos */}
      <Card className="bg-purple-900/20 border-purple-600/30">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-400 mb-1">0</div>
          <div className="text-sm text-purple-300 font-medium">Jobs Ativos</div>
          <div className="text-xs text-purple-400 mt-1">Executando agora</div>
        </CardContent>
      </Card>

      {/* All Volumes Size */}
      <Card className="bg-purple-900/20 border-purple-600/30">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-400 mb-1">247</div>
          <div className="text-sm text-purple-300 font-medium">GB Total</div>
          <div className="text-xs text-purple-400 mt-1">Armazenamento</div>
        </CardContent>
      </Card>

      {/* Gráfico de Pizza - Status dos Jobs */}
      <Card className="bg-slate-800 border-slate-700 col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Status dos Jobs</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="h-24 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={pieData} cx="50%" cy="50%" outerRadius={30} innerRadius={15}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded" style={{backgroundColor: item.color}} />
                  <span className="text-slate-300 truncate">{item.name}</span>
                </div>
                <span className="text-slate-300">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Jobs por Cliente - Resumo */}
      <Card className="bg-slate-800 border-slate-700 col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Top Clientes por Tamanho</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {clientStats.slice(0, 4).map((client, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded" 
                    style={{backgroundColor: index % 2 === 0 ? '#22c55e' : '#3b82f6'}} 
                  />
                  <span className="text-slate-300 text-xs">
                    {client.name.toUpperCase()}
                  </span>
                </div>
                <div className="text-slate-300 font-mono">{formatBytes(client.bytes)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};