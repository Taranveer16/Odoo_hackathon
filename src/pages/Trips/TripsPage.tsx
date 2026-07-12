import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, AlertCircle, CheckCircle, XCircle, Zap } from 'lucide-react';
import { getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip } from '../../services/tripService';
import { getVehicles } from '../../services/vehicleService';
import { getDrivers } from '../../services/driverService';
import { validateTripDispatch, isDriverDispatchEligible, isVehicleDispatchEligible } from '../../lib/businessRules';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import { toast } from '../../store/toastStore';
import { exportToCSV } from '../../lib/csvExport';
import type { Trip, Vehicle, Driver } from '../../types';

const tripSchema = z.object({
  source: z.string().min(2, 'Origin required'),
  destination: z.string().min(2, 'Destination required'),
  vehicleId: z.string().min(1, 'Select a vehicle'),
  driverId: z.string().min(1, 'Select a driver'),
  cargoWeight: z.coerce.number().min(0, 'Cargo weight required'),
  plannedDistance: z.coerce.number().min(1, 'Distance required'),
  notes: z.string().optional(),
});

type TripForm = z.infer<typeof tripSchema>;

const completeSchema = z.object({
  finalOdometer: z.coerce.number().min(1, 'Required'),
  fuelConsumed: z.coerce.number().min(0, 'Required'),
  actualDistance: z.coerce.number().min(0).optional(),
});
type CompleteForm = z.infer<typeof completeSchema>;

const TRIP_STEPS = ['Draft', 'Dispatched', 'Completed'];

