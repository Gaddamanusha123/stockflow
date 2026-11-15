import React from 'react';
import { Modal } from '../common/Modal';
import { StockBadge } from '../common/Badge';
import {
  Package,
  Calendar,
  UserCheck,
  TrendingUp,
  DollarSign,
  Layers,
  Edit2,
  Sliders,
} from 'lucide-react';

export const ProductDetailModal = ({
  isOpen,
  onClose,
  product,
  onEdit,
  onAdjustStock,
}) => {
  if (!product) return null;

  const cost = parseFloat(product.cost_price) || 0;
  const price = parseFloat(product.selling_price) || 0;
  const totalValue = (cost * (product.quantity_on_hand || 0)).toFixed(2);
  const profitMargin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : 0;
  const profitPerUnit = (price - cost).toFixed(2);

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Product Specification & Details" maxWidth="max-w-xl">
      <div className="space-y-5">
        {/* Header Title & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                SKU: {product.sku}
              </span>
              <span className="text-xs text-slate-400">ID #{product.id}</span>
            </div>
          </div>
          <StockBadge status={product.stock_status} quantity={product.quantity_on_hand} />
        </div>

        {/* Description */}
        {product.description && (
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Description & Notes
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Stock & Threshold Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Stock on Hand
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {product.quantity_on_hand} <span className="text-xs font-normal text-slate-500">units</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Warning Threshold
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {product.effective_low_stock_threshold}{' '}
              <span className="text-[10px] font-normal text-slate-500">
                {product.low_stock_threshold ? '(Custom)' : '(Org Default)'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Cost Value
            </div>
            <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
              ${totalValue}
            </div>
          </div>
        </div>

        {/* Financial & Pricing Breakdown */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Pricing & Margin Analysis
          </h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Cost Price</span>
              <p className="font-semibold text-slate-900 font-mono text-sm mt-0.5">${cost.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-slate-500">Selling Price</span>
              <p className="font-semibold text-slate-900 font-mono text-sm mt-0.5">${price.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-slate-500">Profit Margin</span>
              <p className="font-semibold text-emerald-600 font-mono text-sm mt-0.5">
                +{profitMargin}% <span className="text-[10px] text-slate-400">(${profitPerUnit})</span>
              </p>
            </div>
          </div>
        </div>

        {/* Audit Meta Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>Created: {formatDate(product.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>Updated: {formatDate(product.updated_at)}</span>
          </div>
          {product.last_updated_by_email && (
            <div className="flex items-center gap-2 col-span-2">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Last modified by: <strong className="text-slate-700">{product.last_updated_by_email}</strong></span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAdjustStock(product);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              Adjust Stock
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
