"use client";
import { useState } from "react";

interface DatabaseSetupProps {
  onRefresh?: () => void;
}

export default function DatabaseSetup({ onRefresh }: DatabaseSetupProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Database Setup Required
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>
              To enable full functionality, you need to set up the database tables in Supabase.
            </p>
          </div>
          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100"
            >
              {showInstructions ? 'Hide' : 'Show'} setup instructions →
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100"
              >
                Refresh connection →
              </button>
            )}
          </div>
          
          {showInstructions && (
            <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Quick Setup:</h4>
              <ol className="text-sm text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside">
                <li>Go to your Supabase project dashboard</li>
                <li>Navigate to the SQL Editor</li>
                <li>Copy and paste the contents of <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">supabase-setup.sql</code></li>
                <li>Click "Run" to execute the SQL</li>
                <li>Refresh this page</li>
              </ol>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">📖 Need detailed instructions?</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Check out the complete setup guide in <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">DATABASE_SETUP.md</code>
                </p>
              </div>
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700 rounded text-xs">
                <p className="font-medium text-slate-900 dark:text-white mb-1">Note:</p>
                <p className="text-slate-600 dark:text-slate-400">
                  The app will work with local storage as a fallback, but for full functionality 
                  (persistent data, analytics, alerts), you need the database setup.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}