export type UserRole = 'user' | 'admin';
export type MessageOrigin = 'user' | 'assistant' | 'system';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  loginName?: string;
}

export interface LoginResponse {
  token: string;
}

export interface Device {
  id: string;
  name: string;
  activeUserRelation: string | null;
  userCount?: number;
}

export interface DeviceUser extends User {
  userRole: UserRole;
}

export interface UserDeviceRelation {
  id: string;
  userId: string;
  deviceId: string;
  activeConfigurationId: string | null;
  userRole: UserRole;
}

export interface DeviceWithDetails extends Device {
  users: DeviceUser[];
  relations: UserDeviceRelation[];
}

export interface AssistantConfiguration {
  id: string;
  ownerId: string;
  assistantName: string;
  systemPrompt: string;
  topicRestrictions: string;
  assistantVoice: string;
}

export interface ConfigurationMessage {
  id: string;
  messageOrigin: MessageOrigin;
  createdDate: string;
  content: string;
  configurationId: string;
}

export interface ApiErrorResponse {
  message?: string;
}
