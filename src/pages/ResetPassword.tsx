import { useMemo, useState, type FormEvent } from 'react';
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
import { api } from 'api/api';
import { ROUTE_PATHS } from 'routes';

type ResetPasswordApiResponse = {
  sent?: boolean;
  expiresAt?: string;
  accessToken?: string;
  token?: string;
};

const buildResetToken = (search: string): string => {
  const params = new URLSearchParams(search);
  return (params.get('token') || '').trim();
};

export default function ResetPassword(): JSX.Element {
  const history = useHistory();
  const location = useLocation();
  const token = useMemo(() => buildResetToken(location.search), [location.search]);

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('ไม่สามารถดำเนินการได้');
  const [successMessage, setSuccessMessage] = useState('');

  const isResetMode = Boolean(token);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isResetMode) {
      if (!newPassword.trim() || !confirmPassword.trim()) {
        setDialogMessage('กรุณากรอกรหัสผ่านใหม่และยืนยันรหัสผ่านให้ครบถ้วน');
        setOpenDialog(true);
        return;
      }

      if (newPassword !== confirmPassword) {
        setDialogMessage('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
        setOpenDialog(true);
        return;
      }
    } else if (!email.trim()) {
      setDialogMessage('กรุณากรอกอีเมลของคุณ');
      setOpenDialog(true);
      return;
    }

    setIsLoading(true);

    try {
      if (isResetMode) {
        await api.post<ResetPasswordApiResponse>('/auth/reset-password', {
          token,
          newPassword
        });
        setSuccessMessage('ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที');
      } else {
        await api.post<ResetPasswordApiResponse>('/auth/forgot-password', {
          email: email.trim()
        });
        setSuccessMessage('เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว');
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      if (status === 400) {
        setDialogMessage('ข้อมูลที่ส่งไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      } else if (status === 404) {
        setDialogMessage('ไม่พบข้อมูลที่เกี่ยวข้องกับคำขอนี้');
      } else {
        setDialogMessage(message || 'ไม่สามารถดำเนินการได้ในขณะนี้');
      }

      setOpenDialog(true);
    } finally {
      setIsLoading(false);
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
            maxWidth: 520,
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
              flexDirection: 'column'
            }}>
            <Typography
              sx={{
                mb: 1.25,
                color: '#6a7464',
                fontSize: { xs: '0.68rem', sm: '0.74rem' },
                fontWeight: 700,
                letterSpacing: { xs: '0.18em', sm: '0.22em' },
                textTransform: 'uppercase',
                textAlign: 'center'
              }}>
              CarbonEdge Portal
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 0.75,
                color: '#1f2a1c',
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.45rem', sm: '1.75rem' },
                textAlign: 'center'
              }}>
              {isResetMode ? 'ตั้งรหัสผ่านใหม่' : 'ลืมรหัสผ่าน'}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                mb: { xs: 2.25, sm: 3 },
                textAlign: 'center',
                lineHeight: 1.7,
                fontSize: { xs: '0.92rem', sm: '1rem' },
                color: '#6b7468'
              }}>
              {isResetMode
                ? 'กรอกรหัสผ่านใหม่เพื่อใช้งานบัญชีของคุณอีกครั้ง'
                : 'กรอกอีเมลที่ใช้สมัครระบบเพื่อรับลิงก์รีเซ็ตรหัสผ่าน'}
            </Typography>

            {successMessage ? (
              <Box
                sx={{
                  mb: 2.5,
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                  backgroundColor: 'rgba(138, 162, 129, 0.12)',
                  color: '#2f4a25',
                  border: '1px solid rgba(39, 65, 31, 0.10)',
                  lineHeight: 1.7
                }}>
                {successMessage}
              </Box>
            ) : null}

            <Box sx={{ width: '100%' }}>
              {isResetMode ? (
                <>
                  <TextField
                    autoFocus
                    fullWidth
                    label="รหัสผ่านใหม่"
                    placeholder="กรอกรหัสผ่านใหม่"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="ยืนยันรหัสผ่านใหม่"
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    margin="normal"
                  />
                </>
              ) : (
                <TextField
                  autoFocus
                  fullWidth
                  label="อีเมล"
                  placeholder="กรอกอีเมลของคุณ"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  margin="normal"
                />
              )}
            </Box>

            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || Boolean(successMessage)}
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
                alignSelf: 'center',
                '&:hover': {
                  boxShadow: '0 16px 32px rgba(39, 65, 31, 0.28)'
                }
              }}>
              {isResetMode ? 'ตั้งรหัสผ่านใหม่' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
            </Button>

            <Button
              type="button"
              variant="text"
              onClick={() => history.push(ROUTE_PATHS.LOGIN)}
              sx={{
                mt: 1.5,
                color: '#5f6a58',
                fontSize: '0.9rem',
                fontWeight: 600,
                textTransform: 'none',
                alignSelf: 'center',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#27411f',
                  textDecoration: 'underline'
                }
              }}>
              กลับไปหน้าเข้าสู่ระบบ
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
