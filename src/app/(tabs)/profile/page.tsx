import { type ReactNode, Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { getToday } from "@/lib/flashcards/data";
import { DEFAULT_NEW_CARDS } from "@/lib/flashcards/daily-plan";
import { dictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import { LogOutIcon } from "./icons";
import { DialectSetting, DirectionSetting, LanguageSetting, PaceSetting, TopicsSetting } from "./settings";

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Profile />
    </Suspense>
  );
}

// Who the learner is, how they're getting on, and their settings.
async function Profile() {
  const [supabase, locale] = await Promise.all([createClient(), getLocale()]);
  const t = dictionary(locale);
  const [claims, profile, dialects, stats, { tree }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase
      .from("profiles")
      .select("created_at, new_cards_per_day, card_front, interests, dialect_id")
      .maybeSingle(),
    supabase.from("dialects").select("id, name").order("name"),
    supabase.rpc("profile_stats").single(),
    getToday(supabase),
  ]);
  if (profile.error) throw new Error(profile.error.message);
  if (dialects.error) throw new Error(dialects.error.message);
  if (stats.error) throw new Error(stats.error.message);

  const claimed = claims.data?.claims.email;
  const email = typeof claimed === "string" ? claimed : null;
  const since = profile.data?.created_at
    ? new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
        new Date(profile.data.created_at),
      )
    : null;
  // Topics are the top-level word decks, as in onboarding.
  const topics = tree
    .filter((deck) => deck.kind === "vocabulary")
    .map(({ code, title, emoji, color }) => ({ code, title, emoji, color }));

  return (
    <>
      <title>{t.title(t.profile.title)}</title>

      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-bold text-accent-foreground"
        >
          {(email ?? "?").charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight">{email ?? t.profile.title}</h1>
          {since && <p className="text-sm text-muted">{t.profile.learningSince(since)}</p>}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{t.profile.progress}</h2>
        <div className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface">
          <Stat icon="🔥" value={stats.data.streak} label={t.profile.streak(stats.data.streak)} />
          <Stat icon="📚" value={stats.data.words_learned} label={t.profile.wordsLearned(stats.data.words_learned)} />
          <Stat icon="🧩" value={stats.data.rules_learned} label={t.profile.rulesLearned(stats.data.rules_learned)} />
        </div>
      </section>

      <Group title={t.profile.languages}>
        <LanguageSetting locale={locale} />
        <DialectSetting dialects={dialects.data} current={profile.data?.dialect_id ?? null} locale={locale} />
      </Group>

      <Group title={t.profile.learning}>
        <PaceSetting newCardsPerDay={profile.data?.new_cards_per_day ?? DEFAULT_NEW_CARDS} locale={locale} />
        <DirectionSetting
          cardFront={profile.data?.card_front === "translation" ? "translation" : "swiss_german"}
          locale={locale}
        />
        <TopicsSetting topics={topics} interests={profile.data?.interests ?? []} locale={locale} />
      </Group>

      <Group title={t.profile.account}>
        <form action={signOut}>
          <button className="flex min-h-14 w-full items-center gap-3 text-left font-semibold text-danger transition-opacity active:opacity-60">
            <LogOutIcon />
            {t.profile.logOut}
          </button>
        </form>
      </Group>
    </>
  );
}

// A section of settings: flat rows under a heading, with thin lines between them.
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{title}</h2>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}

function Stat({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-4 text-center">
      <span aria-hidden className="text-xl">
        {icon}
      </span>
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-xs leading-tight text-muted">{label}</span>
    </div>
  );
}
