"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-[var(--foreground)]">
            Photo Pro
          </h1>
          <span className="hidden text-sm text-[var(--muted-foreground)] sm:inline">
            Celtic Quest Fishing
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <a
            href="/dashboard"
            className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)]"
          >
            Queue
          </a>
          <a
            href="/dashboard/history"
            className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--primary)]"
          >
            History
          </a>
          <button
            onClick={handleSignOut}
            className="rounded-md px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
          >
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  );
}
