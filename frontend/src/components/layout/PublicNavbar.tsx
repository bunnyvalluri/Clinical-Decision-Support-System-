"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Menu,
  X,
  ShieldCheck,
  Activity,
  Sparkles,
  HeartPulse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PUBLIC_NAV_LINKS } from "@/config/navigation";

export function PublicNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile drawer on Escape key or resize to desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-all shadow-xs pt-safe">
      <div className="w-full mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand & Logo Section */}
        <div className="flex items-center shrink-0 mr-2 sm:mr-4 lg:mr-6">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs p-1 group-hover:border-teal-500 transition-colors">
              <Image
                src="/logo.png"
                alt="HealthNova AI Logo"
                width={36}
                height={36}
                className="h-full w-full object-contain rounded-lg"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-slate-950 group-hover:text-teal-700 transition-colors whitespace-nowrap">
                  HealthNova
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/80 shadow-2xs whitespace-nowrap">
                  AI
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 tracking-tight hidden 2xl:block whitespace-nowrap">
                AI-Powered Clinical Decision Support
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Main Public Navigation"
          className="hidden lg:flex items-center gap-1 xl:gap-1.5"
        >
          {PUBLIC_NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href) && !link.href.includes("#");

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-teal-50 text-teal-800 font-bold border border-teal-200/60 shadow-2xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Live Operational Heartbeat Badge */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50/80 text-[11px] font-medium text-emerald-800 whitespace-nowrap">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-mono font-semibold">Systems Live</span>
          </div>

          <Link href="/login" className="hidden sm:inline-flex">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100/90 whitespace-nowrap px-3"
            >
              Sign In
            </Button>
          </Link>

          <Link href="/register" className="hidden sm:inline-flex">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-50 whitespace-nowrap px-3"
            >
              Register
            </Button>
          </Link>

          {/* Mobile / Tablet Menu Trigger */}
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            className="lg:hidden touch-target inline-flex items-center justify-center p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
          >
            <Menu className="h-5 w-5 text-slate-800" />
          </button>
        </div>
      </div>
    </header>

    {/* Mobile Slide-Over Navigation Drawer */}
    {mounted && mobileMenuOpen && typeof document !== "undefined" && createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
        className="lg:hidden fixed inset-0 z-[9999] flex flex-col bg-white h-screen h-[100dvh] w-screen overscroll-contain overflow-hidden shadow-2xl animate-in fade-in duration-200"
      >
        {/* Mobile Drawer Top Bar */}
        <div className="flex min-h-16 h-16 items-center justify-between border-b border-slate-200 px-4 pt-safe bg-white shrink-0">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 group"
          >
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-0.5">
              <Image
                src="/logo.png"
                alt="HealthNova AI Logo"
                width={36}
                height={36}
                className="h-full w-full object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-slate-950">HealthNova</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                AI
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="touch-target inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Mobile Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 pb-safe overscroll-contain">
          {/* Live Operational Status Banner */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">SYSTEMS OPERATIONAL • BPY-CSE-2666</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full shrink-0 font-bold">
              LIVE
            </span>
          </div>

          {/* Navigation Section Links */}
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold px-2 mb-2">
              Navigation
            </p>
            {PUBLIC_NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href) && !link.href.includes("#");

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-teal-50 text-teal-800 border border-teal-200 font-bold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && (
                    <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-md font-bold">
                      Current
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile Actions */}
          <div className="pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button
                  variant="outline"
                  className="w-full text-xs font-semibold border-slate-300"
                >
                  Sign In
                </Button>
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button
                  variant="outline"
                  className="w-full text-xs font-semibold border-slate-300"
                >
                  Register
                </Button>
              </Link>
            </div>
          </div>

          {/* Disclaimer in mobile menu */}
          <div className="pt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span>HIPAA-aligned • Human-in-the-loop clinical decision support</span>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
);
}
