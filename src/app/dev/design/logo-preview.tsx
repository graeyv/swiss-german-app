import { Logo } from "@/app/ui/logo";

// Developer preview only: the logo above a tab's title, as in the app, and how the same speech
// bubble could become the app icon and favicon, which aren't made yet.

// The bubble in the sizes an app icon would need.
const BUBBLE = {
  icon: { text: "px-3 py-1.5 text-[1.375rem]", tail: "-bottom-1.5 left-3 w-3.5" },
  tiny: { text: "px-1.5 py-0.5 text-[0.75rem]", tail: "-bottom-1 left-1 w-2" },
};

function IconBubble({ size }: { size: keyof typeof BUBBLE }) {
  const { text, tail } = BUBBLE[size];
  return (
    <span className="relative inline-flex">
      <span className={`rounded-full bg-sage-light leading-none font-bold tracking-tight text-teal ${text}`}>
        hoi
      </span>
      <svg aria-hidden viewBox="0 0 12 10" className={`absolute fill-sage-light ${tail}`}>
        <path d="M0 0h12L2 10Z" />
      </svg>
    </span>
  );
}

export function LogoPreview() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 rounded-3xl bg-ivory p-6 outline-2 outline-mist">
        <Logo />
        <div className="flex flex-col gap-2">
          <span className="text-title font-bold">Lernen</span>
          <span className="text-subtitle font-semibold">Was Schweizerdeutsch vom Hochdeutschen unterscheidet.</span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <span className="text-caption text-teal-soft">Später als App-Icon (Startbildschirm, Favicon)</span>
        <div className="flex items-end gap-6">
          <span className="flex size-24 items-center justify-center rounded-[1.75rem] bg-teal pb-2">
            <IconBubble size="icon" />
          </span>
          <span className="flex size-12 items-center justify-center rounded-xl bg-teal pb-1">
            <IconBubble size="tiny" />
          </span>
        </div>
      </div>
    </div>
  );
}
