// Shown at the end of a session, picked at random. Swiss German spelling varies by writer: have
// a native speaker review these before launch, like the cards.
export const CHEERS = [
  "Super gmacht!", // Well done!
  "Tipptopp!", // Perfect!
  "Mega guet!", // Really good!
  "Bravo!",
] as const;

export type Cheer = (typeof CHEERS)[number];

export function pickCheer(random: () => number = Math.random): Cheer {
  return CHEERS[Math.floor(random() * CHEERS.length)];
}
