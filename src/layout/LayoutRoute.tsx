import React, { ComponentType, useState } from 'react';
import { Route, Redirect, RouteComponentProps } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import styled from 'styled-components';
import { useAuth } from 'auth/AuthContext';
import { Role, hasAllowedRoles } from 'auth/roles';
import { ROUTE_PATHS } from 'routes';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ls from 'localstorage-slim';

export const Page = styled.div`
  width: 100%;
`;

const Main = styled.main<{ $isPublic?: boolean; open?: boolean }>`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  padding: 20px;
  height: ${({ $isPublic }) => ($isPublic ? '100vh' : '100%')};
  margin-left: ${({ theme, $isPublic, open }) => ($isPublic || !open ? 0 : theme.size.sidebar)};
  ${({ theme }) => theme.breakpoints.down('md')} {
    margin-left: 0;
  }
`;

const MainContent = styled.div`
  flex: 1 1 auto;
  min-height: 0;
`;

const PageFooter = styled.footer`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  padding: 12px 16px 4px;
  text-align: center;
`;
export interface LayoutRouteProps {
  component: ComponentType;
  exact?: boolean;
  isPublic?: boolean;
  path: string;
  allowedRoles?: Role[];
  requiredPermissions?: string[];
}

interface AuthenticatedRouteProps extends LayoutRouteProps {
  isSidebarOpen: boolean;
  handleSidebarOpen: (state?: boolean) => void;
}

const hasRequiredPermissions = (
  userPermissions: string[],
  requiredPermissions?: string[]
): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  return requiredPermissions.every((p) => userPermissions.includes(p));
};

function PublicRoute({
  component: Component,
  exact,
  path
}: Partial<LayoutRouteProps>): JSX.Element {
  return (
    <Route
      exact={exact}
      path={path}
      render={(props) => (
        <Main $isPublic>
          <MainContent>
            {/* @ts-expect-error */}
            <Component {...props} />
          </MainContent>
        </Main>
      )}
    />
  );
}

function PrivateRoute({
  component: Component,
  exact,
  path,
  isSidebarOpen,
  handleSidebarOpen,
  allowedRoles,
  requiredPermissions
}: AuthenticatedRouteProps): JSX.Element {
  const { authReady, getToken, getRoles, getPermission, needsProfileCompletion } = useAuth();
  const isAuthenticated = !!getToken();

  const roles = getRoles();
  const permissions = getPermission?.() || [];

  const render = (props: RouteComponentProps): React.ReactNode => {
    if (!authReady) {
      return (
        <Main>
          <Box width="100%" minHeight="60vh" display="flex" alignItems="center" justifyContent="center">
            <CircularProgress />
          </Box>
        </Main>
      );
    }

    if (!isAuthenticated) {
      return <Redirect to={{ pathname: ROUTE_PATHS.LOGIN, state: { from: props.location } }} />;
    }

    if (needsProfileCompletion() && props.location.pathname !== ROUTE_PATHS.PROFILE) {
      return <Redirect to={ROUTE_PATHS.PROFILE} />;
    }

    // ✅ permission-first
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!hasRequiredPermissions(permissions, requiredPermissions)) {
        return <Redirect to={{ pathname: ROUTE_PATHS.FORBIDDEN }} />;
      }
    } else {
      // ✅ fallback role
      if (!hasAllowedRoles(roles, allowedRoles)) {
        return <Redirect to={{ pathname: ROUTE_PATHS.FORBIDDEN }} />;
      }
    }

    return (
      <>
        <Navbar onSidebarToggle={handleSidebarOpen} />
        <Sidebar isOpen={isSidebarOpen} onSidebarToggle={handleSidebarOpen} />
        <Main open={isSidebarOpen}>
          <MainContent>
            {/* @ts-expect-error */}
            <Component {...props} />
          </MainContent>
          <PageFooter />
        </Main>
      </>
    );
  };

  return <Route exact={exact} path={path} render={render} />;
}

export default function LayoutRoute(props: LayoutRouteProps): JSX.Element {
  const {
    component: Component,
    exact = true,
    path,
    isPublic,
    allowedRoles,
    requiredPermissions = []
  } = props;

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(ls.get('SIDEBAR_TOGGLE') || false);

  function handleSidebarOpen(state = !isSidebarOpen) {
    ls.set<boolean>('SIDEBAR_TOGGLE', state);
    setIsSidebarOpen(state);
  }

  if (isPublic) {
    return <PublicRoute component={Component} exact={exact} path={path} />;
  }

  return (
    <PrivateRoute
      component={Component}
      exact={exact}
      path={path}
      isSidebarOpen={isSidebarOpen}
      handleSidebarOpen={handleSidebarOpen}
      allowedRoles={allowedRoles}
      requiredPermissions={requiredPermissions}
    />
  );
}
