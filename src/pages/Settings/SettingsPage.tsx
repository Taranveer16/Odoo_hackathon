import { useState } from 'react';
import { Check, X, Shield, Lock, Unlock, RefreshCw } from 'lucide-react';
import { toast } from '../../store/toastStore';
import { mockStore } from '../../mocks/mockStore';

type Module =
  | 'Dashboard'
  | 'Fleet Registry'
  | 'Drivers & Safety'
  | 'Trip Dispatcher'
  | 'Maintenance'
  | 'Fuel & Expenses'
  | 'Reports & Analytics'
  | 'RBAC & Settings';

type RoleKey = 'fleet_manager' | 'dispatcher' | 'safety_officer' | 'financial_analyst';

const modules: Module[] = [
  'Dashboard',
  'Fleet Registry',
  'Drivers & Safety',
  'Trip Dispatcher',
  'Maintenance',
  'Fuel & Expenses',
  'Reports & Analytics',
  'RBAC & Settings',
];

const roles: { key: RoleKey; label: string }[] = [
  { key: 'fleet_manager', label: 'Fleet Manager' },
  { key: 'dispatcher', label: 'Dispatcher' },
  { key: 'safety_officer', label: 'Safety Officer' },
  { key: 'financial_analyst', label: 'Financial Analyst' },
];

const defaultMatrix: Record<RoleKey, Record<Module, boolean>> = {
  fleet_manager: {
    Dashboard: true,
    'Fleet Registry': true,
    'Drivers & Safety': true,
    'Trip Dispatcher': true,
    Maintenance: true,
    'Fuel & Expenses': true,
    'Reports & Analytics': true,
    'RBAC & Settings': true,
  },
  dispatcher: {
    Dashboard: true,
    'Fleet Registry': true,
    'Drivers & Safety': false,
    'Trip Dispatcher': true,
    Maintenance: false,
    'Fuel & Expenses': false,
    'Reports & Analytics': false,
    'RBAC & Settings': false,
  },
  safety_officer: {
    Dashboard: true,
    'Fleet Registry': false,
    'Drivers & Safety': true,
    'Trip Dispatcher': false,
    Maintenance: true,
    'Fuel & Expenses': false,
    'Reports & Analytics': true,
    'RBAC & Settings': false,
  },
  financial_analyst: {
    Dashboard: true,
    'Fleet Registry': false,
    'Drivers & Safety': false,
    'Trip Dispatcher': false,
    Maintenance: true,
    'Fuel & Expenses': true,
    'Reports & Analytics': true,
    'RBAC & Settings': false,
  },
};

export default function SettingsPage() {
  const [matrix, setMatrix] = useState<Record<RoleKey, Record<Module, boolean>>>(() => {
    const raw = localStorage.getItem('transit_rbac_matrix');
    return raw ? JSON.parse(raw) : defaultMatrix;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (role: RoleKey, module: Module) => {
    if (!isEditing) return;
    setMatrix((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [module]: !prev[role][module],
      },
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem('transit_rbac_matrix', JSON.stringify(matrix));
      setIsSaving(false);
      setIsEditing(false);
      toast.success('Permissions Saved', 'Role-based access matrix updated successfully.');
    }, 800);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset permissions to default?')) {
      setMatrix(defaultMatrix);
      localStorage.setItem('transit_rbac_matrix', JSON.stringify(defaultMatrix));
      toast.info('Matrix Reset', 'Permissions set back to platform defaults.');
    }
  };

  const handleResetDatabase = () => {
    if (window.confirm('Reset all demo data in localStorage? This will wipe your edits.')) {
      mockStore.reset();
      toast.success('Database Reset', 'Demo store reseeded with initial data.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings & RBAC</h1>
          <p className="page-subtitle">Configure system options and Role-Based Access Control</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setMatrix(JSON.parse(localStorage.getItem('transit_rbac_matrix') || JSON.stringify(defaultMatrix)));
                  setIsEditing(false);
                }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {isSaving && <div className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />}
                Save Permissions
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary text-sm flex items-center gap-2 border-accent/30 text-accent hover:bg-accent/10"
            >
              <Unlock className="w-4 h-4" /> Edit Permissions
            </button>
          )}
        </div>
      </div>

      {/* RBAC Matrix Card */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-panel-2 border border-border">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">Role-Based Access Control Matrix</h3>
              <p className="text-xs text-secondary mt-0.5">
                Define access rights per role. Active role restrictions are simulated.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted">
            {isEditing ? (
              <span className="flex items-center gap-1.5 text-warning">
                <Unlock className="w-3.5 h-3.5" /> Editing Mode
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-secondary">
                <Lock className="w-3.5 h-3.5" /> Read-Only
              </span>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr className="bg-panel-2">
                <th className="w-1/3">Module / Section</th>
                {roles.map((r) => (
                  <th key={r.key} className="text-center font-bold text-xs uppercase tracking-wider py-4">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => (
                <tr key={mod} className="border-b border-border/50 hover:bg-panel-2/30">
                  <td className="font-semibold text-primary py-4">{mod}</td>
                  {roles.map((r) => {
                    const hasAccess = matrix[r.key][mod];
                    return (
                      <td key={r.key} className="text-center py-4">
                        <button
                          type="button"
                          onClick={() => handleToggle(r.key, mod)}
                          disabled={!isEditing}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-all ${
                            hasAccess
                              ? 'bg-success/15 border-success/30 text-success hover:bg-success/25'
                              : 'bg-danger/10 border-danger/20 text-danger/80 hover:bg-danger/20'
                          } ${!isEditing ? 'cursor-default' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                          title={isEditing ? `Toggle ${mod} access for ${r.label}` : `${mod} Access`}
                        >
                          {hasAccess ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isEditing && (
          <div className="mt-4 flex justify-end">
            <button onClick={handleReset} className="btn-secondary text-xs flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Reset Matrix Defaults
            </button>
          </div>
        )}
      </div>

      {/* Dev Utils & Resets */}
      <div className="card p-6 border-danger/20 bg-danger-bg/5">
        <h3 className="text-sm font-bold text-danger mb-2 flex items-center gap-2">
          ⚠️ System & Developer Settings
        </h3>
        <p className="text-xs text-secondary mb-4 leading-relaxed">
          Manage system mock stores. Resets database tables back to default starting records (10 vehicles, 10 drivers, 15 trips).
        </p>
        <button
          onClick={handleResetDatabase}
          className="btn-danger text-sm flex items-center gap-2 hover:bg-danger/30"
        >
          <RefreshCw className="w-4 h-4" /> Reseed & Reset Database Store
        </button>
      </div>
    </div>
  );
}
