import { mockDelay, mockStore, USE_MOCK } from '../mocks/mockStore';
import apiClient from '../lib/apiClient';
import type { Warehouse } from '../types';

export async function getWarehouses(): Promise<Warehouse[]> {
  if (USE_MOCK) {
    await mockDelay(200);
    return mockStore.getWarehouses();
  }
  const res = await apiClient.get<Warehouse[]>('/warehouses');
  return res.data;
}

export async function getWarehouse(id: string): Promise<Warehouse> {
  if (USE_MOCK) {
    await mockDelay(150);
    const wh = mockStore.getWarehouse(id);
    if (!wh) throw new Error(`Warehouse ${id} not found`);
    return wh;
  }
  const res = await apiClient.get<Warehouse>(`/warehouses/${id}`);
  return res.data;
}

export async function createWarehouse(data: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>): Promise<Warehouse> {
  if (USE_MOCK) {
    await mockDelay(300);
    const now = new Date().toISOString();
    const wh: Warehouse = {
      ...data,
      id: `wh-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    mockStore.addWarehouse(wh);
    return wh;
  }
  const res = await apiClient.post<Warehouse>('/warehouses', data);
  return res.data;
}
