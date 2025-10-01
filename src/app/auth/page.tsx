"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Open modal based on query param mode=signup|login
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'signup' || mode === 'login') {
      setIsLogin(mode === 'login');
      setShowAuthModal(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          router.push("/");
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setMessage("Check your email for the confirmation link!");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
      }
      // Google OAuth will redirect, so we don't need to handle success here
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#060615] flex flex-col px-6 pt-16 pb-6">
      {/* Night-sky background with tiny stars */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#3b1d7a26,_transparent_60%),radial-gradient(ellipse_at_bottom,_#1a0b5e26,_transparent_60%)]" />
        <div className="absolute inset-0" style={{
          backgroundImage:
            'radial-gradient(#ffffff 0.5px, transparent 0.5px), radial-gradient(#a78bfa 0.4px, transparent 0.4px), radial-gradient(#7c3aed 0.3px, transparent 0.3px)',
          backgroundSize: '3px 3px, 6px 6px, 9px 9px',
          backgroundPosition: '0 0, 1px 2px, 2px 1px',
          opacity: .08
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto text-center flex-1 flex items-center justify-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_24px_rgba(124,58,237,0.25)]">
          in love with
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-400"> scanning</span>
        </h1>

        {/* CTA moved to bottom */}
      </div>

      {/* Bottom actions */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="space-y-3">
          <button
            onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
            className="w-full py-4 rounded-full font-semibold text-white bg-gradient-to-r from-fuchsia-500 to-violet-500 shadow-lg hover:opacity-95 active:scale-[0.99] transition"
          >
            Get started
          </button>
          <button
            onClick={() => { setIsLogin(true); setShowAuthModal(true); }}
            className="w-full py-4 rounded-full font-semibold text-white/90 bg-white/10 backdrop-blur border border-white/15 hover:bg-white/15 transition"
          >
            I already have an account
          </button>
        </div>
        <p className="mt-4 text-sm text-white/75 text-center">
          Scan products, detect plant diseases, and track expiries effortlessly in one app.
        </p>
        <p className="mt-6 text-[11px] leading-5 text-white/65 text-center">
          Your privacy is our top concern. By continuing you confirm you’ve read and accepted our
          <a href="/policies" className="underline ml-1">Guidelines</a> and
          <a href="/faq" className="underline ml-1">Need help</a>.
        </p>
      </div>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative w-full max-w-sm rounded-3xl bg-white/15 backdrop-blur-2xl border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {isLogin ? "Sign In" : "Create an Account"}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-gray-300 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Continue with Google Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-black text-white font-semibold py-3 px-6 rounded-2xl hover:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-4"
            >
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </div>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-200">or sign up with email</span>
              </div>
            </div>

            {/* Email and Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gradient-to-r from-pink-50 to-yellow-50 text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Email"
                />
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gradient-to-r from-pink-50 to-yellow-50 text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Password"
                  minLength={8}
                />
              </div>

              {/* Password Requirements */}
              <p className="text-xs text-gray-500">
                Passwords must be at least eight characters and include an uppercase letter, a lowercase letter, and a number.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">{message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-300 text-gray-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-transparent mr-2"></div>
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </div>
                ) : (
                  isLogin ? "Sign In" : "Sign Up"
                )}
              </button>
            </form>
            {/* Social Icons Row removed for classic style */}

            {/* Terms and Conditions */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-300">
                By tapping {isLogin ? "Sign In" : "Sign Up"} or Continue with Google, you agree to our{" "}
                <span className="text-blue-300 underline">Terms and Conditions</span> and{" "}
                <span className="text-blue-300 underline">Privacy statement</span>.
              </p>
            </div>

            {/* Toggle between Sign In and Sign Up */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-200">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                    setMessage("");
                  }}
                  className="ml-2 text-blue-300 font-medium hover:text-white transition-colors duration-200"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}