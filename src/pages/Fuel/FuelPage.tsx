import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, AlertCircle, Fuel, Receipt } from 'lucide-react';
import { getFuelLogs, createFuelLog, getExpenses, createExpense } from '../../services/fuelService';
import { getMaintenanceRecords } from '../../services/maintenanceService';
import { getVehicles } from '../../services/vehicleService';
import Modal from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import { toast } from '../../store/toastStore';
import { exportToCSV } from '../../lib/csvExport';
import type { ExpenseType } from '../../types';

const fuelSchema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  liters: z.coerce.number().min(0.1, 'Enter liters'),
  costPerLiter: z.coerce.number().min(0, 'Enter cost per liter'),
  date: z.string().min(1, 'Date required'),
  odometer: z.coerce.number().optional(),
  notes: z.string().optional(),
});

const expenseSchema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  type: z.enum(['toll', 'parking', 'repair', 'insurance', 'misc'] as const),
  amount: z.coerce.number().min(0, 'Amount required'),
  date: z.string().min(1, 'Date required'),
  description: z.string().optional(),
});

type FuelForm = z.infer<typeof fuelSchema>;
type ExpenseForm = z.infer<typeof expenseSchema>;

const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  toll: 'Toll', parking: 'Parking', repair: 'Repair', insurance: 'Insurance', misc: 'Miscellaneous'
};

