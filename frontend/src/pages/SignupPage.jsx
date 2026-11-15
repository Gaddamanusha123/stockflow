import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Building2, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export const SignupPage = () => {
  const [formData, setFormData] = useState({
    organization_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    if (formData.password !== formData.confirm_password) {
      setErrors({ confirm_password: 'Passwords do not match.' });
      return;
    }

    if (formData.password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsSubmitting(true);

    try {
      await signup(formData);
      navigate('/');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        setGeneralError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 bg-emerald-500 rounded-2xl text-white shadow-xl shadow-emerald-500/25 mb-4">
          <Box className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Organization</h2>
        <p className="mt-2 text-sm text-slate-400">
          Start your multi-tenant inventory with isolated storage
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {generalError && (
            <div className="mb-6 flex items-center gap-2.5 p-3.5 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Organization / Company Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="organization_name"
                  required
                  value={formData.organization_name}
                  onChange={handleChange}
                  placeholder="e.g. Apex Logistics Ltd"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                    errors.organization_name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
              </div>
              {errors.organization_name && <p className="text-xs text-rose-600 mt-1">{Array.isArray(errors.organization_name) ? errors.organization_name[0] : errors.organization_name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Admin Work Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@company.com"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                    errors.email ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-600 mt-1">{Array.isArray(errors.email) ? errors.email[0] : errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                    errors.password ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
              </div>
              {errors.password && <p className="text-xs text-rose-600 mt-1">{Array.isArray(errors.password) ? errors.password[0] : errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="confirm_password"
                  required
                  minLength={6}
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                    errors.confirm_password ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
              </div>
              {errors.confirm_password && <p className="text-xs text-rose-600 mt-1">{Array.isArray(errors.confirm_password) ? errors.confirm_password[0] : errors.confirm_password}</p>}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Account & Organization
              </button>
            </div>
          </form>

          <div className="mt-6 text-center pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
