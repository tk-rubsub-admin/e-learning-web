import { api } from 'api/api';

export type CategoryRecord = {
  id: number;
  name: string;
  idNumber?: string | null;
  description?: string | null;
  parent?: number | null;
  sortOrder?: number | null;
  courseCount?: number | null;
  visible?: boolean | null;
  visibleOld?: boolean | null;
  timeModified?: number | null;
  depth?: number | null;
  path?: string | null;
  theme?: string | null;
};

export type CreateCategoryPayload = {
  name: string;
  parent: number;
  idNumber?: string;
  description?: string;
  visible?: boolean;
  theme?: string;
};

export const getCategories = async (): Promise<CategoryRecord[]> => {
  const response = await api.get<CategoryRecord[]>('/categories');
  return response.data || [];
};

export const createCategory = async (payload: CreateCategoryPayload): Promise<CategoryRecord> => {
  const response = await api.post<CategoryRecord>('/categories', payload);
  return response.data;
};
