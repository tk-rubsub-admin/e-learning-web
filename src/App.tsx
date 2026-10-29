import React from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import { useAuth } from 'auth/AuthContext';
import { Box, CircularProgress } from '@material-ui/core';
import { Toaster } from 'react-hot-toast';
import { getDefaultRouteForRole, routes, ROUTE_PATHS } from './routes';
import LayoutRoute from './layout/LayoutRoute';
import GlobalLoadingDialog from 'components/GlobalLoadingDialog';
import './styles/button.css';

function App(): JSX.Element {
  const { authReady, getRole, getToken } = useAuth();
  const isAuthenticated = !!getToken();

  return (
    <React.Suspense
      fallback={
        <Box
          height="100vh"
          width="100vw"
          display="flex"
          justifyContent="center"
          alignItems="center">
          <CircularProgress />
        </Box>
      }>
      <Router>
        <Toaster />
        <GlobalLoadingDialog />
        <Switch>
          <Route
            exact
            path={ROUTE_PATHS.ROOT}
            render={() => {
              if (!authReady) {
                return (
                  <Box
                    height="100vh"
                    width="100vw"
                    display="flex"
                    justifyContent="center"
                    alignItems="center">
                    <CircularProgress />
                  </Box>
                );
              }

              return <Redirect to={isAuthenticated ? getDefaultRouteForRole(getRole()) : ROUTE_PATHS.LOGIN} />;
            }}
          />
          {routes.map(({ exact, path, component, isPublic, allowedRoles, requiredPermissions }) => (
            <LayoutRoute
              key={path}
              exact={exact}
              path={path}
              component={component}
              isPublic={isPublic}
              allowedRoles={allowedRoles}
              requiredPermissions={requiredPermissions}
            />
          ))}
          <Redirect to={ROUTE_PATHS.NOT_FOUND} />
        </Switch>
      </Router>
    </React.Suspense>
  );
}

export default App;
