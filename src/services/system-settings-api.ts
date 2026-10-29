import { api } from 'api/api';

export type SystemSetting = {
  key: string;
  value: string;
  secret: boolean;
  configured: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

export type SystemSettingAudit = {
  id: number;
  key: string;
  oldValue?: string | null;
  newValue?: string | null;
  secret: boolean;
  changedAt: string;
  changedBy?: string | null;
};

export const getSystemSettings = async (): Promise<SystemSetting[]> => {
  const response = await api.get<SystemSetting[]>('/admin/system-settings');
  return response.data || [];
};

export const updateSystemSetting = async (key: string, value: string): Promise<SystemSetting> => {
  const response = await api.patch<SystemSetting>(`/admin/system-settings/${encodeURIComponent(key)}`, { value });
  return response.data;
};

export const testMoodleConnection = async (): Promise<string> => {
  const response = await api.post<string>('/admin/system-settings/moodle/test');
  return response.data;
};

export const testMailConnection = async (): Promise<void> => {
  await api.post('/admin/system-settings/mail/test');
};

export const getSystemSettingAudit = async (): Promise<SystemSettingAudit[]> => {
  const response = await api.get<SystemSettingAudit[]>('/admin/system-settings/audit');
  return response.data || [];
};
