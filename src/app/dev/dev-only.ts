import { notFound } from "next/navigation";

// The developer pages exist only while developing: in production they're not found.
export function devOnly() {
  if (process.env.NODE_ENV === "production") notFound();
}
