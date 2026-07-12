import { mockDelay, mockStore, USE_MOCK } from '../mocks/mockStore';
import apiClient from '../lib/apiClient';
import type { CargoVerification, CargoVerificationItem, VerificationStatus } from '../types';

// GET verifications for a specific trip
export async function getVerificationsByTrip(tripId: string): Promise<CargoVerification[]> {
  if (USE_MOCK) {
    await mockDelay(200);
    return mockStore.getVerificationsByTrip(tripId);
  }
  const res = await apiClient.get<CargoVerification[]>(`/verifications?tripId=${tripId}`);
  return res.data;
}

// GET verification for specific checkpoint
export async function getVerificationByCheckpoint(
  tripId: string,
  checkpointId: string
): Promise<CargoVerification | null> {
  if (USE_MOCK) {
    await mockDelay(150);
    return mockStore.getVerificationByCheckpoint(tripId, checkpointId) ?? null;
  }
  const res = await apiClient.get<CargoVerification | null>(
    `/verifications?tripId=${tripId}&checkpointId=${checkpointId}`
  );
  return res.data;
}

// GET verifications for a warehouse (CCO view)
export async function getVerificationsByWarehouse(warehouseId: string): Promise<CargoVerification[]> {
  if (USE_MOCK) {
    await mockDelay(200);
    return mockStore.getVerificationsByWarehouse(warehouseId);
  }
  const res = await apiClient.get<CargoVerification[]>(`/verifications?warehouseId=${warehouseId}`);
  return res.data;
}

// POST — CCO starts a new verification session
export async function createVerification(data: {
  tripId: string;
  checkpointId: string;
  warehouseId: string;
  verifiedBy: string;
  verifiedByName: string;
  items: CargoVerificationItem[];
}): Promise<CargoVerification> {
  if (USE_MOCK) {
    await mockDelay(300);
    const now = new Date().toISOString();

    // Prevent duplicate verification
    const existing = mockStore.getVerificationByCheckpoint(data.tripId, data.checkpointId);
    if (existing && (existing.status === 'approved' || existing.status === 'rejected')) {
      throw new Error('This checkpoint has already been verified.');
    }

    const verification: CargoVerification = {
      id: `vrf-${Date.now()}`,
      ...data,
      status: 'in_progress',
      createdAt: now,
    };
    mockStore.addVerification(verification);

    // Update checkpoint verificationStatus to in_progress
    const trip = mockStore.getTrip(data.tripId);
    if (trip) {
      const updatedCheckpoints = trip.checkpoints.map(cp =>
        cp.id === data.checkpointId
          ? { ...cp, verificationStatus: 'in_progress' as const, verificationId: verification.id }
          : cp
      );
      mockStore.updateTrip({ ...trip, checkpoints: updatedCheckpoints, updatedAt: now });
    }

    return verification;
  }
  const res = await apiClient.post<CargoVerification>('/verifications', data);
  return res.data;
}

// PATCH — CCO submits final verification decision
export async function submitVerification(
  verificationId: string,
  items: CargoVerificationItem[],
  decision: 'approved' | 'rejected',
  overallNotes?: string
): Promise<CargoVerification> {
  if (USE_MOCK) {
    await mockDelay(400);
    const verification = mockStore.getVerification(verificationId);
    if (!verification) throw new Error(`Verification ${verificationId} not found`);
    if (verification.status === 'approved' || verification.status === 'rejected') {
      throw new Error('This verification has already been submitted.');
    }

    const now = new Date().toISOString();
    const updated: CargoVerification = {
      ...verification,
      items,
      status: decision,
      overallNotes,
      verifiedAt: now,
    };
    mockStore.updateVerification(updated);

    // Update checkpoint verificationStatus on the trip
    const trip = mockStore.getTrip(verification.tripId);
    if (trip) {
      const newCpVerifStatus: 'approved' | 'rejected' = decision;
      const updatedCheckpoints = trip.checkpoints.map(cp =>
        cp.id === verification.checkpointId
          ? {
              ...cp,
              verificationStatus: newCpVerifStatus,
              status: decision === 'approved' ? ('completed' as const) : ('waiting' as const),
              actualDeparture: decision === 'approved' ? now : undefined,
            }
          : cp
      );

      // Advance trip status if all checkpoints approved
      const allApproved = updatedCheckpoints
        .filter(cp => cp.assignedCcoId)
        .every(cp => cp.verificationStatus === 'approved');

      const newTripStatus = allApproved
        ? 'out_for_delivery' as const
        : decision === 'rejected'
        ? 'waiting' as const
        : trip.status;

      mockStore.updateTrip({
        ...trip,
        checkpoints: updatedCheckpoints,
        status: newTripStatus,
        updatedAt: now,
      });
    }

    return updated;
  }
  const res = await apiClient.patch<CargoVerification>(`/verifications/${verificationId}/submit`, {
    items,
    decision,
    overallNotes,
  });
  return res.data;
}
