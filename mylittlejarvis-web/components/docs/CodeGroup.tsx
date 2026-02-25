"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

interface CodeGroupProps {
  children: React.ReactElement<{ label: string; children: string }>[];
}

export function CodeGroup({ children }: CodeGroupProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const tabs = Array.isArray(children) ? children : [children];
  const activeCode = tabs[activeTab]?.props.children || "";
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="my-6 rounded-lg border border-white/10 overflow-hidden bg-[#1A1A24]">
      {/* Header with tabs and copy button */}
      <div className="flex items-center justify-between bg-[#252525] border-b border-white/5">
        <div className="flex">
          {tabs.map((tab, i) => (
            <button
              key={tab.props.label}
              onClick={() => setActiveTab(i)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === i
                  ? "text-[#00D4AA] bg-[#00D4AA]/10"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {tab.props.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      
      {/* Code content */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-gray-300">
          <code>{activeCode}</code>
        </pre>
      </div>
    </div>
  );
}
