"use client";

import { useActionState } from "react";
import { authenticate, type AuthState } from "./actions";

const inputClass =
  "rounded-lg border border-line bg-surface px-3 py-2 outline-offset-2 focus:outline-2 focus:outline-accent";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(authenticate, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          className={inputClass}
        />
      </label>

      <div aria-live="polite" className="text-sm">
        {state.error && <p className="text-danger">{state.error}</p>}
        {state.message && <p className="text-success">{state.message}</p>}
      </div>

      <button
        name="intent"
        value="login"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        Log in
      </button>
      <button
        name="intent"
        value="signup"
        disabled={pending}
        className="rounded-full border border-line px-6 py-3 font-semibold transition-colors hover:bg-surface disabled:opacity-50"
      >
        Create account
      </button>
    </form>
  );
}
