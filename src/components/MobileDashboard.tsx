"use client";
import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DatabaseSetup from "@/components/DatabaseSetup";
import ProductSearch from "@/components/ProductSearch";
import Scanner from "@/components/Scanner";
import TreeScanner from "@/components/TreeScanner";
import ExpiryOCR from "@/components/ExpiryOCR";
import AboutApp from "@/components/AboutApp";
import ExportData from "@/components/ExportData";
import AiLauncher from "@/components/AiLauncher";
import ExpiryAlerts from "@/components/ExpiryAlerts";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, ScanRecord, UserProfile } from "@/lib/supabaseClient";

type Product = {
  product_name: string | null;
  brand: string | null;
  expiry_date?: string | null;
  is_expired?: boolean | null;
  source?: string;
  barcode?: string;
};

function parseExpiryFromText(text: string): string | null {
  const patterns = [
    /(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/, // YYYY-MM-DD
    /(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/, // MM/DD/YYYY
    /exp(?:iry|iration)?\s*[:]?\s*(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const nums = m.slice(1).map((n) => parseInt(n, 10));
      let year = nums[2] ?? nums[0];
      const month = nums[0] ?? nums[1];
      const day = nums[1] ?? nums[2];
      if (year < 100) year += 2000;
      const mm = String(month).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      return `${year}-${mm}-${dd}`;
    }
  }
  return null;
}

export default function MobileDashboard() {
  function serializeUnknownError(err: unknown) {
    if (err instanceof Error) {
      return {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    }
    try {
      return JSON.parse(JSON.stringify(err));
    } catch {
      return { value: String(err) };
    }
  }

  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'plans' | 'scanner' | 'analytics' | 'export' | 'alerts' | 'about'>('home');
  const [showDatabaseWarning, setShowDatabaseWarning] = useState(false);
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [actionCategory, setActionCategory] = useState<"food" | "medicine" | "cosmetic" | "tree" | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayScanCount, setTodayScanCount] = useState<number>(0);
  const [introPhase, setIntroPhase] = useState<'greeting' | 'menu'>('menu');
  const [showMenu, setShowMenu] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [comingSoonPlan, setComingSoonPlan] = useState<"basic" | "premium" | "advanced" | null>(null);

  const displayName = useMemo(() => {
    const meta: any = user?.user_metadata || {};
    const explicit = meta.display_name || meta.full_name || meta.name || meta.username;
    if (explicit && typeof explicit === 'string') return explicit;
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  }, [user]);

  const categoryGradient = useMemo(() => {
    switch (actionCategory) {
      case 'food':
        return 'from-green-100 to-green-200';
      case 'medicine':
        return 'from-blue-100 to-blue-200';
      case 'cosmetic':
        return 'from-pink-100 to-pink-200';
      case 'tree':
        return 'from-emerald-100 to-emerald-200';
      default:
        return 'from-gray-100 to-gray-200';
    }
  }, [actionCategory]);

  // Sync initial tab from URL, e.g. /dashboard?tab=plans
  useEffect(() => {
    const urlTab = searchParams?.get('tab');
    if (!urlTab) return;
    const allowed = ['home','plans','scanner','analytics','export','alerts','about'] as const;
    if (allowed.includes(urlTab as any)) {
      setActiveTab(urlTab as any);
    }
  }, [searchParams]);

  // (Profile dropdown removed)

  // Load user's scan history from Supabase
  const loadScanHistory = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping scan history load');
      return;
    }
    
    try {
      console.log('Loading scan history for user:', user.id);
      console.log('User object:', user);
      console.log('Supabase client:', supabase);
      const { data, error } = await supabase
        .from('scan_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error loading scan history:', error);
        // Best-effort detail extraction across different error shapes
        const detailsObj: Record<string, unknown> = {
          code: (error as any)?.code,
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
        };
        console.error('Error details:', detailsObj);
        console.error('Full error object (serialized):', serializeUnknownError(error));
        
        // If table doesn't exist, show empty history instead of crashing
        if (error.code === 'PGRST116' || 
            error.message?.includes('relation "scan_records" does not exist') ||
            error.message?.includes('does not exist')) {
          console.warn('scan_records table does not exist. Please run the SQL schema setup.');
          setShowDatabaseWarning(true);
          setHistory([]);
          return;
        }
        // For other errors, still set empty history to prevent crashes
        setHistory([]);
        return;
      }
      
      setHistory(data || []);
      setShowDatabaseWarning(false); // Clear warning if successful
    } catch (err) {
      console.error('Error loading scan history (catch block):', err);
      console.error('Error type:', typeof err);
      console.error('Error constructor:', (err as any)?.constructor?.name);
      console.error('Error serialized:', serializeUnknownError(err));
      // Set empty history on any error to prevent app crash
      setHistory([]);
      setShowDatabaseWarning(true);
    }
  }, [user]);

  // Load user profile (plan tier)
  const loadUserProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!error && data) setProfile(data as UserProfile);
  }, [user]);

  // Load today's scan count for limiting by plan
  const loadTodayScanCount = useCallback(async () => {
    if (!user) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('scan_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString());
    setTodayScanCount(count ?? 0);
  }, [user]);

  // Save scan to Supabase
  const saveScanToHistory = useCallback(async (product: Product) => {
    if (!user) {
      console.log('No user found, skipping scan save');
      return;
    }
    
    try {
      console.log('Saving scan for user:', user.id, product);
      const { error } = await supabase
        .from('scan_records')
        .insert({
          user_id: user.id,
          barcode: product.barcode || '',
          product_name: product.product_name,
          brand: product.brand,
          expiry_date: product.expiry_date,
          is_expired: product.is_expired,
          source: product.source || 'manual'
        });
      
      if (error) {
        console.error('Error saving scan:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        // If table doesn't exist, just add to local state instead of crashing
        if (error.code === 'PGRST116' || 
            error.message?.includes('relation "scan_records" does not exist') ||
            error.message?.includes('does not exist')) {
          console.warn('scan_records table does not exist. Adding to local history only.');
          setShowDatabaseWarning(true);
          setHistory(prev => [{
            id: Date.now().toString(),
            user_id: user.id,
            barcode: product.barcode || '',
            product_name: product.product_name,
            brand: product.brand,
            expiry_date: product.expiry_date || null,
            is_expired: product.is_expired || null,
            source: (product.source || 'manual') as 'cache' | 'openfoodfacts' | 'openfda' | 'manual',
            created_at: new Date().toISOString()
          }, ...prev].slice(0, 20));
          return;
        }
        return;
      }
      
      // Reload history after saving
      loadScanHistory();
    } catch (err) {
      console.error('Error saving scan:', err);
      // Add to local state as fallback
      setHistory(prev => [{
        id: Date.now().toString(),
        user_id: user.id,
        barcode: product.barcode || '',
        product_name: product.product_name,
        brand: product.brand,
        expiry_date: product.expiry_date || null,
        is_expired: product.is_expired || null,
        source: (product.source || 'manual') as 'cache' | 'openfoodfacts' | 'openfda' | 'manual',
        created_at: new Date().toISOString()
      }, ...prev].slice(0, 20));
    }
  }, [user, loadScanHistory]);

  // Load profile and history when user changes
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadScanHistory();
      loadTodayScanCount();
    }
  }, [user, loadScanHistory, loadUserProfile, loadTodayScanCount]);

  // Keep welcome banner visible (no auto-dismiss)

  // Apply saved theme (default light). 'dark' adds theme-dark class
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
      const body = document.body;
      if (saved === 'dark') body.classList.add('theme-dark'); else body.classList.remove('theme-dark');
    } catch {}
  }, []);

  const expiredLabel = useMemo(() => {
    if (!product?.expiry_date) return null;
    const now = new Date();
    const d = new Date(product.expiry_date);
    return d < now ? "Expired" : null;
  }, [product]);

  const handleDetected = useCallback(async (code: string) => {
    // Enforce plan-based scan limits
    const plan = profile?.plan_tier ?? 'premium';
    const limits: Record<string, { dailyScans: number; ocr: boolean; analytics: boolean }> = {
      basic: { dailyScans: 10, ocr: false, analytics: false },
      premium: { dailyScans: 50, ocr: true, analytics: true },
      advanced: { dailyScans: Infinity as unknown as number, ocr: true, analytics: true },
    };
    const limit = limits[plan];
    if (plan !== 'advanced' && todayScanCount >= limit.dailyScans) {
      alert(`Daily scan limit reached for your plan (${plan}). Upgrade to Advanced for unlimited scans.`);
      setScanning(false);
      setShowScannerModal(false);
      return;
    }
    setScanning(false);
    const res = await fetch("/api/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode: code, category: actionCategory ?? undefined }),
    });
    const data = await res.json();
    if (data.notFound) {
      const p: Product = { product_name: null, brand: null, source: "notFound", barcode: code };
      setProduct(p);
      await saveScanToHistory(p);
      await loadTodayScanCount();
    } else {
      const p: Product = {
        product_name: data.product_name ?? null,
        brand: data.brand ?? null,
        barcode: code,
        source: data.source,
        expiry_date: data.expiry_date ?? null,
        is_expired: data.is_expired ?? null,
      };
      setProduct(p);
      await saveScanToHistory(p);
      await loadTodayScanCount();
    }
  }, [saveScanToHistory, profile, todayScanCount, loadTodayScanCount]);

  const handleOCRParsed = useCallback((text: string) => {
    const plan = profile?.plan_tier ?? 'premium';
    const ocrAllowed = plan === 'advanced' || plan === 'premium';
    if (!ocrAllowed) {
      alert('OCR is not available on Basic. Upgrade to Premium or Advanced.');
      return;
    }
    const exp = parseExpiryFromText(text);
    setProduct((p) => {
      const np = { ...(p ?? {}), expiry_date: exp, is_expired: exp ? new Date(exp) < new Date() : null } as Product;
      // Persist to backend when possible
      if (np.barcode && exp) {
        fetch("/api/save-expiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode: np.barcode, expiry_date: exp }),
        }).catch(() => {});
      }
      return np;
    });
  }, [profile]);

  const openScanner = () => {
    setScanning(true);
    setShowScannerModal(true);
  };

  const onPickImage = () => uploadInputRef.current?.click();

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const tempId = "file-scan-temp";
      const el = document.createElement("div");
      el.id = tempId;
      el.style.display = "none";
      document.body.appendChild(el);
      const instance = new Html5Qrcode(tempId);
      const decodedText = await instance.scanFile(file, true);
      await instance.clear();
      el.remove();
      await handleDetected(decodedText);
    } catch (err) {
      console.error("Image scan failed", err);
      alert("Could not read a code from that image.");
    } finally {
      e.currentTarget.value = "";
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth");
  };

  const handleProductSelect = useCallback((selectedProduct: ScanRecord) => {
    const product: Product = {
      product_name: selectedProduct.product_name,
      brand: selectedProduct.brand,
      barcode: selectedProduct.barcode,
      source: selectedProduct.source as any,
      expiry_date: selectedProduct.expiry_date,
      is_expired: selectedProduct.is_expired,
    };
    setProduct(product);
  }, []);

  const selectPlan = useCallback(async (plan: "basic" | "premium" | "advanced") => {
    // Temporarily show a Coming Soon modal when a plan is chosen
    setComingSoonPlan(plan);
    return;

    // If you later enable real plan switching, remove the early return above
    // and use the implementation below to persist the change.
    // if (!user) return;
    // const { error } = await supabase
    //   .from('user_profiles')
    //   .update({ plan_tier: plan })
    //   .eq('id', user.id);
    // if (error) {
    //   alert('Failed to update plan. Please try again.');
    //   return;
    // }
    // setProfile((prev) => prev ? { ...prev, plan_tier: plan } : prev);
    // alert(`Your plan is now ${plan}.`);
  }, []);

  const checkDatabaseConnection = useCallback(async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('scan_records')
        .select('id')
        .limit(1);
      
      if (!error) {
        setShowDatabaseWarning(false);
        loadScanHistory();
      }
    } catch (err) {
      // Database still not ready
    }
  }, [user, loadScanHistory]);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="mx-auto w-full max-w-3xl flex items-center justify-between">
          {/* App Name */}
          <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-black">Personal Smart Scanning</h1>

          {/* Hamburger on right */}
            <button
            aria-label="Open menu"
            onClick={() => setShowMenu(true)}
            className="h-11 w-11 rounded-2xl border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 shadow-sm"
          >
            <svg className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
                </div>
                  </div>

      {/* Side Drawer Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.45),_transparent_60%),radial-gradient(ellipse_at_bottom,_rgba(0,0,0,0.45),_transparent_60%)] backdrop-blur-sm" onClick={() => setShowMenu(false)} />
          <div className="absolute left-0 top-0 h-full w-80 bg-gradient-to-br from-white/50 to-white/20 backdrop-blur-xl backdrop-saturate-150 border-r border-white/40 shadow-[0_10px_40px_rgba(0,0,0,0.25)] ring-1 ring-white/30 p-5 rounded-r-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="text-xl font-semibold text-gray-900">Menu</div>
              <button onClick={() => setShowMenu(false)} className="h-9 w-9 rounded-full bg-white/40 hover:bg-white/60 text-gray-800 flex items-center justify-center shadow-sm">×</button>
              </div>
            <nav className="space-y-2">
              <button onClick={() => { setActiveTab('home'); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-white/40 text-gray-900 border border-white/40 backdrop-blur-sm">Home</button>
              <button onClick={() => { setActiveTab('about'); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-white/40 text-gray-900 border border-white/40 backdrop-blur-sm">About</button>
              <button onClick={() => { setActiveTab('plans'); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-white/40 text-gray-900 border border-white/40 backdrop-blur-sm">Plans</button>
              {user ? (
                <button onClick={() => { setShowMenu(false); handleSignOut(); }} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-white/40 text-red-600 border border-white/40 backdrop-blur-sm">Sign out</button>
              ) : (
                <button onClick={() => { setShowMenu(false); router.push('/auth?mode=login'); }} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-white/40 text-gray-900 border border-white/40 backdrop-blur-sm">Login</button>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 pb-20">

        {/* Database Setup Warning */}
        {showDatabaseWarning && <DatabaseSetup onRefresh={checkDatabaseConnection} />}

        {/* Tab Content */}
        {activeTab === 'home' && (
          <div className="space-y-3">
            {/* Welcome Message with slide-left exit */}
            <div className={`mb-2 max-w-md mx-auto relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-300 shadow transition-all duration-500 ${introPhase === 'menu' ? 'translate-x-0 opacity-100' : 'translate-x-0 opacity-100'}`}>
              <div className="relative p-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-yellow-600 border border-gray-300">👋</span>
                  <span className="text-sm font-semibold tracking-wide text-gray-800 bg-white px-2.5 py-0.5 rounded-full border border-gray-300 shadow-sm">Hello {displayName?.toUpperCase?.() || displayName}</span>
                </div>
                <h2 className="mt-2 text-[22px] font-extrabold tracking-tight text-black">
                  Welcome, {displayName?.toUpperCase?.() || displayName}
                </h2>
                <p className="mt-1 text-[14px] leading-5 text-gray-700">
                  Personal Smart Scanning helps you scan products and plant leaves, track expiry dates, export your data, and get helpful insights — all in one place.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 border border-gray-300 text-gray-800">⚡ Fast scans</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 border border-gray-300 text-gray-800">🔔 Expiry alerts</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 border border-gray-300 text-gray-800">📦 Exports</span>
              </div>
                    </div>
                    </div>

            {/* Slim helper banner removed to avoid duplication */}

            {/* Vertical stacked cards (no swipe) */}
            <div className={`transform transition-all duration-500 translate-y-0 opacity-100 mt-2 max-w-md mx-auto space-y-1`}>
              <button onClick={() => setActionCategory('food')} className="group block w-full relative overflow-hidden rounded-[24px] bg-white shadow-lg hover:shadow-xl border border-gray-200 active:scale-[0.99] transition">
                <div className="relative h-20 bg-[#4f46e5] flex items-center px-4 rounded-t-[24px]">
                  <div className="text-xl font-extrabold text-white leading-tight">Scan a Food</div>
                  <div className="ml-auto h-7 w-7 rounded-full bg-white/90 flex items-center justify-center text-sm">🍎</div>
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition" />
                  </div>
                <div className="p-3 text-left">
                  <p className="text-xs text-gray-600">Track food expiry dates</p>
                </div>
              </button>

              <button onClick={() => setActionCategory('medicine')} className="group block w-full relative overflow-hidden rounded-[24px] bg-white shadow-lg hover:shadow-xl border border-gray-200 active:scale-[0.99] transition">
                <div className="relative h-20 bg-[#7e22ce] flex items-center px-4 rounded-t-[24px]">
                  <div className="text-xl font-extrabold text-white leading-tight">Scan a Medicine</div>
                  <div className="ml-auto h-7 w-7 rounded-full bg-white/90 flex items-center justify-center text-sm">💊</div>
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition" />
                    </div>
                <div className="p-3 text-left">
                      <p className="text-xs text-gray-600">Monitor medication expiry</p>
                </div>
              </button>

              <button onClick={() => setActionCategory('cosmetic')} className="group block w-full relative overflow-hidden rounded-[24px] bg-white shadow-lg hover:shadow-xl border border-gray-200 active:scale-[0.99] transition">
                <div className="relative h-20 bg-[#0d9488] flex items-center px-4 rounded-t-[24px]">
                  <div className="text-xl font-extrabold text-white leading-tight">Scan a Cosmetic</div>
                  <div className="ml-auto h-7 w-7 rounded-full bg-white/80 flex items-center justify-center text-sm">💄</div>
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition" />
                    </div>
                <div className="p-3 text-left">
                      <p className="text-xs text-gray-600">Check beauty product dates</p>
                </div>
              </button>

              <button onClick={() => router.push('/leaf')} className="group block w-full relative overflow-hidden rounded-[24px] bg-white shadow-lg hover:shadow-xl border border-gray-200 active:scale-[0.99] transition">
                <div className="relative h-20 bg-[#c026d3] flex items-center px-4 rounded-t-[24px]">
                  <div className="text-xl font-extrabold text-white leading-tight">Scan a Leaf</div>
                  <div className="ml-auto h-7 w-7 rounded-full bg-white/80 flex items-center justify-center text-sm">🍃</div>
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition" />
                      </div>
                <div className="p-3 text-left">
                      <p className="text-xs text-gray-600">Detect plant diseases & health</p>
                </div>
              </button>
            </div>

            {/* Recent Scans Preview */}
            {history.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-black mb-4">Recent Scans</h3>
                <div className="space-y-3">
                  {history.slice(0, 3).map((h) => (
                    <div key={h.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-black truncate">
                            {h.product_name ?? "Unknown Product"}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {h.brand && `${h.brand} • `}{new Date(h.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="ml-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* AI Assistant Launcher on Home */}
            <AiLauncher />
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="space-y-6">
            {/* Product Search */}
            <div className="rounded-2xl bg-white p-4 shadow-lg">
              <h2 className="mb-4 text-lg font-semibold text-black">Search Products</h2>
              <ProductSearch onProductSelect={handleProductSelect} />
            </div>

            {scanning && (
              <div className="rounded-2xl bg-white p-4 shadow-lg">
                <div className="mb-4 flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <h2 className="text-lg font-semibold text-black">Live Scanner</h2>
                </div>
                <Scanner onDetected={handleDetected} />
              </div>
            )}

            {/* Product Information */}
            <div className="rounded-2xl bg-white p-4 shadow-lg">
              <h2 className="mb-4 text-lg font-semibold text-black">Product Information</h2>
              <div className="space-y-4">
                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="text-sm font-medium text-gray-600">Barcode</div>
                  <div className="mt-1 font-mono text-lg text-black">
                    {product?.barcode ?? "No barcode scanned"}
                  </div>
                </div>
                
                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="text-sm font-medium text-gray-600">Product Name</div>
                  <div className="mt-1 text-lg font-semibold text-black">
                    {product?.product_name ?? "Unknown product"}
                  </div>
                </div>
                
                {product?.brand && (
                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="text-sm font-medium text-gray-600">Brand</div>
                    <div className="mt-1 text-lg text-black">{product.brand}</div>
                  </div>
                )}

                {product && (
                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="text-sm font-medium text-gray-600">Expiry Date</div>
                    <div className="mt-1 flex items-center space-x-2">
                      <span className="text-lg text-black">
                        {product.expiry_date ?? "Capture from package"}
                      </span>
                      {expiredLabel && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                          {expiredLabel}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border-2 border-dashed border-gray-300 p-4">
                  <div className="text-center">
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">Upload image to extract expiry date</p>
                    <ExpiryOCR onParsed={handleOCRParsed} />
                  </div>
                </div>
              </div>
            </div>

            {/* History Section */}
            <div className="rounded-2xl bg-white p-4 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black">Scan History</h2>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  {history.length} items
                </span>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">No scans yet</p>
                  <p className="text-xs text-gray-500">Start scanning to see your history here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((h) => (
                    <div key={h.id} className="rounded-xl bg-gray-50 p-4 transition-all hover:bg-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-mono text-gray-500 truncate">
                            {h.barcode}
                          </div>
                          <div className="mt-1 font-semibold text-black truncate">
                            {h.product_name ?? "Unknown"}
                          </div>
                          {h.brand && (
                            <div className="text-sm text-gray-600 truncate">
                              {h.brand}
                            </div>
                          )}
                          {h.expiry_date && (
                            <div className="mt-2 text-xs text-gray-500">
                              Expiry: {h.expiry_date}
                            </div>
                          )}
                          <div className="mt-1 text-xs text-gray-400">
                            {new Date(h.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Plans tab content */}
        {activeTab === 'plans' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-black text-center">Choose Your Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Premium */}
              <div className={`rounded-2xl border ${profile?.plan_tier === 'premium' ? 'border-black' : 'border-gray-200'} bg-white p-5 shadow-sm`}>
                <div className="text-sm font-medium text-gray-700">Premium</div>
                <div className="mt-2 text-3xl font-extrabold text-black">$0.99</div>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li>• Up to 50 scans/day</li>
                  <li>• OCR uploads enabled</li>
                  <li>• Analytics enabled</li>
                  <li>• Export data (CSV/JSON)</li>
                  <li>• Expiry alerts</li>
                </ul>
                <button onClick={() => selectPlan('premium')} className="mt-4 w-full rounded-xl bg-black text-white py-2 font-semibold hover:bg-gray-800">{profile?.plan_tier === 'premium' ? 'Current Plan' : 'Choose Premium'}</button>
              </div>
              {/* Advanced */}
              <div className={`rounded-2xl border ${profile?.plan_tier === 'advanced' ? 'border-black' : 'border-gray-200'} bg-white p-5 shadow-sm`}>
                <div className="text-sm font-medium text-gray-700">Advanced</div>
                <div className="mt-2 text-3xl font-extrabold text-black">$4</div>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li>• Unlimited scans</li>
                  <li>• OCR uploads enabled</li>
                  <li>• Full analytics and insights</li>
                  <li>• Export + expiry alerts</li>
                  <li>• Priority support</li>
                </ul>
                <button onClick={() => selectPlan('advanced')} className="mt-4 w-full rounded-xl bg-black text-white py-2 font-semibold hover:bg-gray-800">{profile?.plan_tier === 'advanced' ? 'Current Plan' : 'Choose Advanced'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Coming Soon Modal for Plans */}
        {comingSoonPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-sm mx-auto rounded-2xl bg-white p-5 shadow-2xl text-center">
              <h3 className="text-lg font-semibold text-black">Coming soon</h3>
              <p className="mt-2 text-sm text-gray-700">The {comingSoonPlan} plan will be available shortly. Thanks for your interest!</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setComingSoonPlan(null)} className="flex-1 rounded-xl bg-black text-white py-2 font-semibold hover:bg-gray-800">OK</button>
              </div>
            </div>
          </div>
        )}

        {/* About tab content */}
        {activeTab === 'about' && (
          <div className="max-w-2xl mx-auto">
            <AboutApp />
          </div>
        )}

        {activeTab === 'export' && (
          <div className="max-w-2xl mx-auto">
            {profile?.plan_tier === 'basic' ? (
              <div className="rounded-2xl bg-white p-6 border border-gray-200 text-center">
                <h3 className="text-lg font-semibold text-black">Export is unavailable on Basic</h3>
                <p className="mt-2 text-sm text-gray-600">Upgrade to Premium or Advanced to export your data.</p>
                <button onClick={() => setActiveTab('plans')} className="mt-4 rounded-xl bg-black text-white px-4 py-2 font-semibold">View Plans</button>
              </div>
            ) : (
            <ExportData />
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          profile?.plan_tier === 'basic' ? (
            <div className="max-w-xl mx-auto rounded-2xl bg-white p-6 border border-gray-200 text-center">
              <h3 className="text-lg font-semibold text-black">Expiry alerts are unavailable on Basic</h3>
              <p className="mt-2 text-sm text-gray-600">Upgrade to Premium or Advanced to enable alerts.</p>
              <button onClick={() => setActiveTab('plans')} className="mt-4 rounded-xl bg-black text-white px-4 py-2 font-semibold">View Plans</button>
            </div>
          ) : (
          <ExpiryAlerts />
          )
        )}

      </main>

      {/* Action Modal with Scan/Upload */}
      {actionCategory && actionCategory !== 'tree' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
          <div className="w-full sm:max-w-md sm:rounded-2xl sm:mb-0 mb-0 bg-white p-5 shadow-2xl border-t sm:border sm:mx-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold text-black capitalize">{actionCategory}</div>
              <button onClick={() => setActionCategory(null)} className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700">×</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={openScanner}
                className={`w-full relative overflow-hidden rounded-2xl bg-gradient-to-br ${categoryGradient} border border-gray-200 py-3 px-4 text-base font-semibold text-black shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
              >
                Take a scan
              </button>
              <button
                onClick={onPickImage}
                className={`w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 border border-gray-200 py-3 px-4 text-base font-semibold text-black shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
              >
                Upload a barcode image
              </button>
            </div>
            <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
            <div className="mt-4 rounded-xl bg-gray-50 p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Results</h4>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-600">Barcode</div>
                  <div className="font-mono text-base text-black">{product?.barcode ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Product</div>
                  <div className="text-base font-semibold text-black">{product?.product_name ?? "—"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Scanner Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md mx-auto rounded-2xl bg-white p-4 shadow-2xl relative">
            <button
              onClick={() => { setShowScannerModal(false); setScanning(false); setActionCategory(null); }}
              className="absolute right-3 top-3 h-8 w-8 rounded-full bg-black text-white flex items-center justify-center"
            >
              ×
            </button>
            <div className="mb-3 flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <div className="font-semibold text-black">
                {actionCategory === 'tree' ? 'Leaf Disease Scanner' : 'Scanning…'}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border">
              {actionCategory === 'tree' ? (
                <TreeScanner 
                  onDetected={handleDetected} 
                  onImageCapture={(imageData) => {
                    console.log('Plant image captured:', imageData);
                    // Handle plant image capture if needed
                  }}
                />
              ) : (
                scanning && <Scanner onDetected={handleDetected} />
              )}
              {actionCategory !== 'tree' && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation removed in favor of hamburger menu */}
    </div>
  );
}