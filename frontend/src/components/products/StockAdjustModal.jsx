import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { productsAPI } from '../../api/products';
import { StockBadge } from '../common/Badge';
import { Loader2, AlertCircle, Plus, Minus, ArrowRight } from 'lucide-react';

export const StockAdjustModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [mode, setMode] = useState('adjust'); // 'adjust' (+/-) or 'set' (direct)
  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const [directValue, setDirectValue] = useState(0);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setAdjustmentValue(0);
      setDirectValue(product.quantity_on_hand ?? 0);
      setNote('');
      setError('');
      setMode('adjust');
    }
  }, [product, isOpen]);

  if (!product) return null;

  const currentQty = product.quantity_on_hand ?? 0;
  const targetQty = mode === 'adjust' ? currentQty + (parseInt(adjustmentValue, 10) || 0) : parseInt(directValue, 10) || 0;
  const isNegative = targetQty < 0;

  const handleQuickAdd = (delta) => {
    if (mode === 'adjust') {
      setAdjustmentValue((prev) => (parseInt(prev, 10) || 0) + delta);
    } else {
      setDirectValue((prev) => Math.max(0, (parseInt(prev, 10) || 0) + delta));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNegative) {
      setError(`Stock cannot be negative. Target quantity is ${targetQty}.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    const payload = mode === 'adjust'
      ? { adjustment: parseInt(adjustmentValue, 10) || 0, note: note.trim() }
      : { new_quantity: parseInt(directValue, 10) || 0, note: note.trim() };

    try {
      const response = await productsAPI.adjustStock(product.id, payload);
      onSuccess(response.product, 'stock_updated');
      onClose();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors) {
        const errData = err.response.data.errors;
        setError(typeof errData === 'string' ? errData : JSON.stringify(errData));
      } else {
        setError('Failed to update stock quantity. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjust Stock Quantity" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product summary card */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">{product.name}</h4>
              <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {product.sku}</p>
            </div>
            <StockBadge status={product.stock_status} quantity={product.quantity_on_hand} />
          </div>
          <div className="pt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-200/60 mt-2">
            <span>Current Available Stock:</span>
            <span className="font-bold text-slate-900 text-sm">{currentQty} units</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode selector */}
        <div className="flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode('adjust')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'adjust' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Relative Adjustment (+ / -)
          </button>
          <button
            type="button"
            onClick={() => setMode('set')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'set' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Direct Quantity Override
          </button>
        </div>

        {/* Input & Quick Action buttons */}
        {mode === 'adjust' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Quantity Change
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(e.target.value)}
                placeholder="e.g. +10 or -5"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            {/* Quick buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[-10, -5, -1, 1, 5, 10, 25].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleQuickAdd(delta)}
                  className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                    delta > 0
                      ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      : 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Absolute Quantity
            </label>
            <input
              type="number"
              min="0"
              value={directValue}
              onChange={(e) => setDirectValue(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        )}

        {/* Target Preview */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
          <div className="text-xs text-slate-500">Calculated Stock After Update:</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">{currentQty}</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className={`text-base font-bold ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
              {targetQty} units
            </span>
          </div>
        </div>

        {/* Optional Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Reason / Adjustment Note (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Restock shipment received, damaged item write-off"
            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isNegative}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50 transition-colors"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Adjustment
          </button>
        </div>
      </form>
    </Modal>
  );
};
