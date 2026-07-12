import { mockDelay, mockStore, USE_MOCK } from '../mocks/mockStore';
import apiClient from '../lib/apiClient';
import type { AnalyticsSummary, MonthlyFuelData, VehicleCostData } from '../types';

// GET /analytics/summary
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  if (USE_MOCK) {
    await mockDelay(400);
    const vehicles = mockStore.getVehicles();
    const trips = mockStore.getTrips();
    const drivers = mockStore.getDrivers();
    const fuelLogs = mockStore.getFuelLogs();
    const maintenance = mockStore.getMaintenance();
    const expenses = mockStore.getExpenses();

    const activeVehicles = vehicles.filter(
      (v) => v.status === 'available' || v.status === 'on_trip'
    ).length;
    const availableVehicles = vehicles.filter((v) => v.status === 'available').length;
    const vehiclesInMaintenance = vehicles.filter((v) => v.status === 'in_shop').length;
    const retiredVehicles = vehicles.filter((v) => v.status === 'retired').length;

    const activeTrips = trips.filter((t) => t.status === 'dispatched').length;
    const pendingTrips = trips.filter((t) => t.status === 'draft').length;
    const completedTrips = trips.filter((t) => t.status === 'completed').length;

    const driversOnDuty = drivers.filter((d) => d.status === 'on_trip').length;

    const nonRetiredVehicles = vehicles.filter((v) => v.status !== 'retired').length;
    const fleetUtilization =
      nonRetiredVehicles > 0
        ? Math.round((vehicles.filter((v) => v.status === 'on_trip').length / nonRetiredVehicles) * 100)
        : 0;

    const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.totalCost, 0);
    const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + m.cost, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalExpenses;

    const totalDistance = trips
      .filter((t) => t.actualDistance)
      .reduce((sum, t) => sum + (t.actualDistance || 0), 0);
    const totalFuelConsumed = trips
      .filter((t) => t.fuelConsumed)
      .reduce((sum, t) => sum + (t.fuelConsumed || 0), 0);
    const avgFuelEfficiency = totalFuelConsumed > 0
      ? Math.round((totalDistance / totalFuelConsumed) * 10) / 10
      : 0;

    return {
      totalVehicles: vehicles.length,
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenance,
      retiredVehicles,
      activeTrips,
      pendingTrips,
      completedTrips,
      driversOnDuty,
      fleetUtilization,
      totalFuelCost,
      totalMaintenanceCost,
      totalOperationalCost,
      avgFuelEfficiency,
    };
  }
  const res = await apiClient.get<AnalyticsSummary>('/analytics/summary');
  return res.data;
}

// Monthly fuel data (last 6 months)
export async function getMonthlyFuelData(): Promise<MonthlyFuelData[]> {
  if (USE_MOCK) {
    await mockDelay(300);
    const fuelLogs = mockStore.getFuelLogs();
    const monthMap = new Map<string, { liters: number; cost: number }>();

    fuelLogs.forEach((log) => {
      const date = new Date(log.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap.get(key) || { liters: 0, cost: 0 };
      monthMap.set(key, {
        liters: existing.liters + log.liters,
        cost: existing.cost + log.totalCost,
      });
    });

    // Ensure last 6 months are present
    const result: MonthlyFuelData[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const month = date.toLocaleString('default', { month: 'short' });
      const data = monthMap.get(key) || { liters: 0, cost: 0 };
      // Add some variance for demo appeal
      result.push({
        month,
        liters: Math.round(data.liters + Math.random() * 100 + 50),
        cost: Math.round(data.cost + Math.random() * 150 + 75),
      });
    }
    return result;
  }
  const res = await apiClient.get<MonthlyFuelData[]>('/analytics/fuel-monthly');
  return res.data;
}

// Vehicle cost data for analytics
export async function getVehicleCostData(): Promise<VehicleCostData[]> {
  if (USE_MOCK) {
    await mockDelay(350);
    const vehicles = mockStore.getVehicles();
    const fuelLogs = mockStore.getFuelLogs();
    const maintenance = mockStore.getMaintenance();

    return vehicles
      .filter((v) => v.status !== 'retired')
      .map((vehicle) => {
        const fuelCost = fuelLogs
          .filter((f) => f.vehicleId === vehicle.id)
          .reduce((sum, f) => sum + f.totalCost, 0);
        const maintenanceCost = maintenance
          .filter((m) => m.vehicleId === vehicle.id)
          .reduce((sum, m) => sum + m.cost, 0);
        const totalCost = fuelCost + maintenanceCost;
        // Simplified ROI: assume revenue = planned distance * $2/km
        const completedTripsForVehicle = mockStore.getTrips().filter(
          (t) => t.vehicleId === vehicle.id && t.status === 'completed'
        );
        const revenue = completedTripsForVehicle.reduce(
          (sum, t) => sum + (t.actualDistance || t.plannedDistance) * 2,
          0
        );
        const roi = vehicle.acquisitionCost > 0
          ? Math.round(((revenue - totalCost) / vehicle.acquisitionCost) * 100 * 10) / 10
          : 0;
        return {
          vehicleId: vehicle.id,
          registrationNumber: vehicle.registrationNumber,
          name: vehicle.name,
          fuelCost: Math.round(fuelCost),
          maintenanceCost: Math.round(maintenanceCost),
          totalCost: Math.round(totalCost),
          acquisitionCost: vehicle.acquisitionCost,
          roi,
        };
      })
      .sort((a, b) => b.totalCost - a.totalCost);
  }
  const res = await apiClient.get<VehicleCostData[]>('/analytics/vehicle-costs');
  return res.data;
}
