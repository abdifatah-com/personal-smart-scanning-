"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, ScanRecord } from "@/lib/supabaseClient";

interface ExpiryAlert {
  id: string;
  scan_record_id: string;
  alert_date: string;
  is_sent: boolean;
  created_at: string;
  scan_record: ScanRecord;
}

export default function ExpiryAlerts() {
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ScanRecord | null>(null);
  const [alertDate, setAlertDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('expiry_alerts')
        .select(`
          *,
          scan_record:scan_records(*)
        `)
        .eq('user_id', user.id)
        .order('alert_date', { ascending: true });

      if (error) {
        console.error('Error loading alerts:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        // If table doesn't exist, show empty alerts instead of crashing
        if (error.code === 'PGRST116' || 
            error.message?.includes('relation "expiry_alerts" does not exist') ||
            error.message?.includes('does not exist')) {
          console.warn('expiry_alerts table does not exist. Showing empty alerts.');
          setAlerts([]);
          return;
        }
        return;
      }

      setAlerts(data || []);
    } catch (err) {
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('scan_records')
        .select('*')
        .eq('user_id', user.id)
        .not('expiry_date', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading products:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        // If table doesn't exist, return empty array instead of crashing
        if (error.code === 'PGRST116' || 
            error.message?.includes('relation "scan_records" does not exist') ||
            error.message?.includes('does not exist')) {
          console.warn('scan_records table does not exist. Returning empty products list.');
          return [];
        }
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error loading products:', err);
      return [];
    }
  }, []);

  const createAlert = useCallback(async () => {
    if (!selectedProduct || !alertDate) return;

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('expiry_alerts')
        .insert({
          user_id: user.id,
          scan_record_id: selectedProduct.id,
          alert_date: alertDate
        });

      if (error) {
        console.error('Error creating alert:', error);
        return;
      }

      setShowCreateAlert(false);
      setSelectedProduct(null);
      setAlertDate("");
      loadAlerts();
    } catch (err) {
      console.error('Error creating alert:', err);
    } finally {
      setIsCreating(false);
    }
  }, [selectedProduct, alertDate, loadAlerts]);

  const deleteAlert = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('expiry_alerts')
        .delete()
        .eq('id', alertId);

      if (error) {
        console.error('Error deleting alert:', error);
        return;
      }

      loadAlerts();
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  }, [loadAlerts]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const upcomingAlerts = alerts.filter(alert => 
    new Date(alert.alert_date) >= new Date() && !alert.is_sent
  );

  const pastAlerts = alerts.filter(alert => 
    new Date(alert.alert_date) < new Date() || alert.is_sent
  );

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Expiry Alerts</h2>
        <button
          onClick={() => setShowCreateAlert(true)}
          className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/25"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Create Alert</span>
        </button>
      </div>

      {/* Upcoming Alerts */}
      {upcomingAlerts.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Upcoming Alerts</h3>
          <div className="space-y-3">
            {upcomingAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {alert.scan_record.product_name || "Unknown Product"}
                  </div>
                  {alert.scan_record.brand && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {alert.scan_record.brand}
                    </div>
                  )}
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Alert: {new Date(alert.alert_date).toLocaleDateString()}
                    {alert.scan_record.expiry_date && (
                      <span className="ml-2">
                        • Expires: {new Date(alert.scan_record.expiry_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Alerts */}
      {pastAlerts.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Past Alerts</h3>
          <div className="space-y-3">
            {pastAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {alert.scan_record.product_name || "Unknown Product"}
                  </div>
                  {alert.scan_record.brand && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {alert.scan_record.brand}
                    </div>
                  )}
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Alert: {new Date(alert.alert_date).toLocaleDateString()}
                    {alert.is_sent && (
                      <span className="ml-2 text-green-600 dark:text-green-400">• Sent</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {alerts.length === 0 && (
        <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-800 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
          </svg>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No alerts yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Create alerts to get notified before products expire</p>
          <button
            onClick={() => setShowCreateAlert(true)}
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/25"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create Your First Alert</span>
          </button>
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreateAlert && (
        <CreateAlertModal
          onClose={() => setShowCreateAlert(false)}
          onCreate={createAlert}
          onLoadProducts={loadProducts}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          alertDate={alertDate}
          setAlertDate={setAlertDate}
          isCreating={isCreating}
        />
      )}
    </div>
  );
}

interface CreateAlertModalProps {
  onClose: () => void;
  onCreate: () => void;
  onLoadProducts: () => Promise<ScanRecord[]>;
  selectedProduct: ScanRecord | null;
  setSelectedProduct: (product: ScanRecord | null) => void;
  alertDate: string;
  setAlertDate: (date: string) => void;
  isCreating: boolean;
}

function CreateAlertModal({
  onClose,
  onCreate,
  onLoadProducts,
  selectedProduct,
  setSelectedProduct,
  alertDate,
  setAlertDate,
  isCreating
}: CreateAlertModalProps) {
  const [products, setProducts] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const data = await onLoadProducts();
      setProducts(data);
      setLoading(false);
    };
    loadProducts();
  }, [onLoadProducts]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create Expiry Alert</h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select Product
              </label>
              {loading ? (
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
              ) : (
                <select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    setSelectedProduct(product || null);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">Select a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.product_name || 'Unknown'} - {product.brand || 'No brand'} 
                      {product.expiry_date && ` (Expires: ${new Date(product.expiry_date).toLocaleDateString()})`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Alert Date
              </label>
              <input
                type="date"
                value={alertDate}
                onChange={(e) => setAlertDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={onCreate}
                disabled={!selectedProduct || !alertDate || isCreating}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isCreating ? 'Creating...' : 'Create Alert'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}