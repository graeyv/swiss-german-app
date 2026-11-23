import { type ReactNode, Suspense } from "react";
import { LoadingPlaceholder } from "@/app/loading-placeholder";
import { DEFAULT_NEW_CARDS } from "@/lib/flashcards/daily-plan";
import { dictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { lessonsFor } from "@/lib/learn/lessons";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import { LogOutIcon } from "./icons";
import { Stat } from "./stat";
import { AudioSetting, DialectSetting, DirectionSetting, PaceSetting, TrackSetting } from "./settings";

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
  const [claims, profile, dialects, stats] = await Promise.all([
    supabase.auth.getClaims(),
    supabase
      .from("profiles")
      .select("created_at, new_cards_per_day, card_front, autoplay_audio, dialect_id")
      .maybeSingle(),
    supabase.from("dialects").select("id, name").order("name"),
    supabase.rpc("profile_stats").single(),
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

  return (
    <>
      <title>{t.title(t.profile.title)}</title>

      {/* The learner's initial in a sage circle, like the logo's bubble, the address in heading
          size, and since when they learn. */}
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-sage text-title font-bold"
        >
          {(email ?? "?").charAt(0).toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate text-heading font-bold">{email ?? t.profile.title}</h1>
          {since && <p className="text-caption text-teal-soft">{t.profile.learningSince(since)}</p>}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <GroupTitle>{t.profile.progress}</GroupTitle>
        <div className="grid grid-cols-2 gap-3">
          <Stat icon="flame" value={stats.data.streak} label={t.profile.streak(stats.data.streak)} />
          <Stat icon="cards" value={stats.data.words_learned} label={t.profile.wordsLearned(stats.data.words_learned)} />
        </div>
      </section>

      <Group title={t.profile.languages}>
        <TrackSetting locale={locale} modules={{ de: lessonsFor("de").length, en: lessonsFor("en").length }} />
        <DialectSetting dialects={dialects.data} current={profile.data?.dialect_id ?? null} locale={locale} />
      </Group>

      <Group title={t.profile.learning}>
        <PaceSetting newCardsPerDay={profile.data?.new_cards_per_day ?? DEFAULT_NEW_CARDS} locale={locale} />
        <DirectionSetting
          cardFront={profile.data?.card_front === "translation" ? "translation" : "swiss_german"}
          locale={locale}
        />
        <AudioSetting autoplay={profile.data?.autoplay_audio ?? true} locale={locale} />
      </Group>

      <Group title={t.profile.account}>
        {/* In brick, as what ends something; a row on mist like the settings. */}
        <form action={signOut}>
          <button className="flex min-h-18 w-full items-center gap-4 rounded-3xl bg-mist px-6 py-4 text-left text-body font-bold text-brick transition-transform active:scale-[0.98]">
            <LogOutIcon />
            {t.profile.logOut}
          </button>
        </form>
      </Group>
    </>
  );
}

// A section of settings: rows on mist under a heading, with space between them, as Learn's
// modules. No lines. Each setting also holds its sheet, so they're not a list. See DESIGN.md.
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <GroupTitle>{title}</GroupTitle>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

// A section's heading, as "ALLE MODULE" in Learn.
function GroupTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-caption font-semibold tracking-[0.08em] text-teal-soft uppercase">{children}</h2>;
}
