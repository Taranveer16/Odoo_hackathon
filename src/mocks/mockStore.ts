import {
  MOCK_VEHICLES,
  MOCK_DRIVERS,
  MOCK_TRIPS,
  MOCK_MAINTENANCE,
  MOCK_FUEL_LOGS,
  MOCK_EXPENSES,
  MOCK_WAREHOUSES,
  MOCK_CCO_USERS,
  MOCK_CARGO_VERIFICATIONS,
} from './mockData';
import type {
  Vehicle,
  Driver,
  Trip,
  MaintenanceRecord,
  FuelLog,
  Expense,
  User,
  Warehouse,
  CargoVerification,
} from '../types';

// ─── USE_MOCK Flag ────────────────────────────────────────────
// Set VITE_USE_MOCK=false in .env to route all calls through the real API
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// ─── Artificial Latency (dev realism) ────────────────────────
export const mockDelay = (ms = 400) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ─── Mock Store (in-memory + localStorage persistence) ────────
const STORE_KEY = 'transit_mock_store';

interface MockStore {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceRecord[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  warehouses: Warehouse[];
  ccoUsers: User[];
  cargoVerifications: CargoVerification[];
  initialized: boolean;
}

function loadStore(): MockStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockStore;
      if (parsed.initialized) {
        // Ensure new collections exist for existing stores
        return {
          ...parsed,
          warehouses: parsed.warehouses ?? MOCK_WAREHOUSES,
          ccoUsers: parsed.ccoUsers ?? MOCK_CCO_USERS,
          cargoVerifications: parsed.cargoVerifications ?? MOCK_CARGO_VERIFICATIONS,
        };
      }
    }
  } catch {
    // ignore parse errors
  }
  // Seed with initial data on first load
  const initial: MockStore = {
    vehicles: MOCK_VEHICLES,
    drivers: MOCK_DRIVERS,
    trips: MOCK_TRIPS,
    maintenance: MOCK_MAINTENANCE,
    fuelLogs: MOCK_FUEL_LOGS,
    expenses: MOCK_EXPENSES,
    warehouses: MOCK_WAREHOUSES,
    ccoUsers: MOCK_CCO_USERS,
    cargoVerifications: MOCK_CARGO_VERIFICATIONS,
    initialized: true,
  };
  saveStore(initial);
  return initial;
}

function saveStore(store: MockStore): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // quota exceeded — skip persistence
  }
}

// In-memory store (source of truth during session)
let _store: MockStore = loadStore();

// ─── Store Accessors ──────────────────────────────────────────
export const mockStore = {
  // Vehicles
  getVehicles: () => [..._store.vehicles],
  getVehicle: (id: string) => _store.vehicles.find((v) => v.id === id),
  setVehicles: (vehicles: Vehicle[]) => {
    _store = { ..._store, vehicles };
    saveStore(_store);
  },
  addVehicle: (vehicle: Vehicle) => {
    _store = { ..._store, vehicles: [..._store.vehicles, vehicle] };
    saveStore(_store);
  },
  updateVehicle: (updated: Vehicle) => {
    _store = {
      ..._store,
      vehicles: _store.vehicles.map((v) => (v.id === updated.id ? updated : v)),
    };
    saveStore(_store);
  },

  // Drivers
  getDrivers: () => [..._store.drivers],
  getDriver: (id: string) => _store.drivers.find((d) => d.id === id),
  addDriver: (driver: Driver) => {
    _store = { ..._store, drivers: [..._store.drivers, driver] };
    saveStore(_store);
  },
  updateDriver: (updated: Driver) => {
    _store = {
      ..._store,
      drivers: _store.drivers.map((d) => (d.id === updated.id ? updated : d)),
    };
    saveStore(_store);
  },

  // Trips
  getTrips: () => [..._store.trips],
  getTrip: (id: string) => _store.trips.find((t) => t.id === id),
  addTrip: (trip: Trip) => {
    _store = { ..._store, trips: [..._store.trips, trip] };
    saveStore(_store);
  },
  updateTrip: (updated: Trip) => {
    _store = {
      ..._store,
      trips: _store.trips.map((t) => (t.id === updated.id ? updated : t)),
    };
    saveStore(_store);
  },

  // Maintenance
  getMaintenance: () => [..._store.maintenance],
  addMaintenance: (record: MaintenanceRecord) => {
    _store = { ..._store, maintenance: [..._store.maintenance, record] };
    saveStore(_store);
  },
  updateMaintenance: (updated: MaintenanceRecord) => {
    _store = {
      ..._store,
      maintenance: _store.maintenance.map((m) => (m.id === updated.id ? updated : m)),
    };
    saveStore(_store);
  },

  // Fuel Logs
  getFuelLogs: () => [..._store.fuelLogs],
  addFuelLog: (log: FuelLog) => {
    _store = { ..._store, fuelLogs: [..._store.fuelLogs, log] };
    saveStore(_store);
  },

  // Expenses
  getExpenses: () => [..._store.expenses],
  addExpense: (expense: Expense) => {
    _store = { ..._store, expenses: [..._store.expenses, expense] };
    saveStore(_store);
  },

  // Warehouses
  getWarehouses: () => [..._store.warehouses],
  getWarehouse: (id: string) => _store.warehouses.find((w) => w.id === id),
  addWarehouse: (warehouse: Warehouse) => {
    _store = { ..._store, warehouses: [..._store.warehouses, warehouse] };
    saveStore(_store);
  },

  // CCO Users
  getCCOUsers: () => [..._store.ccoUsers],
  getCCOUser: (id: string) => _store.ccoUsers.find((c) => c.id === id),
  getCCOsByWarehouse: (warehouseId: string) =>
    _store.ccoUsers.filter((c) => c.assignedWarehouseId === warehouseId),
  addCCOUser: (user: User) => {
    _store = { ..._store, ccoUsers: [..._store.ccoUsers, user] };
    saveStore(_store);
  },
  updateCCOUser: (updated: User) => {
    _store = {
      ..._store,
      ccoUsers: _store.ccoUsers.map((c) => (c.id === updated.id ? updated : c)),
    };
    saveStore(_store);
  },

  // Cargo Verifications
  getVerifications: () => [..._store.cargoVerifications],
  getVerification: (id: string) =>
    _store.cargoVerifications.find((v) => v.id === id),
  getVerificationByCheckpoint: (tripId: string, checkpointId: string) =>
    _store.cargoVerifications.find(
      (v) => v.tripId === tripId && v.checkpointId === checkpointId
    ),
  getVerificationsByTrip: (tripId: string) =>
    _store.cargoVerifications.filter((v) => v.tripId === tripId),
  getVerificationsByWarehouse: (warehouseId: string) =>
    _store.cargoVerifications.filter((v) => v.warehouseId === warehouseId),
  addVerification: (verification: CargoVerification) => {
    _store = {
      ..._store,
      cargoVerifications: [..._store.cargoVerifications, verification],
    };
    saveStore(_store);
  },
  updateVerification: (updated: CargoVerification) => {
    _store = {
      ..._store,
      cargoVerifications: _store.cargoVerifications.map((v) =>
        v.id === updated.id ? updated : v
      ),
    };
    saveStore(_store);
  },

  // Dev utility
  reset: () => {
    localStorage.removeItem(STORE_KEY);
    _store = loadStore();
  },
};
