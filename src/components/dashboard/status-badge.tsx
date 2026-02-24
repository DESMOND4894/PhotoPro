import type { TripStatus } from "@/lib/types";

const statusConfig: Record<
  TripStatus,
  { label: string; dotColor: string; className: string }
> = {
  receiving: {
    label: "Receiving",
    dotColor: "bg-blue-500",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  pending: {
    label: "Pending",
    dotColor: "bg-amber-500",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  approved: {
    label: "Approved",
    dotColor: "bg-green-500",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  posting: {
    label: "Posting\u2026",
    dotColor: "bg-purple-500",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  posted: {
    label: "Posted",
    dotColor: "bg-emerald-500",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  skipped: {
    label: "Skipped",
    dotColor: "bg-gray-400",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  failed: {
    label: "Failed",
    dotColor: "bg-red-500",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export function StatusBadge({ status }: { status: TripStatus }) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}
