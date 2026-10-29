/* eslint-disable no-restricted-imports */
import config from 'config';
import axios from 'axios';
import ls from 'localstorage-slim';
import { browserName } from 'react-device-detect';
import { STORAGE_KEYS } from 'auth/AuthContext';
import { startApiLoading, stopApiLoading } from './loadingState';
import packageInfo from '../../package.json';

const AUTH_BYPASS_PATHS = [
  '/v1/login',
  '/v1/logout',
  '/v1/auth/line/login',
  '/v1/auth/line/register',
  '/v1/auth/one-time-login'
  , '/auth/login'
  , '/auth/refresh'
  , '/auth/logout'
];
const FORCED_LOGOUT_MARKER = 'carbonedge:forced-logout';
const LEGACY_FORCED_LOGOUT_MARKER = 'nutalig:forced-logout';
const LEGACY_AUTH_STORAGE_KEYS = [
  'nutalig:user_role',
  'nutalig:permission',
  'nutalig:staff_role',
  'nutalig:staff_id',
  'nutalig:sales_id',
  'nutalig:employee_id',
  'nutalig:user_token',
  'nutalig:user_id',
  'nutalig:account',
  'nutalig:username',
  'nutalig:company',
  'nutalig:logo'
];

const shouldBypassForcedLogout = (url?: string) =>
  typeof url === 'string' && AUTH_BYPASS_PATHS.some((path) => url.includes(path));

const forceLogoutToLogin = () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (
    sessionStorage.getItem(FORCED_LOGOUT_MARKER) === '1' ||
    sessionStorage.getItem(LEGACY_FORCED_LOGOUT_MARKER) === '1'
  ) {
    return;
  }

  sessionStorage.setItem(FORCED_LOGOUT_MARKER, '1');
  sessionStorage.removeItem(LEGACY_FORCED_LOGOUT_MARKER);
  Object.values(STORAGE_KEYS).forEach((key) => ls.remove(key));
  LEGACY_AUTH_STORAGE_KEYS.forEach((key) => ls.remove(key));
  window.location.replace('/login?reason=session-replaced');
};

const notifyAuthorizationStale = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent('carbonedge:authorization-stale'));
};

export const api = axios.create({
  baseURL: config.dkpApi,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

let refreshInFlight: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = ls.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) return Promise.reject(new Error('No refresh token'));

  refreshInFlight = api.post('/auth/refresh', { refreshToken })
    .then((response) => {
      const accessToken = response.data?.accessToken as string | undefined;
      const nextRefreshToken = response.data?.refreshToken as string | undefined;
      if (!accessToken || !nextRefreshToken) throw new Error('Invalid refresh response');
      ls.set(STORAGE_KEYS.TOKEN, accessToken);
      ls.set(STORAGE_KEYS.REFRESH_TOKEN, nextRefreshToken);
      return accessToken;
    })
    .finally(() => { refreshInFlight = null; });
  return refreshInFlight;
};

api.interceptors.request.use(
  async (config) => {
    startApiLoading();
    config.headers = config.headers || {};
    config.headers['ngrok-skip-browser-warning'] = 'true';

    const token =
      ls.get<string | null>(STORAGE_KEYS.TOKEN) ||
      ls.get<string | null>('nutalig:user_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const userId = ls.get<string | null>(STORAGE_KEYS.ID);
    config.headers.timestamp = Math.floor(Date.now() / 1000);
    config.headers.user_agent = browserName;
    config.headers.application_version = packageInfo.version;
    if (userId) config.headers.userId = userId;

    return config;
  },
  (err) => {
    stopApiLoading();
    return Promise.reject(err);
  }
);

api.interceptors.response.use(
  (res) => {
    stopApiLoading();
    return res;
  },
  async (error) => {
    stopApiLoading();
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !shouldBypassForcedLogout(original.url)) {
      original._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        forceLogoutToLogin();
      }
    }

    if (status === 401 && !shouldBypassForcedLogout(original?.url)) {
      forceLogoutToLogin();
    }

    if (status === 403 && original && !original._authorizationRefreshRequested) {
      original._authorizationRefreshRequested = true;
      notifyAuthorizationStale();
    }

    return Promise.reject(error);
  }
);
