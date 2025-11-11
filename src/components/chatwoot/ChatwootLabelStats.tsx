import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tag, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp 
} from 'lucide-react';
import { LabelStats } from '@/hooks/useChatwootLabelStats';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

interface ChatwootLabelStatsProps {
  labelStats: LabelStats[];
  isLoading?: boolean;
  onLabelClick?: (label: string) => void;
}

type SortOption = 'total' | 'open' | 'percentage' | 'alphabetical';

export const ChatwootLabelStats = ({ 
  labelStats, 
  isLoading = false,
  onLabelClick 
}: ChatwootLabelStatsProps) => {
  const [sortBy, setSortBy] = useState<SortOption>('total');

  const sortedStats = [...labelStats].sort((a, b) => {
    switch (sortBy) {
      case 'total':
        return b.totalConversations - a.totalConversations;
      case 'open':
        return b.openConversations - a.openConversations;
      case 'percentage':
        return b.percentage - a.percentage;
      case 'alphabetical':
        return a.label.localeCompare(b.label);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (labelStats.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">Nenhuma estatística de etiqueta disponível</p>
        <p className="text-xs mt-2">Adicione etiquetas às conversas para ver estatísticas</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Estatísticas por Etiqueta</h2>
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="total">Ordenar por Total</SelectItem>
            <SelectItem value="open">Ordenar por Abertas</SelectItem>
            <SelectItem value="percentage">Ordenar por %</SelectItem>
            <SelectItem value="alphabetical">Ordem Alfabética</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sortedStats.map((stat) => (
          <Card 
            key={stat.label}
            className="cursor-pointer hover:shadow-lg transition-shadow border-l-4"
            style={{ borderLeftColor: stat.labelObject.color }}
            onClick={() => onLabelClick?.(stat.label)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Tag 
                    className="h-4 w-4" 
                    style={{ color: stat.labelObject.color }}
                  />
                  <span className="truncate">{stat.label}</span>
                </div>
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{
                    backgroundColor: `${stat.labelObject.color}20`,
                    color: stat.labelObject.color,
                  }}
                >
                  {stat.percentage.toFixed(1)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Total */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-foreground">{stat.totalConversations}</span>
                </div>
                <Progress 
                  value={stat.percentage} 
                  className="h-2"
                  style={{
                    backgroundColor: `${stat.labelObject.color}20`,
                  }}
                />
              </div>

              {/* Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3 w-3 text-green-500" />
                    <span>Abertas</span>
                  </div>
                  <Badge variant="outline" className="text-xs h-5 border-green-500/30 bg-green-500/10 text-green-600">
                    {stat.openConversations}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    <span>Pendentes</span>
                  </div>
                  <Badge variant="outline" className="text-xs h-5 border-yellow-500/30 bg-yellow-500/10 text-yellow-600">
                    {stat.pendingConversations}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-blue-500" />
                    <span>Resolvidas</span>
                  </div>
                  <Badge variant="outline" className="text-xs h-5 border-blue-500/30 bg-blue-500/10 text-blue-600">
                    {stat.resolvedConversations}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
