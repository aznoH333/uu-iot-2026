import { apiRequest } from './client';
import type { LoginResponse, User } from '../types/api';

export interface LoginPayload {
  loginName: string;
  loginPassword: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  loginName: string;
  loginPassword: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiRequest<LoginResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  register: (payload: RegisterPayload) =>
    apiRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
