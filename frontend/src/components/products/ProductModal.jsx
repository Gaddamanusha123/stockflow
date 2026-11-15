import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { productsAPI } from '../../api/products';
import { Loader2, AlertCircle } from 'lucide-react';

export const ProductModal = ({ isOpen, onClose, product = null, onSuccess }) => {
  const isEdit = !!product;

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    quantity_on_hand: 0,
    cost_price: '0.00',
    selling_price: '0.00',
    low_stock_threshold: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        quantity_on_hand: product.quantity_on_hand ?? 0,
        cost_price: product.cost_price || '0.00',
        selling_price: product.selling_price || '0.00',
        low_stock_threshold: product.low_stock_threshold !== null && product.low_stock_threshold !== undefined
          ? String(product.low_stock_threshold)
          : '',
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        description: '',
        quantity_on_hand: 0,
        cost_price: '0.00',
        selling_price: '0.00',
        low_stock_threshold: '',
      });
    }
    setErrors({});
    setGeneralError('');
  }, [product, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setGeneralError('');

    // Prepare payload
    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      description: formData.description.trim(),
      quantity_on_hand: parseInt(formData.quantity_on_hand, 10) || 0,
      cost_price: parseFloat(formData.cost_price) || 0.00,
      selling_price: parseFloat(formData.selling_price) || 0.00,
      low_stock_threshold: formData.low_stock_threshold === '' ? null : parseInt(formData.low_stock_threshold, 10),
    };

    try {
      let savedProduct;
      if (isEdit) {
        savedProduct = await productsAPI.update(product.id, payload);
      } else {
        savedProduct = await productsAPI.create(payload);
      }
      onSuccess(savedProduct, isEdit ? 'updated' : 'created');
      onClose();
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.errors) {
          setErrors(err.response.data.errors);
        } else if (typeof err.response.data === 'object') {
          setErrors(err.response.data);
        } else {
          setGeneralError('An unexpected server error occurred.');
        }
      } else {
        setGeneralError('Network connection failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Product Details' : 'Add New Inventory Product'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Ergonomic Office Chair"
              className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.name ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
              }`}
            />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{Array.isArray(errors.name) ? errors.name[0] : errors.name}</p>}
          </div>

          {/* SKU */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              SKU Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="sku"
              required
              value={formData.sku}
              onChange={handleChange}
              placeholder="e.g. FURN-CHR-001"
              className={`w-full px-3.5 py-2 text-sm font-mono uppercase border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.sku ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
              }`}
            />
            {errors.sku && <p className="text-xs text-rose-600 mt-1">{Array.isArray(errors.sku) ? errors.sku[0] : errors.sku}</p>}
          </div>

          {/* Initial / Current Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Quantity on Hand <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              name="quantity_on_hand"
              min="0"
              required
              value={formData.quantity_on_hand}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.quantity_on_hand ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
              }`}
            />
            {errors.quantity_on_hand && <p className="text-xs text-rose-600 mt-1">{Array.isArray(errors.quantity_on_hand) ? errors.quantity_on_hand[0] : errors.quantity_on_hand}</p>}
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Cost Price ($) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="cost_price"
              required
              value={formData.cost_price}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.cost_price ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
              }`}
            />
            {errors.cost_price && <p className="text-xs text-rose-600 mt-1">{Array.isArray(errors.cost_price) ? errors.cost_price[0] : errors.cost_price}</p>}
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Selling Price ($) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="selling_price"
              required
              value={formData.selling_price}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.selling_price ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
              }`}
            />
            {errors.selling_price && <p className="text-xs text-rose-600 mt-1">{Array.isArray(errors.selling_price) ? errors.selling_price[0] : errors.selling_price}</p>}
          </div>

          {/* Low Stock Threshold (Optional) */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Custom Low Stock Threshold (Optional)
            </label>
            <input
              type="number"
              min="0"
              name="low_stock_threshold"
              value={formData.low_stock_threshold}
              onChange={handleChange}
              placeholder="Leave empty to use organization default threshold"
              className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.low_stock_threshold ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
              }`}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              When empty, the system automatically uses your organization-wide default threshold.
            </p>
            {errors.low_stock_threshold && <p className="text-xs text-rose-600 mt-1">{Array.isArray(errors.low_stock_threshold) ? errors.low_stock_threshold[0] : errors.low_stock_threshold}</p>}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add product specifications, dimensions, notes, etc."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-sm transition-all disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

