"use client";
import { useState, useCallback } from "react";
import { supabase, ScanRecord } from "@/lib/supabaseClient";

interface ExportDataProps {
  onExportComplete?: () => void;
}

export default function ExportData({ onExportComplete }: ExportDataProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  const exportToCSV = useCallback((data: ScanRecord[]) => {
    const headers = ['Barcode', 'Product Name', 'Brand', 'Expiry Date', 'Is Expired', 'Source', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...data.map(record => [
        record.barcode,
        `"${record.product_name || ''}"`,
        `"${record.brand || ''}"`,
        record.expiry_date || '',
        record.is_expired ? 'Yes' : 'No',
        record.source,
        new Date(record.created_at).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `scan-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportToJSON = useCallback((data: ScanRecord[]) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `scan-history-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('scan_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Export error:', error);
        return;
      }

      if (exportFormat === 'csv') {
        exportToCSV(data || []);
      } else {
        exportToJSON(data || []);
      }

      onExportComplete?.();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  }, [exportFormat, exportToCSV, exportToJSON, onExportComplete]);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Export Data</h3>
        <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Export Format
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={(e) => setExportFormat(e.target.value as 'csv')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">CSV</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="json"
                checked={exportFormat === 'json'}
                onChange={(e) => setExportFormat(e.target.value as 'json')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">JSON</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25"
        >
          {isExporting ? (
            <div className="flex items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
              Exporting...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Scan History
            </div>
          )}
        </button>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Downloads all your scan history in the selected format
        </p>
      </div>
    </div>
  );
}