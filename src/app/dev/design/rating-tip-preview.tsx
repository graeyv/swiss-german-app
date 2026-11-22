"use client";

import { useState } from "react";
import { GradeButtons } from "@/app/flashcards/grade-buttons";
import { TextButton } from "@/app/ui/button";
import { Tip } from "@/app/ui/tip";
import { dictionary } from "@/lib/i18n";

const INTERVALS = { 1: "1 Min.", 2: "6 Min.", 3: "10 Min.", 4: "3 T." };

// Developer preview only: the one-time tip above the rating buttons, as on the first card a
// learner turns over, with a way to watch it rise in again. Rating hides it, as in a session. As
// wide as on an iPhone (390 px screen).
export function RatingTipPreview() {
  const t = dictionary("de").session;
  // A new key replays the animation.
  const [round, setRound] = useState(0);
  const [shown, setShown] = useState(true);

  return (
    <div className="flex w-[342px] max-w-full flex-col gap-3">
      {shown && <Tip key={round} title={t.ratingTip.title} text={t.ratingTip.text} delay={0.45} />}
      <GradeButtons intervals={INTERVALS} onGrade={() => setShown(false)} t={t} />
      <TextButton
        onClick={() => {
          setShown(true);
          setRound(round + 1);
        }}
      >
        Nochmals zeigen
      </TextButton>
    </div>
  );
}
