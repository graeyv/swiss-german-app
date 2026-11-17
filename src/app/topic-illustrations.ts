import type { StaticImageData } from "next/image";
import atHome from "../../public/illustrations/topics/at-home.png";
import atWork from "../../public/illustrations/topics/at-work.png";
import essentials from "../../public/illustrations/topics/essentials.png";
import everydayServices from "../../public/illustrations/topics/everyday-services.png";
import gettingAround from "../../public/illustrations/topics/getting-around.png";
import socialLife from "../../public/illustrations/topics/social-life.png";

// The illustration of each topic that has one, by flashcard deck code, for Flashcards and
// Conversations alike. A topic without one shows its icon. The images have no background: the
// tile or banner sets it, so it can change.
export const TOPIC_ILLUSTRATIONS: Partial<Record<string, StaticImageData>> = {
  C03: socialLife,
  C04: atHome,
  C05: atWork,
  C06: everydayServices,
  C07: gettingAround,
  C08: essentials,
};
