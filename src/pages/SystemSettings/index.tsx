import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import HistoryIcon from '@mui/icons-material/History';
import SaveIcon from '@mui/icons-material/Save';
import SyncIcon from '@mui/icons-material/Sync';
import { getSystemSettingAudit, getSystemSettings, testMailConnection, testMoodleConnection, updateSystemSetting, type SystemSetting, type SystemSettingAudit } from 'services/system-settings-api';

const FIELDS = [
  { key: 'moodle.base-url', label: 'Moodle Base URL', help: 'URL สำหรับ Moodle Web Service เช่น http://localhost:8085/lms' },
  { key: 'moodle.login-base-url', label: 'Moodle Login URL', help: 'URL ที่ผู้เรียนจะถูกส่งไปเปิดบทเรียน' },
  { key: 'moodle.service-token', label: 'Moodle Service Token', help: 'เก็บแบบปกปิด ค่าเดิมจะไม่ถูกส่งกลับมา', secret: true },
  { key: 'moodle.launch-shared-secret', label: 'Launch Shared Secret', help: 'ต้องตั้งค่าเดียวกับ Moodle plugin หลังเปลี่ยนค่าให้ Sync ด้วยตนเอง', secret: true },
  { key: 'moodle.launch-token-ttl-seconds', label: 'Launch Token อายุ (วินาที)', help: 'กำหนดได้ 30–3,600 วินาที', type: 'number' },
  { key: 'learning.max-upload-size-mb', label: 'ขนาดไฟล์เนื้อหาสูงสุด (MB.)', help: 'กำหนดได้ 1-1,024 MB; ค่าแนะนำ 1,024 MB รองรับวิดีโอ 720p ความยาวไม่เกิน 30 นาที และมีผลหลัง restart lms-api', type: 'number' }
  , { key: 'mail.host', label: 'SMTP Host', help: 'เช่น smtp.gmail.com' }
  , { key: 'mail.port', label: 'SMTP Port', help: 'เช่น 587', type: 'number' }
  , { key: 'mail.username', label: 'SMTP Username', help: 'ชื่อผู้ใช้สำหรับส่งอีเมล' }
  , { key: 'mail.password', label: 'SMTP Password', help: 'เก็บแบบปกปิด ค่าเดิมจะไม่ถูกส่งกลับมา', secret: true }
] as const;

const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'ใช้ค่าจาก environment';

