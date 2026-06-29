import { cn, statusColor } from '../../lib/utils';

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: BadgeProps) {
  return (
    <span className={cn('badge', statusColor(status), className)}>
      {label ?? status.replace(/_/g, ' ')}
    </span>
  );
}
