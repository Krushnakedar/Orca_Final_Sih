import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Waves, UserPlus, Lock, Mail, User, Building, Anchor, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const INPUT_BASE =
  'w-full py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition';
const INPUT_WITH_ICON = `${INPUT_BASE} pl-10 pr-3.5`;
const INPUT_PLAIN = `${INPUT_BASE} px-3.5`;
const LABEL = 'block text-xs font-medium text-foreground mb-1.5';
const ICON = 'w-4 h-4 text-muted-foreground absolute left-3.5 top-3';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'fisherman',
    organization: '',
    vesselName: '',
    preferredSector: 'Arabian Sea / Mumbai Coast'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        organization: formData.organization,
        vesselName: formData.vesselName,
        preferredSector: formData.preferredSector
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ocean-500 to-tealAccent-500 flex items-center justify-center mx-auto shadow-lg shadow-ocean-950/60">
            <Waves className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Register Operator Account
          </h1>
          <p className="text-xs text-muted-foreground">
            Join the ORCA Marine Intelligence & Advisory Network
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-danger-surface border border-danger/40 text-danger text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-danger shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Full Name</label>
              <div className="relative">
                <User className={ICON} />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Capt. Ramesh Patel"
                  className={INPUT_WITH_ICON}
                />
              </div>
            </div>

            <div>
              <label className={LABEL}>Email Address</label>
              <div className="relative">
                <Mail className={ICON} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ramesh@fisheries.org"
                  className={INPUT_WITH_ICON}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Password</label>
              <div className="relative">
                <Lock className={ICON} />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className={INPUT_WITH_ICON}
                />
              </div>
            </div>

            <div>
              <label className={LABEL}>Confirm Password</label>
              <div className="relative">
                <Lock className={ICON} />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className={INPUT_WITH_ICON}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>User Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={INPUT_PLAIN}
              >
                <option value="fisherman">Fisherman / Vessel Master</option>
                <option value="researcher">Marine Researcher / Oceanographer</option>
                <option value="coastal_authority">Coastal Authority / Coast Guard</option>
                <option value="operator">Disaster Management / Port Operator</option>
              </select>
            </div>

            <div>
              <label className={LABEL}>Primary Coastal Sector</label>
              <select
                name="preferredSector"
                value={formData.preferredSector}
                onChange={handleChange}
                className={INPUT_PLAIN}
              >
                <option value="Arabian Sea / Mumbai Coast">Arabian Sea / Mumbai Coast</option>
                <option value="Arabian Sea / Kochi Harbor">Arabian Sea / Kochi Harbor</option>
                <option value="Bay of Bengal / Chennai Coast">Bay of Bengal / Chennai Coast</option>
                <option value="Bay of Bengal / Visakhapatnam">Bay of Bengal / Visakhapatnam</option>
                <option value="Gulf of Kutch / Porbandar">Gulf of Kutch / Porbandar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Organization (Optional)</label>
              <div className="relative">
                <Building className={ICON} />
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  placeholder="Fisheries Society / Dept"
                  className={INPUT_WITH_ICON}
                />
              </div>
            </div>

            <div>
              <label className={LABEL}>Vessel Name / Reg. ID (Optional)</label>
              <div className="relative">
                <Anchor className={ICON} />
                <input
                  type="text"
                  name="vesselName"
                  value={formData.vesselName}
                  onChange={handleChange}
                  placeholder="Matsya-IND-04"
                  className={INPUT_WITH_ICON}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-ocean-600 to-ocean-500 hover:from-ocean-500 hover:to-ocean-400 text-primary-foreground text-sm font-semibold rounded-xl transition shadow-lg shadow-ocean-950/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed pt-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
          </button>

          <div className="pt-2 text-center text-xs text-muted-foreground">
            Already have an operator account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-hover font-semibold underline underline-offset-4">
              Sign In
            </Link>
          </div>
        </form>

        <div className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          <span>Role-based access control for Smart India Hackathon 2026</span>
        </div>
      </div>
    </div>
  );
}
