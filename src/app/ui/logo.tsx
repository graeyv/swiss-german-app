// The Hoi logo: the word in a sage-light speech bubble, its tail at the bottom left, since saying
// hoi is the first thing a learner does. See DESIGN.md.
export function Logo() {
  return (
    <span className="relative inline-flex">
      <span className="rounded-full bg-sage-light px-3 py-1.5 text-[1.25rem] leading-none font-bold tracking-tight text-teal">
        hoi
      </span>
      <svg aria-hidden viewBox="0 0 12 10" className="absolute -bottom-1.5 left-2.5 w-3 fill-sage-light">
        <path d="M0 0h12L2 10Z" />
      </svg>
    </span>
  );
}
