import type { LucideIcon } from 'lucide-react';

import { cn } from '@kinetix/utils';
import { Card } from './ui/card';

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: string;
  accent?: 'primary' | 'secondary';
}

export function StatCard({ label, value, icon: Icon, hint, accent = 'primary', className, ...props }: StatCardProps) {
  return (
    <Card
      className={cn(
        'p-5 transition-transform duration-200 hover:-translate-y-0.5',
        'border-white/60 bg-white/60 supports-[backdrop-filter]:bg-white/40 backdrop-blur-xl',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-primary">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              accent === 'primary'
                ? 'gradient-chip'
                : 'bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground shadow-[0_4px_12px_rgba(168,130,60,0.3)]',
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}