import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pill, ShieldCheck, Mail, Lock, User, Phone, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function AuthPage({ initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [role, setRole] = useState('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(email, password);
        if (res.success) {
          navigate('/schedule');
        } else {
          setError(res.error);
        }
      } else {
        const res = await register({ name, email, password, role, phone });
        if (res.success) {
          navigate('/schedule');
        } else {
          setError(res.error);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick fill demo credentials
  const fillDemo = (demoRole) => {
    if (demoRole === 'patient') {
      setEmail('patient@test.com');
      setPassword('SecurePass1');
    } else if (demoRole === 'doctor') {
      setEmail('jane.foster@hospital.com');
      setPassword('SecurePass1');
    } else if (demoRole === 'retailer') {
      setEmail('medplus@shop.com');
      setPassword('SecurePass1');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-3 shadow">
            <Pill className="w-6 h-6 transform -rotate-45" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isLogin ? 'Welcome Back to Meditrace' : 'Create Your Meditrace Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isLogin
              ? 'Enter your credentials to manage doses and prescriptions'
              : 'Join as a patient, doctor, or verified retailer pharmacy'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`py-2 rounded-lg transition-all ${
              isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`py-2 rounded-lg transition-all ${
              !isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {!isLogin && (
            <>
              {/* Role selection */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {['patient', 'doctor', 'retailer'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-3 rounded-xl border text-center capitalize font-medium transition-all ${
                        role === r
                          ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 chars, 1 uppercase, 1 number"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <span>Please wait...</span>
            ) : (
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* Demo Fast Login Pills */}
        {isLogin && (
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 mb-2">Fast test fill (demo accounts):</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              <button
                type="button"
                onClick={() => fillDemo('patient')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-[11px] text-slate-600 rounded-lg transition-colors"
              >
                Patient Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemo('doctor')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-[11px] text-slate-600 rounded-lg transition-colors"
              >
                Doctor Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemo('retailer')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-[11px] text-slate-600 rounded-lg transition-colors"
              >
                Retailer Demo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
