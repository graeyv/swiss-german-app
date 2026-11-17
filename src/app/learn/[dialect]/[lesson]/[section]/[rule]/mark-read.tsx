"use client";

import { useEffect } from "react";
import { markRead } from "@/app/learn/actions";

// Saves the topic as read once its page has opened, for the Learn tab. Nothing waits for it, and
// if it fails, the topic simply counts as unread until the learner opens it again.
export function MarkRead({ path }: { path: string }) {
  useEffect(() => {
    void markRead(path);
  }, [path]);

  return null;
}
