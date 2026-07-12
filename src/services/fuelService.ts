import { v4 as uuidv4 } from 'uuid';
import { mockDelay, mockStore, USE_MOCK } from '../mocks/mockStore';
import apiClient from '../lib/apiClient';
import type { FuelLog, Expense } from '../types';

// GET /fuel-logs
export async function getFuelLogs(): Promise<FuelLog[]> {
  if (USE_MOCK) {
    await mockDelay(300);
    return mockStore.getFuelLogs();
  }
  const res = await apiClient.get<FuelLog[]>('/fuel-logs');
  return res.data;
}

// POST /fuel-logs
export async function createFuelLog(
  data: Omit<FuelLog, 'id' | 'createdAt' | 'updatedAt'>
): Promise<FuelLog> {
  if (USE_MOCK) {
    await mockDelay(400);
    const log: FuelLog = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStore.addFuelLog(log);
    return log;
  }
  const res = await apiClient.post<FuelLog>('/fuel-logs', data);
  return res.data;
}

// GET /expenses
export async function getExpenses(): Promise<Expense[]> {
  if (USE_MOCK) {
    await mockDelay(300);
    return mockStore.getExpenses();
  }
  const res = await apiClient.get<Expense[]>('/expenses');
  return res.data;
}

// POST /expenses
export async function createExpense(
  data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Expense> {
  if (USE_MOCK) {
    await mockDelay(400);
    const expense: Expense = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStore.addExpense(expense);
    return expense;
  }
  const res = await apiClient.post<Expense>('/expenses', data);
  return res.data;
}
