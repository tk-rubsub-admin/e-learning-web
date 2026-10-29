import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DatabaseBackupJob, DatabaseBackupOverview, DatabaseBackupFile, downloadDatabaseBackup, getDatabaseBackupOverview, getDatabaseBackupStatus, startDatabaseBackup } from 'services/database-backup-api';

const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
const formatSize = (value: number) => value < 1024 * 1024 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1024 / 1024).toFixed(2)} MB`;

export default function DatabaseBackupPage(): JSX.Element {
  const [overview, setOverview] = useState<DatabaseBackupOverview | null>(null);
  const [job, setJob] = useState<DatabaseBackupJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await getDatabaseBackupOverview();
      setOverview(result);
      setJob(result.activeJob || null);
    } catch (error: any) {
      setMessage({ severity: 'error', text: error?.response?.data?.message || 'โหลดข้อมูลสำรองไม่สำเร็จ' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!job || job.status !== 'RUNNING') return undefined;
    const timer = window.setInterval(async () => {
      try {
        const updated = await getDatabaseBackupStatus(job.id);
        setJob(updated);
        if (updated.status !== 'RUNNING') {
          window.clearInterval(timer);
          await load();
          setMessage({ severity: updated.status === 'COMPLETED' ? 'success' : 'error', text: updated.message || (updated.status === 'COMPLETED' ? 'สำรองข้อมูลสำเร็จ' : 'สำรองข้อมูลไม่สำเร็จ') });
        }
      } catch (error: any) {
        setMessage({ severity: 'error', text: error?.response?.data?.message || 'ตรวจสอบสถานะงานสำรองข้อมูลไม่สำเร็จ' });
      }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [job, load]);

  const start = async () => {
    setStarting(true);
    setMessage(null);
    try {
      const started = await startDatabaseBackup();
      setJob(started);
      setMessage({ severity: 'success', text: 'เริ่มสำรองฐานข้อมูลแล้ว สามารถรอจนสถานะเสร็จสมบูรณ์ได้ในหน้านี้' });
    } catch (error: any) {
      setMessage({ severity: 'error', text: error?.response?.data?.message || 'เริ่มสำรองข้อมูลไม่สำเร็จ' });
    } finally {
      setStarting(false);
    }
  };

  const download = async (file: DatabaseBackupFile) => {
    setDownloading(`${file.id}-${file.database}`);
    try {
      await downloadDatabaseBackup(file);
    } catch (error: any) {
      setMessage({ severity: 'error', text: error?.response?.data?.message || 'ดาวน์โหลดไฟล์สำรองไม่สำเร็จ' });
    } finally {
      setDownloading(null);
    }
  };

  return <Box component="main" sx={{ minHeight: '100vh', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 } }}>
    <Paper sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
        <Box><Typography variant="h4" fontWeight={700}>สำรองข้อมูล</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>สำรองฐานข้อมูล elearning และ Moodle ตามคำสั่งผู้ดูแลระบบ</Typography></Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { setLoading(true); void load(); }}>รีเฟรช</Button>
          <Button variant="contained" startIcon={starting || job?.status === 'RUNNING' ? <CircularProgress size={16} color="inherit" /> : <BackupIcon />} disabled={starting || job?.status === 'RUNNING' || !overview?.configured} onClick={() => void start()}>สำรองข้อมูลตอนนี้</Button>
        </Stack>
      </Stack>

      {message && <Alert sx={{ mt: 3 }} severity={message.severity} onClose={() => setMessage(null)}>{message.text}</Alert>}
      <Alert severity="info" sx={{ mt: 3 }}>สำรองเฉพาะข้อมูลในฐานข้อมูล 2 ชุดนี้ ไม่รวม PDF, วิดีโอ, Moodledata หรือไฟล์ต้นฉบับของคอร์ส ไฟล์สำรองถูกบีบอัดและเข้ารหัสก่อนจัดเก็บ</Alert>
      {!loading && overview && !overview.configured && <Alert severity="warning" sx={{ mt: 2 }}>ยังไม่ได้ตั้งค่าการสำรองข้อมูลที่ Backend: กำหนด APP_BACKUP_ENCRYPTION_KEY (Base64 ของคีย์ 32 bytes) และข้อมูลเชื่อมต่อฐานข้อมูลใน environment ของ Backend จากนั้น restart service</Alert>}

      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 7 }}><CircularProgress /></Box> : <>
        <Paper variant="outlined" sx={{ mt: 3, p: 2.5, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={700}>สถานะล่าสุด</Typography>
          {job ? <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Typography>สถานะ: {job.status === 'RUNNING' ? 'กำลังสำรองข้อมูล…' : job.status === 'COMPLETED' ? 'สำเร็จ' : 'ไม่สำเร็จ'}</Typography>
            <Typography variant="body2" color="text.secondary">เริ่มเมื่อ {formatDate(job.startedAt)}{job.finishedAt ? ` · เสร็จเมื่อ ${formatDate(job.finishedAt)}` : ''}</Typography>
            {job.message && job.status !== 'RUNNING' && <Typography variant="body2">{job.message}</Typography>}
          </Stack> : <Typography color="text.secondary" sx={{ mt: 1 }}>ยังไม่มีงานสำรองข้อมูลในเซสชันนี้</Typography>}
        </Paper>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 1.5 }}>ไฟล์สำรองที่มีอยู่</Typography>
        <Stack spacing={1.5}>
          {overview?.files.length ? overview.files.map((file) => <Paper key={`${file.id}-${file.database}`} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
              <Box><Typography fontWeight={700}>{file.database === 'elearning' ? 'ฐานข้อมูล E-Learning' : 'ฐานข้อมูล Moodle'}</Typography><Typography variant="body2" color="text.secondary">{formatDate(file.createdAt)} · {formatSize(file.sizeBytes)}</Typography></Box>
              <Button variant="outlined" startIcon={downloading === `${file.id}-${file.database}` ? <CircularProgress size={16} /> : <DownloadIcon />} disabled={downloading !== null} onClick={() => void download(file)}>ดาวน์โหลด</Button>
            </Stack>
          </Paper>) : <Typography color="text.secondary">ยังไม่มีไฟล์สำรอง</Typography>}
        </Stack>
      </>}
    </Paper>
  </Box>;
}
