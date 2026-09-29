import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  /** Thêm padding trên dưới, mặc định py-24 */
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

export function LoadingSpinner({ className = "py-24", size = "md" }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeMap[size]} text-orange-600 animate-spin`} />
    </div>
  );
}
