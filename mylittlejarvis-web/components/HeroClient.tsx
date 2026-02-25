"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Terminal, Cpu, HardDrive } from "lucide-react";

export function HeroClient() {
  const { t, isLoading } = useTranslation();

  if (isLoading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-white/10 rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-white/10 rounded w-32 mx-auto"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20 px-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D4AA]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
            {t("hero.badge1")}
          </span>
          <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
            {t("hero.badge2")}
          </span>
          <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
            {t("hero.badge3")}
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
          {t("hero.headline1")}<br />
          {t("hero.headline2")}<br />
          <span className="bg-gradient-to-r from-[#00D4AA] to-purple-500 bg-clip-text text-transparent">
            {t("hero.headline3")}
          </span>
        </h1>

        {/* Subtitle */}
        <p 
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: t("hero.subtitle") }}
        />

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/#installation"
            className="px-8 py-4 bg-[#00D4AA] text-black font-bold rounded-xl hover:bg-[#00D4AA]/90 transition-all text-lg"
          >
            {t("hero.cta1")}
          </Link>
          <Link
            href="/#terminal"
            className="px-8 py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all border border-white/10 text-lg"
          >
            {t("hero.cta2")}
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16 pt-16 border-t border-white/10">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-1">15%</div>
            <div className="text-sm text-gray-500">Claude Pro Cost</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-1">24/7</div>
            <div className="text-sm text-gray-500">Always On</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-1">3min</div>
            <div className="text-sm text-gray-500">Setup Time</div>
          </div>
        </div>
      </div>

      {/* Demo Terminal */}
      <div className="relative max-w-3xl mx-auto mt-16 w-full">
        <div className="bg-[#12121A] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          {/* Terminal Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#1A1A24] border-b border-white/5">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 text-center text-sm text-gray-500 font-mono">
              jarvis — zsh
            </div>
          </div>

          {/* Terminal Content */}
          <div className="p-6 font-mono text-sm">
            <div className="text-[#00D4AA] mb-2">{t("hero.online")}</div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs shrink-0">
                  {t("hero.chatUser")}
                </div>
                <div className="bg-white/5 rounded-lg px-4 py-2 text-gray-300">
                  {t("hero.chatSample")}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00D4AA]/20 flex items-center justify-center text-[#00D4AA] text-xs shrink-0 font-bold">
                  {t("hero.chatAgent")}
                </div>
                <div className="bg-[#00D4AA]/10 rounded-lg px-4 py-2 text-gray-300 border border-[#00D4AA]/20">
                  {t("hero.chatReply")}
                </div>
              </div>
            </div>
            <div className="mt-4 text-gray-500 text-xs">{t("hero.justNow")}</div>
          </div>

          {/* Terminal Stats */}
          <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/5 bg-[#0A0A0F]">
            <div className="px-4 py-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-400">{t("hero.statCpu")}: <span className="text-[#00D4AA]">12%</span></span>
            </div>
            <div className="px-4 py-3 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-400">{t("hero.statMemory")}: <span className="text-[#00D4AA]">845MB</span></span>
            </div>
            <div className="px-4 py-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-400">{t("hero.statTasks")}: <span className="text-[#00D4AA]">{t("hero.statTasksValue")}</span></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
