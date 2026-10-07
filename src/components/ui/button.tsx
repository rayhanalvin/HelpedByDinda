import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "accent" | "destructive" | "warning";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer";

    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-border bg-card text-foreground hover:bg-muted hover:border-primary/40",
      ghost: "text-foreground hover:bg-muted",
      accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm hover:shadow-md", // Hijau Emerald
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm",
    };

    const sizes = {
      default: "h-11 px-5 py-2.5 text-sm min-h-[44px]", // 44px touch target mobile
      sm: "h-9 px-3.5 text-xs rounded-lg min-h-[36px]",
      lg: "h-12 px-7 text-base rounded-2xl min-h-[48px]",
      icon: "h-11 w-11 p-0 min-h-[44px] min-w-[44px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
