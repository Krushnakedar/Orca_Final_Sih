import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Waves, LogIn, Lock, Mail, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fromPath = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError('');
  };

  const handleFillDemo = () => {
    setFormData({
      email: 'demo@orca.marine',
      password: 'Password123!',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ocean-500 to-tealAccent-500 flex items-center justify-center mx-auto shadow-lg shadow-ocean-950/60">
            <Waves className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Sign In to ORCA
          </h1>
          <p className="text-xs text-muted-foreground">
            Agentic AI Marine Intelligence & Operational Telemetry Platform
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-info-surface border border-info/30 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-accent" />
            <div>
              <div className="text-xs font-bold text-foreground">Hackathon Reviewer Demo</div>
              <div className="text-[11px] text-muted-foreground">demo@orca.marine &bull; Password123!</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground transition"
          >
            Auto-fill
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-danger-surface border border-danger/40 text-danger text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-danger shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="operator@marine.gov.in"
                className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-ocean-600 to-ocean-500 hover:from-ocean-500 hover:to-ocean-400 text-primary-foreground text-sm font-semibold rounded-xl transition shadow-lg shadow-ocean-950/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Access Dashboard'}</span>
          </button>

          <div className="pt-2 text-center text-xs text-muted-foreground">
            New operator?{' '}
            <Link to="/register" className="text-primary hover:text-primary-hover font-semibold underline underline-offset-4">
              Create an account
            </Link>
          </div>
        </form>

        <div className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          <span>Protected with JWT & SHA-256 password hashing</span>
        </div>
      </div>
    </div>
  );
}
