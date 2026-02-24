export function Footer() {
  return (
    <footer className="px-8 py-6 border-t border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a
            href="https://photo-pro-mu.vercel.app/privacy"
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="https://photo-pro-mu.vercel.app/terms"
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Terms of Service
          </a>
          <a
            href="https://photo-pro-mu.vercel.app/support"
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Support
          </a>
          <a
            href="https://photo-pro-mu.vercel.app/data-deletion"
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Data Deletion
          </a>
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          &copy; 2026 Celtic Quest Fishing Fleet
        </p>
      </div>
    </footer>
  );
}
