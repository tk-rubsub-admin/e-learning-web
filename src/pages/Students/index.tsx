import { useEffect, useState, type ChangeEvent } from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckIcon from '@mui/icons-material/Check';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { ROUTE_PATHS } from 'routes';
import { approveStudent, bulkCreateStudents, searchStudents, suspendStudent, type StudentSearchResult } from 'services/course-api';
import { Cancel, Close } from '@mui/icons-material';

const rowsPerPage = 5;

export default function StudentsPage(): JSX.Element {
  const history = useHistory();
  const [keyword, setKeyword] = useState('');
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('ไม่สามารถโหลดรายชื่อนักเรียนได้');
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [openBulkResultDialog, setOpenBulkResultDialog] = useState(false);
  const [bulkResultMessage, setBulkResultMessage] = useState('');
  const [failedRows, setFailedRows] = useState<Array<{ rowNumber: number; username: string; message: string }>>([]);
  const [studentToApprove, setStudentToApprove] = useState<StudentSearchResult | null>(null);
  const [studentAction, setStudentAction] = useState<'approve' | 'suspend'>('approve');
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        const data = await searchStudents(keyword, page, rowsPerPage);
        if (!active) return;
        setStudents(data.items || []);
        setPageCount(Math.max(1, data.totalPages || 0));
        setTotalElements(data.totalElements || 0);
      } catch (error: any) {
        if (!active) return;
        setErrorMessage(error?.response?.data?.message || 'ไม่สามารถโหลดรายชื่อนักเรียนได้ในขณะนี้');
        setOpenErrorDialog(true);
      } finally {
        if (active) setIsLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [keyword, page, refreshKey]);

  const handleBulkUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsBulkUploading(true);
    try {
      const result = await bulkCreateStudents(file);
      setBulkResultMessage(
        `อ่านทั้งหมด ${result.totalRows} แถว\n` +
        `สร้างสำเร็จ ${result.createdCount} คน\n` +
        `ไม่สำเร็จ ${result.failedCount} คน`
      );
      setFailedRows(
        (result.results || [])
          .filter((item) => item.status === 'FAILED')
          .map((item) => ({
            rowNumber: item.rowNumber,
            username: item.username,
            message: item.message
          }))
      );
      setPage(1);
      setRefreshKey((current) => current + 1);
      setOpenBulkResultDialog(true);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถอัปโหลดไฟล์นักเรียนได้ในขณะนี้');
      setOpenErrorDialog(true);
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleApproveStudent = async () => {
    if (!studentToApprove) return;
    setIsApproving(true);
    try {
      if (studentAction === 'suspend') {
        await suspendStudent(studentToApprove.id);
      } else {
        await approveStudent(studentToApprove.id);
      }
      setStudentToApprove(null);
      setRefreshKey((current) => current + 1);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะผู้เรียนได้ในขณะนี้');
      setOpenErrorDialog(true);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <>
      <Box component="main" sx={{ minHeight: '100vh', px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1, sm: 2 } }}>
        <CssBaseline />
        <Paper elevation={0} sx={{ maxWidth: 1180, mx: 'auto', overflow: 'hidden', borderRadius: 4, border: '1px solid rgba(39, 65, 31, 0.08)', boxShadow: '0 24px 60px rgba(27, 38, 22, 0.08)' }}>
          <Box sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 }, color: '#fff', background: 'linear-gradient(135deg, #17361e 0%, #244c2a 52%, #3f6c3a 100%)' }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.14)', display: 'grid', placeItems: 'center' }}>
                <PeopleIcon />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>
                  CarbonEdge Learning
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15 }}>นักเรียน</Typography>
              </Box>
            </Stack>
            <Typography sx={{ mt: 1.5, maxWidth: 680, lineHeight: 1.7, opacity: 0.9 }}>
              ค้นหาและตรวจสอบรายชื่อนักเรียนในระบบ
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 2, sm: 3.5 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 2.5 }}>
              <TextField
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(1);
                }}
                placeholder="ค้นหาชื่อ, username หรือ email"
                InputProps={{ startAdornment: <SearchIcon sx={{ color: '#75806e', mr: 1 }} /> }}
                sx={{ width: { xs: '100%', sm: 380 } }}
              />
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip label={`ทั้งหมด ${totalElements} คน`} sx={{ fontWeight: 800, color: '#244026', backgroundColor: '#edf3e9' }} />
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={isBulkUploading ? <CircularProgress size={16} /> : <UploadFileIcon />}
                  disabled={isBulkUploading}
                  title="ไฟล์ Excel ต้องมีคอลัมน์ username และ password"
                  sx={{ borderRadius: 999, fontWeight: 800, textTransform: 'none', color: '#244026', borderColor: 'rgba(36, 64, 38, 0.35)' }}>
                  {isBulkUploading ? 'กำลังอัปโหลด...' : 'Bulk Upload'}
                  <input
                    hidden
                    type="file"
                    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.xlsx,.xls"
                    onChange={handleBulkUpload}
                  />
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => history.push(ROUTE_PATHS.STUDENT_CREATE)}
                  sx={{ borderRadius: 999, fontWeight: 800, textTransform: 'none', backgroundColor: '#244026 !important' }}>
                  สร้างนักเรียนใหม่
                </Button>
              </Stack>
            </Stack>

            <Stack spacing={1.25}>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
              ) : students.length ? (
                students.map((student) => {
                  const fullName = [student.firstName, student.lastName].filter(Boolean).join(' ').trim();
                  return (
                    <Paper key={student.id} variant="outlined" sx={{ p: { xs: 1.75, sm: 2 }, borderRadius: 3, borderColor: 'rgba(39, 65, 31, 0.10)' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: '#20301d' }}>{fullName || student.username}</Typography>
                          <Typography variant="body2" sx={{ color: '#6a7564', mt: 0.25 }}>{student.username}{student.email ? ` • ${student.email}` : ''}</Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                          <Chip size="small" label={student.status || student.role || 'STUDENT'} sx={{ fontWeight: 700 }} />
                          <Tooltip title="อนุมัติผู้เรียน">
                            <IconButton
                              size="small"
                              disabled={student.status === 'ACTIVE'}
                              aria-label={`อนุมัติ ${student.username}`}
                              onClick={() => {
                                setStudentAction('approve');
                                setStudentToApprove(student);
                              }}
                              sx={{ color: '#2e7d32', backgroundColor: 'rgba(46, 125, 50, 0.08)', '&:hover': { backgroundColor: 'rgba(46, 125, 50, 0.16)' } }}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ระงับการใช้งานผู้เรียน">
                            <IconButton
                              size="small"
                              disabled={student.status !== 'ACTIVE'}
                              aria-label={`ระงับการใช้งาน ${student.username}`}
                              onClick={() => {
                                setStudentAction('suspend');
                                setStudentToApprove(student);
                              }}
                              sx={{ color: '#ff0e0eff', backgroundColor: 'rgba(205, 83, 83, 0.08)', '&:hover': { backgroundColor: 'rgba(205, 83, 83, 0.16)' } }}
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })
              ) : (
                <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderStyle: 'dashed', textAlign: 'center', color: '#6a7564' }}>
                  ไม่พบรายชื่อนักเรียน
                </Paper>
              )}
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={1.5} sx={{ pt: 3 }}>
              <Typography variant="body2" sx={{ color: '#6a7564' }}>
                หน้า {page} จาก {pageCount}
              </Typography>
              <Box>
                <Pagination count={pageCount} page={page} onChange={(_, value) => setPage(value)} color="primary" />
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Box>

      <Dialog open={openErrorDialog} onClose={() => setOpenErrorDialog(false)}>
        <DialogTitle>เกิดข้อผิดพลาด</DialogTitle>
        <DialogContent><DialogContentText>{errorMessage}</DialogContentText></DialogContent>
        <DialogActions><Button variant="contained" onClick={() => setOpenErrorDialog(false)}>ตกลง</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(studentToApprove)} onClose={() => !isApproving && setStudentToApprove(null)}>
        <DialogTitle>{studentAction === 'suspend' ? 'ยืนยันการระงับการใช้งาน' : 'ยืนยันการอนุมัติผู้เรียน'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {studentAction === 'suspend'
              ? `ต้องการระงับการใช้งานผู้เรียน ${studentToApprove?.username} ใช่หรือไม่?`
              : `ต้องการ Approve ผู้เรียน ${studentToApprove?.username} ใช่หรือไม่?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentToApprove(null)} disabled={isApproving}>ยกเลิก</Button>
          <Button variant="contained" color={studentAction === 'suspend' ? 'warning' : 'primary'} onClick={handleApproveStudent} disabled={isApproving} startIcon={isApproving ? <CircularProgress size={16} /> : <CheckIcon />}>
            {isApproving ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openBulkResultDialog} onClose={() => setOpenBulkResultDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>สรุปผลการสร้างนักเรียน</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-line', mb: failedRows.length ? 2 : 0 }}>
            {bulkResultMessage}
          </DialogContentText>
          {failedRows.length ? (
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 800, color: '#b24c23' }}>รายการที่สร้างไม่สำเร็จ</Typography>
              {failedRows.map((item) => (
                <Paper key={`${item.rowNumber}-${item.username}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    แถว {item.rowNumber}: {item.username || '(ไม่มี username)'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9a5b36' }}>{item.message}</Typography>
                </Paper>
              ))}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setOpenBulkResultDialog(false)}>ตกลง</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
