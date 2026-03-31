"use client";

import { useEffect, useState, useCallback } from "react";

interface WhatsAppMessage {
  id: string;
  direction: "inbound" | "outbound";
  sender_phone: string | null;
  recipient_phone: string | null;
  message_type: "text" | "image" | "reaction" | "interactive";
  content: string | null;
  is_captain: boolean;
  trip_id: string | null;
  created_at: string;
}

function maskPhone(phone: string | null): string {
  if (!phone) return "—";
  if (phone.length > 6) {
    return phone.slice(0, 3) + "••••" + phone.slice(-4);
  }
  return phone;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function DirectionBadge({ direction }: { direction: string }) {
  if (direction === "inbound") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        Inbound
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
      Outbound
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    text: "bg-slate-100 text-slate-700",
    image: "bg-purple-100 text-purple-700",
    reaction: "bg-yellow-100 text-yellow-700",
    interactive: "bg-indigo-100 text-indigo-700",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[type] || styles.text}`}>
      {type}
    </span>
  );
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/messages?limit=200");
      const data = await res.json();
      setMessages(data.messages || []);
      setTotal(data.total || 0);
    } catch {
      console.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">WhatsApp Activity</h2>
        <p className="text-slate-500 mt-1">
          Real-time log of all WhatsApp messages — {total} total messages
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 font-medium">No messages yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Messages will appear here when photos are sent via WhatsApp
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Direction</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">From / To</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Content</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {messages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {formatTime(msg.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <DirectionBadge direction={msg.direction} />
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={msg.message_type} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                      {msg.direction === "inbound"
                        ? maskPhone(msg.sender_phone)
                        : maskPhone(msg.recipient_phone)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 max-w-md truncate">
                      {msg.content || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {msg.is_captain ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          Captain
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Crew / Bot</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
