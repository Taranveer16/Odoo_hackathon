import { mockDelay, mockStore, USE_MOCK } from '../mocks/mockStore';
import apiClient from '../lib/apiClient';
import type { User } from '../types';

// GET all CCO users
export async function getCCOs(): Promise<User[]> {
  if (USE_MOCK) {
    await mockDelay(200);
    return mockStore.getCCOUsers();
  }
  const res = await apiClient.get<User[]>('/ccos');
  return res.data;
}

// GET CCOs assigned to a specific warehouse
export async function getCCOsByWarehouse(warehouseId: string): Promise<User[]> {
  if (USE_MOCK) {
    await mockDelay(150);
    return mockStore.getCCOsByWarehouse(warehouseId);
  }
  const res = await apiClient.get<User[]>(`/ccos?warehouseId=${warehouseId}`);
  return res.data;
}

// POST — dispatcher creates a new CCO inline
export async function createCCO(data: {
  name: string;
  email: string;
  phone?: string;
  assignedWarehouseId: string;
}): Promise<User> {
  if (USE_MOCK) {
    await mockDelay(400);
    const now = new Date().toISOString();
    // Check if email already exists
    const existing = mockStore.getCCOUsers().find(c => c.email === data.email);
    if (existing) throw new Error(`A CCO with email ${data.email} already exists.`);

    const cco: User = {
      id: `cco-${Date.now()}`,
      email: data.email,
      name: data.name,
      role: 'cargo_control_officer',
      phone: data.phone,
      assignedWarehouseId: data.assignedWarehouseId,
      branch: mockStore.getWarehouse(data.assignedWarehouseId)?.location ?? '',
      createdAt: now,
      updatedAt: now,
    };
    mockStore.addCCOUser(cco);
    return cco;
  }
  const res = await apiClient.post<User>('/ccos', data);
  return res.data;
}
