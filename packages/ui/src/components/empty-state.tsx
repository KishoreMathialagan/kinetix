import type { LucideIcon } from 'lucide-react';

import { cn } from '@kinetix/utils';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-primary/20 px-6 py-14 text-center', className)}
      {...props}
    >
      {Icon ? (
        <div className="gradient-chip h-14 w-14 rounded-full shadow-[0_6px_16px_rgba(18,57,60,0.25)]">
          <Icon className="h-7 w-7" />
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description ? <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}