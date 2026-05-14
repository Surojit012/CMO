"use client";

import { useState, useEffect } from "react";
import { X, User, AtSign, Send, Twitter, FolderOpen } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

type ProfileSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    telegram: "",
    twitter: "",
    projectName: "",
  });
  const [plan, setPlan] = useState("payperuse");

  useEffect(() => {
    if (isOpen) {
      const data = localStorage.getItem("cmo_onboarding_data");
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.profile) setProfile(parsed.profile);
          if (parsed.plan) setPlan(parsed.plan);
        } catch (e) {}
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          walletAddress: wallets?.[0]?.address || null,
          profile,
          plan,
        }),
      });

      if (res.ok) {
        localStorage.setItem(
          "cmo_onboarding_data",
          JSON.stringify({ profile, plan })
        );
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      } else {
        console.error("Failed to update profile");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md rounded-2xl border bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Telegram</label>
            <div className="relative">
              <Send className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={profile.telegram}
                onChange={(e) => setProfile(p => ({ ...p, telegram: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/20 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Twitter (Optional)</label>
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                <input
                  type="text"
                  value={profile.twitter}
                  onChange={(e) => setProfile(p => ({ ...p, twitter: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/20 transition"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Project (Optional)</label>
              <div className="relative">
                <FolderOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                <input
                  type="text"
                  value={profile.projectName}
                  onChange={(e) => setProfile(p => ({ ...p, projectName: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/20 transition"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Current Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 transition appearance-none"
            >
              <option value="weekly" className="bg-zinc-900 text-white">Starter ($9/week)</option>
              <option value="monthly" className="bg-zinc-900 text-white">Growth ($29/month)</option>
              <option value="yearly" className="bg-zinc-900 text-white">Scale ($249/year)</option>
              <option value="payperuse" className="bg-zinc-900 text-white">Pay Per Use</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !profile.name || !profile.email || !profile.telegram}
            className="rounded-lg bg-white px-5 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "Saving..." : success ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
