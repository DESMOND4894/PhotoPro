"use client";

import { useState } from "react";

interface CaptionEditorProps {
  tripId: string;
  caption: string;
  onUpdate: (newCaption: string) => void;
}

export function CaptionEditor({ tripId, caption, onUpdate }: CaptionEditorProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(caption);
  const [regenerating, setRegenerating] = useState(false);

  async function handleSave() {
    const res = await fetch(`/api/trips/${tripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: text }),
    });

    if (res.ok) {
      onUpdate(text);
      setEditing(false);
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    const res = await fetch(`/api/trips/${tripId}/caption`, {
      method: "POST",
    });

    if (res.ok) {
      const data = await res.json();
      setText(data.caption);
      onUpdate(data.caption);
    }
    setRegenerating(false);
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            Save
          </button>
          <button
            onClick={() => {
              setText(caption);
              setEditing(false);
            }}
            className="rounded-lg bg-[var(--secondary)] px-3 py-1.5 text-xs font-medium text-[var(--secondary-foreground)] hover:opacity-90"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-[var(--foreground)] leading-relaxed">
        &ldquo;{caption}&rdquo;
      </p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg bg-[var(--secondary)] px-3 py-1.5 text-xs font-medium text-[var(--secondary-foreground)] hover:opacity-90"
        >
          Edit Caption
        </button>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="rounded-lg bg-[var(--secondary)] px-3 py-1.5 text-xs font-medium text-[var(--secondary-foreground)] hover:opacity-90 disabled:opacity-50"
        >
          {regenerating ? "Generating…" : "Regenerate"}
        </button>
      </div>
    </div>
  );
}
