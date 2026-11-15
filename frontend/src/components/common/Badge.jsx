import React from 'react';

export const StockBadge = ({ status, quantity }) => {
  if (quantity === 0 || status === 'OUT_OF_STOCK') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
        <span className="w-1.5 h-1.5 mr-1.5 bg-rose-600 rounded-full"></span>
        Out of Stock
      </span>
    );
  }

  if (status === 'LOW_STOCK') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 mr-1.5 bg-amber-500 rounded-full animate-pulse"></span>
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
      <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full"></span>
      In Stock
    </span>
  );
};

