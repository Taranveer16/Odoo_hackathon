import { api } from './api';
import type { Role } from '../types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  } catch (err: any) {
    throw new Error(err.response?.data?.detail || 'Login failed. Please try again.');
  }
}

export async function signup(
  name: string,
  email: string,
  password: string,
  role: Role
): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/auth/signup', { name, email, password, role });
    return data;
  } catch (err: any) {
    throw new Error(err.response?.data?.detail || 'Signup failed. Please try again.');
  }
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me');
  return data;
}