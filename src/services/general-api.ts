import { api } from 'api/api';
import type { LineLoginRequest, LineRegisterRequest, LoginResponse, UserProfile } from 'services/User/user-type';

type RawUserProfile = {
  id?: number | string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  phoneNumber?: string;
  addressHouseNumber?: string;
  addressMoo?: string;
  addressBuilding?: string;
  addressAlley?: string;
  addressRoad?: string;
  addressProvince?: string;
  addressDistrict?: string;
  addressSubdistrict?: string;
  addressPostalCode?: string;
  pdpaConsentAt?: string;
  informationCertifiedAt?: string;
  status?: string;
  role?: string;
  moodleUserId?: number | null;
  firstLogin?: boolean;
  completedProfile?: boolean;
};

export type UpdateStudentProfileRequest = {
  email: string;
  firstName: string;
  lastName: string;
};

type LegacySessionRequest = {
  userId?: string;
};

const emptyLoginResponse = (): LoginResponse => ({ status: 'ok', data: { token: '' } });

const toRole = (role?: string): UserProfile['role'] => {
  const roleCode = (role || '').trim();

  if (!roleCode) {
    return undefined;
  }

  return {
    roleCode,
    roleNameTh: roleCode,
    roleNameEn: roleCode
  };
};

const toUserProfile = (profile: RawUserProfile): UserProfile => {
  const username = (profile.username || '').trim();
  const firstName = (profile.firstName || '').trim();
  const lastName = (profile.lastName || '').trim();
  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || username || '-';

  return {
    id: String(profile.id ?? ''),
    username,
    email: profile.email || '',
    firstName,
    lastName,
    title: profile.title || '',
    phoneNumber: profile.phoneNumber || '',
    addressHouseNumber: profile.addressHouseNumber || '',
    addressMoo: profile.addressMoo || '',
    addressBuilding: profile.addressBuilding || '',
    addressAlley: profile.addressAlley || '',
    addressRoad: profile.addressRoad || '',
    addressProvince: profile.addressProvince || '',
    addressDistrict: profile.addressDistrict || '',
    addressSubdistrict: profile.addressSubdistrict || '',
    addressPostalCode: profile.addressPostalCode || '',
    pdpaConsentAt: profile.pdpaConsentAt,
    informationCertifiedAt: profile.informationCertifiedAt,
    displayName,
    pictureUrl: '',
    role: toRole(profile.role),
    permissions: [],
    moodleUserId: profile.moodleUserId ?? null,
    firstLogin: profile.firstLogin ?? false,
    completedProfile: profile.completedProfile ?? true
  };
};

export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get<RawUserProfile>('/users/me');
  return toUserProfile(response.data || {});
};

export const updateStudentProfile = async (
  request: UpdateStudentProfileRequest
): Promise<UserProfile> => {
  const response = await api.put<RawUserProfile>('/users/me', request);
  return toUserProfile(response.data || {});
};

export const login = async (_req?: LegacySessionRequest): Promise<LoginResponse> => emptyLoginResponse();

export const logout = async (_req?: LegacySessionRequest): Promise<LoginResponse> => {
  await api.post('/auth/logout');
  return emptyLoginResponse();
};

export const oneTimeLogin = async (token: string): Promise<LoginResponse> => ({
  ...emptyLoginResponse(),
  data: { token }
});

export const lineLogin = async (_req: LineLoginRequest): Promise<LoginResponse> => emptyLoginResponse();

export const lineRegister = async (_req: LineRegisterRequest): Promise<LoginResponse> => emptyLoginResponse();

export const getJobStatus = async (): Promise<{ processed: number; total: number }> => ({
  processed: 0,
  total: 0
});
