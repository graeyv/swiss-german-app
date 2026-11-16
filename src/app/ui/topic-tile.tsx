import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

type TopicTileProps = {
  href: string;
  title: string;
  caption?: string;
  // The topic's illustration across the top, or, for a topic without one, its icon.
  image?: StaticImageData;
  icon?: IconName;
  // Pinned to the bottom, such as today's counts, so it lines up across tiles of a row.
  footer?: ReactNode;
};

// A topic in a two-column grid, as in Flashcards and Conversations. See DESIGN.md.
export function TopicTile({ href, title, caption, image, icon = "cards", footer }: TopicTileProps) {
  return (
    <Link
      href={href}
      // Full height, so tiles side by side match when one title wraps and the other doesn't.
      className="flex h-full flex-col gap-3 overflow-hidden rounded-2xl bg-mist transition-transform active:scale-[0.98]"
    >
      {image ? (
        // Half the column, which is at most 42rem wide. The image has no background of its own:
        // sage-light sets it off from the tile.
        <Image src={image} alt="" quality={90} sizes="(min-width: 42rem) 20rem, 50vw" className="aspect-[3/2] w-full bg-sage-light" />
      ) : (
        <Icon name={icon} size={28} className="mx-4 mt-4 text-teal-soft" />
      )}
      <span className={`flex min-w-0 flex-1 flex-col gap-0.5 px-4 ${footer ? "" : "pb-4"}`}>
        <strong className="leading-snug font-semibold">{title}</strong>
        {caption && <small className="truncate text-sm leading-snug text-teal-soft">{caption}</small>}
      </span>
      {footer && <span className="mt-auto px-4 pb-4">{footer}</span>}
    </Link>
  );
}
