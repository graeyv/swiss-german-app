"use client";

import { useEffect } from "react";
import { LAST_OPENED_COOKIE, nextPlace } from "@/lib/learn/last-opened";

// Remembers this page as where the learner left off, for the Learn tab. path is such as
// "be/pronunciation" for a module or "be/pronunciation/consonants/r" for a topic.
export function RememberPlace({ path }: { path: string }) {
  useEffect(() => {
    const previous = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${LAST_OPENED_COOKIE}=`))
      ?.slice(LAST_OPENED_COOKIE.length + 1);
    const place = nextPlace(previous && decodeURIComponent(previous), path);
    // A year, on this device only.
    document.cookie = `${LAST_OPENED_COOKIE}=${encodeURIComponent(place)}; path=/; max-age=31536000; samesite=lax`;
  }, [path]);

  return null;
}
