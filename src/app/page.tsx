"use client";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (user && !loading) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#060615] flex items-center justify-center px-6 py-10">
      {/* Night-sky background with tiny stars */}
      <div className="absolute inset-0 pointer-events-none">
        {/* soft nebula tint */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#3b1d7a26,_transparent_60%),radial-gradient(ellipse_at_bottom,_#1a0b5e26,_transparent_60%)]" />
        {/* star field */}
        <div className="absolute inset-0" style={{
          backgroundImage:
            'radial-gradient(#ffffff 0.5px, transparent 0.5px), radial-gradient(#a78bfa 0.4px, transparent 0.4px), radial-gradient(#7c3aed 0.3px, transparent 0.3px)',
          backgroundSize: '3px 3px, 6px 6px, 9px 9px',
          backgroundPosition: '0 0, 1px 2px, 2px 1px',
          opacity: .08
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          in love with
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-400"> scanning</span>
        </h1>
        <p className="mt-4 text-sm text-white/70 max-w-sm mx-auto">
          Scan products, detect plant diseases, and track expiries effortlessly in one app.
        </p>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => router.push("/auth?mode=signup")}
            className="w-full py-4 rounded-full font-semibold text-white bg-gradient-to-r from-fuchsia-500 to-violet-500 shadow-lg hover:opacity-95 active:scale-[0.99] transition"
          >
            Get started
          </button>
          <button
            onClick={() => router.push("/auth?mode=login")}
            className="w-full py-4 rounded-full font-semibold text-white/90 bg-white/10 backdrop-blur border border-white/15 hover:bg-white/15 transition"
          >
            I already have an account
          </button>
        </div>

        <p className="mt-6 text-[11px] leading-5 text-white/65">
          Your privacy is our top concern. By continuing you confirm you’ve read and accepted our
          <a href="/policies" className="underline ml-1">Guidelines</a> and
          <a href="/faq" className="underline ml-1">Need help</a>.
        </p>
      </div>
    </div>
  );
}
