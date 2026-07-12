import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, AlertCircle, AlertTriangle } from 'lucide-react';
import { getDrivers, createDriver, updateDriver } from '../../services/driverService';
import { isLicenseExpiringSoon } from '../../lib/businessRules';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import { toast } from '../../store/toastStore';
import { exportToCSV } from '../../lib/csvExport';
import type { Driver, DriverStatus, LicenseCategory } from '../../types';

const driverSchema = z.object({
  name: z.string().min(2, 'Name required'),
  licenseNumber: z.string().min(3, 'License number required'),
  licenseCategory: z.enum(['A', 'B', 'C', 'D', 'E', 'F'] as const),
  licenseExpiry: z.string().min(1, 'Expiry date required'),
  contactNumber: z.string().min(7, 'Contact number required'),
  email: z.string().email().optional().or(z.literal('')),
  safetyScore: z.coerce.number().min(0).max(100),
  status: z.enum(['available', 'on_trip', 'off_duty', 'suspended'] as const),
  branch: z.string().optional(),
  notes: z.string().optional(),
});

type DriverForm = z.infer<typeof driverSchema>;

const STATUS_OPTIONS: DriverStatus[] = ['available', 'on_trip', 'off_duty', 'suspended'];
const LICENSE_CATS: LicenseCategory[] = ['A', 'B', 'C', 'D', 'E', 'F'];

function SafetyScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-success' : score >= 75 ? 'bg-warning' : 'bg-danger';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-panel-2 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular ${score >= 90 ? 'text-success' : score >= 75 ? 'text-warning' : 'text-danger'}`}>
        {score}
      </span>
    </div>
  );
}

function LicenseExpiryCell({ expiry, status }: { expiry: string; status: DriverStatus }) {
  const expired = new Date(expiry) < new Date();
  const expiringSoon = !expired && isLicenseExpiringSoon({ licenseExpiry: expiry } as Driver, 30);
  const date = new Date(expiry).toLocaleDateString();

  return (
    <div className="flex items-center gap-1.5">
      {(expired || expiringSoon) && (
        <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${expired ? 'text-danger' : 'text-warning'}`} />
      )}
      <span className={`text-sm ${expired ? 'text-danger font-medium' : expiringSoon ? 'text-warning' : 'text-secondary'}`}>
        {date}
      </span>
    </div>
  );
}

export default function DriversPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: getDrivers,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(driverSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) => createDriver(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver added', 'New driver profile created.');
      setModalOpen(false); reset();
    },
    onError: (err: any) => toast.error('Failed to add driver', err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Driver> }) => updateDriver(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver updated');
      setModalOpen(false); setEditingDriver(null); reset();
    },
    onError: (err: any) => toast.error('Update failed', err.message),
  });

  const openAdd = () => {
    setEditingDriver(null);
    reset({ status: 'available', licenseCategory: 'C', safetyScore: 80 });
    setModalOpen(true);
  };

  const openEdit = (d: Driver) => {
    setEditingDriver(d);
    reset({ ...d, email: d.email ?? '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    const payload = { ...data, email: data.email || undefined };
    if (editingDriver) {
      await updateMutation.mutateAsync({ id: editingDriver.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload as Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver Profiles</h1>
          <p className="page-subtitle">{drivers.length} drivers in system</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(drivers, 'drivers_export', [
              { key: 'name', label: 'Name' },
              { key: 'licenseNumber', label: 'License No.' },
              { key: 'licenseCategory', label: 'Category' },
              { key: 'licenseExpiry', label: 'Expiry' },
              { key: 'safetyScore', label: 'Safety Score' },
              { key: 'status', label: 'Status' },
            ])}
            className="btn-secondary text-sm"
          >Export CSV</button>
          <button onClick={openAdd} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Driver
          </button>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>License No.</th>
                <th>Category</th>
                <th>License Expiry</th>
                <th>Safety Score</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted py-12">No drivers onboarded yet</td></tr>
              ) : (
                drivers.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-muted">{d.contactNumber}</div>
                    </td>
                    <td className="font-mono text-sm text-secondary">{d.licenseNumber}</td>
                    <td className="text-secondary font-semibold">Class {d.licenseCategory}</td>
                    <td><LicenseExpiryCell expiry={d.licenseExpiry} status={d.status} /></td>
                    <td><SafetyScoreBar score={d.safetyScore} /></td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      <button onClick={() => openEdit(d)} className="btn-ghost p-1.5 text-muted hover:text-primary">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); reset(); setEditingDriver(null); }}
        title={editingDriver ? 'Edit Driver' : 'Add Driver Profile'}
        size="lg"
        footer={
          <>
            <button onClick={() => { setModalOpen(false); reset(); setEditingDriver(null); }} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="btn-primary flex items-center gap-2">
              {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />}
              {editingDriver ? 'Save Changes' : 'Add Driver'}
            </button>
          </>
        }
      >
        <form className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Full Name *</label>
            <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Marcus Johnson" />
            {errors.name && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.name.message as any}</p>}
          </div>
          <div>
            <label className="label">License Number *</label>
            <input {...register('licenseNumber')} className={`input ${errors.licenseNumber ? 'input-error' : ''}`} placeholder="DL-2023-001" />
            {errors.licenseNumber && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.licenseNumber.message as any}</p>}
          </div>
          <div>
            <label className="label">License Category *</label>
            <select {...register('licenseCategory')} className="input">
              {LICENSE_CATS.map((c) => <option key={c} value={c} className="bg-panel">Class {c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">License Expiry *</label>
            <input type="date" {...register('licenseExpiry')} className={`input ${errors.licenseExpiry ? 'input-error' : ''}`} />
            {errors.licenseExpiry && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.licenseExpiry.message as any}</p>}
          </div>
          <div>
            <label className="label">Contact Number *</label>
            <input {...register('contactNumber')} className={`input ${errors.contactNumber ? 'input-error' : ''}`} placeholder="+1-555-0100" />
            {errors.contactNumber && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.contactNumber.message as any}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" {...register('email')} className="input" placeholder="driver@company.com" />
          </div>
          <div>
            <label className="label">Safety Score (0–100) *</label>
            <input type="number" {...register('safetyScore')} className="input" min="0" max="100" />
          </div>
          <div>
            <label className="label">Status *</label>
            <select {...register('status')} className="input">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-panel">{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Branch</label>
            <input {...register('branch')} className="input" placeholder="HQ" />
          </div>
          <div>
            <label className="label">Notes</label>
            <input {...register('notes')} className="input" placeholder="Optional notes" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
