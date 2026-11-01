import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <p className="font-semibold text-accent">Grüezi</p>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Understand your Swiss neighbours, not just their signs.
      </h1>
      <p className="text-lg text-muted">
        Short lessons in real Swiss German, starting with Zürich dialect. Learn what people
        actually say at the bakery, at work and on the tram.
      </p>
      <Link
        href="/learn"
        className="w-fit rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90"
      >
        Start learning
      </Link>
    </main>
  );
}
