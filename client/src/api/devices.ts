import { apiRequest } from './client';
import type { Device, DeviceUser, UserDeviceRelation } from '../types/api';

export const devicesApi = {
  getDevices: () => apiRequest<Device[]>('/devices'),

  createDevice: (payload: { name: string }, token: string) =>
    apiRequest<Device>('/devices', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    }),

  updateDevice: (deviceId: string, payload: Partial<Pick<Device, 'name' | 'activeUserRelation'>>, token: string) =>
    apiRequest<Device>(`/devices/${deviceId}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(payload),
    }),

  deleteDevice: (deviceId: string, token: string) =>
    apiRequest<void>(`/devices/${deviceId}`, {
      method: 'DELETE',
      token,
    }),

  listDeviceUsers: (deviceId: string, token: string) =>
    apiRequest<DeviceUser[]>(`/devices/${deviceId}/listUsers`, { token }),

  getDeviceRelations: (deviceId: string, token: string) =>
    apiRequest<UserDeviceRelation[]>(`/user-device-relations/device/${deviceId}`, { token }),

  claimDevice: (payload: { name: string; deviceId: string }, token: string) =>
    apiRequest<UserDeviceRelation>('/user-device-relations/claim-device', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    }),

  addUserToDevice: (payload: { userId: string; deviceId: string }, token: string) =>
    apiRequest<UserDeviceRelation>('/user-device-relations/add-user-to-device', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    }),

  leaveDevice: (deviceId: string, token: string) =>
    apiRequest<void>('/user-device-relations/leave-device', {
      method: 'POST',
      token,
      body: JSON.stringify({ deviceId }),
    }),

  setActiveUser: (payload: { userId: string; deviceId: string }, token: string) =>
    apiRequest<Device>('/user-device-relations/set-active-user', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    }),

  setActiveConfiguration: (
    payload: { userDeviceRelationId: string; configurationId: string },
    token: string,
  ) =>
    apiRequest<UserDeviceRelation>('/user-device-relations/set-active-configuration', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    }),
};
