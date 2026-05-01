import { apiRequest } from './client';
import type { AssistantConfiguration, ConfigurationMessage } from '../types/api';

export type AssistantConfigurationUpdate = Partial<
  Pick<AssistantConfiguration, 'assistantName' | 'systemPrompt' | 'topicRestrictions' | 'assistantVoice'>
>;

export const configurationsApi = {
  getConfigurations: (token: string) =>
    apiRequest<AssistantConfiguration[]>('/assistant-configurations', { token }),

  createConfiguration: (token: string) =>
    apiRequest<AssistantConfiguration>('/assistant-configurations', {
      method: 'POST',
      token,
    }),

  updateConfiguration: (id: string, payload: AssistantConfigurationUpdate, token: string) =>
    apiRequest<AssistantConfiguration>(`/assistant-configurations/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(payload),
    }),

  deleteConfiguration: (id: string, token: string) =>
    apiRequest<void>(`/assistant-configurations/${id}`, {
      method: 'DELETE',
      token,
    }),

  getMessagesByConfiguration: (configurationId: string, token: string) =>
    apiRequest<ConfigurationMessage[]>(`/messages/${configurationId}`, { token }),
};
