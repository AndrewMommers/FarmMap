import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: 'green' | 'blue' | 'amber' | 'red' | 'purple';
  className?: string;
}

const colorMap = {
  green:  { bg: 'bg-farm-50',   icon: 'bg-farm-100  text-farm-700',  trend: 'text-farm-600'  },
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100  text-blue-700',  trend: 'text-blue-600'  },
  amber:  { bg: 'bg-amber-50',  icon: 'bg-amber-100 text-amber-700', trend: 'text-amber-600' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100   text-red-700',   trend: 'text-red-600'   },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-700', trend: 'text-purple-600' },
};

export function StatCard({ title, value, subtitle, icon, trend, color = 'green', className }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn('card flex items-start gap-4', className)}>
      <div className={cn('rounded-xl p-3 flex-shrink-0', c.icon)}>
        <span className="w-5 h-5 block">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 leading-none">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
        {trend && (
          <p className={cn('text-xs font-medium mt-1', c.trend)}>
            {trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
