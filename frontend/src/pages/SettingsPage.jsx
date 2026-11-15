import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../api/settings';
import { useAuth } from '../context/AuthContext';
import {
  SlidersHorizontal,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

export const SettingsPage = () => {
  const { organization, updateOrganization } = useAuth();
  const [threshold, setThreshold] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await settingsAPI.getSettings();
        setThreshold(data.default_low_stock_threshold);
        updateOrganization(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Unable to load organization settings from database.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    const val = parseInt(threshold, 10);
    if (isNaN(val) || val < 0) {
      setError('Threshold must be a non-negative whole number (0 or higher).');
      setIsSaving(false);
      return;
    }

    try {
      const response = await settingsAPI.updateSettings({
        default_low_stock_threshold: val,
      });
      updateOrganization(response.settings);
      setSuccessMessage('Organization low stock threshold successfully updated in database!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to update settings:', err);
      if (err.response && err.response.data && err.response.data.errors) {
        const errData = err.response.data.errors;
        setError(typeof errData === 'string' ? errData : JSON.stringify(errData));
      } else {
        setError('Failed to update settings. Please check backend connectivity.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage workspace defaults, automated stock thresholds, and multi-tenant configurations
        </p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl text-sm font-medium bg-emerald-50 border border-emerald-200 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl text-sm font-medium bg-rose-50 border border-rose-200 text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Organization Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Tenant Identity</h3>
            <p className="text-xs text-slate-500">Database multi-tenancy isolation boundary</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Organization Name
            </span>
            <p className="font-semibold text-slate-900 mt-1">{organization?.name || 'Loading...'}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tenant ID
            </span>
            <p className="font-mono text-xs text-slate-700 mt-1 bg-slate-100 px-2 py-1 rounded inline-block">
              {organization?.id || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Stock Threshold Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Default Low Stock Threshold</h3>
            <p className="text-xs text-slate-500">
              Automated reorder triggers for products without a custom threshold
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Default Warning Threshold (Quantity Units)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                required
                disabled={isLoading || isSaving}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-40 px-3.5 py-2 text-sm border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isLoading || isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all disabled:opacity-60"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <span>How Threshold Logic Works in StockFlow</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>
                <strong>Product-Level Override:</strong> If a product specifies its own threshold (e.g. 5 units), that value is always used.
              </li>
              <li>
                <strong>Organization Default:</strong> If a product has no specific threshold (left blank), this default value is applied automatically.
              </li>
              <li>
                <strong>Dashboard Recalculation:</strong> Updating this threshold will immediately recalculate all low-stock calculations across your workspace.
              </li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};
