import { v4 as uuidv4 } from 'uuid';
import { mockDelay, mockStore, USE_MOCK } from '../mocks/mockStore';
import apiClient from '../lib/apiClient';
import type { MaintenanceRecord } from '../types';

// GET /maintenance
export async function getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
  if (USE_MOCK) {
    await mockDelay(350);
    return mockStore.getMaintenance();
  }
  const res = await apiClient.get<MaintenanceRecord[]>('/maintenance');
  return res.data;
}

// POST /maintenance
export async function createMaintenanceRecord(
  data: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MaintenanceRecord> {
  if (USE_MOCK) {
    await mockDelay(400);
    const record: MaintenanceRecord = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStore.addMaintenance(record);

    // Side-effect: set vehicle to in_shop if status is 'open'
    if (data.status === 'open') {
      const vehicle = mockStore.getVehicle(data.vehicleId);
      if (vehicle && vehicle.status !== 'retired') {
        mockStore.updateVehicle({ ...vehicle, status: 'in_shop', updatedAt: new Date().toISOString() });
      }
    }

    return record;
  }
  const res = await apiClient.post<MaintenanceRecord>('/maintenance', data);
  return res.data;
}

// PATCH /maintenance/:id
export async function updateMaintenanceRecord(
  id: string,
  data: Partial<Omit<MaintenanceRecord, 'id' | 'createdAt'>>
): Promise<MaintenanceRecord> {
  if (USE_MOCK) {
    await mockDelay(400);
    const existing = mockStore.getMaintenance().find((m) => m.id === id);
    if (!existing) throw new Error(`Maintenance record ${id} not found`);
    const updated: MaintenanceRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    mockStore.updateMaintenance(updated);

    // Side-effect: if closing record, restore vehicle to available (unless retired)
    if (data.status === 'completed' && existing.status === 'open') {
      const vehicle = mockStore.getVehicle(existing.vehicleId);
      if (vehicle && vehicle.status !== 'retired') {
        mockStore.updateVehicle({ ...vehicle, status: 'available', updatedAt: new Date().toISOString() });
      }
    }

    return updated;
  }
  const res = await apiClient.patch<MaintenanceRecord>(`/maintenance/${id}`, data);
  return res.data;
}
