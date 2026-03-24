"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Connection {
  id: string;
  platform: string;
  platform_user_id: string;
  platform_name: string;
  token_expires_at: string;
  page_id: string | null;
  ig_account_id: string | null;
  scopes: string[];
  connected_by_name: string | null;
  updated_at: string;
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
      <ConnectPageInner />
    </Suspense>
  );
}

function ConnectPageInner() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const detail = searchParams.get("detail");

  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, []);

  async function fetchConnections() {
    try {
      const res = await fetch("/api/admin/connections");
      const data = await res.json();
      setConnections(data.connections || []);
    } catch {
      console.error("Failed to fetch connections");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect(id: string) {
    if (!confirm("Disconnect this account? The app will fall back to environment variable tokens.")) return;
    await fetch("/api/admin/connections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchConnections();
  }

  function daysUntilExpiry(expiresAt: string): number {
    return Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  const errorMessages: Record<string, string> = {
    denied: "You denied the permission request. Please try again and accept all permissions.",
    missing_params: "Missing parameters from Facebook. Please try again.",
    invalid_state: "Security check failed. Please try again.",
    no_pages: "No Facebook Pages found on your account. Make sure you are an admin of a Facebook Page.",
    exchange_failed: "Failed to connect with Facebook. Please try again.",
  };

  const facebookConnection = connections.find((c) => c.platform === "facebook");
  const instagramConnection = connections.find((c) => c.platform === "instagram");

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Connect Accounts</h1>
      <p className="text-slate-500 mb-8">
        Connect your Facebook Page and Instagram Business account to enable photo publishing.
      </p>

      {/* Success / Error Alerts */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Accounts connected successfully! Your tokens have been saved.
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p>{errorMessages[error] || "Something went wrong. Please try again."}</p>
          {detail && <p className="mt-1 text-xs text-red-600 font-mono">{detail}</p>}
        </div>
      )}

      {/* Connect Button */}
      <div className="mb-8">
        <a
          href="/api/auth/facebook"
          className="inline-flex items-center gap-3 px-6 py-3 bg-[#1877F2] text-white font-semibold rounded-lg hover:bg-[#166FE5] transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          {connections.length > 0 ? "Reconnect with Facebook" : "Connect with Facebook"}
        </a>
        <p className="text-sm text-slate-400 mt-2">
          This will request permissions for Facebook Pages and Instagram publishing.
        </p>
      </div>

      {/* Loading */}
      {loading && <p className="text-slate-400">Loading connections...</p>}

      {/* Connected Accounts */}
      {!loading && connections.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Connected Accounts</h2>

          {/* Facebook */}
          {facebookConnection && (
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1877F2] rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{facebookConnection.platform_name}</p>
                    <p className="text-sm text-slate-500">Facebook Page &middot; ID: {facebookConnection.page_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(facebookConnection.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Disconnect
                </button>
              </div>
              <TokenExpiry expiresAt={facebookConnection.token_expires_at} daysUntilExpiry={daysUntilExpiry} />
            </div>
          )}

          {/* Instagram */}
          {instagramConnection && (
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{instagramConnection.platform_name}</p>
                    <p className="text-sm text-slate-500">Instagram Business &middot; ID: {instagramConnection.ig_account_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(instagramConnection.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Disconnect
                </button>
              </div>
              <TokenExpiry expiresAt={instagramConnection.token_expires_at} daysUntilExpiry={daysUntilExpiry} />
            </div>
          )}

          {/* Permissions */}
          {facebookConnection?.scopes && facebookConnection.scopes.length > 0 && (
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Granted Permissions</h3>
              <div className="flex flex-wrap gap-2">
                {facebookConnection.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full"
                  >
                    {scope}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Connected By */}
          {facebookConnection?.connected_by_name && (
            <p className="text-sm text-slate-400">
              Connected by {facebookConnection.connected_by_name} on{" "}
              {new Date(facebookConnection.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* No connections */}
      {!loading && connections.length === 0 && (
        <div className="p-8 bg-white rounded-xl border border-slate-200 text-center">
          <p className="text-slate-500">No accounts connected yet.</p>
          <p className="text-sm text-slate-400 mt-1">
            Click the button above to connect your Facebook Page and Instagram account.
          </p>
        </div>
      )}
    </div>
  );
}

function TokenExpiry({
  expiresAt,
  daysUntilExpiry,
}: {
  expiresAt: string;
  daysUntilExpiry: (d: string) => number;
}) {
  const days = daysUntilExpiry(expiresAt);
  const isExpiring = days <= 7;
  const isExpired = days <= 0;

  return (
    <div className="mt-3 flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          isExpired ? "bg-red-500" : isExpiring ? "bg-yellow-500" : "bg-green-500"
        }`}
      />
      <span className={`text-sm ${isExpired ? "text-red-600" : isExpiring ? "text-yellow-600" : "text-slate-500"}`}>
        {isExpired
          ? "Token expired — reconnect to refresh"
          : isExpiring
            ? `Token expires in ${days} day${days === 1 ? "" : "s"} — reconnect soon`
            : `Token expires ${new Date(expiresAt).toLocaleDateString()} (${days} days)`}
      </span>
    </div>
  );
}
