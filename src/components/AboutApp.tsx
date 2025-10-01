"use client";
import React, { useMemo, useState } from "react";

type SectionKey = "about" | "how" | "policies" | null;

export default function AboutApp() {
  const [open, setOpen] = useState<SectionKey>(null);

  const SectionButton = ({
    title,
    gradient,
    onClick,
    emoji,
  }: { title: string; gradient: string; onClick: () => void; emoji: string }) => (
    <button
      onClick={onClick}
      className={`w-full relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-left border border-gray-200`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80">
            <span className="text-xl">{emoji}</span>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-700/90">Tap to view details</p>
          </div>
        </div>
        <svg className="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );

  const content = useMemo(() => {
    if (open === "about") {
      return (
        <div className="space-y-2 text-sm text-gray-700">
          <h2 className="text-xl font-bold text-black">About the App</h2>
          <p>
            PWA Scanner helps you quickly scan product barcodes to fetch product details and track
            expiry dates. It works offline-first as a Progressive Web App and securely syncs your
            scan history to the cloud when online.
          </p>
        </div>
      );
    }
    if (open === "how") {
      return (
        <div className="space-y-2 text-sm text-gray-700">
          <h3 className="text-lg font-semibold text-black">How it works</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Tap a category and choose Take a scan to open the camera, or Upload to use an image.</li>
            <li>We read the barcode and look up product data from trusted sources.</li>
            <li>Optionally capture expiry from the package; we’ll save it to your history.</li>
            <li>Your recent scans appear in History, and you can export data anytime.</li>
          </ol>
        </div>
      );
    }
    if (open === "policies") {
      return (
        <div className="space-y-2 text-sm text-gray-700">
          <h3 className="text-lg font-semibold text-black">Policies</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="font-medium">Privacy:</span> We store only the data needed to provide the service (barcode, product info, optional expiry) under your account.</li>
            <li><span className="font-medium">Security:</span> Authentication is handled by Supabase; data access is restricted to your user via Row-Level Security.</li>
            <li><span className="font-medium">Permissions:</span> Camera access is used solely for scanning; you can revoke it anytime in your device settings.</li>
            <li><span className="font-medium">Data export:</span> You can export or delete your data from the app at any time.</li>
          </ul>
        </div>
      );
    }
    return null;
  }, [open]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <SectionButton title="About the App" gradient="from-indigo-100 to-indigo-200" onClick={() => setOpen("about")} emoji="ℹ️" />
      <SectionButton title="How it works" gradient="from-emerald-100 to-emerald-200" onClick={() => setOpen("how")} emoji="⚙️" />
      <SectionButton title="Policies" gradient="from-rose-100 to-rose-200" onClick={() => setOpen("policies")} emoji="📜" />

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
          <div className="w-full sm:max-w-md sm:rounded-2xl sm:mb-0 mb-0 bg-white p-5 shadow-2xl border-t sm:border sm:mx-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold text-black capitalize">{open}</div>
              <button onClick={() => setOpen(null)} className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700">×</button>
            </div>
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

