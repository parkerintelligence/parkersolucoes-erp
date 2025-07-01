
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
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'border-gray-200 bg-gradient-to-br from-gray-50 to-white',
  success: 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50',
  warning: 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50',
  danger: 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50',
  info: 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50',
};

const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    case 'down':
      return <TrendingDown className="h-3 w-3 text-red-500" />;
    case 'stable':
      return <Minus className="h-3 w-3 text-gray-500" />;
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
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <div className="text-gray-400">{icon}</div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {trend && trendValue && (
              <Badge variant="outline" className="gap-1 text-xs">
                {getTrendIcon(trend)}
                {trendValue}
              </Badge>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          {progress !== undefined && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500">{progress}% do objetivo</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
