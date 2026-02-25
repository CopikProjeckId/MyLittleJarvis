"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  children: React.ReactNode;
  className?: string;
}

interface TabProps {
  label: string;
  children: React.ReactNode;
}

export function Tabs({ children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = Array.isArray(children) ? children : [children];
  
  const labels = tabs.map((tab) => (tab as React.ReactElement<TabProps>).props.label);
  
  return (
    <div className={cn("my-6 rounded-lg border border-white/10 overflow-hidden", className)}>
      <div className="flex bg-white/5 border-b border-white/10">
        {labels.map((label, i) => (
          <button
            key={label}
            onClick={() => setActiveTab(i)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === i
                ? "text-[#00D4AA] bg-[#00D4AA]/10 border-b-2 border-[#00D4AA]"
                : "text-gray-400 hover:text-white"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tabs[activeTab]}
      </div>
    </div>
  );
}

export function Tab({ children }: TabProps) {
  return <div>{children}</div>;
}
