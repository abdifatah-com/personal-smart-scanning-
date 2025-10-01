"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, ScanRecord } from "@/lib/supabaseClient";

interface AnalyticsData {
  totalScans: number;
  uniqueProducts: number;
  expiredProducts: number;
  recentScans: ScanRecord[];
  topBrands: { brand: string; count: number }[];
  monthlyStats: { month: string; count: number }[];
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const daysAgo = timeRange === 'all' ? 0 : 
                     timeRange === '7d' ? 7 : 
                     timeRange === '30d' ? 30 : 90;

      const dateFilter = timeRange === 'all' ? '' : 
        `created_at.gte.${new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()}`;

      // Get all scans for the time period
      const { data: scans, error: scansError } = await supabase
        .from('scan_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (scansError) {
        console.error('Error loading analytics:', {
          code: scansError.code,
          message: scansError.message,
          details: scansError.details,
          hint: scansError.hint
        });
        // If table doesn't exist, show empty analytics instead of crashing
        if (scansError.code === 'PGRST116' || 
            scansError.message?.includes('relation "scan_records" does not exist') ||
            scansError.message?.includes('does not exist')) {
          console.warn('scan_records table does not exist. Showing empty analytics.');
          setAnalytics({
            totalScans: 0,
            uniqueProducts: 0,
            expiredProducts: 0,
            recentScans: [],
            topBrands: [],
            monthlyStats: []
          });
          return;
        }
        return;
      }

      const filteredScans = timeRange === 'all' ? scans : 
        scans?.filter(scan => 
          new Date(scan.created_at) >= new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        ) || [];

      // Calculate statistics
      const totalScans = filteredScans.length;
      const uniqueProducts = new Set(filteredScans.map(s => s.barcode)).size;
      const expiredProducts = filteredScans.filter(s => s.is_expired).length;
      const recentScans = filteredScans.slice(0, 5);

      // Top brands
      const brandCounts = filteredScans
        .filter(s => s.brand)
        .reduce((acc, scan) => {
          acc[scan.brand!] = (acc[scan.brand!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topBrands = Object.entries(brandCounts)
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Monthly stats
      const monthlyStats = filteredScans.reduce((acc, scan) => {
        const month = new Date(scan.created_at).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const monthlyStatsArray = Object.entries(monthlyStats)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      setAnalytics({
        totalScans,
        uniqueProducts,
        expiredProducts,
        recentScans,
        topBrands,
        monthlyStats: monthlyStatsArray
      });
    } catch (err) {
      console.error('Error loading analytics:', err);
      // Set empty analytics on any error to prevent crashes
      setAnalytics({
        totalScans: 0,
        uniqueProducts: 0,
        expiredProducts: 0,
        recentScans: [],
        topBrands: [],
        monthlyStats: []
      });
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Scans</p>
              <p className="text-3xl font-bold">{analytics.totalScans}</p>
            </div>
            <svg className="h-8 w-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Unique Products</p>
              <p className="text-3xl font-bold">{analytics.uniqueProducts}</p>
            </div>
            <svg className="h-8 w-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Expired Products</p>
              <p className="text-3xl font-bold">{analytics.expiredProducts}</p>
            </div>
            <svg className="h-8 w-8 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Top Brands */}
      {analytics.topBrands.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top Brands</h3>
          <div className="space-y-3">
            {analytics.topBrands.map((brand, index) => (
              <div key={brand.brand} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    {index + 1}
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">{brand.brand}</span>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">{brand.count} scans</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Scans */}
      <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Scans</h3>
        <div className="space-y-3">
          {analytics.recentScans.map((scan) => (
            <div key={scan.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 dark:text-white truncate">
                  {scan.product_name || "Unknown Product"}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {scan.brand && `${scan.brand} • `}
                  {new Date(scan.created_at).toLocaleDateString()}
                </div>
              </div>
              {scan.is_expired && (
                <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-full">
                  Expired
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}