
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface GLPIMetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  progress?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  icon: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'border-slate-600 bg-slate-800 text-white', 
  success: 'border-green-600 bg-green-900/20 text-green-100', 
  warning: 'border-yellow-600 bg-yellow-900/20 text-yellow-100', 
  danger: 'border-red-600 bg-red-900/20 text-red-100', 
  info: 'border-blue-600 bg-blue-900/20 text-blue-100', 
  gray: 'border-slate-600 bg-slate-800 text-slate-200', 
};

const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-3 w-3 text-green-400" />;
    case 'down':
      return <TrendingDown className="h-3 w-3 text-red-400" />;
    case 'stable':
      return <Minus className="h-3 w-3 text-slate-400" />;
    default:
      return null;
  }
};

export const GLPIMetricsCard = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  progress,
  variant = 'default',
  icon,
  className = '',
}: GLPIMetricsCardProps) => {
  return (
    <Card className={`${variantStyles[variant]} hover:shadow-lg transition-all duration-300 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="text-slate-300">{icon}</div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{value}</span>
            {trend && trendValue && (
              <Badge variant="outline" className="gap-1 text-xs border-slate-600 bg-slate-700">
                {getTrendIcon(trend)}
                {trendValue}
              </Badge>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          {progress !== undefined && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2 bg-slate-700" />
              <p className="text-xs text-slate-400">{progress}% do objetivo</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
