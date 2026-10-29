import { TFunction, Namespace } from 'react-i18next';

export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  STUDENT: 'STUDENT'
});

export type Role = string;

export const hasAllowedRole = (role?: string | null, allowedRoles?: Role[]): boolean => {
  if (!allowedRoles || !allowedRoles.length) {
    return true;
  }
  return !!role && allowedRoles.includes(role);
};

export const hasAllowedRoles = (roles?: string[] | null, allowedRoles?: Role[]): boolean => {
  if (!allowedRoles || !allowedRoles.length) {
    return true;
  }
  return !!roles?.length && roles.some((role) => allowedRoles.includes(role));
};

export const getAdminUserRoleLabel = (
  role: string | null | undefined,
  t: TFunction<Namespace>
): string => {
  return t(role ? `role.${role}` : '');
}