export default function FuelPage() {
  const qc = useQueryClient();
  const [fuelOpen, setFuelOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const { data: fuelLogs = [], isLoading: fuelLoading } = useQuery({ queryKey: ['fuel-logs'], queryFn: getFuelLogs });
  const { data: expenses = [], isLoading: expLoading } = useQuery({ queryKey: ['expenses'], queryFn: getExpenses });
  const { data: maintenance = [] } = useQuery({ queryKey: ['maintenance'], queryFn: getMaintenanceRecords });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: getVehicles });
  const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, v]));

  const { register: regFuel, handleSubmit: submitFuel, reset: resetFuel, watch: watchFuel,
    formState: { errors: fuelErrors, isSubmitting: fuelSubmitting } } = useForm<any>({ resolver: zodResolver(fuelSchema) });
  const { register: regExp, handleSubmit: submitExp, reset: resetExp,
    formState: { errors: expErrors, isSubmitting: expSubmitting } } = useForm<any>({ resolver: zodResolver(expenseSchema) });

  const liters = watchFuel('liters');
  const costPerLiter = watchFuel('costPerLiter');
  const totalFuelCost = liters && costPerLiter ? (liters * costPerLiter) : 0;

  const fuelMutation = useMutation({
    mutationFn: (data: FuelForm) => createFuelLog({ ...data, totalCost: Number(data.liters) * Number(data.costPerLiter) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fuel-logs'] });
      toast.success('Fuel log added');
      setFuelOpen(false); resetFuel();
    },
    onError: (err: any) => toast.error('Failed to log fuel', err.message),
  });

  const expMutation = useMutation({
    mutationFn: (data: ExpenseForm) => createExpense(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense logged');
      setExpenseOpen(false); resetExp();
    },
    onError: (err: any) => toast.error('Failed to log expense', err.message),
  });

  // Per-vehicle cost summary
  const costSummary = vehicles.map((v) => {
    const fuel = fuelLogs.filter((f) => f.vehicleId === v.id).reduce((s, f) => s + f.totalCost, 0);
    const maint = maintenance.filter((m) => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
    const exp = expenses.filter((e) => e.vehicleId === v.id).reduce((s, e) => s + e.amount, 0);
    return { vehicle: v, fuel, maint, exp, total: fuel + maint + exp };
  }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fuel & Expenses</h1>
          <p className="page-subtitle">Track operational costs per vehicle</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { resetExp({ date: new Date().toISOString().split('T')[0], type: 'toll' }); setExpenseOpen(true); }} className="btn-secondary text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Add Expense
          </button>
          <button onClick={() => { resetFuel({ date: new Date().toISOString().split('T')[0] }); setFuelOpen(true); }} className="btn-primary text-sm flex items-center gap-2">
            <Fuel className="w-4 h-4" /> Log Fuel
          </button>
        </div>
      </div>

      {/* Cost Summary Cards */}
      {costSummary.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-primary">Vehicle Cost Summary</h3>
            <button
              onClick={() => exportToCSV(
                costSummary.map((c) => ({
                  registration: c.vehicle.registrationNumber,
                  name: c.vehicle.name,
                  fuelCost: c.fuel.toFixed(2),
                  maintenanceCost: c.maint.toFixed(2),
                  expenseCost: c.exp.toFixed(2),
                  totalCost: c.total.toFixed(2),
                })),
                'vehicle_costs'
              )}
              className="btn-secondary text-xs"
            >Export CSV</button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Fuel Cost</th>
                  <th>Maintenance</th>
                  <th>Other Expenses</th>
                  <th>Total Op. Cost</th>
                </tr>
              </thead>
              <tbody>
                {costSummary.map((c) => (
                  <tr key={c.vehicle.id}>
                    <td>
                      <div className="font-medium">{c.vehicle.registrationNumber}</div>
                      <div className="text-xs text-muted">{c.vehicle.name}</div>
                    </td>
                    <td className="tabular text-info">${c.fuel.toFixed(2)}</td>
                    <td className="tabular text-warning">${c.maint.toFixed(2)}</td>
                    <td className="tabular text-secondary">${c.exp.toFixed(2)}</td>
                    <td className="tabular font-bold text-primary">${c.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fuel Logs */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-primary">Fuel Logs</h3>
          <button
            onClick={() => exportToCSV(fuelLogs, 'fuel_logs')}
            className="btn-secondary text-xs"
          >Export CSV</button>
        </div>
        {fuelLoading ? <TableSkeleton rows={5} cols={5} /> : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Vehicle</th><th>Date</th><th>Liters</th><th>Cost/L</th><th>Total Cost</th></tr>
              </thead>
              <tbody>
                {fuelLogs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-muted py-8">No fuel logs yet</td></tr>
                ) : (
                  [...fuelLogs].reverse().map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="font-medium">{vehicleMap[log.vehicleId]?.registrationNumber ?? '—'}</div>
                        <div className="text-xs text-muted">{vehicleMap[log.vehicleId]?.name ?? log.vehicleId}</div>
                      </td>
                      <td className="text-secondary">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="tabular text-secondary">{log.liters} L</td>
                      <td className="tabular text-secondary">${log.costPerLiter.toFixed(2)}</td>
                      <td className="tabular font-semibold text-info">${log.totalCost.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expenses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-primary">Other Expenses</h3>
          <button onClick={() => exportToCSV(expenses, 'expenses')} className="btn-secondary text-xs">Export CSV</button>
        </div>
        {expLoading ? <TableSkeleton rows={4} cols={5} /> : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Vehicle</th><th>Type</th><th>Description</th><th>Date</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-muted py-8">No expenses logged</td></tr>
                ) : (
                  [...expenses].reverse().map((exp) => (
                    <tr key={exp.id}>
                      <td>
                        <div className="font-medium">{vehicleMap[exp.vehicleId]?.registrationNumber ?? '—'}</div>
                        <div className="text-xs text-muted">{vehicleMap[exp.vehicleId]?.name ?? exp.vehicleId}</div>
                      </td>
                      <td className="capitalize text-secondary">{EXPENSE_TYPE_LABELS[exp.type]}</td>
                      <td className="text-secondary text-sm">{exp.description ?? '—'}</td>
                      <td className="text-secondary">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="tabular font-semibold text-warning">${exp.amount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fuel Modal */}
      <Modal isOpen={fuelOpen} onClose={() => { setFuelOpen(false); resetFuel(); }} title="Log Fuel"
        footer={
          <>
            <button onClick={() => { setFuelOpen(false); resetFuel(); }} className="btn-secondary">Cancel</button>
            <button onClick={submitFuel((d: any) => fuelMutation.mutate(d))} disabled={fuelSubmitting} className="btn-primary flex items-center gap-2">
              {fuelSubmitting && <div className="w-3.5 h-3.5 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />}
              Log Fuel
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="label">Vehicle *</label>
            <select {...regFuel('vehicleId')} className={`input ${fuelErrors.vehicleId ? 'input-error' : ''}`}>
              <option value="" className="bg-panel">— Select vehicle —</option>
              {vehicles.map((v) => <option key={v.id} value={v.id} className="bg-panel">{v.registrationNumber} — {v.name}</option>)}
            </select>
            {fuelErrors.vehicleId && <p className="field-error"><AlertCircle className="w-3 h-3" />{fuelErrors.vehicleId.message as any}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Liters *</label>
              <input type="number" step="0.1" {...regFuel('liters')} className="input" placeholder="0.0" />
            </div>
            <div>
              <label className="label">Cost per Liter ($) *</label>
              <input type="number" step="0.01" {...regFuel('costPerLiter')} className="input" placeholder="1.45" />
            </div>
          </div>
          {totalFuelCost > 0 && (
            <div className="p-3 rounded-lg bg-info-bg border border-info-border">
              <p className="text-xs text-info font-semibold">Total: ${totalFuelCost.toFixed(2)}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input type="date" {...regFuel('date')} className="input" />
            </div>
            <div>
              <label className="label">Odometer (km)</label>
              <input type="number" {...regFuel('odometer')} className="input" />
            </div>
          </div>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal isOpen={expenseOpen} onClose={() => { setExpenseOpen(false); resetExp(); }} title="Add Expense"
        footer={
          <>
            <button onClick={() => { setExpenseOpen(false); resetExp(); }} className="btn-secondary">Cancel</button>
            <button onClick={submitExp((d: any) => expMutation.mutate(d))} disabled={expSubmitting} className="btn-primary flex items-center gap-2">
              {expSubmitting && <div className="w-3.5 h-3.5 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />}
              Add Expense
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="label">Vehicle *</label>
            <select {...regExp('vehicleId')} className={`input ${expErrors.vehicleId ? 'input-error' : ''}`}>
              <option value="" className="bg-panel">— Select vehicle —</option>
              {vehicles.map((v) => <option key={v.id} value={v.id} className="bg-panel">{v.registrationNumber} — {v.name}</option>)}
            </select>
            {expErrors.vehicleId && <p className="field-error"><AlertCircle className="w-3 h-3" />{expErrors.vehicleId.message as any}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type *</label>
              <select {...regExp('type')} className="input">
                {(Object.keys(EXPENSE_TYPE_LABELS) as ExpenseType[]).map((t) => (
                  <option key={t} value={t} className="bg-panel">{EXPENSE_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Amount ($) *</label>
              <input type="number" step="0.01" {...regExp('amount')} className="input" placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input type="date" {...regExp('date')} className="input" />
            </div>
            <div>
              <label className="label">Description</label>
              <input {...regExp('description')} className="input" placeholder="Brief note" />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
