import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-900",
  {
    variants: {
      variant: {
        default:
          'bg-violet text-white shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_4px_12px_-2px_rgba(108,92,231,0.45)] hover:bg-violet-dim focus-visible:ring-violet/60 active:scale-[0.98]',
        secondary:
          'bg-base-800 text-base-50 border border-base-600 hover:bg-base-700 focus-visible:ring-base-500/60 active:scale-[0.98]',
        ghost:
          'text-base-200 hover:bg-base-800 hover:text-base-50 focus-visible:ring-base-500/60',
        outline:
          'border border-base-600 bg-transparent text-base-100 hover:bg-base-800 focus-visible:ring-base-500/60',
        destructive:
          'bg-coral/90 text-white hover:bg-coral focus-visible:ring-coral/60 active:scale-[0.98]',
        mint:
          'bg-mint text-base-950 font-semibold shadow-[0_4px_12px_-2px_rgba(0,217,163,0.4)] hover:bg-mint-dim active:scale-[0.98]',
        gradient:
          'bg-[linear-gradient(135deg,var(--color-violet)_0%,#8b6ff0_50%,var(--color-mint)_135%)] text-white font-semibold shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_6px_18px_-4px_rgba(108,92,231,0.55)] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_8px_22px_-4px_rgba(108,92,231,0.7)] hover:brightness-[1.06] focus-visible:ring-violet/60 active:scale-[0.98]',
        link: 'text-violet underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 [&_svg]:size-4',
        sm: 'h-8 rounded-[var(--radius-sm)] px-3 text-[13px] [&_svg]:size-3.5',
        lg: 'h-12 rounded-[var(--radius-lg)] px-6 text-base [&_svg]:size-5',
        icon: 'h-10 w-10 [&_svg]:size-4',
        'icon-sm': 'h-8 w-8 [&_svg]:size-3.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
