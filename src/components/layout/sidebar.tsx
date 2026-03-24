"use client";

import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isQueue = pathname === "/dashboard";
  const isHistory = pathname === "/dashboard/history";
  const isConnect = pathname === "/admin/connect";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--sidebar-bg)] text-white flex flex-col z-40">
      {/* Logo */}
      <div className="px-8 py-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-tight">Photo Pro</h1>
        <p className="text-slate-400 text-sm mt-0.5">Celtic Quest Fishing Fleet</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-5 py-6 space-y-2">
        <a
          href="/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
            isQueue
              ? "bg-slate-700/60 text-white font-medium"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Queue
        </a>
        <a
          href="/dashboard/history"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
            isHistory
              ? "bg-slate-700/60 text-white font-medium"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </a>
        <a
          href="/admin/connect"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
            isConnect
              ? "bg-slate-700/60 text-white font-medium"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Connect
        </a>
      </nav>

      {/* Connected Accounts */}
      <div className="px-5 py-4 border-t border-slate-700">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Connected Accounts</p>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <div className="min-w-0">
              <p className="text-sm text-white truncate">Celtic Quest Fishing Fleet</p>
              <p className="text-xs text-slate-400">Facebook Page</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-pink-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            <div className="min-w-0">
              <p className="text-sm text-white truncate">@celtic_quest_fleet</p>
              <p className="text-xs text-slate-400">Instagram Business</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="px-3 pb-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
