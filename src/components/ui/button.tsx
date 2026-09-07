import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors duration-150 disabled:opacity-50 min-h-11 px-4",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:bg-accent",
        secondary: "border border-primary text-primary bg-surface hover:bg-bg",
        ghost: "border border-border text-muted bg-transparent hover:bg-bg",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export function Button({
  className,
  variant,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