export default function SystemSettingsPage(): JSX.Element {
  const [settings, setSettings] = useState<Record<string, SystemSetting>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [audit, setAudit] = useState<SystemSettingAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testingMail, setTestingMail] = useState(false);
  const [message, setMessage] = useState<{ severity: 'success' | 'error' | 'info'; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [items, audits] = await Promise.all([getSystemSettings(), getSystemSettingAudit()]);
      const itemMap = Object.fromEntries(items.map((item) => [item.key, item]));
      setSettings(itemMap);
      setValues(Object.fromEntries(items.filter((item) => !item.secret).map((item) => [item.key, item.value])));
      setAudit(audits);
    } catch (error: any) {
      setMessage({ severity: 'error', text: error?.response?.data?.message || 'ไม่สามารถโหลดการตั้งค่าระบบได้' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const hasConfiguredSecret = useMemo(() => (key: string) => !!settings[key]?.configured, [settings]);

  const save = async (key: string, isSecret?: boolean) => {
    const value = (values[key] || '').trim();
    if (!value) {
      setMessage({ severity: 'error', text: 'กรุณาระบุค่าใหม่ก่อนบันทึก' });
      return;
    }
    setSaving(key);
    try {
      const saved = await updateSystemSetting(key, value);
      setSettings((current) => ({ ...current, [key]: saved }));
      if (isSecret) setValues((current) => ({ ...current, [key]: '' }));
      const audits = await getSystemSettingAudit();
      setAudit(audits);
      setMessage({ severity: 'success', text: 'บันทึกการตั้งค่าแล้ว' });
    } catch (error: any) {
      setMessage({ severity: 'error', text: error?.response?.data?.message || 'บันทึกการตั้งค่าไม่สำเร็จ' });
    } finally {
      setSaving(null);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      await testMoodleConnection();
      setMessage({ severity: 'success', text: 'เชื่อมต่อ Moodle สำเร็จ' });
    } catch (error: any) {
      setMessage({ severity: 'error', text: error?.response?.data?.message || 'เชื่อมต่อ Moodle ไม่สำเร็จ' });
    } finally {
      setTesting(false);
    }
  };

  const testMail = async () => {
    setTestingMail(true);
    try {
      await testMailConnection();
      setMessage({ severity: 'success', text: 'เชื่อมต่อ SMTP สำเร็จ' });
    } catch (error: any) {
      setMessage({ severity: 'error', text: error?.response?.data?.message || 'เชื่อมต่อ SMTP ไม่สำเร็จ' });
    } finally {
      setTestingMail(false);
    }
  };

  return (
    <Box component="main" sx={{ minHeight: '100vh', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 } }}>
      <Paper sx={{ maxWidth: 980, mx: 'auto', p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ sm: 'center' }}>
          <Box>
            <Typography variant="h4">ตั้งค่าระบบ</Typography>
          </Box>
          <Button variant="outlined" startIcon={testing ? <CircularProgress size={16} /> : <SyncIcon />} disabled={testing} onClick={testConnection}>
            ทดสอบการเชื่อมต่อ Moodle
          </Button>
          <Button variant="outlined" startIcon={testingMail ? <CircularProgress size={16} /> : <SyncIcon />} disabled={testingMail} onClick={testMail}>
            ทดสอบ SMTP
          </Button>
        </Stack>

        {message && <Alert sx={{ mt: 3 }} severity={message.severity} onClose={() => setMessage(null)}>{message.text}</Alert>}

        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box> : (
          <>
            <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>Moodle Integration</Typography>
            <Alert severity="warning" sx={{ mb: 3 }}>เมื่อเปลี่ยน Launch Shared Secret ต้องเปลี่ยนค่าเดียวกันใน Moodle plugin ด้วย มิฉะนั้นการเข้าเรียนจะใช้งานไม่ได้</Alert>
            <Stack spacing={3}>
              {FIELDS.map((field) => {
                const setting = settings[field.key];
                const secret = setting?.secret === true || field.secret === true;
                return <Box key={field.key}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }}>
                    <TextField
                      fullWidth
                      label={field.label}
                      type={secret ? 'password' : field.type || 'text'}
                      value={secret && hasConfiguredSecret(field.key) ? '********************************' : values[field.key] || ''}
                      onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
                      helperText={`${field.help}${secret && hasConfiguredSecret(field.key) ? ' · ค่าเดิมถูกปกปิด; กรอกค่าใหม่เมื่อต้องการเปลี่ยน' : ''} · ${formatDate(setting?.updatedAt)}${setting?.updatedBy ? ` โดย ${setting.updatedBy}` : ''}`}
                    />
                    <Button sx={{ minWidth: 94, mt: { sm: 1 } }} variant="contained" startIcon={saving === field.key ? <CircularProgress size={16} /> : <SaveIcon />} disabled={saving !== null} onClick={() => save(field.key, secret)}>บันทึก</Button>
                  </Stack>
                </Box>;
              })}
            </Stack>

            <Divider sx={{ my: 4 }} />
            <Stack direction="row" spacing={1} alignItems="center"><HistoryIcon /><Typography variant="h6">ประวัติ 50 รายการล่าสุด</Typography></Stack>
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              {audit.length === 0 ? <Typography color="text.secondary">ยังไม่มีประวัติการเปลี่ยนแปลง</Typography> : audit.map((entry) => (
                <Box key={entry.id} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="body2"><b>{entry.key}</b> เปลี่ยนจาก {entry.oldValue || '(ค่าเริ่มต้น)'} เป็น {entry.newValue || '(ว่าง)'}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatDate(entry.changedAt)}{entry.changedBy ? ` โดย ${entry.changedBy}` : ''}</Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}
      </Paper>
    </Box>
  );
}
