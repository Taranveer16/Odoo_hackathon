import { mockDelay, mockStore, USE_MOCK } from '../mocks/mockStore';
import { MOCK_USERS } from '../mocks/mockData';
import apiClient from '../lib/apiClient';
import type { AuthResponse, User, Role } from '../types';

// POST /auth/login
export async function login(email: string, password: string): Promise<AuthResponse> {
  if (USE_MOCK) {
    await mockDelay(600);
    // Search in both regular users AND CCO users
    const user =
      MOCK_USERS.find((u) => u.email === email) ??
      mockStore.getCCOUsers().find((u) => u.email === email);

    if (!user || password.length < 3) {
      throw new Error('Invalid email or password');
    }
    const token = `mock-jwt-${user.id}-${Date.now()}`;
    return { token, access_token: token, user };
  }
  const res = await apiClient.post<any>('/auth/login', { email, password });
  return {
    token: res.data.access_token,
    access_token: res.data.access_token,
    user: res.data.user,
  };
}

// POST /auth/signup
export async function signup(name: string, email: string, password: string, role: Role): Promise<AuthResponse> {
  if (USE_MOCK) {
    await mockDelay(600);
    const newUser: User = {
      id: `u-${Date.now()}`,
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const token = `mock-jwt-${newUser.id}-${Date.now()}`;
    return { token, access_token: token, user: newUser };
  }
  const res = await apiClient.post<any>('/auth/signup', { name, email, password, role });
  return {
    token: res.data.access_token,
    access_token: res.data.access_token,
    user: res.data.user,
  };
}

// GET /auth/me
export async function getMe(): Promise<User> {
  if (USE_MOCK) {
    await mockDelay(200);
    const token = localStorage.getItem('transit_token');
    const userId = token?.split('-')[2];
    // Check regular users first, then CCO users
    const user =
      MOCK_USERS.find((u) => u.id === userId) ??
      mockStore.getCCOUsers().find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    return user;
  }
  const res = await apiClient.get<User>('/auth/me');
  return res.data;
}

