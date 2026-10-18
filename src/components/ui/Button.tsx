"use client";

import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "destructive" | "ghost";

// framer-motion's motion.button redefines onDrag/onDragStart/onDragEnd/
// onAnimationStart/onAnimationEnd with animation-specific signatures that
// conflict with the native DOM event handler types of the same name -
// omit them here since this component doesn't use any of them, rather
// than fighting the type collision every time this file changes.
type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"
>;

interface ButtonProps extends NativeButtonProps {
  variant?: Variant;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: "btn-primary",
  secondary:
    "border border-border bg-surface text-ink hover:border-indigo hover:text-indigo",
  destructive: "border border-rose text-rose hover:bg-rose-soft",
  ghost: "text-ink-soft hover:text-ink",
};

/** Shared button primitive. Prefer this over one-off className strings
 * so every button in the app stays visually and behaviorally consistent -
 * change the look here once, instead of hunting through every page. */
export function Button({
  variant = "primary",
  icon,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </motion.button>
  );
}
