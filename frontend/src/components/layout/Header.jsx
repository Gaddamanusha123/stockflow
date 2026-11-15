import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, User, LogOut, Package2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
            <Package2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900">StockFlow</span>
        </div>

        {organization && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>{organization.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-700 bg-slate-50 border border-slate-200/80">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase">
              {user.email ? user.email[0] : 'U'}
            </div>
            <span className="text-xs font-medium hidden md:inline-block max-w-[180px] truncate">
              {user.email}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
          title="Sign out of StockFlow"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
