import { useEffect, useState, type FormEvent } from 'react';
import { useHistory } from 'react-router-dom';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useAuth } from 'auth/AuthContext';
import { ROUTE_PATHS } from 'routes';
import { getUserProfile, updateStudentProfile } from 'services/general-api';

const GENERATED_EMAIL_SUFFIX = '@users.carbonedge.invalid';

export default function ProfilePage(): JSX.Element {
  const history = useHistory();
  const { refreshUserProfile, needsProfileCompletion } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    getUserProfile()
      .then((profile) => {
        if (!active) return;
        setUsername(profile.username);
        setEmail(profile.email?.endsWith(GENERATED_EMAIL_SUFFIX) ? '' : profile.email || '');
        setFirstName(profile.firstName === profile.username ? '' : profile.firstName || '');
        setLastName(profile.lastName === '-' ? '' : profile.lastName || '');
      })
      .catch((error: any) => {
        if (active) setErrorMessage(error?.response?.data?.message || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedEmail || !trimmedFirstName || !trimmedLastName) {
      setErrorMessage('กรุณากรอกอีเมล ชื่อ และนามสกุลให้ครบถ้วน');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setErrorMessage('กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }

    setIsSaving(true);
    try {
      await updateStudentProfile({
        email: trimmedEmail,
        firstName: trimmedFirstName,
        lastName: trimmedLastName
      });
      await refreshUserProfile();
      history.replace(ROUTE_PATHS.COURSES);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถอัปเดตโปรไฟล์ได้ในขณะนี้');
    } finally {
      setIsSaving(false);
    }
  };

  const profileRequired = needsProfileCompletion();

  return (
    <>
      <Box component="main" sx={{ px: { xs: 0, sm: 2 }, py: { xs: 1, sm: 3 } }}>
        <Paper elevation={0} sx={{ maxWidth: 720, mx: 'auto', overflow: 'hidden', borderRadius: 4, border: '1px solid rgba(39, 65, 31, 0.08)', boxShadow: '0 24px 60px rgba(27, 38, 22, 0.08)' }}>
          <Box sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 }, color: '#fff', background: 'linear-gradient(135deg, #17361e 0%, #244c2a 52%, #3f6c3a 100%)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.14)', display: 'grid', placeItems: 'center' }}>
                <AccountCircleOutlinedIcon />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Student Profile</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15 }}>ข้อมูลโปรไฟล์</Typography>
              </Box>
            </Box>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Typography sx={{ mb: 2, color: '#64705e', lineHeight: 1.7 }}>
              {profileRequired
                ? 'กรุณากรอกข้อมูลโปรไฟล์ให้ครบถ้วนก่อนเริ่มใช้งานระบบ'
                : 'แก้ไขชื่อ นามสกุล และอีเมลที่ใช้ใน CarbonEdge และ Moodle'}
            </Typography>
            <TextField fullWidth disabled label="ชื่อผู้ใช้งาน" value={username} margin="normal" />
            <TextField autoFocus fullWidth required disabled={isLoading} label="อีเมล" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" margin="normal" />
            <TextField fullWidth required disabled={isLoading} label="ชื่อ" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" margin="normal" inputProps={{ maxLength: 100 }} />
            <TextField fullWidth required disabled={isLoading} label="นามสกุล" value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" margin="normal" inputProps={{ maxLength: 100 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.25, mt: 3 }}>
              {!profileRequired ? (
                <Button type="button" variant="outlined" disabled={isSaving} onClick={() => history.push(ROUTE_PATHS.COURSES)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>ยกเลิก</Button>
              ) : null}
              <Button type="submit" variant="contained" disabled={isLoading || isSaving} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, backgroundColor: '#244026 !important' }}>
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Dialog open={!!errorMessage} onClose={() => setErrorMessage('')}>
        <DialogTitle>เกิดข้อผิดพลาด</DialogTitle>
        <DialogContent><DialogContentText>{errorMessage}</DialogContentText></DialogContent>
        <DialogActions><Button variant="contained" onClick={() => setErrorMessage('')}>ตกลง</Button></DialogActions>
      </Dialog>
    </>
  );
}
