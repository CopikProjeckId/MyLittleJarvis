"use client";

import { cn } from "@/lib/utils";
import { Info, AlertTriangle, Lightbulb, CheckCircle } from "lucide-react";

interface CalloutProps {
  type?: "info" | "warning" | "tip" | "success";
  children: React.ReactNode;
  title?: string;
}

const icons = {
  info: Info,
  warning: AlertTriangle,
  tip: Lightbulb,
  success: CheckCircle,
};

const styles = {
  info: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  tip: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  success: "bg-green-500/10 border-green-500/30 text-green-400",
};

export function Callout({ type = "info", children, title }: CalloutProps) {
  const Icon = icons[type];
  
  return (
    <div className={cn(
      "my-6 rounded-lg border p-4",
      styles[type]
    )}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && (
            <p className="font-semibold mb-1">{title}</p>
          )}
          <div className="text-sm leading-relaxed opacity-90">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
