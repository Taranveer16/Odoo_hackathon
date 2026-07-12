import { v4 as uuidv4 } from 'uuid';
import { mockDelay, mockStore, USE_MOCK } from '../mocks/mockStore';
import apiClient from '../lib/apiClient';
import type { Vehicle } from '../types';

// GET /vehicles
export async function getVehicles(): Promise<Vehicle[]> {
  if (USE_MOCK) {
    await mockDelay(350);
    return mockStore.getVehicles();
  }
  const res = await apiClient.get<Vehicle[]>('/vehicles');
  return res.data;
}

// GET /vehicles/:id
export async function getVehicle(id: string): Promise<Vehicle> {
  if (USE_MOCK) {
    await mockDelay(200);
    const v = mockStore.getVehicle(id);
    if (!v) throw new Error(`Vehicle ${id} not found`);
    return v;
  }
  const res = await apiClient.get<Vehicle>(`/vehicles/${id}`);
  return res.data;
}

// POST /vehicles
export async function createVehicle(
  data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Vehicle> {
  if (USE_MOCK) {
    await mockDelay(400);
    const vehicle: Vehicle = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStore.addVehicle(vehicle);
    return vehicle;
  }
  const res = await apiClient.post<Vehicle>('/vehicles', data);
  return res.data;
}

// PUT /vehicles/:id
export async function updateVehicle(
  id: string,
  data: Partial<Omit<Vehicle, 'id' | 'createdAt'>>
): Promise<Vehicle> {
  if (USE_MOCK) {
    await mockDelay(400);
    const existing = mockStore.getVehicle(id);
    if (!existing) throw new Error(`Vehicle ${id} not found`);
    const updated: Vehicle = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    mockStore.updateVehicle(updated);
    return updated;
  }
  const res = await apiClient.put<Vehicle>(`/vehicles/${id}`, data);
  return res.data;
}

// PATCH /vehicles/:id/status (convenience)
export async function updateVehicleStatus(
  id: string,
  status: Vehicle['status']
): Promise<Vehicle> {
  return updateVehicle(id, { status });
}
