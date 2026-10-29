/* eslint-disable prettier/prettier */
import { useTranslation } from 'react-i18next';
import { ROLES } from 'auth/roles';
import { ROUTE_PATHS } from 'routes';
import {
  Home,
  School,
  Category,
  MenuBook,
  People,
  AccountCircle,
  Settings,
  History,
  RateReview,
  Insights,
  WorkspacePremium,
  Backup
} from '@mui/icons-material'
import { SidebarItemsType } from './Sidebar/types';

export function useMenuItems() {
  const { t } = useTranslation();

  const pagesSection = [
    {
      id: 'left_menu__home',
      title: t('sidebar.home'),
      href: ROUTE_PATHS.ROOT,
      icon: Home
    },
    {
      id: 'left_menu__courses',
      title: 'คอร์สเรียนของฉัน',
      href: ROUTE_PATHS.COURSES,
      icon: School,
      allowedRoles: [ROLES.STUDENT]
    },
    {
      id: 'left_menu__profile',
      title: t('sidebar.profile'),
      href: ROUTE_PATHS.PROFILE,
      icon: AccountCircle,
      allowedRoles: [ROLES.STUDENT]
    },
    {
      id: 'left_menu__learning_courses',
      title: 'คอร์สเรียน',
      href: ROUTE_PATHS.LEARNING_COURSES,
      icon: MenuBook,
      allowedRoles: [ROLES.ADMIN]
    },
    {
      id: 'left_menu__students',
      title: 'นักเรียน',
      href: ROUTE_PATHS.STUDENTS,
      icon: People,
      allowedRoles: [ROLES.ADMIN]
    },
    {
      id: 'left_menu__categories',
      title: 'หมวดหมู่คอร์ส',
      href: ROUTE_PATHS.CATEGORIES,
      icon: Category,
      allowedRoles: [ROLES.ADMIN]
    },
    {
      id: 'left_menu__learning_history', title: 'ประวัติการเรียน', href: ROUTE_PATHS.LEARNING_HISTORY, icon: History,
      allowedRoles: [ROLES.ADMIN, ROLES.STUDENT]
    },
    {
      id: 'left_menu__satisfaction', title: 'แบบประเมินความพึงพอใจ', href: ROUTE_PATHS.SATISFACTION,
      icon: RateReview, allowedRoles: [ROLES.ADMIN]
    },
    {
      id: 'left_menu__certificate_template',
      title: 'ใบประกาศนียบัตร',
      href: ROUTE_PATHS.CERTIFICATE_TEMPLATE,
      icon: WorkspacePremium,
      allowedRoles: [ROLES.ADMIN]
    },
    {
      id: 'left_menu__system_settings',
      title: 'ตั้งค่าระบบ',
      href: ROUTE_PATHS.SYSTEM_SETTINGS,
      icon: Settings,
      allowedRoles: [ROLES.ADMIN]
    },
  ] as unknown as SidebarItemsType[];

  const menuItems = [
    {
      title: t('sidebar.pages'),
      pages: pagesSection
    }
  ];

  return menuItems;
}

export default useMenuItems;
