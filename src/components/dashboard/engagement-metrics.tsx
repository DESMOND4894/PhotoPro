"use client";

import { useEffect, useState } from "react";

interface PlatformEngagement {
  platform: string;
  likes: number;
  comments: number;
  shares?: number;
}

export function EngagementMetrics({ tripId }: { tripId: string }) {
  const [engagement, setEngagement] = useState<PlatformEngagement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/trips/${tripId}/engagement`)
      .then((res) => res.json())
      .then((data) => setEngagement(data.engagement || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tripId]);

  if (loading) {
    return (
      <div className="text-xs text-slate-400 animate-pulse">
        Loading engagement...
      </div>
    );
  }

  if (engagement.length === 0) return null;

  return (
    <div className="mb-5">
      <p className="text-sm font-medium text-slate-700 mb-3">Engagement</p>
      <div className="grid grid-cols-2 gap-3">
        {engagement.map((e) => (
          <div
            key={e.platform}
            className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
              {e.platform}
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-700">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {e.likes}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {e.comments}
              </span>
              {e.shares !== undefined && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  {e.shares}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
