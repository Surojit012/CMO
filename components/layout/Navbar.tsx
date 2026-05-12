"use client";

import Link from "next/link";
import { LogOut, Menu } from "lucide-react";

type NavbarProps = {
  userLabel: string;
  balance: string;
  balanceSymbol: string;
  onLogout: () => void;
  onMenuToggle: () => void;
  showMenuButton?: boolean;
};

export function Navbar({
  userLabel,
  balance,
  balanceSymbol,
  onLogout,
  onMenuToggle,
  showMenuButton = false,
}: NavbarProps) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between h-[52px] px-4 sm:px-6 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5">
      {/* Left */}
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <button
            onClick={onMenuToggle}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition lg:hidden"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <Link
          href="/"
          className="text-sm font-bold tracking-[0.2em] text-white transition hover:opacity-80 sm:text-[15px]"
        >
          CMO
        </Link>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
          Beta
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline font-mono text-xs text-zinc-500">
          {Number(balance).toFixed(2)} {balanceSymbol}
        </span>
        <span className="max-w-[120px] truncate text-xs text-zinc-600 hidden sm:inline">
          {userLabel}
        </span>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-[11px] font-medium text-zinc-400 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
}
