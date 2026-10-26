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

// The look of each variant (colors, corner radius, border, shadow) is
// defined per theme in src/app/globals.css, so it follows the active theme.
const variantClasses: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "ui-btn-secondary",
  destructive: "ui-btn-destructive",
  ghost: "ui-btn-ghost",
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
      className={`ui-btn inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </motion.button>
  );
}
