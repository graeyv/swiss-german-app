import Link from "next/link";
import { Suspense } from "react";
import { withAppName } from "@/app/ui/app-name";
import { Logo } from "@/app/ui/logo";
import { getLocale } from "@/lib/i18n/server";
import { dictionary } from "@/lib/i18n";
import { LoginForm } from "./login-form";

// Logging in, or with ?new, creating an account, which the welcome page's "Los geht's" opens.
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-8 px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header>
        <Link href="/" className="inline-flex min-h-11 items-center">
          <Logo />
        </Link>
      </header>
      {/* The texts follow the language cookie, which is only known per request. */}
      <Suspense>
        <Login searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const locale = await getLocale();
  const signUp = "new" in (await searchParams);
  const t = dictionary(locale);

  return (
    <section className="flex flex-col gap-6 pt-4">
      <title>{t.title(signUp ? t.login.createAccount : t.login.title)}</title>
      <h1 className="text-title leading-tight font-bold">{withAppName(signUp ? t.login.signUpHeading : t.login.heading)}</h1>
      <LoginForm locale={locale} signUp={signUp} />
    </section>
  );
}
