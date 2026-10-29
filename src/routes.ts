import { lazy } from 'react';
import { ROLES } from 'auth/roles';
import { LayoutRouteProps } from './layout/LayoutRoute';

export const ROUTE_PATHS = Object.freeze({
  CATCH_ALL: '**',
  ROOT: '/',
  DASHBOARD: '/dashboard',
  COURSES: '/courses',
  LEARNING_COURSES: '/learning-courses',
  STUDENTS: '/students',
  STUDENT_CREATE: '/students-create',
  PROFILE: '/profile',
  COURSE_CREATE: '/course-create',
  COURSE_DETAIL: '/course/:id',
  CATEGORIES: '/categories',
  CATEGORY_CREATE: '/categories-create',
  SYSTEM_SETTINGS: '/system-settings',
  CERTIFICATE_TEMPLATE: '/certificate-template',
  DATABASE_BACKUP: '/data-backup',
  LEARNING_HISTORY: '/learning-history',
  SATISFACTION: '/satisfaction',
  ENGAGEMENT: '/engagement',
  CERTIFICATE_VERIFY: '/certificates/verify/:code',
  LOGIN: '/login',
  REGISTER: '/register',
  LOGIN_SUCCESS: '/login-success',
  LOGIN_FAILURE: '/login-failure',
  LOGOUT: '/logout',
  FORBIDDEN: '/403',
  NOT_FOUND: '/404',
  RESET_PASSWORD: '/reset-password'
});

export const getDefaultRouteForRole = (role?: string | null): string => {
  if (role === ROLES.ADMIN) {
    return ROUTE_PATHS.DASHBOARD;
  }

  return ROUTE_PATHS.COURSES;
};

export const routes: Readonly<LayoutRouteProps[]> = Object.freeze([
  {
    path: ROUTE_PATHS.LOGIN,
    isPublic: true,
    component: lazy(() => import('./pages/Login' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.REGISTER,
    isPublic: true,
    component: lazy(() => import('./pages/Register' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.LOGOUT,
    isPublic: true,
    component: lazy(() => import('./pages/Logout' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.RESET_PASSWORD,
    isPublic: true,
    component: lazy(() => import('./pages/ResetPassword' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.DASHBOARD,
    component: lazy(() => import('./pages/AdminDashboard')),
    allowedRoles: [ROLES.ADMIN]
  },
  {
    path: ROUTE_PATHS.COURSES,
    component: lazy(() => import('./pages/Courses' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.ADMIN, ROLES.STUDENT]
  },
  {
    path: ROUTE_PATHS.LEARNING_COURSES,
    component: lazy(() => import('./pages/Courses/Learning' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.ADMIN]
  },
  {
    path: ROUTE_PATHS.STUDENTS,
    component: lazy(() => import('./pages/Students' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.ADMIN]
  },
  {
    path: ROUTE_PATHS.STUDENT_CREATE,
    component: lazy(() => import('./pages/Students/Create' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.ADMIN]
  },
  {
    path: ROUTE_PATHS.PROFILE,
    component: lazy(() => import('./pages/Profile' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.STUDENT]
  },
  {
    path: ROUTE_PATHS.COURSE_CREATE,
    component: lazy(() => import('./pages/Courses/Create' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.ADMIN]
  },
  {
    path: ROUTE_PATHS.COURSE_DETAIL,
    component: lazy(() => import('./pages/Courses/Detail' /* webpackChunkName: "app" */))
  },
  {
    path: ROUTE_PATHS.CATEGORIES,
    component: lazy(() => import('./pages/Categories' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.ADMIN]
  },
  {
    path: ROUTE_PATHS.CATEGORY_CREATE,
    component: lazy(() => import('./pages/Categories/Create' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.ADMIN]
  },
  {
    path: ROUTE_PATHS.CERTIFICATE_VERIFY,
    isPublic: true,
    component: lazy(() => import('./pages/CertificateVerify'))
  },
  {
    path: ROUTE_PATHS.LEARNING_HISTORY,
    component: lazy(() => import('./pages/LearningHistory')),
    allowedRoles: [ROLES.ADMIN, ROLES.STUDENT]
  },
  {
    path: ROUTE_PATHS.SATISFACTION,
    component: lazy(() => import('./pages/Satisfaction' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.ADMIN, ROLES.STUDENT]
  },
  {
    path: ROUTE_PATHS.ENGAGEMENT,
    component: lazy(() => import('./pages/Engagement')),
    allowedRoles: [ROLES.ADMIN]
  },
  {
    path: ROUTE_PATHS.SYSTEM_SETTINGS,
    component: lazy(() => import('./pages/SystemSettings' /* webpackChunkName: "app" */)),
    allowedRoles: [ROLES.ADMIN]
  },
  {
    path: ROUTE_PATHS.CERTIFICATE_TEMPLATE,
    component: lazy(() => import('./pages/CertificateTemplate')),
    allowedRoles: [ROLES.ADMIN]
  },
  {
    path: ROUTE_PATHS.DATABASE_BACKUP,
    component: lazy(() => import('./pages/DatabaseBackup')),
    allowedRoles: [ROLES.ADMIN]
  }
]);
