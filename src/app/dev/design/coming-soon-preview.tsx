import { TopicTile } from "@/app/ui/topic-tile";
import atHome from "../../../../public/illustrations/topics/at-home.png";
import socialLife from "../../../../public/illustrations/topics/social-life.png";

// Developer preview only: a topic with content next to one with nothing in it yet, as wide as on
// an iPhone (390 px screen), where the tiles are narrowest.
export function ComingSoonPreview() {
  return (
    <div className="grid w-[342px] max-w-full grid-cols-2 gap-3">
      <TopicTile href="#" title="Zuhause" caption="5 Szenen" image={atHome} />
      <TopicTile href="#" title="Freizeit" caption="4 Szenen" image={socialLife} comingSoon="Bald verfügbar" />
    </div>
  );
}
