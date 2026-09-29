import React from 'react';
import { User, Mail, Shield, Building, Anchor, MapPin, Calendar, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLabels = {
    fisherman: 'Fisherman / Vessel Master',
    researcher: 'Marine Researcher / Oceanographer',
    coastal_authority: 'Coastal Authority / Coast Guard',
    operator: 'Disaster Management / Port Operator',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Operator Profile</h1>
          <p className="text-sm text-muted-foreground">Maritime credentials, vessel attributes, and regional sectors</p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 bg-danger-surface hover:bg-danger/20 border border-danger/40 text-danger text-xs font-semibold rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto text-2xl font-extrabold text-white shadow-md">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{user?.name || 'Marine Operator'}</h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{user?.email}</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>{roleLabels[user?.role] || user?.role || 'Operator'}</span>
          </div>
        </div>

        <div className="md:col-span-2 p-6 rounded-2xl bg-surface border border-border space-y-6 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h3 className="font-bold text-foreground">Operational Profile Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-surface-secondary border border-border space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building className="w-3.5 h-3.5 text-primary" />
                <span>Affiliated Organization</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {user?.organization || 'Independent Operator'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary border border-border space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Anchor className="w-3.5 h-3.5 text-accent" />
                <span>Registered Vessel</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {user?.vesselName || 'No Vessel Assigned'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary border border-border space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-danger" />
                <span>Default Sector</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {user?.preferredSector || 'Arabian Sea / Mumbai Coast'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary border border-border space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Registered On</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Active Session'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-secondary border border-border text-xs text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground">Role Capabilities:</span>
            <p>
              Your account is authorized to initiate AI Marine Safety queries, receive localized PFZ telemetry, submit geofenced voyage paths, and configure active emergency safety alert thresholds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
