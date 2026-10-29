import { api } from 'api/api';

export type DatabaseBackupJob = {
  id: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  message: string;
  startedAt: string;
  finishedAt?: string | null;
};

export type DatabaseBackupFile = {
  id: string;
  database: 'elearning' | 'moodle';
  sizeBytes: number;
  createdAt: string;
};

export type DatabaseBackupOverview = {
  configured: boolean;
  activeJob?: DatabaseBackupJob | null;
  files: DatabaseBackupFile[];
};

export const getDatabaseBackupOverview = async () =>
  (await api.get<DatabaseBackupOverview>('/admin/backups')).data;

export const startDatabaseBackup = async () =>
  (await api.post<DatabaseBackupJob>('/admin/backups')).data;

export const getDatabaseBackupStatus = async (id: string) =>
  (await api.get<DatabaseBackupJob>(`/admin/backups/${encodeURIComponent(id)}`)).data;

export const downloadDatabaseBackup = async (file: DatabaseBackupFile) => {
  const response = await api.get<Blob>(`/admin/backups/${encodeURIComponent(file.id)}/${file.database}`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `backup-${file.id}-${file.database}.sql.gz.enc`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
