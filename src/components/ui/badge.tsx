import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-normal transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-base-700 text-base-200',
        violet: 'bg-violet-soft text-violet border border-violet/30',
        mint: 'bg-mint-soft text-mint border border-mint/30',
        coral: 'bg-coral-soft text-coral border border-coral/30',
        amber: 'bg-amber-soft text-amber border border-amber/30',
        outline: 'border border-base-600 text-base-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
