import { Suspense } from "react";
import { getLocale } from "@/lib/i18n/server";
import { dictionary } from "@/lib/i18n";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      {/* The texts follow the language cookie, which is only known per request. */}
      <Suspense>
        <Login />
      </Suspense>
    </main>
  );
}

async function Login() {
  const locale = await getLocale();
  const t = dictionary(locale);

  return (
    <>
      <title>{t.title(t.login.title)}</title>
      <h1 className="text-3xl font-bold tracking-tight">{t.login.heading}</h1>
      <LoginForm locale={locale} />
    </>
  );
}
