"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/app/ui/button";
import { dictionary, type Locale } from "@/lib/i18n";
import { authenticate, type AuthState, signInWithGoogle } from "./actions";

const inputClass =
  "min-h-12 rounded-2xl border border-line bg-surface px-4 text-base outline-offset-2 focus:outline-2 focus:outline-accent";

// Google first, the quickest way in, then email and password with the one main action, logging in
// or creating an account, and a quiet link to the other. See DESIGN.md.
export function LoginForm({ locale, signUp }: { locale: Locale; signUp: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(authenticate, {});
  const [google, googleAction, googlePending] = useActionState<AuthState>(signInWithGoogle, {});
  const t = dictionary(locale).login;

  return (
    <div className="flex flex-col gap-4">
      <form action={googleAction} className="flex flex-col gap-2">
        <Button type="submit" variant="secondary" disabled={googlePending || pending}>
          <GoogleLogo />
          {t.google}
        </Button>
        {google.error && (
          <p aria-live="polite" className="text-caption text-brick">
            {google.error}
          </p>
        )}
      </form>
      <p className="text-center text-caption text-teal-soft">{t.or}</p>
      <EmailForm state={state} action={action} pending={pending || googlePending} signUp={signUp} t={t} />
    </div>
  );
}

type EmailFormProps = {
  state: AuthState;
  action: (formData: FormData) => void;
  pending: boolean;
  signUp: boolean;
  t: ReturnType<typeof dictionary>["login"];
};

function EmailForm({ state, action, pending, signUp, t }: EmailFormProps) {
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

// Google's "G" in its own four colours, as Google requires for signing in with it.
function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-5 shrink-0">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
