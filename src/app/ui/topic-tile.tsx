import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ComingSoonPill } from "./coming-soon-pill";
import { Icon, type IconName } from "./icons";

type TopicTileProps = {
  href: string;
  title: string;
  caption?: string;
  // The topic's illustration across the top, or, for a topic without one, its icon.
  image?: StaticImageData;
  icon?: IconName;
  // Pinned to the bottom, such as today's counts, so it lines up across tiles of a row.
  footer?: ReactNode;
  // For a topic with nothing in it yet: the label to show, such as "Bald verfügbar".
  comingSoon?: string;
};

// A topic in a two-column grid, as in Flashcards and Conversations. See DESIGN.md. A topic with
// nothing in it yet is inactive, its picture on mist and its title in teal-soft, with a pill
// under the title instead of its size, so prototype testers see at once that it's not ready
// rather than broken.
export function TopicTile({ href, title, caption, image, icon = "cards", footer, comingSoon }: TopicTileProps) {
  return (
    <Link
      href={href}
      // Full height, so tiles side by side match when one title wraps and the other doesn't.
      className="flex h-full flex-col gap-3 overflow-hidden rounded-2xl bg-mist transition-transform active:scale-[0.98]"
    >
      {image ? (
        // Half the column, which is at most 42rem wide. The image has no background of its own:
        // sage-light sets it off from the tile, or mist while it's inactive.
        <Image
          src={image}
          alt=""
          quality={90}
          sizes="(min-width: 42rem) 20rem, 50vw"
          className={`aspect-[3/2] w-full ${comingSoon ? "bg-mist" : "bg-sage-light"}`}
        />
      ) : (
        <Icon name={icon} size={28} className="mx-4 mt-4 text-teal-soft" />
      )}
      <span className={`flex min-w-0 flex-1 flex-col gap-0.5 px-4 ${footer ? "" : "pb-4"}`}>
        <strong className={`leading-snug font-semibold ${comingSoon ? "text-teal-soft" : ""}`}>{title}</strong>
        {comingSoon ? (
          <ComingSoonPill label={comingSoon} />
        ) : (
          caption && <small className="truncate text-sm leading-snug text-teal-soft">{caption}</small>
        )}
      </span>
      {footer && <span className="mt-auto px-4 pb-4">{footer}</span>}
    </Link>
  );
}
