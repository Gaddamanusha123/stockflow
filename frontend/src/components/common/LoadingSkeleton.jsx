import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="w-full animate-pulse space-y-4">
      <div className="h-10 bg-slate-100 rounded-lg w-full" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          {[...Array(cols)].map((_, j) => (
            <div
              key={j}
              className="h-8 bg-slate-100 rounded flex-1"
              style={{ opacity: 1 - j * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-8 bg-slate-200 rounded w-16" />
        </div>
        <div className="w-12 h-12 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
};
