// ============================================================
// TransitOps — Data Type Definitions
// These interfaces map 1:1 to PostgreSQL table columns.
// All entities include id (UUID), createdAt, updatedAt.
// Foreign keys use IDs (not nested objects) for API compatibility.
// ============================================================

export type Role =
  | 'fleet_manager'
  | 'dispatcher'
  | 'safety_officer'
  | 'financial_analyst';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  branch?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Vehicle ─────────────────────────────────────────────────
export type VehicleType =
  | 'truck'
  | 'van'
  | 'bus'
  | 'pickup'
  | 'motorcycle'
  | 'other';

export type VehicleStatus =
  | 'available'
  | 'on_trip'
  | 'in_shop'
  | 'retired';

export interface Vehicle {
  id: string;
  registrationNumber: string; // unique
  name: string;
  model: string;
  type: VehicleType;
  maxLoadCapacity: number; // kg
  odometer: number; // km
  acquisitionCost: number; // USD
  status: VehicleStatus;
  year?: number;
  fuelType?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Driver ──────────────────────────────────────────────────
export type LicenseCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type DriverStatus =
  | 'available'
  | 'on_trip'
  | 'off_duty'
  | 'suspended';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: LicenseCategory;
  licenseExpiry: string; // ISO date string
  contactNumber: string;
  email?: string;
  safetyScore: number; // 0–100
  status: DriverStatus;
  branch?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Trip ────────────────────────────────────────────────────
export type TripStatus =
  | 'draft'
  | 'dispatched'
  | 'completed'
  | 'cancelled';

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  source: string;
  destination: string;
  cargoWeight: number; // kg
  plannedDistance: number; // km
  actualDistance?: number; // km
  fuelConsumed?: number; // liters
  finalOdometer?: number; // km
  status: TripStatus;
  dispatchedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Maintenance ─────────────────────────────────────────────
export type MaintenanceStatus = 'open' | 'completed';

export type ServiceType =
  | 'oil_change'
  | 'tire_replacement'
  | 'brake_service'
  | 'engine_repair'
  | 'transmission'
  | 'electrical'
  | 'body_work'
  | 'inspection'
  | 'other';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceType: ServiceType;
  description?: string;
  cost: number;
  date: string; // ISO date
  status: MaintenanceStatus;
  technician?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Fuel Log ────────────────────────────────────────────────
export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  date: string;
  odometer?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Expense ─────────────────────────────────────────────────
export type ExpenseType = 'toll' | 'parking' | 'repair' | 'insurance' | 'misc';

export interface Expense {
  id: string;
  vehicleId: string;
  tripId?: string;
  type: ExpenseType;
  amount: number;
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Analytics ───────────────────────────────────────────────
export interface AnalyticsSummary {
  totalVehicles: number;
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  retiredVehicles: number;
  activeTrips: number;
  pendingTrips: number;
  completedTrips: number;
  driversOnDuty: number;
  fleetUtilization: number; // percentage
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalOperationalCost: number;
  avgFuelEfficiency: number; // km/liter
}

export interface MonthlyFuelData {
  month: string;
  liters: number;
  cost: number;
}

export interface VehicleCostData {
  vehicleId: string;
  registrationNumber: string;
  name: string;
  fuelCost: number;
  maintenanceCost: number;
  totalCost: number;
  acquisitionCost: number;
  roi: number; // percentage
}

// ─── API Responses ───────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
