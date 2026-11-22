import atHome from "../../../../public/illustrations/topics/at-home.png";
import socialLife from "../../../../public/illustrations/topics/social-life.png";
import { PracticeSwitch } from "@/app/(tabs)/flashcards/practice-switch";
import { TodaysGoal } from "@/app/(tabs)/flashcards/todays-goal";
import { TabHeader } from "@/app/ui/tab-header";
import { TopicTile } from "@/app/ui/topic-tile";
import { dictionary } from "@/lib/i18n";

const t = dictionary("de");

// Developer preview only: the tab header on Üben and Dialoge, with the start of what follows. As
// wide as on an iPhone (390 px screen).
export function PracticeHeaderPreview() {
  return (
    <div className="flex w-[342px] max-w-full flex-col gap-8">
      <TabHeader title={t.flashcards.title} intro={t.flashcards.intro} />
      <PracticeSwitch view="words" locale="de" />
      <TodaysGoal
        newCardsPerDay={10}
        introducedToday={4}
        reviewsDone={6}
        reviewsTotal={15}
        reached={false}
        lifted={false}
        canLift={false}
        locale="de"
      />
    </div>
  );
}

export function ConversationsHeaderPreview() {
  return (
    <div className="flex w-[342px] max-w-full flex-col gap-8">
      <TabHeader title={t.nav.conversations} intro={t.conversations.intro} />
      <div className="grid grid-cols-2 gap-3">
        <TopicTile href="#" title="Zuhause" caption="5 Szenen" image={atHome} />
        <TopicTile href="#" title="Freizeit" caption="4 Szenen" image={socialLife} />
      </div>
    </div>
  );
}
