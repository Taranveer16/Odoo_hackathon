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
  data: Partial<Trip>
): Promise<Trip> {
  if (USE_MOCK) {
    await mockDelay(400);
    const trip: Trip = {
      checkpoints: [],
      priority: 'normal',
      cargoWeight: 0,
      plannedDistance: 0,
      ...data,
      id: `TRP-${String(Date.now()).slice(-4)}`,
      status: 'draft',
      progressPercent: 0,
      source: data.source ?? '',
      destination: data.destination ?? '',
      vehicleId: data.vehicleId ?? '',
      driverId: data.driverId ?? '',
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
      progressPercent: 5,
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

// PATCH /trips/:id/complete (mark as delivered)
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
      status: 'delivered',
      progressPercent: 100,
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
        odometer: data.finalOdometer || vehicle.odometer,
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

    // Side-effect: restore if was dispatched / in transit
    const activeStatuses = ['dispatched', 'departed', 'en_route', 'in_transit', 'at_checkpoint'];
    if (activeStatuses.includes(trip.status)) {
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

// PATCH /trips/:id/checkpoint/:cpId — mark next checkpoint as arrived/departed
export async function markCheckpoint(tripId: string, checkpointId: string): Promise<Trip> {
  if (USE_MOCK) {
    await mockDelay(300);
    const trip = mockStore.getTrip(tripId);
    if (!trip) throw new Error(`Trip ${tripId} not found`);

    const now = new Date().toISOString();
    const cpIndex = trip.checkpoints.findIndex(c => c.id === checkpointId);
    if (cpIndex === -1) throw new Error(`Checkpoint ${checkpointId} not found`);

    const cp = trip.checkpoints[cpIndex];
    // Advance checkpoint status: pending → arrived → departed/completed
    let newCpStatus: import('../types').CheckpointStatus = cp.status;
    let actualArrival = cp.actualArrival;
    let actualDeparture = cp.actualDeparture;

    if (cp.status === 'pending' || cp.status === 'en_route') {
      newCpStatus = 'arrived';
      actualArrival = now;
    } else if (cp.status === 'arrived' || cp.status === 'loading' || cp.status === 'unloading' || cp.status === 'waiting') {
      newCpStatus = 'completed';
      actualDeparture = now;
    }

    const updatedCheckpoints = trip.checkpoints.map((c, i) =>
      i === cpIndex ? { ...c, status: newCpStatus, actualArrival, actualDeparture } : c
    );

    // Compute new overall progress
    const completedCount = updatedCheckpoints.filter(c => c.status === 'completed' || c.status === 'departed').length;
    const totalStops = updatedCheckpoints.length + 2; // +2 for origin and destination
    const progressPercent = Math.round(((completedCount + 1) / totalStops) * 100);

    // If all checkpoints completed, advance trip to out_for_delivery
    const allDone = updatedCheckpoints.every(c => c.status === 'completed' || c.status === 'departed');
    const newStatus: import('../types').TripLifecycleStatus = allDone
      ? 'out_for_delivery'
      : trip.status === 'dispatched' || trip.status === 'departed'
      ? 'in_transit'
      : trip.status;

    const updated: Trip = {
      ...trip,
      checkpoints: updatedCheckpoints,
      status: newStatus,
      progressPercent: Math.min(progressPercent, 95),
      updatedAt: now,
    };
    mockStore.updateTrip(updated);
    return updated;
  }
  const res = await apiClient.patch<Trip>(`/trips/${tripId}/checkpoint/${checkpointId}`);
  return res.data;
}
