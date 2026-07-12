import { v4 as uuidv4 } from 'uuid';
import { mockDelay, mockStore, USE_MOCK } from '../mocks/mockStore';
import apiClient from '../lib/apiClient';
import type { Driver } from '../types';

// GET /drivers
export async function getDrivers(): Promise<Driver[]> {
  if (USE_MOCK) {
    await mockDelay(350);
    return mockStore.getDrivers();
  }
  const res = await apiClient.get<Driver[]>('/drivers');
  return res.data;
}

// GET /drivers/:id
export async function getDriver(id: string): Promise<Driver> {
  if (USE_MOCK) {
    await mockDelay(200);
    const d = mockStore.getDriver(id);
    if (!d) throw new Error(`Driver ${id} not found`);
    return d;
  }
  const res = await apiClient.get<Driver>(`/drivers/${id}`);
  return res.data;
}

// POST /drivers
export async function createDriver(
  data: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Driver> {
  if (USE_MOCK) {
    await mockDelay(400);
    const driver: Driver = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStore.addDriver(driver);
    return driver;
  }
  const res = await apiClient.post<Driver>('/drivers', data);
  return res.data;
}

// PUT /drivers/:id
export async function updateDriver(
  id: string,
  data: Partial<Omit<Driver, 'id' | 'createdAt'>>
): Promise<Driver> {
  if (USE_MOCK) {
    await mockDelay(400);
    const existing = mockStore.getDriver(id);
    if (!existing) throw new Error(`Driver ${id} not found`);
    const updated: Driver = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    mockStore.updateDriver(updated);
    return updated;
  }
  const res = await apiClient.put<Driver>(`/drivers/${id}`, data);
  return res.data;
}

export async function updateDriverStatus(
  id: string,
  status: Driver['status']
): Promise<Driver> {
  return updateDriver(id, { status });
}
