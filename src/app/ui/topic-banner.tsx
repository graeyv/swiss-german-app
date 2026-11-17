import Image, { type StaticImageData } from "next/image";

// The top of a topic's page: its illustration as a flat banner, whole and centred on sage-light,
// since cropping it would cut off heads and feet. See DESIGN.md.
export function TopicBanner({ image }: { image: StaticImageData }) {
  return (
    <Image
      src={image}
      alt=""
      quality={90}
      preload
      sizes="(min-width: 42rem) 39rem, 100vw"
      className="aspect-[2/1] w-full rounded-3xl bg-sage-light object-contain"
    />
  );
}
