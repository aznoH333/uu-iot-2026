import { useCallback, useEffect, useMemo, useState } from 'react';
import { configurationsApi, type AssistantConfigurationUpdate } from '../api/configurations';
import { useAuth } from '../auth/AuthContext';
import type { AssistantConfiguration, ConfigurationMessage } from '../types/api';

export function useConfigurations() {
  const { token } = useAuth();
  const [configurations, setConfigurations] = useState<AssistantConfiguration[]>([]);
  const [selectedConfigurationId, setSelectedConfigurationId] = useState<string | null>(null);
  const [selectedConfigurationMessages, setSelectedConfigurationMessages] = useState<ConfigurationMessage[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isMessagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedConfiguration = useMemo(
    () => configurations.find((configuration) => configuration.id === selectedConfigurationId) ?? null,
    [configurations, selectedConfigurationId],
  );

  const loadConfigurations = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await configurationsApi.getConfigurations(token);
      const validConfigurations = response.filter((configuration): configuration is AssistantConfiguration => Boolean(configuration?.id));
      setConfigurations(validConfigurations);
      setSelectedConfigurationId((current) => current ?? validConfigurations[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configurations');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadConfigurations();
  }, [loadConfigurations]);

  const createConfiguration = useCallback(async () => {
    if (!token) throw new Error('You must be logged in');
    const created = await configurationsApi.createConfiguration(token);
    await loadConfigurations();
    setSelectedConfigurationId(created.id);
  }, [loadConfigurations, token]);

  const updateConfiguration = useCallback(async (id: string, payload: AssistantConfigurationUpdate) => {
    if (!token) throw new Error('You must be logged in');
    const updated = await configurationsApi.updateConfiguration(id, payload, token);
    setConfigurations((current) => current.map((configuration) => configuration.id === id ? updated : configuration));
  }, [token]);

  const deleteConfiguration = useCallback(async (id: string) => {
    if (!token) throw new Error('You must be logged in');
    await configurationsApi.deleteConfiguration(id, token);
    await loadConfigurations();
    setSelectedConfigurationId((current) => current === id ? null : current);
  }, [loadConfigurations, token]);

  const loadMessagesForConfiguration = useCallback(async (configurationId: string) => {
    if (!token) throw new Error('You must be logged in');
    setMessagesLoading(true);
    setError(null);

    try {
      const response = await configurationsApi.getMessagesByConfiguration(configurationId, token);
      setSelectedConfigurationMessages(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || !selectedConfigurationId) {
      setSelectedConfigurationMessages([]);
      return;
    }
    void loadMessagesForConfiguration(selectedConfigurationId);
  }, [loadMessagesForConfiguration, selectedConfigurationId, token]);

  return {
    configurations,
    selectedConfiguration,
    selectedConfigurationId,
    selectedConfigurationMessages,
    isLoading,
    isMessagesLoading,
    error,
    setSelectedConfigurationId,
    refresh: loadConfigurations,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    loadMessagesForConfiguration,
  };
}
