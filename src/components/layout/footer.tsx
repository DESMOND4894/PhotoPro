export function Footer() {
  return (
    <footer className="px-8 py-6 border-t border-slate-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a
            href="https://photo-pro-mu.vercel.app/privacy"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="https://photo-pro-mu.vercel.app/terms"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Terms of Service
          </a>
          <a
            href="https://photo-pro-mu.vercel.app/support"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Support
          </a>
          <a
            href="https://photo-pro-mu.vercel.app/data-deletion"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Data Deletion
          </a>
        </div>
        <p className="text-xs text-slate-400">
          &copy; 2026 Celtic Quest Fishing Fleet
        </p>
      </div>
    </footer>
  );
}
