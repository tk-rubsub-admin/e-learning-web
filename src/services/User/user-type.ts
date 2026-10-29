export type Role = {
  roleCode?: string;
  roleNameTh?: string;
  roleNameEn?: string;
};

export type UserProfile = {
  id: string;
  username: string;
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
  displayName?: string;
  pictureUrl?: string;
  role?: Role;
  permissions?: string[];
  employeeId?: string;
  salesId?: string;
  moodleUserId?: number | null;
  firstLogin?: boolean;
  completedProfile?: boolean;
};

export type LoginResponse = {
  status?: string;
  data?: {
    token?: string;
    accessToken?: string;
    user?: UserProfile;
  };
  token?: string;
  accessToken?: string;
  user?: UserProfile;
};

export type LineLoginRequest = {
  token?: string;
  idToken?: string;
  accessToken?: string;
};

export type LineRegisterRequest = {
  token?: string;
  idToken?: string;
  accessToken?: string;
};
