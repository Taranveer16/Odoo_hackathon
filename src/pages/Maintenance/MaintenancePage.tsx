import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { getMaintenanceRecords, createMaintenanceRecord, updateMaintenanceRecord } from '../../services/maintenanceService';
import { getVehicles } from '../../services/vehicleService';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import { toast } from '../../store/toastStore';
import { exportToCSV } from '../../lib/csvExport';
import type { ServiceType } from '../../types';

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  serviceType: z.enum(['oil_change', 'tire_replacement', 'brake_service', 'engine_repair', 'transmission', 'electrical', 'body_work', 'inspection', 'other'] as const),
  description: z.string().optional(),
  cost: z.coerce.number().min(0, 'Cost required'),
  date: z.string().min(1, 'Date required'),
  technician: z.string().optional(),
});

type MaintenanceForm = z.infer<typeof maintenanceSchema>;

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  oil_change: 'Oil Change',
  tire_replacement: 'Tire Replacement',
  brake_service: 'Brake Service',
  engine_repair: 'Engine Repair',
  transmission: 'Transmission',
  electrical: 'Electrical',
  body_work: 'Body Work',
  inspection: 'Inspection',
  other: 'Other',
};

export default function MaintenancePage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: getMaintenanceRecords,
  });

  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: getVehicles });
  const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, v]));

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(maintenanceSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: MaintenanceForm) =>
      createMaintenanceRecord({ ...data, status: 'open' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['analytics-summary'] });
      toast.success('Maintenance logged', 'Vehicle status set to In Shop.');
      setModalOpen(false); reset();
    },
    onError: (err: any) => toast.error('Failed to log maintenance', err.message),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) =>
      updateMaintenanceRecord(id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Record closed', 'Vehicle restored to Available.');
    },
    onError: (err: any) => toast.error('Failed to close record', err.message),
  });

  const onSubmit = (data: MaintenanceForm) => createMutation.mutate(data);

  const sortedRecords = [...records].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">{records.filter((r) => r.status === 'open').length} open records</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status flow diagram */}
          <div className="hidden md:flex items-center gap-2 text-xs text-muted mr-4">
            <span className="badge-success">Available</span>
            <ArrowRight className="w-3 h-3" />
            <span className="badge-warning">In Shop</span>
            <ArrowRight className="w-3 h-3" />
            <span className="badge-success">Available</span>
          </div>
          <button
            onClick={() => exportToCSV(records, 'maintenance_export', [
              { key: 'vehicleId', label: 'Vehicle ID' },
              { key: 'serviceType', label: 'Service Type' },
              { key: 'cost', label: 'Cost ($)' },
              { key: 'date', label: 'Date' },
              { key: 'status', label: 'Status' },
            ])}
            className="btn-secondary text-sm"
          >Export CSV</button>
          <button onClick={() => { reset({ date: new Date().toISOString().split('T')[0] }); setModalOpen(true); }} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Log Service
          </button>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Service Type</th>
                <th>Description</th>
                <th>Technician</th>
                <th>Cost</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted py-12">No maintenance records</td></tr>
              ) : (
                sortedRecords.map((r) => {
                  const vehicle = vehicleMap[r.vehicleId];
                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="font-medium">{vehicle?.registrationNumber ?? '—'}</div>
                        <div className="text-xs text-muted">{vehicle?.name ?? r.vehicleId}</div>
                      </td>
                      <td className="text-secondary">{SERVICE_TYPE_LABELS[r.serviceType]}</td>
                      <td className="text-secondary text-xs max-w-xs truncate">{r.description ?? '—'}</td>
                      <td className="text-secondary text-sm">{r.technician ?? '—'}</td>
                      <td className="tabular text-secondary">${r.cost.toLocaleString()}</td>
                      <td className="text-secondary text-sm">{new Date(r.date).toLocaleDateString()}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>
                        {r.status === 'open' && (
                          <button
                            onClick={() => closeMutation.mutate(r.id)}
                            className="text-xs px-2 py-1 rounded bg-success-bg border border-success-border text-success hover:bg-success/20 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" /> Close
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); reset(); }}
        title="Log Maintenance Record"
        subtitle="Creating an open record will set the vehicle to In Shop"
        footer={
          <>
            <button onClick={() => { setModalOpen(false); reset(); }} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="btn-primary flex items-center gap-2">
              {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />}
              Log Service
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="label">Vehicle *</label>
            <select {...register('vehicleId')} className={`input ${errors.vehicleId ? 'input-error' : ''}`}>
              <option value="" className="bg-panel">— Select vehicle —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} className="bg-panel">
                  {v.registrationNumber} — {v.name} ({v.status.replace('_', ' ')})
                </option>
              ))}
            </select>
            {errors.vehicleId && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.vehicleId.message as any}</p>}
          </div>
          <div>
            <label className="label">Service Type *</label>
            <select {...register('serviceType')} className="input">
              {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map((t) => (
                <option key={t} value={t} className="bg-panel">{SERVICE_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <input {...register('description')} className="input" placeholder="Brief description of work done" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cost ($) *</label>
              <input type="number" {...register('cost')} className={`input ${errors.cost ? 'input-error' : ''}`} placeholder="0" />
              {errors.cost && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.cost.message as any}</p>}
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" {...register('date')} className={`input ${errors.date ? 'input-error' : ''}`} />
              {errors.date && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.date.message as any}</p>}
            </div>
          </div>
          <div>
            <label className="label">Technician</label>
            <input {...register('technician')} className="input" placeholder="Name or company" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
