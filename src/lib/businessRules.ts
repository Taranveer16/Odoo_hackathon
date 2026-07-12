import type { Vehicle, Driver, Trip } from '../types';

// ─── Business Rules ───────────────────────────────────────────
// These rules are shared between UI validation and can be referenced
// for a future backend validator (Node/Express) to ensure consistency.
// Each function returns { valid: boolean; reason?: string }

export interface RuleResult {
  valid: boolean;
  reason?: string;
}

// ─── Vehicle Rules ────────────────────────────────────────────

/**
 * A vehicle is eligible for dispatch if its status is 'available'.
 */
export function isVehicleDispatchEligible(vehicle: Vehicle): RuleResult {
  if (vehicle.status === 'retired') {
    return { valid: false, reason: `${vehicle.name} is retired and cannot be dispatched.` };
  }
  if (vehicle.status === 'in_shop') {
    return { valid: false, reason: `${vehicle.name} is currently in the maintenance shop.` };
  }
  if (vehicle.status === 'on_trip') {
    return { valid: false, reason: `${vehicle.name} is already on an active trip.` };
  }
  return { valid: true };
}

/**
 * Cargo weight must not exceed the vehicle's maximum load capacity.
 */
export function isCargoWithinCapacity(
  vehicle: Vehicle,
  cargoWeightKg: number
): RuleResult {
  if (cargoWeightKg > vehicle.maxLoadCapacity) {
    const overage = (cargoWeightKg - vehicle.maxLoadCapacity).toLocaleString();
    return {
      valid: false,
      reason: `Cargo weight (${cargoWeightKg.toLocaleString()} kg) exceeds ${vehicle.name}'s max capacity (${vehicle.maxLoadCapacity.toLocaleString()} kg) by ${overage} kg.`,
    };
  }
  return { valid: true };
}

// ─── Driver Rules ─────────────────────────────────────────────

/**
 * A driver's license expiry date must not be in the past.
 */
export function isLicenseValid(driver: Driver): RuleResult {
  const expiry = new Date(driver.licenseExpiry);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (expiry < today) {
    return {
      valid: false,
      reason: `${driver.name}'s license expired on ${new Date(driver.licenseExpiry).toLocaleDateString()}.`,
    };
  }
  return { valid: true };
}

/**
 * Returns true if the license is expiring within N days.
 */
export function isLicenseExpiringSoon(
  driver: Driver,
  withinDays = 30
): boolean {
  const expiry = new Date(driver.licenseExpiry);
  const threshold = new Date(Date.now() + withinDays * 86400000);
  return expiry <= threshold && expiry >= new Date();
}

/**
 * A driver is eligible for dispatch if they are 'available',
 * not 'suspended', and have a valid (non-expired) license.
 */
export function isDriverDispatchEligible(driver: Driver): RuleResult {
  if (driver.status === 'suspended') {
    return { valid: false, reason: `${driver.name} is suspended.` };
  }
  if (driver.status === 'on_trip') {
    return { valid: false, reason: `${driver.name} is already on an active trip.` };
  }
  if (driver.status === 'off_duty') {
    return { valid: false, reason: `${driver.name} is currently off duty.` };
  }
  const licenseCheck = isLicenseValid(driver);
  if (!licenseCheck.valid) return licenseCheck;
  return { valid: true };
}

// ─── Trip Rules ───────────────────────────────────────────────

/**
 * Validates all business rules for creating/dispatching a trip.
 * Returns the first failing rule, or valid if all pass.
 */
export function validateTripDispatch(
  vehicle: Vehicle,
  driver: Driver,
  cargoWeightKg: number
): RuleResult {
  const vehicleCheck = isVehicleDispatchEligible(vehicle);
  if (!vehicleCheck.valid) return vehicleCheck;

  const driverCheck = isDriverDispatchEligible(driver);
  if (!driverCheck.valid) return driverCheck;

  const capacityCheck = isCargoWithinCapacity(vehicle, cargoWeightKg);
  if (!capacityCheck.valid) return capacityCheck;

  return { valid: true };
}

// ─── Maintenance Rules ────────────────────────────────────────

/**
 * Opening a maintenance record should set the vehicle to 'in_shop'
 * unless the vehicle is 'retired'.
 */
export function shouldSetVehicleInShop(vehicleStatus: Vehicle['status']): boolean {
  return vehicleStatus !== 'retired' && vehicleStatus !== 'in_shop';
}

/**
 * Closing a maintenance record restores vehicle to 'available'
 * unless it is 'retired'.
 */
export function getVehicleStatusAfterMaintenanceClose(
  vehicleStatus: Vehicle['status']
): Vehicle['status'] {
  if (vehicleStatus === 'retired') return 'retired';
  return 'available';
}

// ─── Registration Uniqueness ──────────────────────────────────

/**
 * Checks if a registration number is unique within the current vehicle list.
 * Pass excludeId when editing an existing vehicle.
 */
export function isRegistrationUnique(
  registrationNumber: string,
  vehicles: Vehicle[],
  excludeId?: string
): RuleResult {
  const conflict = vehicles.find(
    (v) =>
      v.registrationNumber.toLowerCase() === registrationNumber.toLowerCase() &&
      v.id !== excludeId
  );
  if (conflict) {
    return {
      valid: false,
      reason: `Registration number "${registrationNumber}" is already in use by ${conflict.name}.`,
    };
  }
  return { valid: true };
}
