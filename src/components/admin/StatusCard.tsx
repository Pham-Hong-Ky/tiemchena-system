import React from "react";
import type { LucideIcon } from "lucide-react";

interface StatusCardProps {
  icon: LucideIcon;
  label: string;
  count: number;
  status: string;
  activeStyle: string; // tailwind classes khi được chọn
  isActive: boolean;
  onClick: () => void;
}

export function StatusCard({
  icon: Icon,
  label,
  count,
  activeStyle,
  isActive,
  onClick,
}: StatusCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border transition cursor-pointer ${
        isActive
          ? `${activeStyle} shadow-md`
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <Icon className="w-5 h-5" />
        <span className="text-2xl font-black">{count}</span>
      </div>
      <p className="text-xs font-bold mt-2">{label}</p>
    </div>
  );
}
