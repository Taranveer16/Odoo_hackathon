import { v4 as uuidv4 } from 'uuid';
import { mockDelay, mockStore, USE_MOCK } from '../mocks/mockStore';
import apiClient from '../lib/apiClient';
import type { Trip } from '../types';

// GET /trips
export async function getTrips(): Promise<Trip[]> {
  if (USE_MOCK) {
    await mockDelay(350);
    return mockStore.getTrips();
  }
  const res = await apiClient.get<Trip[]>('/trips');
  return res.data;
}

// POST /trips
export async function createTrip(
  data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<Trip> {
  if (USE_MOCK) {
    await mockDelay(400);
    const trip: Trip = {
      ...data,
      id: uuidv4(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStore.addTrip(trip);
    return trip;
  }
  const res = await apiClient.post<Trip>('/trips', data);
  return res.data;
}

// PATCH /trips/:id/dispatch
export async function dispatchTrip(id: string): Promise<Trip> {
  if (USE_MOCK) {
    await mockDelay(500);
    const trip = mockStore.getTrip(id);
    if (!trip) throw new Error(`Trip ${id} not found`);
    const updated: Trip = {
      ...trip,
      status: 'dispatched',
      dispatchedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStore.updateTrip(updated);

    // Side-effect: update vehicle + driver status
    const vehicle = mockStore.getVehicle(trip.vehicleId);
    if (vehicle) mockStore.updateVehicle({ ...vehicle, status: 'on_trip', updatedAt: new Date().toISOString() });
    const driver = mockStore.getDriver(trip.driverId);
    if (driver) mockStore.updateDriver({ ...driver, status: 'on_trip', updatedAt: new Date().toISOString() });

    return updated;
  }
  const res = await apiClient.patch<Trip>(`/trips/${id}/dispatch`);
  return res.data;
}

// PATCH /trips/:id/complete
export async function completeTrip(
  id: string,
  data: { finalOdometer: number; fuelConsumed: number; actualDistance?: number }
): Promise<Trip> {
  if (USE_MOCK) {
    await mockDelay(500);
    const trip = mockStore.getTrip(id);
    if (!trip) throw new Error(`Trip ${id} not found`);
    const updated: Trip = {
      ...trip,
      ...data,
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStore.updateTrip(updated);

    // Side-effect: restore vehicle + driver to available
    const vehicle = mockStore.getVehicle(trip.vehicleId);
    if (vehicle) {
      mockStore.updateVehicle({
        ...vehicle,
        status: 'available',
        odometer: data.finalOdometer,
        updatedAt: new Date().toISOString(),
      });
    }
    const driver = mockStore.getDriver(trip.driverId);
    if (driver) mockStore.updateDriver({ ...driver, status: 'available', updatedAt: new Date().toISOString() });

    return updated;
  }
  const res = await apiClient.patch<Trip>(`/trips/${id}/complete`, data);
  return res.data;
}

// PATCH /trips/:id/cancel
export async function cancelTrip(id: string, reason?: string): Promise<Trip> {
  if (USE_MOCK) {
    await mockDelay(400);
    const trip = mockStore.getTrip(id);
    if (!trip) throw new Error(`Trip ${id} not found`);
    const updated: Trip = {
      ...trip,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      notes: reason || trip.notes,
      updatedAt: new Date().toISOString(),
    };
    mockStore.updateTrip(updated);

    // Side-effect: only restore if was dispatched
    if (trip.status === 'dispatched') {
      const vehicle = mockStore.getVehicle(trip.vehicleId);
      if (vehicle) mockStore.updateVehicle({ ...vehicle, status: 'available', updatedAt: new Date().toISOString() });
      const driver = mockStore.getDriver(trip.driverId);
      if (driver) mockStore.updateDriver({ ...driver, status: 'available', updatedAt: new Date().toISOString() });
    }

    return updated;
  }
  const res = await apiClient.patch<Trip>(`/trips/${id}/cancel`, { reason });
  return res.data;
}
