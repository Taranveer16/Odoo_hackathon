import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAnalyticsSummary, getMonthlyFuelData, getVehicleCostData } from '../../services/analyticsService';
import { TableSkeleton, KPICardSkeleton } from '../../components/common/Skeleton';
import { exportToCSV } from '../../lib/csvExport';
import { Fuel, TrendingUp, DollarSign, Award, Download } from 'lucide-react';

export default function AnalyticsPage() {
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

  const handleExportSummary = () => {
    if (!summary) return;
    exportToCSV([summary], 'analytics_summary_export');
  };

  const handleExportFuel = () => {
    exportToCSV(monthlyFuel, 'monthly_fuel_export');
  };

  const handleExportCosts = () => {
    exportToCSV(vehicleCosts, 'vehicle_costs_roi_export');
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Analyze fleet efficiency, ROI, and total expenditures</p>
        </div>
        <button
          onClick={handleExportSummary}
          disabled={summaryLoading || !summary}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export Summary CSV
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
        ) : summary ? (
          <>
            <div className="kpi-card">
              <div className="flex justify-between items-start">
                <span className="kpi-label">Avg Fuel Efficiency</span>
                <Fuel className="w-4 h-4 text-info" />
              </div>
              <div className="kpi-value text-info mt-2">
                {summary.avgFuelEfficiency} <span className="text-sm font-normal text-secondary">km/L</span>
              </div>
              <p className="text-xs text-muted mt-1">Liters consumed vs actual km</p>
            </div>

            <div className="kpi-card">
              <div className="flex justify-between items-start">
                <span className="kpi-label">Fleet Utilization</span>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div className="kpi-value text-success mt-2">
                {summary.fleetUtilization}%
              </div>
              <p className="text-xs text-muted mt-1">Percentage of vehicles active</p>
            </div>

            <div className="kpi-card">
              <div className="flex justify-between items-start">
                <span className="kpi-label">Total Operational Cost</span>
                <DollarSign className="w-4 h-4 text-warning" />
              </div>
              <div className="kpi-value text-warning mt-2">
                ${summary.totalOperationalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted mt-1">Fuel + Maintenance + Expenses</p>
            </div>

            <div className="kpi-card">
              <div className="flex justify-between items-start">
                <span className="kpi-label">Fleet Fuel Expense</span>
                <DollarSign className="w-4 h-4 text-accent" />
              </div>
              <div className="kpi-value text-accent mt-2">
                ${summary.totalFuelCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted mt-1">Overall fuel investment</p>
            </div>
          </>
        ) : null}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Fuel Usage */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-primary">Monthly Fuel Expense</h3>
            <button
              onClick={handleExportFuel}
              disabled={fuelLoading || !monthlyFuel.length}
              className="btn-ghost p-1 hover:text-accent flex items-center gap-1.5 text-xs text-muted"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
          <div className="h-72">
            {fuelLoading ? (
              <div className="h-full flex items-center justify-center text-muted">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFuel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2B2E" />
                  <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1A1B1E', border: '1px solid #2A2B2E', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#F1F2F4' }}
                    itemStyle={{ color: '#9CA3AF' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="cost" name="Cost ($)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="liters" name="Volume (L)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Costliest Vehicles */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-primary">Top Costliest Vehicles</h3>
            <button
              onClick={handleExportCosts}
              disabled={costsLoading || !vehicleCosts.length}
              className="btn-ghost p-1 hover:text-accent flex items-center gap-1.5 text-xs text-muted"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
          <div className="h-72">
            {costsLoading ? (
              <div className="h-full flex items-center justify-center text-muted">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleCosts.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2B2E" />
                  <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <YAxis dataKey="registrationNumber" type="category" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{ background: '#1A1B1E', border: '1px solid #2A2B2E', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#F1F2F4' }}
                    itemStyle={{ color: '#9CA3AF' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="fuelCost" name="Fuel ($)" stackId="a" fill="#3B82F6" />
                  <Bar dataKey="maintenanceCost" name="Maintenance ($)" stackId="a" fill="#F97316" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ROI and Cost Table */}
      <div className="card">
        <div className="flex justify-between items-center p-5 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-primary">Vehicle Financial & ROI Summary</h3>
            <p className="text-xs text-muted mt-0.5">ROI = (Trip Revenue − (Maintenance + Fuel)) / Acquisition Cost</p>
          </div>
          <button
            onClick={handleExportCosts}
            disabled={costsLoading || !vehicleCosts.length}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>

        {costsLoading ? (
          <div className="p-5"><TableSkeleton rows={5} cols={6} /></div>
        ) : (
          <div className="table-wrapper border-0 rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Fuel Cost</th>
                  <th>Maintenance Cost</th>
                  <th>Acquisition Cost</th>
                  <th>Total Cost</th>
                  <th>Calculated ROI</th>
                </tr>
              </thead>
              <tbody>
                {vehicleCosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-8">
                      No cost data recorded yet
                    </td>
                  </tr>
                ) : (
                  vehicleCosts.map((vc) => (
                    <tr key={vc.vehicleId}>
                      <td className="font-semibold text-primary">
                        {vc.registrationNumber}
                        <span className="block text-2xs text-muted font-normal">{vc.name}</span>
                      </td>
                      <td className="tabular text-secondary">${vc.fuelCost.toLocaleString()}</td>
                      <td className="tabular text-secondary">${vc.maintenanceCost.toLocaleString()}</td>
                      <td className="tabular text-secondary">${vc.acquisitionCost.toLocaleString()}</td>
                      <td className="tabular text-secondary">${vc.totalCost.toLocaleString()}</td>
                      <td className="tabular">
                        <span className={`font-semibold ${vc.roi >= 0 ? 'text-success' : 'text-danger'}`}>
                          {vc.roi}%
                        </span>
                      </td>
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
