"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/app/ui/button";
import { dictionary, type Locale } from "@/lib/i18n";
import { authenticate, type AuthState } from "./actions";

const inputClass =
  "min-h-12 rounded-2xl border border-line bg-surface px-4 text-base outline-offset-2 focus:outline-2 focus:outline-accent";

// One main action, logging in or creating an account, and a quiet link to the other.
export function LoginForm({ locale, signUp }: { locale: Locale; signUp: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(authenticate, {});
  const t = dictionary(locale).login;

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-caption font-semibold">
        {t.email}
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-caption font-semibold">
        {t.password}
        <input
          name="password"
          type="password"
          autoComplete={signUp ? "new-password" : "current-password"}
          required
          minLength={6}
          className={inputClass}
        />
      </label>

      <div aria-live="polite" className="text-caption">
        {state.error && <p className="text-brick">{state.error}</p>}
        {state.message && <p>{state.message}</p>}
      </div>

      <Button type="submit" name="intent" value={signUp ? "signup" : "login"} disabled={pending}>
        {signUp ? t.createAccount : t.logIn}
      </Button>
      <Link
        href={signUp ? "/login" : "/login?new"}
        replace
        className="flex min-h-11 items-center self-center px-4 text-caption font-semibold text-teal-soft underline underline-offset-4"
      >
        {signUp ? t.haveAccount : t.newHere}
      </Link>
    </form>
  );
}
