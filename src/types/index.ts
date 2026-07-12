// ============================================================
// TransitOps — Data Type Definitions
// Extended with full checkpoint/route lifecycle support
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
  registrationNumber: string;
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
  licenseExpiry: string;
  contactNumber: string;
  email?: string;
  safetyScore: number; // 0–100
  status: DriverStatus;
  branch?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Trip & Checkpoints ──────────────────────────────────────
export type CheckpointStatus =
  | 'pending'
  | 'en_route'
  | 'arrived'
  | 'loading'
  | 'unloading'
  | 'waiting'
  | 'delayed'
  | 'departed'
  | 'completed';

export interface Checkpoint {
  id: string;
  label: string;          // e.g. "Checkpoint 1 (Nashik)"
  location: string;
  expectedArrival?: string;
  actualArrival?: string;
  expectedDeparture?: string;
  actualDeparture?: string;
  status: CheckpointStatus;
  notes?: string;
  delayMinutes?: number;
}

export type TripLifecycleStatus =
  | 'draft'
  | 'assigned'
  | 'ready_for_dispatch'
  | 'dispatched'
  | 'departed'
  | 'en_route'
  | 'at_checkpoint'
  | 'loading'
  | 'unloading'
  | 'in_transit'
  | 'waiting'
  | 'delayed'
  | 'out_for_delivery'
  | 'delivered'
  | 'trip_closed'
  | 'cancelled';

// Keep backward compat alias
export type TripStatus = TripLifecycleStatus;

export type TripPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Trip {
  id: string;
  tripName?: string;
  vehicleId: string;
  driverId: string;
  source: string;
  destination: string;
  checkpoints: Checkpoint[];       // Multi-stop route
  cargoType?: string;
  cargoWeight: number;
  clientName?: string;
  plannedDistance: number;
  actualDistance?: number;
  fuelConsumed?: number;
  finalOdometer?: number;
  status: TripLifecycleStatus;
  priority: TripPriority;
  progressPercent?: number;        // 0–100
  currentLocation?: string;
  currentSpeed?: number;           // km/h
  eta?: string;                    // ISO datetime
  dispatchedAt?: string;
  departedAt?: string;
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
  date: string;
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
  fleetUtilization: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalOperationalCost: number;
  avgFuelEfficiency: number;
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
  roi: number;
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
