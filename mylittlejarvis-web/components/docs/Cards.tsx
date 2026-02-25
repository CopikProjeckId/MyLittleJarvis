"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
}

interface CardsProps {
  children: React.ReactElement<CardProps>[];
}

export function Cards({ children }: CardsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4 my-6">
      {children}
    </div>
  );
}

export function Card({ icon, title, description, href }: CardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-4 p-5 rounded-xl",
        "bg-white/5 border border-white/10",
        "hover:border-[#00D4AA]/50 hover:bg-white/[0.07]",
        "transition-all duration-300"
      )}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white group-hover:text-[#00D4AA] transition-colors">
            {title}
          </h3>
          <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#00D4AA] group-hover:translate-x-1 transition-all" />
        </div>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      </div>
    </Link>
  );
}
