import Link from "next/link";
import type { ComponentProps } from "react";

// Buttons from DESIGN.md: pills, full width. Primary is the screen's one main action, at the
// bottom within thumb reach; secondary is anything else that looks like a button.
type Variant = "primary" | "secondary";

const VARIANTS: Record<Variant, string> = {
  primary: "min-h-14 bg-teal text-ivory active:bg-teal-pressed",
  secondary: "min-h-12 bg-mist text-teal",
};

export function buttonClass(variant: Variant = "primary", className = "") {
  return `flex w-full items-center justify-center gap-2 rounded-full px-6 text-center text-body font-semibold transition-[background-color,transform] active:scale-[0.98] disabled:active:scale-100 disabled:bg-mist disabled:text-teal-soft ${VARIANTS[variant]} ${className}`;
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant };

export function Button({ variant, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

// A quiet way on beside the main buttons, such as "Überspringen": underlined text in teal-soft,
// centred, still 44 px high to tap.
export function TextButton({ className = "", type = "button", ...props }: ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={`min-h-11 self-center px-4 text-caption font-semibold text-teal-soft underline underline-offset-4 ${className}`}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant };

export function ButtonLink({ variant, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
