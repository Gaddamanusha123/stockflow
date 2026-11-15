import React, { useState, useEffect, useCallback } from 'react';
import { productsAPI } from '../api/products';
import { ProductModal } from '../components/products/ProductModal';
import { StockAdjustModal } from '../components/products/StockAdjustModal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { StockBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Sliders,
  Package,
  Layers,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter) params.status = statusFilter;

      const data = await productsAPI.getAll(params);
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Unable to load products from server.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter]);

  // Debounced search / filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Open Add Product modal
  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  // Open Edit Product modal
  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  // Open Stock Adjust modal
  const handleOpenAdjust = (product) => {
    setAdjustingProduct(product);
    setIsAdjustModalOpen(true);
  };

  // Open Delete confirmation
  const handleOpenDelete = (product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  };

  // Execute deletion
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await productsAPI.delete(deletingProduct.id);
      // Immediately remove from local state
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      showToast(`Product "${deletingProduct.name}" was successfully deleted.`, 'success');
      setIsDeleteModalOpen(false);
      setDeletingProduct(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      showToast('Failed to delete product. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle successful create / edit
  const handleProductSuccess = (savedProduct, action) => {
    if (action === 'created') {
      setProducts((prev) => [savedProduct, ...prev]);
      showToast(`Product "${savedProduct.name}" created successfully!`, 'success');
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === savedProduct.id ? savedProduct : p))
      );
      showToast(`Product "${savedProduct.name}" updated successfully!`, 'success');
    }
  };

  // Handle successful stock adjustment
  const handleStockSuccess = (updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    showToast(`Stock updated to ${updatedProduct.quantity_on_hand} units.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your organization's catalog, pricing, SKUs, and stock counts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-56 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading && products.length === 0 ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={7} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Products Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter
                ? 'No catalog items match your search or filter criteria. Try clearing filters.'
                : 'Your organization currently has no products registered in the database.'}
            </p>
            <div className="mt-5">
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Your First Product
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Product & Description</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5 text-right">Cost</th>
                  <th className="px-6 py-3.5 text-right">Selling Price</th>
                  <th className="px-6 py-3.5 text-right">Stock on Hand</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const cost = parseFloat(product.cost_price) || 0;
                  const price = parseFloat(product.selling_price) || 0;
                  const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(0) : 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                          {product.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-slate-600 font-mono">
                        ${cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-mono font-semibold text-xs text-slate-900">
                          ${price.toFixed(2)}
                        </div>
                        {margin > 0 && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            {margin}% margin
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={`font-bold text-sm ${
                              product.quantity_on_hand === 0
                                ? 'text-rose-600'
                                : product.stock_status === 'LOW_STOCK'
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {product.quantity_on_hand}
                          </span>
                          <button
                            onClick={() => handleOpenAdjust(product)}
                            title="Adjust quantity"
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StockBadge status={product.stock_status} quantity={product.quantity_on_hand} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAdjust(product)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                            title="Adjust stock"
                          >
                            Stock
                          </button>
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(product)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          product={selectedProduct}
          onSuccess={handleProductSuccess}
        />
      )}

      {/* Stock Adjust Modal */}
      {isAdjustModalOpen && (
        <StockAdjustModal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          product={adjustingProduct}
          onSuccess={handleStockSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Product"
          message={`Are you sure you want to permanently delete "${deletingProduct?.name}" (SKU: ${deletingProduct?.sku})? This database action cannot be undone.`}
          confirmText="Yes, Delete Product"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
