import { useCallback, useEffect, useMemo, useState } from 'react';
import { devicesApi } from '../api/devices';
import { useAuth } from '../auth/AuthContext';
import type { Device, DeviceWithDetails } from '../types/api';

export function useDevices() {
  const { token } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceWithDetails | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isDetailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBaseDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId) ?? null,
    [devices, selectedDeviceId],
  );

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await devicesApi.getDevices();
      if (!token) {
        setDevices([]);
        setSelectedDeviceId(null);
        return;
      }

      const relationResults = await Promise.allSettled(
        response.map(async (device) => ({
          device,
          relations: await devicesApi.getDeviceRelations(device.id, token),
        })),
      );

      const visibleDevices = relationResults
        .filter((result): result is PromiseFulfilledResult<{ device: Device; relations: { id: string }[] }> => result.status === 'fulfilled')
        .filter((result) => result.value.relations.length > 0)
        .map((result) => ({
          ...result.value.device,
          userCount: result.value.relations.length,
        }));

      setDevices(visibleDevices);
      setSelectedDeviceId((current) => visibleDevices.some((device) => device.id === current) ? current : (visibleDevices[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadSelectedDeviceDetails = useCallback(async () => {
    if (!token || !selectedBaseDevice) {
      setSelectedDevice(selectedBaseDevice ? { ...selectedBaseDevice, users: [], relations: [] } : null);
      return;
    }

    setDetailLoading(true);
    setError(null);

    try {
      const [users, relations] = await Promise.all([
        devicesApi.listDeviceUsers(selectedBaseDevice.id, token),
        devicesApi.getDeviceRelations(selectedBaseDevice.id, token),
      ]);
      setSelectedDevice({ ...selectedBaseDevice, users, relations });
    } catch (err) {
      setSelectedDevice({ ...selectedBaseDevice, users: [], relations: [] });
      setError(err instanceof Error ? err.message : 'Failed to load device detail');
    } finally {
      setDetailLoading(false);
    }
  }, [selectedBaseDevice, token]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    void loadSelectedDeviceDetails();
  }, [loadSelectedDeviceDetails]);

  const claimDevice = useCallback(async (name: string, deviceId: string) => {
    if (!token) throw new Error('You must be logged in');
    await devicesApi.claimDevice({ name, deviceId }, token);
    await loadDevices();
    setSelectedDeviceId(deviceId);
  }, [loadDevices, token]);

  const addUserToDevice = useCallback(async (userId: string, deviceId: string) => {
    if (!token) throw new Error('You must be logged in');
    await devicesApi.addUserToDevice({ userId, deviceId }, token);
    await loadSelectedDeviceDetails();
  }, [loadSelectedDeviceDetails, token]);

  const leaveDevice = useCallback(async (deviceId: string) => {
    if (!token) throw new Error('You must be logged in');
    await devicesApi.leaveDevice(deviceId, token);
    await loadDevices();
  }, [loadDevices, token]);

  const deleteDevice = useCallback(async (deviceId: string) => {
    if (!token) throw new Error('You must be logged in');
    await devicesApi.deleteDevice(deviceId, token);
    if (selectedDeviceId === deviceId) setSelectedDeviceId(null);
    await loadDevices();
  }, [loadDevices, selectedDeviceId, token]);

  const setActiveConfiguration = useCallback(async (userDeviceRelationId: string, configurationId: string) => {
    if (!token) throw new Error('You must be logged in');
    await devicesApi.setActiveConfiguration({ userDeviceRelationId, configurationId }, token);
    await loadSelectedDeviceDetails();
  }, [loadSelectedDeviceDetails, token]);

  const setActiveUser = useCallback(async (userId: string, deviceId: string) => {
    if (!token) throw new Error('You must be logged in');
    const updatedDevice = await devicesApi.setActiveUser({ userId, deviceId }, token);
    setDevices((current) => current.map((device) => device.id === updatedDevice.id
      ? { ...updatedDevice, userCount: device.userCount }
      : device));
    setSelectedDevice((current) => current && current.id === updatedDevice.id
      ? { ...current, activeUserRelation: updatedDevice.activeUserRelation }
      : current);
  }, [token]);

  return {
    devices,
    selectedDevice,
    selectedDeviceId,
    isLoading,
    isDetailLoading,
    error,
    setSelectedDeviceId,
    refresh: loadDevices,
    claimDevice,
    addUserToDevice,
    leaveDevice,
    deleteDevice,
    setActiveUser,
    setActiveConfiguration,
  };
}
