import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, AlertCircle } from 'lucide-react';
import { getVehicles, createVehicle, updateVehicle } from '../../services/vehicleService';
import { isRegistrationUnique } from '../../lib/businessRules';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import { toast } from '../../store/toastStore';
import { exportToCSV } from '../../lib/csvExport';
import type { Vehicle, VehicleStatus, VehicleType } from '../../types';

const vehicleSchema = z.object({
  registrationNumber: z.string().min(3, 'Registration number required').max(20),
  name: z.string().min(2, 'Name required'),
  model: z.string().min(2, 'Model required'),
  type: z.enum(['truck', 'van', 'bus', 'pickup', 'motorcycle', 'other'] as const),
  maxLoadCapacity: z.coerce.number().min(1, 'Capacity must be > 0'),
  odometer: z.coerce.number().min(0),
  acquisitionCost: z.coerce.number().min(0),
  status: z.enum(['available', 'on_trip', 'in_shop', 'retired'] as const),
  year: z.coerce.number().min(1990).max(new Date().getFullYear() + 1).optional(),
  fuelType: z.string().optional(),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

const STATUS_OPTIONS: VehicleStatus[] = ['available', 'on_trip', 'in_shop', 'retired'];
const TYPE_OPTIONS: VehicleType[] = ['truck', 'van', 'bus', 'pickup', 'motorcycle', 'other'];

export default function FleetPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<any>({ resolver: zodResolver(vehicleSchema) });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => createVehicle(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['analytics-summary'] });
      toast.success('Vehicle added', 'New vehicle registered in the fleet.');
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => toast.error('Failed to add vehicle', err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vehicle> }) => updateVehicle(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['analytics-summary'] });
      toast.success('Vehicle updated');
      setModalOpen(false);
      setEditingVehicle(null);
      reset();
    },
    onError: (err: any) => toast.error('Update failed', err.message),
  });

  const openAdd = () => {
    setEditingVehicle(null);
    reset({ status: 'available', type: 'truck', odometer: 0, acquisitionCost: 0, maxLoadCapacity: 1000 });
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    reset(v as VehicleForm);
    setModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    // Uniqueness check
    const uniqueCheck = isRegistrationUnique(data.registrationNumber, vehicles, editingVehicle?.id);
    if (!uniqueCheck.valid) {
      setError('registrationNumber', { message: uniqueCheck.reason });
      return;
    }

    if (editingVehicle) {
      await updateMutation.mutateAsync({ id: editingVehicle.id, data });
    } else {
      await createMutation.mutateAsync(data as Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicle Registry</h1>
          <p className="page-subtitle">{vehicles.length} vehicles in fleet</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(vehicles, 'fleet_export', [
              { key: 'registrationNumber', label: 'Reg Number' },
              { key: 'name', label: 'Name' },
              { key: 'model', label: 'Model' },
              { key: 'type', label: 'Type' },
              { key: 'maxLoadCapacity', label: 'Capacity (kg)' },
              { key: 'odometer', label: 'Odometer (km)' },
              { key: 'acquisitionCost', label: 'Acq. Cost ($)' },
              { key: 'status', label: 'Status' },
            ])}
            className="btn-secondary text-sm"
          >
            Export CSV
          </button>
          <button onClick={openAdd} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Registration</th>
                <th>Name / Model</th>
                <th>Type</th>
                <th>Max Load</th>
                <th>Odometer</th>
                <th>Acq. Cost</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted py-12">No vehicles registered yet</td></tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className="font-mono text-sm font-semibold text-accent">{v.registrationNumber}</span>
                    </td>
                    <td>
                      <div className="font-medium text-primary">{v.name}</div>
                      <div className="text-xs text-muted">{v.model} {v.year && `(${v.year})`}</div>
                    </td>
                    <td className="capitalize text-secondary">{v.type}</td>
                    <td className="tabular text-secondary">{v.maxLoadCapacity.toLocaleString()} kg</td>
                    <td className="tabular text-secondary">{v.odometer.toLocaleString()} km</td>
                    <td className="tabular text-secondary">${v.acquisitionCost.toLocaleString()}</td>
                    <td><StatusBadge status={v.status} /></td>
                    <td>
                      <button
                        onClick={() => openEdit(v)}
                        className="btn-ghost p-1.5 text-muted hover:text-primary"
                        aria-label={`Edit ${v.name}`}
                      >
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); reset(); setEditingVehicle(null); }}
        title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        subtitle={editingVehicle ? `Editing ${editingVehicle.registrationNumber}` : 'Register a new vehicle in your fleet'}
        size="lg"
        footer={
          <>
            <button onClick={() => { setModalOpen(false); reset(); setEditingVehicle(null); }} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="btn-primary flex items-center gap-2">
              {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />}
              {editingVehicle ? 'Save Changes' : 'Add Vehicle'}
            </button>
          </>
        }
      >
        <form className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Registration Number *</label>
            <input {...register('registrationNumber')} className={`input ${errors.registrationNumber ? 'input-error' : ''}`} placeholder="TRK-001-A" />
            {errors.registrationNumber && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.registrationNumber.message as any}</p>}
          </div>
          <div>
            <label className="label">Vehicle Name *</label>
            <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Titan Hauler" />
            {errors.name && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.name.message as any}</p>}
          </div>
          <div>
            <label className="label">Model *</label>
            <input {...register('model')} className={`input ${errors.model ? 'input-error' : ''}`} placeholder="Volvo FH16" />
            {errors.model && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.model.message as any}</p>}
          </div>
          <div>
            <label className="label">Type *</label>
            <select {...register('type')} className="input">
              {TYPE_OPTIONS.map((t) => <option key={t} value={t} className="bg-panel capitalize">{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status *</label>
            <select {...register('status')} className="input">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-panel">{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Max Load Capacity (kg) *</label>
            <input type="number" {...register('maxLoadCapacity')} className={`input ${errors.maxLoadCapacity ? 'input-error' : ''}`} placeholder="20000" />
            {errors.maxLoadCapacity && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.maxLoadCapacity.message as any}</p>}
          </div>
          <div>
            <label className="label">Odometer (km)</label>
            <input type="number" {...register('odometer')} className="input" placeholder="0" />
          </div>
          <div>
            <label className="label">Acquisition Cost ($)</label>
            <input type="number" {...register('acquisitionCost')} className="input" placeholder="0" />
          </div>
          <div>
            <label className="label">Year</label>
            <input type="number" {...register('year')} className="input" placeholder={String(new Date().getFullYear())} />
          </div>
          <div>
            <label className="label">Fuel Type</label>
            <input {...register('fuelType')} className="input" placeholder="diesel" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
