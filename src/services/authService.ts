import { v4 as uuidv4 } from 'uuid';
import { mockDelay, mockStore, USE_MOCK } from '../mocks/mockStore';
import { MOCK_USERS } from '../mocks/mockData';
import apiClient from '../lib/apiClient';
import type { AuthResponse, User } from '../types';

// POST /auth/login
export async function login(email: string, password: string): Promise<AuthResponse> {
  if (USE_MOCK) {
    await mockDelay(600);
    const user = MOCK_USERS.find((u) => u.email === email);
    if (!user || password.length < 3) {
      throw new Error('Invalid email or password');
    }
    const token = `mock-jwt-${user.id}-${Date.now()}`;
    return { token, user };
  }
  const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  return res.data;
}

// GET /auth/me
export async function getMe(): Promise<User> {
  if (USE_MOCK) {
    await mockDelay(200);
    const token = localStorage.getItem('transit_token');
    const userId = token?.split('-')[2];
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    return user;
  }
  const res = await apiClient.get<User>('/auth/me');
  return res.data;
}
