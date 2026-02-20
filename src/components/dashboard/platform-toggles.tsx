"use client";

import type { SocialPlatform } from "@/lib/types";

const platforms: { id: SocialPlatform; label: string; icon: string }[] = [
  { id: "facebook", label: "Facebook", icon: "FB" },
  { id: "instagram", label: "Instagram", icon: "IG" },
  { id: "tiktok", label: "TikTok", icon: "TT" },
];

interface PlatformTogglesProps {
  enabled: SocialPlatform[];
  onChange: (platforms: SocialPlatform[]) => void;
  disabled?: boolean;
}

export function PlatformToggles({
  enabled,
  onChange,
  disabled = false,
}: PlatformTogglesProps) {
  function toggle(platform: SocialPlatform) {
    if (disabled) return;
    if (enabled.includes(platform)) {
      onChange(enabled.filter((p) => p !== platform));
    } else {
      onChange([...enabled, platform]);
    }
  }

  return (
    <div className="flex gap-2">
      {platforms.map((p) => (
        <button
          key={p.id}
          onClick={() => toggle(p.id)}
          disabled={disabled}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            enabled.includes(p.id)
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
          } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-80"}`}
        >
          {p.icon}
        </button>
      ))}
    </div>
  );
}
