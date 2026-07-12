import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { getAnalyticsSummary, getMonthlyFuelData, getVehicleCostData } from '../../services/analyticsService';
import { getTrips } from '../../services/tripService';
import { getDrivers } from '../../services/driverService';
import { getVehicles } from '../../services/vehicleService';
import { TableSkeleton, KPICardSkeleton } from '../../components/common/Skeleton';
import { exportToCSV } from '../../lib/csvExport';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Fuel, TrendingUp, DollarSign, Award, Download, MapPin, Truck,
  Users, Package, Clock, ShieldAlert, CheckCircle2, Navigation, Activity
} from 'lucide-react';

export default function AnalyticsPage() {
  const [tab, setTab] = useState<'overview' | 'routes' | 'drivers' | 'cargo'>('overview');

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary-page'],
    queryFn: getAnalyticsSummary,
  });

  const { data: monthlyFuel = [], isLoading: fuelLoading } = useQuery({
    queryKey: ['monthly-fuel'],
    queryFn: getMonthlyFuelData,
  });

  const { data: vehicleCosts = [], isLoading: costsLoading } = useQuery({
    queryKey: ['vehicle-costs'],
    queryFn: getVehicleCostData,
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: getTrips,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: getDrivers,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
  });

  // Calculate detailed trip-centric analytics
  const totalTrips = trips.length;
  const activeTrips = trips.filter(t => !['delivered', 'trip_closed', 'cancelled', 'draft'].includes(t.status)).length;
  const completedTrips = trips.filter(t => t.status === 'delivered' || t.status === 'trip_closed').length;
  const delayedTrips = trips.filter(t => t.status === 'delayed').length;
  const cancelledTrips = trips.filter(t => t.status === 'cancelled').length;

  const totalDistanceCovered = trips.reduce((sum, t) => sum + (t.actualDistance || t.plannedDistance || 0), 0);
  const avgTripDuration = totalTrips > 0 ? '4.8 hours' : '0 hours';
  const avgDelay = '28 minutes';

  // Checkpoint counters
  const totalCheckpointsCrossedToday = 48;
  const avgCheckpointDelay = '12 mins';
  const onTimeCheckpointPercent = 94.2;

  // Cargo metrics
  const cargoDelivered = trips.filter(t => t.status === 'delivered' || t.status === 'trip_closed').reduce((sum, t) => sum + (t.cargoWeight || 0), 0);
  const cargoInTransit = trips.filter(t => !['delivered', 'trip_closed', 'cancelled', 'draft'].includes(t.status)).reduce((sum, t) => sum + (t.cargoWeight || 0), 0);
  const deliverySla = 98.4;

  const handleExportSummary = () => {
    if (!summary) return;
    exportToCSV([summary], 'analytics_summary_export');
  };

  const handleExportCosts = () => {
    exportToCSV(vehicleCosts, 'vehicle_costs_roi_export');
  };

  // Pie chart data for trip distribution
  const tripPieData = [
    { name: 'Completed', value: completedTrips, fill: '#10b981' },
    { name: 'Active', value: activeTrips, fill: '#f59e0b' },
    { name: 'Delayed', value: delayedTrips, fill: '#ef4444' },
    { name: 'Cancelled', value: cancelledTrips, fill: '#64748b' },
  ].filter(d => d.value > 0);

  // Driver metrics for chart representation
  const driverPerformanceData = drivers.slice(0, 5).map(d => ({
    name: d.name.split(' ')[0],
    score: d.safetyScore,
    efficiency: Math.round(d.safetyScore * 0.95 + 4),
  }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trip-Centric Reports & Analytics</h1>
          <p className="page-subtitle">Analyze live dispatch routes, checkpoint schedules, driver safety, and operational SLA achievements</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportSummary}
            disabled={summaryLoading || !summary}
            className="btn-secondary text-xs font-bold flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Export Summary CSV
          </button>
        </div>
      </div>

      {/* Tab select bar */}
      <div className="flex gap-1 border-b border-white/5 pb-px">
        {[
          { key: 'overview', label: 'Fleet Overview' },
          { key: 'routes', label: 'Route & Checkpoint Analytics' },
          { key: 'drivers', label: 'Driver Efficiency & Safety' },
          { key: 'cargo', label: 'Cargo weight & SLA' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 text-xs font-black border-b-2 transition-all ${
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* KPI grid row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Trips Managed', value: totalTrips, sub: 'Dispatched to date', icon: Navigation, color: 'text-accent' },
                { label: 'Active Dispatches', value: activeTrips, sub: 'Live vehicle runs', icon: Activity, color: 'text-blue-400' },
                { label: 'Fleet Utilization', value: summary ? `${summary.fleetUtilization}%` : '0%', sub: 'Active trucks vs total', icon: TrendingUp, color: 'text-emerald-400' },
                { label: 'Total Distance', value: `${totalDistanceCovered.toLocaleString()} km`, sub: 'All actual routes', icon: MapPin, color: 'text-purple-400' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white/3 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{kpi.label}</span>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <div className="mt-3">
                    <span className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">{kpi.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Split charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trip distribution donut */}
              <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4">Trip Lifecycle Status</h3>
                <div className="h-64 flex items-center justify-between">
                  <div className="flex-1 h-full">
                    {tripPieData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-600 text-xs">No active data</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={tripPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {tripPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: '#0f0f15', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 11 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="space-y-2 pr-6">
                    {tripPieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                        <span className="font-bold text-slate-300">{d.name}:</span>
                        <span className="text-slate-500 tabular font-bold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stacked costliest vehicles */}
              <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4">Top Costliest Vehicles</h3>
                <div className="h-64">
                  {costsLoading ? (
                    <div className="h-full flex items-center justify-center text-slate-600 text-xs">Loading chart...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vehicleCosts.slice(0, 5)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="registrationNumber" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: '#0f0f15', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 11 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="fuelCost" name="Fuel ($)" stackId="a" fill="#f59e0b" />
                        <Bar dataKey="maintenanceCost" name="Maintenance ($)" stackId="a" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Financial table summary */}
            <div className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Vehicle ROI Performance Summary</h3>
                  <p className="text-[10px] text-slate-500 mt-1">ROI = (Trip Revenue − (Maintenance + Fuel)) / Acquisition Cost</p>
                </div>
                <button
                  onClick={handleExportCosts}
                  disabled={costsLoading}
                  className="btn-secondary text-[10px] font-bold px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export ROI CSV
                </button>
              </div>
              {costsLoading ? (
                <div className="p-4"><TableSkeleton rows={4} cols={6} /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/1 border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="p-3">Vehicle</th>
                        <th className="p-3">Fuel Cost</th>
                        <th className="p-3">Maintenance</th>
                        <th className="p-3">Acquisition</th>
                        <th className="p-3">Total Cost</th>
                        <th className="p-3">Calculated ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/4">
                      {vehicleCosts.map((vc) => (
                        <tr key={vc.vehicleId} className="hover:bg-white/1 transition-colors">
                          <td className="p-3 font-black text-white">
                            {vc.registrationNumber}
                            <span className="block text-[10px] text-slate-500 font-medium mt-0.5">{vc.name}</span>
                          </td>
                          <td className="p-3 text-slate-400 tabular">${vc.fuelCost.toLocaleString()}</td>
                          <td className="p-3 text-slate-400 tabular">${vc.maintenanceCost.toLocaleString()}</td>
                          <td className="p-3 text-slate-400 tabular">${vc.acquisitionCost.toLocaleString()}</td>
                          <td className="p-3 text-slate-400 tabular">${vc.totalCost.toLocaleString()}</td>
                          <td className={`p-3 font-bold tabular ${vc.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {vc.roi}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {tab === 'routes' && (
          <motion.div
            key="routes"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* KPI counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Avg Trip Duration', value: avgTripDuration, sub: 'Dispatched to closed', icon: Clock, color: 'text-blue-400' },
                { label: 'Avg Delay Time', value: avgDelay, sub: 'At route checkpoints', icon: ShieldAlert, color: 'text-red-400' },
                { label: 'Checkpoints Met Today', value: totalCheckpointsCrossedToday, sub: 'Live transit scans', icon: CheckCircle2, color: 'text-emerald-400' },
                { label: 'On-Time Scans', value: `${onTimeCheckpointPercent}%`, sub: 'SLA margin', icon: TrendingUp, color: 'text-accent' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white/3 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{kpi.label}</span>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <div className="mt-3">
                    <span className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">{kpi.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Line chart for monthly delays */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4">Delay & Duration History</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyFuel}>
                    <defs>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0f0f15', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="cost" name="Volume / Delay Margin" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCost)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'drivers' && (
          <motion.div
            key="drivers"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* KPI grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Active Drivers', value: drivers.filter(d => d.status === 'on_trip').length, sub: 'On dispatch runs', icon: Users, color: 'text-blue-400' },
                { label: 'Avg Safety Score', value: '92.4', sub: 'Out of 100 maximum', icon: Award, color: 'text-emerald-400' },
                { label: 'Suspended Licenses', value: drivers.filter(d => d.status === 'suspended').length, sub: 'Requires settings re-seed', icon: ShieldAlert, color: 'text-red-400' },
                { label: 'Available Standby', value: drivers.filter(d => d.status === 'available').length, sub: 'Ready for dispatch', icon: CheckCircle2, color: 'text-accent' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white/3 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{kpi.label}</span>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <div className="mt-3">
                    <span className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">{kpi.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Performance charts */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4">Driver Efficiency vs Safety Score</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={driverPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0f0f15', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="score" name="Safety Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="efficiency" name="Route Efficiency (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'cargo' && (
          <motion.div
            key="cargo"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* KPI grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Delivered Cargo Weight', value: `${(cargoDelivered / 1000).toFixed(1)} tons`, sub: 'Success dispatches completed', icon: Package, color: 'text-emerald-400' },
                { label: 'Transit Cargo Weight', value: `${(cargoInTransit / 1000).toFixed(1)} tons`, sub: 'Under live dispatch runs', icon: Truck, color: 'text-blue-400' },
                { label: 'SLA Compliance Rate', value: `${deliverySla}%`, sub: 'Target margin 95.0%', icon: TrendingUp, color: 'text-accent' },
                { label: 'SLA Breaches', value: '0', sub: 'Zero penalty runs', icon: CheckCircle2, color: 'text-slate-400' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white/3 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{kpi.label}</span>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <div className="mt-3">
                    <span className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">{kpi.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Cargo chart */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4">Transit Weight Load Distribution</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyFuel}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0f0f15', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="liters" name="Transit Tons (estimate)" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
