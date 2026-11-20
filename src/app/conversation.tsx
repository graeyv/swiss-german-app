// The welcome page's picture: a short conversation in Bärndütsch on a mist card, like a chat. The
// other person's bubbles are on the left in ivory, the learner's on the right in sage, and the
// last, "Hoi zäme!", is yellow, the page's one yellow. Each has the logo's tail and pops in after
// the one before. With reduced motion, they're all there at once. See DESIGN.md.
export function Conversation({ bubbles }: { bubbles: readonly string[] }) {
  return (
    <ul lang="gsw" className="flex flex-1 flex-col justify-center gap-4 rounded-3xl bg-mist px-5 py-8">
      {bubbles.map((text, index) => {
        const right = index % 2 === 1;
        const last = index === bubbles.length - 1;
        // Full class names, so Tailwind finds them.
        const [background, fill] = last
          ? ["bg-yellow", "fill-yellow"]
          : right
            ? ["bg-sage", "fill-sage"]
            : ["bg-ivory", "fill-ivory"];
        return (
          <li
            key={text}
            className={`flex motion-safe:animate-pop ${right ? "justify-end" : "justify-start"}`}
            style={{
              animationDelay: `${0.15 + index * 0.35}s`,
              transformOrigin: right ? "bottom right" : "bottom left",
            }}
          >
            <span className={`relative rounded-3xl px-5 py-2.5 text-subtitle font-semibold ${background}`}>
              {text}
              <svg
                aria-hidden
                viewBox="0 0 12 10"
                className={`absolute -bottom-2 w-3.5 ${fill} ${right ? "right-4 -scale-x-100" : "left-4"}`}
              >
                <path d="M0 0h12L2 10Z" />
              </svg>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