function TripStepper({ status }: { status: Trip['status'] }) {
  const stepIdx = status === 'draft' ? 0 : status === 'dispatched' ? 1 : status === 'completed' ? 2 : -1;
  return (
    <div className="flex items-center gap-0">
      {TRIP_STEPS.map((step, i) => {
        const isActive = i === stepIdx;
        const isDone = i < stepIdx || status === 'completed';
        const isCancelled = status === 'cancelled';
        return (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold border ${
              isCancelled ? 'border-danger/40 bg-danger-bg text-danger' :
              isDone ? 'border-success/50 bg-success-bg text-success' :
              isActive ? 'border-accent/60 bg-accent-subtle text-accent' :
              'border-border bg-panel-2 text-muted'
            }`}>
              {isDone ? '✓' : i + 1}
            </div>
            {i < TRIP_STEPS.length - 1 && (
              <div className={`w-8 h-0.5 ${isDone ? 'bg-success/40' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
      {status === 'cancelled' && (
        <span className="ml-2 text-xs text-danger font-semibold">Cancelled</span>
      )}
    </div>
  );
}

export default function TripsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState<Trip | null>(null);

  const { data: trips = [], isLoading } = useQuery({ queryKey: ['trips'], queryFn: getTrips });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: getVehicles });
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: getDrivers });

  // Eligible vehicles + drivers for dispatch
  const eligibleVehicles = vehicles.filter((v) => isVehicleDispatchEligible(v).valid);
  const eligibleDrivers = drivers.filter((d) => isDriverDispatchEligible(d).valid);

  const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, v]));
  const driverMap = Object.fromEntries(drivers.map((d) => [d.id, d]));

  const {
    register, handleSubmit, watch, reset, setError,
    formState: { errors, isSubmitting },
  } = useForm<any>({ resolver: zodResolver(tripSchema) });

  const {
    register: regComplete, handleSubmit: handleComplete,
    reset: resetComplete, formState: { errors: completeErrors, isSubmitting: completing },
  } = useForm<any>({ resolver: zodResolver(completeSchema) });

  const selectedVehicleId = watch('vehicleId');
  const selectedDriverId = watch('driverId');
  const cargoWeight = watch('cargoWeight');

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);

  // Live capacity check
  const capacityViolation = selectedVehicle && cargoWeight > 0
    ? cargoWeight > selectedVehicle.maxLoadCapacity
    : false;

  const createMutation = useMutation({
    mutationFn: (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => createTrip(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip created', 'Trip saved as draft.');
      setCreateOpen(false); reset();
    },
    onError: (err: any) => toast.error('Failed to create trip', err.message),
  });

  const dispatchMutation = useMutation({
    mutationFn: (id: string) => dispatchTrip(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['drivers'] });
      qc.invalidateQueries({ queryKey: ['analytics-summary'] });
      toast.success('Trip dispatched', 'Vehicle and driver are now on trip.');
    },
    onError: (err: any) => toast.error('Dispatch failed', err.message),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteForm }) =>
      completeTrip(id, { finalOdometer: data.finalOdometer, fuelConsumed: data.fuelConsumed, actualDistance: data.actualDistance }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['drivers'] });
      qc.invalidateQueries({ queryKey: ['analytics-summary'] });
      toast.success('Trip completed', 'Vehicle and driver are now available.');
      setCompleteOpen(null); resetComplete();
    },
    onError: (err: any) => toast.error('Complete failed', err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelTrip(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Trip cancelled');
    },
    onError: (err: any) => toast.error('Cancel failed', err.message),
  });

  const onSubmit = async (data: TripForm) => {
    if (!selectedVehicle || !selectedDriver) return;
    const validation = validateTripDispatch(selectedVehicle, selectedDriver, data.cargoWeight);
    if (!validation.valid) {
      toast.error('Dispatch blocked', validation.reason);
      return;
    }
    await createMutation.mutateAsync(data as any);
  };

  const sortedTrips = [...trips].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Trip Dispatcher</h1>
          <p className="page-subtitle">{trips.filter((t) => t.status === 'dispatched').length} active trips</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(trips, 'trips_export', [
              { key: 'id', label: 'Trip ID' },
              { key: 'source', label: 'From' },
              { key: 'destination', label: 'To' },
              { key: 'status', label: 'Status' },
              { key: 'cargoWeight', label: 'Cargo (kg)' },
              { key: 'plannedDistance', label: 'Planned Dist (km)' },
            ])}
            className="btn-secondary text-sm"
          >Export CSV</button>
          <button onClick={() => { reset(); setCreateOpen(true); }} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Log Trip
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
                <th>Route</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Cargo</th>
                <th>Distance</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrips.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted py-12">No trips yet</td></tr>
              ) : (
                sortedTrips.map((trip) => {
                  const vehicle = vehicleMap[trip.vehicleId];
                  const driver = driverMap[trip.driverId];
                  return (
                    <tr key={trip.id}>
                      <td>
                        <div className="font-medium">{trip.source}</div>
                        <div className="text-xs text-muted">→ {trip.destination}</div>
                      </td>
                      <td className="text-secondary text-sm">{vehicle?.registrationNumber ?? '—'}</td>
                      <td className="text-secondary text-sm">{driver?.name ?? '—'}</td>
                      <td className="tabular text-secondary">{trip.cargoWeight.toLocaleString()} kg</td>
                      <td className="tabular text-secondary">{trip.plannedDistance} km</td>
                      <td><TripStepper status={trip.status} /></td>
                      <td><StatusBadge status={trip.status} /></td>
                      <td>
                        <div className="flex items-center gap-1">
                          {trip.status === 'draft' && (
                            <button
                              onClick={() => dispatchMutation.mutate(trip.id)}
                              className="text-xs px-2 py-1 rounded bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors flex items-center gap-1"
                            >
                              <Zap className="w-3 h-3" /> Dispatch
                            </button>
                          )}
                          {trip.status === 'dispatched' && (
                            <>
                              <button
                                onClick={() => { resetComplete(); setCompleteOpen(trip); }}
                                className="text-xs px-2 py-1 rounded bg-success-bg border border-success-border text-success hover:bg-success/20 transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" /> Complete
                              </button>
                              <button
                                onClick={() => cancelMutation.mutate(trip.id)}
                                className="text-xs px-2 py-1 rounded bg-danger-bg border border-danger-border text-danger hover:bg-danger/20 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Trip Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); reset(); }}
        title="Create New Trip"
        subtitle="Business rules are enforced live"
        size="lg"
        footer={
          <>
            <button onClick={() => { setCreateOpen(false); reset(); }} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting || capacityViolation} className="btn-primary flex items-center gap-2">
              {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />}
              Create Trip
            </button>
          </>
        }
      >
        <form className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Origin *</label>
            <input {...register('source')} className={`input ${errors.source ? 'input-error' : ''}`} placeholder="Atlanta, GA" />
            {errors.source && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.source.message as any}</p>}
          </div>
          <div>
            <label className="label">Destination *</label>
            <input {...register('destination')} className={`input ${errors.destination ? 'input-error' : ''}`} placeholder="Miami, FL" />
            {errors.destination && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.destination.message as any}</p>}
          </div>

          <div>
            <label className="label">Vehicle (Available only) *</label>
            <select {...register('vehicleId')} className={`input ${errors.vehicleId ? 'input-error' : ''}`}>
              <option value="" className="bg-panel">— Select vehicle —</option>
              {eligibleVehicles.map((v) => (
                <option key={v.id} value={v.id} className="bg-panel">
                  {v.registrationNumber} — {v.name} (max {v.maxLoadCapacity.toLocaleString()} kg)
                </option>
              ))}
            </select>
            {errors.vehicleId && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.vehicleId.message as any}</p>}
            {eligibleVehicles.length === 0 && (
              <p className="field-error"><AlertCircle className="w-3 h-3" />No vehicles available for dispatch</p>
            )}
          </div>

          <div>
            <label className="label">Driver (Available only) *</label>
            <select {...register('driverId')} className={`input ${errors.driverId ? 'input-error' : ''}`}>
              <option value="" className="bg-panel">— Select driver —</option>
              {eligibleDrivers.map((d) => (
                <option key={d.id} value={d.id} className="bg-panel">
                  {d.name} · Class {d.licenseCategory} · Score {d.safetyScore}
                </option>
              ))}
            </select>
            {errors.driverId && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.driverId.message as any}</p>}
          </div>

          <div>
            <label className="label">Cargo Weight (kg) *</label>
            <input type="number" {...register('cargoWeight')} className={`input ${capacityViolation ? 'input-error' : ''}`} placeholder="0" />
            {capacityViolation && selectedVehicle && (
              <div className="mt-2 p-3 rounded-lg bg-danger-bg border border-danger-border">
                <div className="flex items-center gap-2 text-danger text-xs font-semibold mb-1">
                  <XCircle className="w-4 h-4 shrink-0" />
                  Capacity exceeded!
                </div>
                <p className="text-xs text-danger/80">
                  {cargoWeight?.toLocaleString()} kg exceeds {selectedVehicle.name}'s max capacity of{' '}
                  {selectedVehicle.maxLoadCapacity.toLocaleString()} kg
                </p>
              </div>
            )}
            {selectedVehicle && !capacityViolation && cargoWeight > 0 && (
              <p className="text-xs text-success mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Within capacity ({Math.round((cargoWeight / selectedVehicle.maxLoadCapacity) * 100)}% loaded)
              </p>
            )}
          </div>

          <div>
            <label className="label">Planned Distance (km) *</label>
            <input type="number" {...register('plannedDistance')} className={`input ${errors.plannedDistance ? 'input-error' : ''}`} placeholder="0" />
            {errors.plannedDistance && <p className="field-error"><AlertCircle className="w-3 h-3" />{errors.plannedDistance.message as any}</p>}
          </div>

          <div className="col-span-2">
            <label className="label">Notes</label>
            <input {...register('notes')} className="input" placeholder="Optional notes" />
          </div>
        </form>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal
        isOpen={!!completeOpen}
        onClose={() => { setCompleteOpen(null); resetComplete(); }}
        title="Complete Trip"
        subtitle={completeOpen ? `${completeOpen.source} → ${completeOpen.destination}` : ''}
        footer={
          <>
            <button onClick={() => { setCompleteOpen(null); resetComplete(); }} className="btn-secondary">Cancel</button>
            <button
              onClick={handleComplete((data: any) => completeOpen && completeMutation.mutateAsync({ id: completeOpen.id, data }))}
              disabled={completing}
              className="btn-primary flex items-center gap-2"
            >
              {completing && <div className="w-3.5 h-3.5 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />}
              Mark Completed
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="label">Final Odometer (km) *</label>
            <input type="number" {...regComplete('finalOdometer')} className={`input ${completeErrors.finalOdometer ? 'input-error' : ''}`} />
            {completeErrors.finalOdometer && <p className="field-error"><AlertCircle className="w-3 h-3" />{completeErrors.finalOdometer.message as any}</p>}
          </div>
          <div>
            <label className="label">Fuel Consumed (liters) *</label>
            <input type="number" {...regComplete('fuelConsumed')} className={`input ${completeErrors.fuelConsumed ? 'input-error' : ''}`} />
            {completeErrors.fuelConsumed && <p className="field-error"><AlertCircle className="w-3 h-3" />{completeErrors.fuelConsumed.message as any}</p>}
          </div>
          <div>
            <label className="label">Actual Distance (km)</label>
            <input type="number" {...regComplete('actualDistance')} className="input" placeholder={completeOpen?.plannedDistance?.toString()} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
