import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CssBaseline from '@mui/material/CssBaseline';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SchoolIcon from '@mui/icons-material/School';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from 'auth/AuthContext';
import { ROLES } from 'auth/roles';
import { ROUTE_PATHS } from 'routes';
import {
  getCategories,
  deleteCourse,
  getMyCourseLaunch,
  searchSystemCourses,
  type CategoryOption,
  type CourseSummary
} from 'services/course-api';

const normalizeText = (value?: string | null): string => (value || '').trim();

export default function LearningCoursesPage(): JSX.Element {
  const history = useHistory();
  const { getRole } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('ไม่สามารถโหลดคอร์สได้');
  const [coursePendingDelete, setCoursePendingDelete] = useState<CourseSummary | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      try {
        const [courseData, categoryData] = await Promise.all([
          searchSystemCourses(),
          getCategories()
        ]);
        if (!active) return;
        setCourses(courseData);
        setCategories(categoryData);
      } catch (error: any) {
        if (!active) return;
        setErrorMessage(error?.response?.data?.message || 'ไม่สามารถโหลดคอร์สได้ในขณะนี้');
        setOpenErrorDialog(true);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      active = false;
    };
  }, []);

  const categoryNameById = useMemo(
    () =>
      new Map(
        categories
          .filter((category) => category.id != null)
          .map((category) => [category.id, category.name] as const)
      ),
    [categories]
  );

  const filteredCourses = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return courses;

    return courses.filter((course) => {
      const haystack = [
        course.shortName,
        course.fullName,
        course.displayName,
        course.summary,
        course.categoryId == null ? '' : categoryNameById.get(course.categoryId) || ''
      ]
        .map((value) => normalizeText(value).toLowerCase())
        .join(' ');

      return haystack.includes(keyword);
    });
  }, [courses, search, categoryNameById]);

  const stats = useMemo(
    () => ({
      total: courses.length,
      filtered: filteredCourses.length
    }),
    [courses.length, filteredCourses.length]
  );

  const currentRole = getRole();
  const canCreateCourse = currentRole === ROLES.ADMIN;
  const canStartCourse = currentRole !== ROLES.ADMIN;
  const canViewCourseDetails = currentRole !== ROLES.STUDENT;

  const handleDeleteCourse = async () => {
    if (!coursePendingDelete) return;
    const target = coursePendingDelete;
    setDeletingCourseId(target.id);
    try {
      await deleteCourse(target.id);
      setCourses((current) => current.filter((course) => course.id !== target.id));
      setCoursePendingDelete(null);
    } catch (error: any) {
      setCoursePendingDelete(null);
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถลบคอร์สได้ในขณะนี้');
      setOpenErrorDialog(true);
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handleStartCourse = async (courseId: number) => {
    try {
      const launch = await getMyCourseLaunch(courseId);
      const launchUrl = launch.launchUrl;
      if (!launchUrl) {
        setErrorMessage('ไม่พบลิงก์เข้าเรียน');
        setOpenErrorDialog(true);
        return;
      }

      window.open(launchUrl, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถเปิดลิงก์เข้าเรียนได้ในขณะนี้');
      setOpenErrorDialog(true);
    }
  };

  return (
    <>
      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 3 }
        }}>
        <CssBaseline />

        <Paper
          elevation={0}
          sx={{
            maxWidth: 1320,
            mx: 'auto',
            borderRadius: { xs: 3, sm: 4 },
            overflow: 'hidden',
            border: '1px solid rgba(39, 65, 31, 0.08)',
            boxShadow: '0 24px 60px rgba(27, 38, 22, 0.08)'
          }}>
          <Box
            sx={{
              px: { xs: 2.5, sm: 4 },
              py: { xs: 3, sm: 4 },
              color: '#fff',
              background: 'linear-gradient(135deg, #17361e 0%, #244c2a 52%, #3f6c3a 100%)'
            }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', md: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap',
                mb: 1.25,
                width: '100%'
              }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                  <SchoolIcon />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.78rem',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      opacity: 0.8,
                      fontWeight: 700
                    }}>
                    CarbonEdge Learning
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                    คอร์สเรียน
                  </Typography>
                </Box>
              </Box>

              {canCreateCourse ? (
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => history.push(ROUTE_PATHS.COURSE_CREATE)}
                  sx={{
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 700,
                    bgcolor: 'rgba(255,255,255,0.14)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.18)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.20)'
                    }
                  }}>
                  เพิ่มคอร์ส
                </Button>
              ) : null}
            </Box>
            <Typography sx={{ maxWidth: 760, lineHeight: 1.7, opacity: 0.9 }}>
              หน้านี้สำหรับผู้ดูแลระบบ ใช้ดูและจัดการคอร์สเรียนที่มีอยู่ในระบบ
            </Typography>
          </Box>

          <Box sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 2.5, sm: 3 } }}>
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.25,
                    borderRadius: 3,
                    borderColor: 'rgba(39, 65, 31, 0.08)',
                    backgroundColor: '#fff'
                  }}>
                  <Typography variant="overline" sx={{ color: '#6f7d68', fontWeight: 700 }}>
                    ทั้งหมด
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#20301d' }}>
                    {stats.total}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.25,
                    borderRadius: 3,
                    borderColor: 'rgba(39, 65, 31, 0.08)',
                    backgroundColor: '#fff'
                  }}>
                  <Typography variant="overline" sx={{ color: '#6f7d68', fontWeight: 700 }}>
                    ผลลัพธ์ที่กรอง
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#20301d' }}>
                    {stats.filtered}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              placeholder="ค้นหาคอร์สด้วยชื่อ, short name หรือรายละเอียด"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#6c7a66', mr: 1 }} />
              }}
              sx={{
                mb: 3,
                '& .MuiInputBase-root': {
                  bgcolor: '#fff',
                  borderRadius: 3
                }
              }}
            />

            {isLoading ? (
              <Box
                sx={{
                  minHeight: 320,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#62715b'
                }}>
                กำลังโหลดคอร์ส...
              </Box>
            ) : filteredCourses.length === 0 ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  borderRadius: 3,
                  borderStyle: 'dashed',
                  textAlign: 'center',
                  color: '#5f6a58'
                }}>
                ไม่พบคอร์สที่ตรงกับคำค้น
              </Paper>
            ) : (
              <Grid container spacing={2.5}>
                {filteredCourses.map((course) => (
                  <Grid item xs={12} md={6} lg={4} key={course.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        borderColor: 'rgba(39, 65, 31, 0.10)',
                        boxShadow: '0 12px 28px rgba(27, 38, 22, 0.05)',
                        transition: 'transform 180ms ease, box-shadow 180ms ease',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 18px 34px rgba(27, 38, 22, 0.10)'
                        }
                      }}>
                      <CardContent sx={{ flex: 1, pb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <Chip
                            label={course.shortName || `Course ${course.id}`}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(39, 65, 31, 0.10)',
                              color: '#244026',
                              fontWeight: 700
                            }}
                          />
                          {course.categoryId != null ? (
                            <Chip
                              label={categoryNameById.get(course.categoryId) || `Category ${course.categoryId}`}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: 'rgba(39, 65, 31, 0.18)', color: '#5e6c59' }}
                            />
                          ) : null}
                        </Box>

                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 800, color: '#1f2b1d', lineHeight: 1.3, mb: 1 }}>
                          {course.displayName || course.fullName}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            color: '#687266',
                            lineHeight: 1.75,
                            minHeight: 72,
                            whiteSpace: 'pre-wrap'
                          }}>
                          {course.summary || 'ไม่มีรายละเอียดเพิ่มเติม'}
                        </Typography>
                      </CardContent>

                      <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1, flexWrap: 'wrap' }}>
                        {canViewCourseDetails ? (
                          <Button
                            variant="outlined"
                            onClick={() =>
                              history.push(ROUTE_PATHS.COURSE_DETAIL.replace(':id', String(course.id)))
                            }
                            sx={{
                              borderRadius: 999,
                              textTransform: 'none',
                              fontWeight: 700
                            }}>
                            ดูรายละเอียด
                          </Button>
                        ) : null}
                        {currentRole === ROLES.ADMIN ? (
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => setCoursePendingDelete(course)}
                            disabled={deletingCourseId != null}
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>
                            ลบคอร์ส
                          </Button>
                        ) : null}
                        {canStartCourse ? (
                          <Button
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => handleStartCourse(course.id)}
                            sx={{
                              borderRadius: 999,
                              textTransform: 'none',
                              fontWeight: 700,
                              backgroundColor: '#244026 !important'
                            }}>
                            เข้าเรียน
                          </Button>
                        ) : null}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Paper>
      </Box>

      <Dialog open={openErrorDialog} onClose={() => setOpenErrorDialog(false)}>
        <DialogTitle>เกิดข้อผิดพลาด</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-line' }}>{errorMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setOpenErrorDialog(false)} autoFocus>
            Ok
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={coursePendingDelete !== null}
        onClose={() => deletingCourseId === null && setCoursePendingDelete(null)}
        aria-labelledby="delete-course-dialog-title">
        <DialogTitle id="delete-course-dialog-title">ยืนยันการลบคอร์ส</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ต้องการลบคอร์ส “{coursePendingDelete?.displayName || coursePendingDelete?.fullName}” ใช่หรือไม่?
            การลบจะนำคอร์สและเนื้อหาที่ผูกไว้ใน Moodle ออกจากระบบ และไม่สามารถย้อนกลับได้
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCoursePendingDelete(null)} disabled={deletingCourseId !== null}>ยกเลิก</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleDeleteCourse()}
            disabled={deletingCourseId !== null}
            startIcon={deletingCourseId === coursePendingDelete?.id ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}>
            {deletingCourseId === coursePendingDelete?.id ? 'กำลังลบ...' : 'ยืนยันลบคอร์ส'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
