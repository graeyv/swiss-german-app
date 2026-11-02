import { signOut } from "./actions";
import { TabLink } from "./tab-link";

export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <p className="font-semibold text-accent">Grüezi</p>
          <form action={signOut}>
            <button className="text-sm text-muted underline-offset-4 hover:underline">
              Log out
            </button>
          </form>
        </div>
        <nav aria-label="Main" className="flex gap-6 border-b border-line">
          <TabLink href="/learn">Lessons</TabLink>
          <TabLink href="/flashcards">Flashcards</TabLink>
        </nav>
      </header>

      {children}
    </main>
  );
}
