import { useState, type FormEvent } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useAuth } from 'auth/AuthContext';
import { getDefaultRouteForRole, ROUTE_PATHS } from 'routes';
import { api } from 'api/api';

type LoginLocationState = {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
};

type LoginApiResponse = {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  expiresAt?: string;
};

const buildRedirectPath = (role: string, from?: LoginLocationState['from']): string => {
  if (!from?.pathname || from.pathname === ROUTE_PATHS.LOGIN) {
    return getDefaultRouteForRole(role);
  }

  return `${from.pathname}${from.search || ''}${from.hash || ''}`;
};

export default function SignInSide(): JSX.Element {
  const history = useHistory();
  const location = useLocation<LoginLocationState>();
  const { setSession, refreshUserProfile, needsProfileCompletion } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isOpenLoading, setIsOpenLoading] = useState(false);
  const [dialogMessage, setDialogMessage] = useState<string>('ไม่สามารถเข้าสู่ระบบได้');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password.trim()) {
      setDialogMessage('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านให้ครบถ้วน');
      setOpenDialog(true);
      return;
    }

    setIsOpenLoading(true);

    try {
      const response = await api.post<LoginApiResponse>('/auth/login', {
        usernameOrEmail: trimmedUsername,
        password
      });

      const accessToken = response.data?.accessToken || response.data?.token || '';
      if (!accessToken) {
        throw new Error('Login response did not include an access token');
      }

      setSession(accessToken, response.data?.refreshToken);
      const role = await refreshUserProfile();

      sessionStorage.removeItem('carbonedge:forced-logout');
      sessionStorage.removeItem('nutalig:forced-logout');
      history.replace(
        needsProfileCompletion()
          ? ROUTE_PATHS.PROFILE
          : buildRedirectPath(role, location.state?.from)
      );
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      if (status === 400) {
        setDialogMessage('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านให้ถูกต้อง');
      } else if (status === 401) {
        setDialogMessage('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setDialogMessage(message || 'ไม่สามารถเข้าสู่ระบบได้ในขณะนี้');
      }

      setOpenDialog(true);
    } finally {
      setIsOpenLoading(false);
    }
  };

  return (
    <>
      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 1.5, sm: 2.5 },
          py: { xs: 2, sm: 3 },
          m: 0,
          background:
            'radial-gradient(circle at top, rgba(140, 162, 129, 0.16), transparent 34%), linear-gradient(180deg, #fcfcf8 0%, #f3f4ee 100%)'
        }}>
        <CssBaseline />
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 460,
            borderRadius: { xs: '24px', sm: '28px' },
            border: '1px solid rgba(38, 52, 33, 0.08)',
            boxShadow: '0 28px 70px rgba(30, 40, 24, 0.10), 0 10px 28px rgba(30, 40, 24, 0.05)',
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 251, 246, 0.98) 100%)',
            overflow: 'hidden',
            position: 'relative',
            alignSelf: { xs: 'stretch', sm: 'center' },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #27411f 0%, #8aa281 100%)'
            }
          }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              px: { xs: 2.25, sm: 5.5 },
              py: { xs: 3, sm: 6.5 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            <Typography
              sx={{
                mb: { xs: 1.75, sm: 2.5 },
                color: '#6a7464',
                fontSize: { xs: '0.68rem', sm: '0.74rem' },
                fontWeight: 700,
                letterSpacing: { xs: '0.18em', sm: '0.22em' },
                textTransform: 'uppercase'
              }}>
              E-Learning
            </Typography>
            <Box
              sx={{
                mb: { xs: 2.25, sm: 3 },
                width: { xs: 112, sm: 154 },
                height: { xs: 112, sm: 154 },
                borderRadius: '50%',
                p: { xs: 1.2, sm: 1.5 },
                background:
                  'radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.98), rgba(246, 249, 243, 0.96) 54%, rgba(232, 239, 226, 0.98) 100%)',
                border: '1px solid rgba(39, 65, 31, 0.10)',
                boxShadow:
                  '0 22px 40px rgba(25, 38, 20, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              <Box
                component="img"
                src="/logo-carbon-edge.png"
                alt="CarbonEdge Logo"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 6px 10px rgba(25, 38, 20, 0.10))'
                }}
              />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 0.75,
                color: '#1f2a1c',
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.45rem', sm: '1.75rem' }
              }}>
              เข้าสู่ระบบ
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                mb: { xs: 2.25, sm: 3 },
                textAlign: 'center',
                maxWidth: { xs: '100%', sm: 320 },
                px: { xs: 0.5, sm: 0 },
                lineHeight: 1.7,
                fontSize: { xs: '0.92rem', sm: '1rem' },
                color: '#6b7468'
              }}>
              เข้าสู่ระบบด้วยชื่อผู้ใช้งานและรหัสผ่านของคุณ
            </Typography>
            <Box sx={{ width: '100%' }}>
              <TextField
                autoFocus
                fullWidth
                label="ชื่อผู้ใช้งาน"
                placeholder="กรอกชื่อผู้ใช้งาน"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                margin="normal"
              />
              <TextField
                fullWidth
                label="รหัสผ่าน"
                placeholder="กรอกรหัสผ่าน"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                margin="normal"
              />
              <Box
                sx={{
                  mt: 0.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1
                }}>
                <Button
                  type="button"
                  variant="text"
                  onClick={() => history.push(ROUTE_PATHS.REGISTER)}
                  sx={{
                    minWidth: 'auto',
                    px: 0,
                    py: 0.5,
                    color: '#27411f',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline'
                    }
                  }}>
                  ลงทะเบียนเข้าใช้งาน
                </Button>
                <Button
                  type="button"
                  variant="text"
                  onClick={() => history.push(ROUTE_PATHS.RESET_PASSWORD)}
                  sx={{
                    minWidth: 'auto',
                    px: 0,
                    py: 0.5,
                    color: '#5f6a58',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: '#27411f',
                      textDecoration: 'underline'
                    }
                  }}>
                  ลืมรหัสผ่าน?
                </Button>
              </Box>
            </Box>
            <Button
              type="submit"
              variant="contained"
              disabled={isOpenLoading}
              sx={{
                mt: { xs: 2.5, sm: 3.5 },
                backgroundColor: '#27411f !important',
                borderRadius: '999px',
                px: { xs: 2.5, sm: 5 },
                py: { xs: 1.45, sm: 1.55 },
                minWidth: { xs: '100%', sm: 240 },
                width: { xs: '100%', sm: 'auto' },
                fontWeight: 700,
                fontSize: { xs: '0.94rem', sm: '0.98rem' },
                letterSpacing: '0.01em',
                boxShadow: '0 12px 28px rgba(39, 65, 31, 0.22)',
                '&:hover': {
                  boxShadow: '0 16px 32px rgba(39, 65, 31, 0.28)'
                }
              }}>
              เข้าสู่ระบบ
            </Button>
          </Box>
        </Paper>
      </Box>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>เกิดข้อผิดพลาด</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-line' }}>{dialogMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setOpenDialog(false)} autoFocus>
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
