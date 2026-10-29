import fs from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(projectRoot, 'src');

const moduleCandidates = (modulePath: string): string[] => {
  const base = resolve(srcRoot, modulePath);

  return [
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    resolve(base, 'index.ts'),
    resolve(base, 'index.tsx'),
    resolve(base, 'index.js'),
    resolve(base, 'index.jsx')
  ];
};

const moduleExists = (modulePath: string): boolean =>
  moduleCandidates(modulePath).some((candidate) => fs.existsSync(candidate));

const placeholderModule = (label: string): string => `
import React from 'react';

export default function PlaceholderPage() {
  return React.createElement(
    'div',
    {
      style: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        color: '#4b5563',
        background: '#f8fafc'
      }
    },
    '${label.replace(/'/g, "\\'")}'
  );
}
`;

const missingModuleFallback = () => ({
  name: 'missing-module-fallback',
  resolveId(source: string) {
    if (source.startsWith('./pages/') || source.startsWith('pages/')) {
      const modulePath = source.replace(/^\.\/+/, '');
      if (!moduleExists(modulePath)) {
        return `\0missing-page:${source}`;
      }
    }

    if (source === 'services/general-api') {
      if (!moduleExists(source)) {
        return '\0missing-service:general-api';
      }
    }

    if (source === 'services/User/user-type') {
      if (!moduleExists(source)) {
        return '\0missing-service:user-type';
      }
    }

    return null;
  },
  load(id: string) {
    if (id.startsWith('\0missing-page:')) {
      const source = id.replace('\0missing-page:', '');
      const label = source.replace(/^\.\/pages\//, '').replace(/^pages\//, '').replace(/\//g, ' / ') || 'Page';
      return placeholderModule(`${label} is not implemented yet`);
    }

    if (id === '\0missing-service:general-api') {
      return `
import ls from 'localstorage-slim';

const emptyLoginResponse = () => ({ status: 'ok', data: { token: '' } });
const getAuthHeaders = () => {
  const token = ls.get('nutalig:user_token');
  return token ? { Authorization: 'Bearer ' + token } : {};
};

export const getUserProfile = async () => {
  const response = await fetch('/api/users/me', {
    headers: {
      ...getAuthHeaders()
    }
  });

  if (!response.ok) {
    throw new Error('Failed to load user profile');
  }

  return response.json();
};

export const login = async () => emptyLoginResponse();
export const logout = async () => emptyLoginResponse();
export const oneTimeLogin = async (token) => ({ data: { token } });
export const lineLogin = async () => emptyLoginResponse();
export const lineRegister = async () => emptyLoginResponse();
export const getJobStatus = async () => ({ processed: 0, total: 0 });
`;
    }

    if (id === '\0missing-service:user-type') {
      return `
export const Role = {};
export const LoginResponse = {};
export const LineLoginRequest = {};
export const LineRegisterRequest = {};
`;
    }

    return null;
  }
});

const Config = () => {
  return defineConfig({
    envPrefix: 'REACT_APP_',
    build: {
      outDir: 'build'
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts']
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8086/lms-api',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    plugins: [missingModuleFallback(), react(), viteTsconfigPaths(), svgrPlugin()]
  });
};

export default Config;
