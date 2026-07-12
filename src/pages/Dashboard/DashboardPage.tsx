import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Car, Users, Wrench, Navigation, Clock, Activity, TrendingUp, AlertTriangle
} from 'lucide-react';
import { useEffect, useRef, useMemo } from 'react';
import { getAnalyticsSummary } from '../../services/analyticsService';
import { getTrips } from '../../services/tripService';
import { getVehicles } from '../../services/vehicleService';
import { getDrivers } from '../../services/driverService';
import StatusBadge from '../../components/common/StatusBadge';
import { KPICardSkeleton, TableSkeleton } from '../../components/common/Skeleton';
import ExportPDFButton from '../../components/common/ExportPDFButton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import type { AnalyticsSummary } from '../../types';

// ─── Animated Number ─────────────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const start = 0;
    const end = value;
    const duration = 800;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (ref.current) ref.current.textContent = Math.round(start + (end - start) * eased).toString();
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <span ref={ref}>0</span>;
}

// ─── KPI Card ─────────────────────────────────────────────────
interface KPIProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  suffix?: string;
  change?: string;
  color?: string;
  delay?: number;
}

function KPICard({ icon: Icon, label, value, suffix = '', change, color = 'text-accent', delay = 0 }: KPIProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="kpi-card"
    >
      <div className="flex items-start justify-between">
        <p className="kpi-label">{label}</p>
        <div className={`w-8 h-8 rounded-lg bg-panel-2 flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className={`kpi-value ${color}`}>
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        {suffix && <span className="text-xl text-secondary">{suffix}</span>}
      </div>
      {change && <p className="kpi-change-up">{change}</p>}
    </motion.div>
  );
}

// ─── Status Bar Chart ─────────────────────────────────────────
function VehicleStatusBar({ summary, chartRef }: { summary: AnalyticsSummary; chartRef: React.RefObject<HTMLDivElement | null> }) {
  const data = [
    { name: 'Available', value: summary.availableVehicles, fill: '#22C55E' },
    { name: 'On Trip', value: summary.activeVehicles - summary.availableVehicles, fill: '#3B82F6' },
    { name: 'In Shop', value: summary.vehiclesInMaintenance, fill: '#F97316' },
    { name: 'Retired', value: summary.retiredVehicles, fill: '#EF4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold text-primary mb-4">Vehicle Status Distribution</h3>
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2B2E" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
            <Tooltip
              contentStyle={{ background: '#1A1B1E', border: '1px solid #2A2B2E', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#F1F2F4' }}
              itemStyle={{ color: '#9CA3AF' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // Chart ref for PDF export
  const chartRef = useRef<HTMLDivElement>(null);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: getAnalyticsSummary,
  });

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: getTrips,
  });

  const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: getVehicles });
  const { data: drivers } = useQuery({ queryKey: ['drivers'], queryFn: getDrivers });

  const recentTrips = trips?.slice().reverse().slice(0, 8) ?? [];

  // Lookup helpers
  const vehicleMap = Object.fromEntries((vehicles ?? []).map((v) => [v.id, v]));
  const driverMap = Object.fromEntries((drivers ?? []).map((d) => [d.id, d]));

  // Build KPIs for PDF export
  const pdfKpis = useMemo(() => {
    if (!summary) return {};
    return {
      'Active Vehicles': summary.activeVehicles,
      'Available Vehicles': summary.availableVehicles,
      'In Maintenance': summary.vehiclesInMaintenance,
      'Active Trips': summary.activeTrips,
      'Pending Trips': summary.pendingTrips,
      'Drivers On Duty': summary.driversOnDuty,
      'Fleet Utilization': `${summary.fleetUtilization}%`,
      'Completed Trips': summary.completedTrips,
      'Fuel Cost': `$${summary.totalFuelCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      'Maintenance Cost': `$${summary.totalMaintenanceCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      'Total Operational': `$${summary.totalOperationalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      'Avg Fuel Efficiency': `${summary.avgFuelEfficiency} km/L`,
    };
  }, [summary]);

  // Build recent trips table data for PDF
  const pdfTables = useMemo(() => {
    if (!recentTrips.length) return {};
    return {
      'Recent Trips': {
        headers: ['Route', 'Vehicle', 'Driver', 'Cargo (kg)', 'Status'],
        rows: recentTrips.map((trip) => [
          `${trip.source} → ${trip.destination}`,
          vehicleMap[trip.vehicleId]?.registrationNumber ?? trip.vehicleId,
          driverMap[trip.driverId]?.name ?? trip.driverId,
          trip.cargoWeight.toLocaleString(),
          trip.status,
        ]),
      },
    };
  }, [recentTrips, vehicleMap, driverMap]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Fleet overview and real-time operations summary</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Activity className="w-3.5 h-3.5 text-success" />
            Live Data
          </div>
          <ExportPDFButton
            reportTitle="Fleet Manager Dashboard Report"
            kpis={pdfKpis}
            chartRefs={[{ title: 'Vehicle Status Distribution', ref: chartRef }]}
            tables={pdfTables}
          />
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryLoading ? (
          Array.from({ length: 8 }).map((_, i) => <KPICardSkeleton key={i} />)
        ) : summary ? (
          <>
            <KPICard icon={Car} label="Active Vehicles" value={summary.activeVehicles} color="text-success" delay={0} change="Fleet utilization" />
            <KPICard icon={Car} label="Available Vehicles" value={summary.availableVehicles} color="text-info" delay={0.05} />
            <KPICard icon={Wrench} label="In Maintenance" value={summary.vehiclesInMaintenance} color="text-warning" delay={0.1} />
            <KPICard icon={Navigation} label="Active Trips" value={summary.activeTrips} color="text-accent" delay={0.15} />
            <KPICard icon={Clock} label="Pending Trips" value={summary.pendingTrips} color="text-secondary" delay={0.2} />
            <KPICard icon={Users} label="Drivers On Duty" value={summary.driversOnDuty} color="text-success" delay={0.25} />
            <KPICard icon={TrendingUp} label="Fleet Utilization" value={summary.fleetUtilization} suffix="%" color="text-accent" delay={0.3} />
            <KPICard icon={AlertTriangle} label="Completed Trips" value={summary.completedTrips} color="text-success" delay={0.35} />
          </>
        ) : null}
      </div>

      {/* ── Charts Row ─────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {summary && <VehicleStatusBar summary={summary} chartRef={chartRef} />}

        {/* Op Cost Card */}
        {summary && (
          <div className="card p-5">
            <h3 className="text-sm font-bold text-primary mb-4">Operational Cost Breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-secondary">Fuel Cost</span>
                  <span className="text-primary font-semibold">${summary.totalFuelCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="h-2 bg-panel-2 rounded-full">
                  <div
                    className="h-2 bg-info rounded-full transition-all duration-1000"
                    style={{ width: `${summary.totalOperationalCost > 0 ? (summary.totalFuelCost / summary.totalOperationalCost * 100) : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-secondary">Maintenance Cost</span>
                  <span className="text-primary font-semibold">${summary.totalMaintenanceCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="h-2 bg-panel-2 rounded-full">
                  <div
                    className="h-2 bg-warning rounded-full transition-all duration-1000"
                    style={{ width: `${summary.totalOperationalCost > 0 ? (summary.totalMaintenanceCost / summary.totalOperationalCost * 100) : 0}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-primary">Total Operational</span>
                  <span className="text-sm font-bold text-accent">${summary.totalOperationalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <div className="pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-secondary">Avg Fuel Efficiency</span>
                  <span className="text-success font-semibold">{summary.avgFuelEfficiency} km/L</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Recent Trips Table ──────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-primary">Recent Trips</h3>
          <a href="/app/trips" className="text-xs text-accent hover:text-accent-light transition-colors">View all →</a>
        </div>
        {tripsLoading ? (
          <div className="p-4"><TableSkeleton rows={5} cols={5} /></div>
        ) : (
          <div className="table-wrapper border-0 rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Cargo (kg)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-muted py-8">No trips yet</td></tr>
                ) : (
                  recentTrips.map((trip) => (
                    <tr key={trip.id}>
                      <td>
                        <div className="font-medium">{trip.source}</div>
                        <div className="text-xs text-muted">→ {trip.destination}</div>
                      </td>
                      <td className="text-secondary">{vehicleMap[trip.vehicleId]?.registrationNumber ?? trip.vehicleId}</td>
                      <td className="text-secondary">{driverMap[trip.driverId]?.name ?? trip.driverId}</td>
                      <td className="text-secondary tabular">{trip.cargoWeight.toLocaleString()}</td>
                      <td><StatusBadge status={trip.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
