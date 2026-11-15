import React, { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../api/dashboard';
import { StatCard } from '../components/common/StatCard';
import { StockBadge } from '../components/common/Badge';
import { CardSkeleton, TableSkeleton } from '../components/common/LoadingSkeleton';
import { StockAdjustModal } from '../components/products/StockAdjustModal';
import { ProductModal } from '../components/products/ProductModal';
import {
  Package,
  Layers,
  AlertTriangle,
  XCircle,
  Plus,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await dashboardAPI.getSummary();
      setData(result);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleStockUpdateSuccess = () => {
    fetchDashboardData();
  };

  const handleProductCreateSuccess = () => {
    fetchDashboardData();
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time multi-tenant stock intelligence & metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {isLoading && !data ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Products"
              value={data?.summary?.total_products ?? 0}
              subtitle="Registered catalog items"
              icon={Package}
              color="blue"
            />
            <StatCard
              title="Total Stock Units"
              value={data?.summary?.total_stock_quantity ?? 0}
              subtitle="Items on hand across warehouse"
              icon={Layers}
              color="emerald"
            />
            <StatCard
              title="Low Stock Items"
              value={data?.summary?.low_stock_products_count ?? 0}
              subtitle="At or below reorder threshold"
              icon={AlertTriangle}
              color="amber"
            />
            <StatCard
              title="Out of Stock"
              value={data?.summary?.out_of_stock_products_count ?? 0}
              subtitle="Critical zero stock alerts"
              icon={XCircle}
              color="rose"
            />
          </>
        )}
      </div>

      {/* Attention / Low Stock Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Stock Attention Required
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Products that have depleted or dropped below their effective reorder threshold
            </p>
          </div>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Org Default Threshold: {data?.organization?.default_low_stock_threshold ?? 10} units
          </Link>
        </div>

        {isLoading && !data ? (
          <div className="p-6">
            <TableSkeleton rows={4} cols={5} />
          </div>
        ) : data?.low_stock_items?.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Healthy Inventory Levels</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All registered inventory items are currently above their warning thresholds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5 text-right">Available Stock</th>
                  <th className="px-6 py-3.5 text-right">Effective Threshold</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.low_stock_items?.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{item.sku}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold text-sm ${item.quantity_on_hand === 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                        {item.quantity_on_hand}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500 font-medium">
                      {item.effective_threshold} units
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StockBadge status={item.stock_status} quantity={item.quantity_on_hand} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setAdjustingProduct(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Catalog Items */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recently Added Products</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest additions to your catalog</p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            <span>View All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data?.recent_products?.length === 0 ? (
          <div className="text-center py-10 px-4 text-xs text-slate-500">
            No products in catalog yet. Click "Add Product" to create your first item.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5 text-right">Cost</th>
                  <th className="px-6 py-3.5 text-right">Selling Price</th>
                  <th className="px-6 py-3.5 text-right">Stock</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recent_products?.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900">{prod.name}</td>
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-600">{prod.sku}</td>
                    <td className="px-6 py-3.5 text-right text-xs text-slate-600 font-mono">
                      ${(parseFloat(prod.cost_price) || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5 text-right text-xs text-slate-900 font-mono font-semibold">
                      ${(parseFloat(prod.selling_price) || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-900">
                      {prod.quantity_on_hand}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <StockBadge status={prod.stock_status} quantity={prod.quantity_on_hand} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <StockAdjustModal
          isOpen={!!adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          product={adjustingProduct}
          onSuccess={handleStockUpdateSuccess}
        />
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <ProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleProductCreateSuccess}
        />
      )}
    </div>
  );
};

