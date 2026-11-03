// Shown while a page loads. Without words, because the language is only known once the page
// is rendering.
export function LoadingPlaceholder() {
  return (
    <div
      aria-busy
      className="h-40 w-full animate-pulse rounded-2xl bg-line/60 motion-reduce:animate-none"
    />
  );
}
