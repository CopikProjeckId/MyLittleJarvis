"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepProps {
  title: string;
  children: React.ReactNode;
}

interface StepsProps {
  children: React.ReactElement<StepProps>[];
}

export function Steps({ children }: StepsProps) {
  return (
    <div className="my-6 space-y-0">
      {children.map((child, index) => (
        <div key={index} className="relative flex gap-4 pb-8 last:pb-0">
          {/* Timeline line */}
          {index < children.length - 1 && (
            <div className="absolute left-5 top-10 bottom-0 w-px bg-gradient-to-b from-[#00D4AA] to-transparent" />
          )}
          
          {/* Step number/check */}
          <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-[#00D4AA]/20 border-2 border-[#00D4AA] flex items-center justify-center">
            <span className="text-[#00D4AA] font-bold text-sm">{index + 1}</span>
          </div>
          
          {/* Content */}
          <div className="flex-1 pt-1">
            <h4 className="text-lg font-semibold text-white mb-2">
              {child.props.title}
            </h4>
            <div className="text-gray-400 text-sm leading-relaxed">
              {child.props.children}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Step({ title, children }: StepProps) {
  return <div title={title}>{children}</div>;
}
