import { useState, type FormEvent } from 'react';
import { useHistory } from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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

export default function CreateStudentPage(): JSX.Element {
  const history = useHistory();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('ไม่สามารถสร้างนักเรียนได้');
  const [formStartedAt] = useState(() => Date.now());

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านให้ครบถ้วน');
      setOpenErrorDialog(true);
      return;
    }
    if (!/^[a-zA-Z0-9._-]{3,50}$/.test(trimmedUsername)) {
      setErrorMessage('ชื่อผู้ใช้งานต้องมี 3-50 ตัวอักษร และใช้ได้เฉพาะ a-z, A-Z, 0-9, จุด, ขีดกลาง หรือขีดล่าง');
      setOpenErrorDialog(true);
      return;
    }
    if (password.length < 8) {
      setErrorMessage('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      setOpenErrorDialog(true);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      setOpenErrorDialog(true);
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/auth/register', { username: trimmedUsername, password, website: '', formStartedAt });
      history.replace(ROUTE_PATHS.STUDENTS);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถสร้างนักเรียนได้ในขณะนี้');
      setOpenErrorDialog(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Box component="main" sx={{ minHeight: '100vh', px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1, sm: 2 } }}>
        <CssBaseline />
        <Paper elevation={0} sx={{ maxWidth: 720, mx: 'auto', overflow: 'hidden', borderRadius: 4, border: '1px solid rgba(39, 65, 31, 0.08)', boxShadow: '0 24px 60px rgba(27, 38, 22, 0.08)' }}>
          <Box sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 }, color: '#fff', background: 'linear-gradient(135deg, #17361e 0%, #244c2a 52%, #3f6c3a 100%)' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => history.push(ROUTE_PATHS.STUDENTS)} sx={{ mb: 2, px: 0, color: 'rgba(255,255,255,0.9)', textTransform: 'none', fontWeight: 700 }}>
              กลับไปรายชื่อนักเรียน
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.14)', display: 'grid', placeItems: 'center' }}><AddCircleOutlineIcon /></Box>
              <Box>
                <Typography sx={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Student Management</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15 }}>สร้างนักเรียนใหม่</Typography>
              </Box>
            </Box>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Typography sx={{ mb: 2.5, color: '#64705e', lineHeight: 1.7 }}>
              ระบุข้อมูลสำหรับเข้าสู่ระบบของนักเรียน ระบบจะสร้างบัญชีใน CarbonEdge และ Moodle ให้โดยอัตโนมัติ
            </Typography>
            <TextField autoFocus fullWidth required label="ชื่อผู้ใช้งาน" placeholder="เช่น student.001" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" margin="normal" />
            <TextField fullWidth required label="รหัสผ่าน" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" margin="normal" />
            <TextField fullWidth required label="ยืนยันรหัสผ่าน" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" margin="normal" />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.25, mt: 3 }}>
              <Button type="button" variant="outlined" disabled={isSaving} onClick={() => history.push(ROUTE_PATHS.STUDENTS)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>ยกเลิก</Button>
              <Button type="submit" variant="contained" disabled={isSaving} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, backgroundColor: '#244026 !important' }}>สร้างนักเรียน</Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Dialog open={openErrorDialog} onClose={() => setOpenErrorDialog(false)}>
        <DialogTitle>เกิดข้อผิดพลาด</DialogTitle>
        <DialogContent><DialogContentText>{errorMessage}</DialogContentText></DialogContent>
        <DialogActions><Button variant="contained" onClick={() => setOpenErrorDialog(false)}>ตกลง</Button></DialogActions>
      </Dialog>
    </>
  );
}
