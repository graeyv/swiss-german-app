"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/app/ui/icons";
import { dictionary, type Locale } from "@/lib/i18n";
import { liftDailyLimit } from "./actions";

// Lifts today's limit of new cards. Saving refreshes the page, which then shows it lifted.
export function LiftLimit({
  label,
  locale,
  variant = "pill",
}: {
  label: string;
  locale: Locale;
  variant?: "pill" | "primary" | "secondary";
}) {
  const t = dictionary(locale).goal;
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function lift() {
    setError(null);
    startSaving(async () => {
      const result = await liftDailyLimit();
      if (result.error) setError(result.error);
    });
  }

  const look =
    variant === "pill"
      ? "min-h-11 w-fit gap-1.5 rounded-full bg-ivory px-4 text-sm font-semibold"
      : `min-h-14 w-full gap-2 rounded-full px-6 font-semibold ${variant === "primary" ? "bg-teal text-ivory" : "bg-mist text-teal"}`;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={lift}
        disabled={saving}
        className={`flex items-center justify-center transition-transform active:scale-95 disabled:opacity-60 ${look}`}
      >
        <Icon name="sparkles" size={variant === "pill" ? 16 : 20} />
        {saving ? t.saving : label}
      </button>
      {variant !== "pill" && <p className="text-sm text-teal-soft">{t.liftNote}</p>}
      {error && (
        <p aria-live="polite" className="text-sm text-brick">
          {t.notSaved(error)}
        </p>
      )}
    </div>
  );
}
