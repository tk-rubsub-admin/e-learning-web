import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CircularProgress,
  CssBaseline,
  Grid,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { useAuth } from 'auth/AuthContext';
import { ROUTE_PATHS } from 'routes';
import { getCategories } from 'services/category-api';
import { searchStudents, searchSystemCourses, type CourseSummary } from 'services/course-api';
import { getSatisfactionResults, listSatisfactionSurveys } from 'services/satisfaction-api';

type DashboardData = {
  courses: CourseSummary[];
  studentCount: number;
  categoryCount: number;
  averageRating: number | null;
};

const quickLinks = [
  { title: 'จัดการคอร์ส', description: 'สร้าง แก้ไข และดูแลคอร์สเรียน', path: ROUTE_PATHS.LEARNING_COURSES, icon: MenuBookRoundedIcon, color: '#315c37' },
  { title: 'จัดการนักเรียน', description: 'ค้นหา เพิ่ม และตรวจสอบสถานะผู้เรียน', path: ROUTE_PATHS.STUDENTS, icon: GroupsRoundedIcon, color: '#2f6e7c' },
  { title: 'หมวดหมู่คอร์ส', description: 'จัดระเบียบคอร์สตามหมวดหมู่', path: ROUTE_PATHS.CATEGORIES, icon: AutoStoriesRoundedIcon, color: '#a26a35' },
  { title: 'ประวัติการเรียน', description: 'ตรวจสอบกิจกรรมการเรียนและผล quiz', path: ROUTE_PATHS.LEARNING_HISTORY, icon: HistoryRoundedIcon, color: '#8057a5' },
  { title: 'แบบประเมินความพึงพอใจ', description: 'สร้างหัวข้อและดูผลการประเมินจากผู้เรียน', path: ROUTE_PATHS.SATISFACTION, icon: RateReviewRoundedIcon, color: '#487e72' },
  { title: 'ตั้งค่าระบบ', description: 'จัดการการตั้งค่าและการเชื่อมต่อ', path: ROUTE_PATHS.SYSTEM_SETTINGS, icon: SettingsRoundedIcon, color: '#8b6b32' }
];

function StatCard({ label, value, detail, icon: Icon, color }: {
  label: string;
  value: number | string;
  detail: string;
  icon: typeof MenuBookRoundedIcon;
  color: string;
}): JSX.Element {
  return (
    <Paper elevation={0} sx={{ height: '100%', p: 2.5, borderRadius: 3, border: '1px solid #e7ece5', bgcolor: '#fff' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>{label}</Typography>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 1, color: '#203624' }}>{value}</Typography>
        </Box>
        <Avatar variant="rounded" sx={{ width: 46, height: 46, bgcolor: `${color}16`, color, borderRadius: 2.5 }}>
          <Icon />
        </Avatar>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>{detail}</Typography>
    </Paper>
  );
}

export default function AdminDashboard(): JSX.Element {
  const history = useHistory();
  const { getUsername } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([searchSystemCourses(), searchStudents(undefined, 1, 1), getCategories()])
      .then(async ([courses, students, categories]) => {
        const surveys = await listSatisfactionSurveys();
        const results = await Promise.all(surveys.filter((survey) => survey.defaultSurvey)
          .map((survey) => getSatisfactionResults(survey.id)));
        const ratingAnswers = results.flatMap((result) => result.questions)
          .filter((question) => question.type === 'RATING' && question.averageRating != null)
          .reduce((total, question) => ({
            sum: total.sum + question.averageRating! * question.answerCount,
            count: total.count + question.answerCount
          }), { sum: 0, count: 0 });
        if (active) setData({
          courses,
          studentCount: students.totalElements,
          categoryCount: categories.length,
          averageRating: ratingAnswers.count ? ratingAnswers.sum / ratingAnswers.count : null
        });
      })
      .catch((requestError) => {
        if (active) setError(requestError?.response?.data?.message || 'ไม่สามารถโหลดข้อมูล Dashboard ได้');
      });
    return () => { active = false; };
  }, []);

  if (!data) {
    return <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      {error ? <Alert severity="error">{error}</Alert> : <CircularProgress />}
    </Box>;
  }

  return (
    <Box component="main" sx={{ minHeight: '100vh', p: { xs: 1.5, sm: 2, md: 3 }, bgcolor: '#f6f8f5' }}>
      <CssBaseline />
      <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
        <Paper elevation={0} sx={{ overflow: 'hidden', mb: 2.5, borderRadius: 4, color: '#fff', background: 'linear-gradient(115deg, #17361e 0%, #285631 58%, #4b7846 100%)' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={3} sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 3.5 } }}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <DashboardRoundedIcon fontSize="small" />
                <Typography variant="overline" sx={{ letterSpacing: '.16em', opacity: .82, fontWeight: 700 }}>CARBONEDGE LEARNING</Typography>
              </Stack>
              <Typography variant="h4" fontWeight={800}>ยินดีต้อนรับ{getUsername() ? `, ${getUsername()}` : ' ผู้ดูแลระบบ'}</Typography>
              <Typography sx={{ mt: 1, maxWidth: 680, opacity: .85, lineHeight: 1.7 }}>
                ภาพรวมการจัดการคอร์ส ผู้เรียน และความคืบหน้าการเรียนในระบบ
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
              <Button variant="contained" startIcon={<AddCircleOutlineRoundedIcon />} onClick={() => history.push(ROUTE_PATHS.COURSE_CREATE)} sx={{ bgcolor: '#fff', color: '#24452a', fontWeight: 800, borderRadius: 2, '&:hover': { bgcolor: '#edf4eb' } }}>
                สร้างคอร์ส
              </Button>
              <Button variant="outlined" startIcon={<PersonAddAlt1RoundedIcon />} onClick={() => history.push(ROUTE_PATHS.STUDENT_CREATE)} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,.55)', fontWeight: 700, borderRadius: 2, '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,.08)' } }}>
                เพิ่มนักเรียน
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="คอร์สทั้งหมด" value={data.courses.length} detail="คอร์สในระบบ Moodle" icon={AutoStoriesRoundedIcon} color="#315c37" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="นักเรียน" value={data.studentCount} detail="บัญชีผู้เรียนในระบบ" icon={PeopleAltRoundedIcon} color="#2f6e7c" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="หมวดหมู่คอร์ส" value={data.categoryCount} detail="หมวดหมู่ที่ใช้จัดกลุ่มคอร์ส" icon={MenuBookRoundedIcon} color="#8057a5" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="ความพึงพอใจเฉลี่ย"
              value={data.averageRating == null ? '-' : `${Number.isInteger(data.averageRating) ? data.averageRating : data.averageRating.toFixed(2)} / 5`}
              detail="เฉลี่ยจากคำถามหลักของทุกคอร์ส"
              icon={RateReviewRoundedIcon}
              color="#487e72"
            />
          </Grid>

          <Grid item xs={12} lg={7}>
            <Paper elevation={0} sx={{ height: '100%', p: { xs: 2.25, sm: 3 }, borderRadius: 3, border: '1px solid #e7ece5' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>คอร์สในระบบ</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>รายการคอร์สที่พร้อมให้จัดการ</Typography>
                </Box>
                <Button size="small" endIcon={<ArrowForwardRoundedIcon />} onClick={() => history.push(ROUTE_PATHS.LEARNING_COURSES)} sx={{ textTransform: 'none', fontWeight: 700 }}>ดูคอร์สทั้งหมด</Button>
              </Stack>
              {data.courses.length ? data.courses.slice(0, 5).map((course) => (
                <Card key={course.id} elevation={0} sx={{ borderBottom: '1px solid #edf0eb', borderRadius: 0 }}>
                  <CardActionArea onClick={() => history.push(ROUTE_PATHS.COURSE_DETAIL.replace(':id', String(course.id)))} sx={{ py: 1.25 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar variant="rounded" sx={{ bgcolor: '#f0f5ee', color: '#315c37', width: 40, height: 40, borderRadius: 2 }}><MenuBookRoundedIcon fontSize="small" /></Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography fontWeight={700} noWrap>{course.displayName || course.fullName || course.shortName}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">{course.shortName}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
                            <GroupsRoundedIcon sx={{ fontSize: 14 }} />
                            {course.studentCount ?? 0} คน
                          </Typography>
                        </Stack>
                      </Box>
                      <ArrowForwardRoundedIcon fontSize="small" color="action" />
                    </Stack>
                  </CardActionArea>
                </Card>
              )) : <Typography color="text.secondary" sx={{ py: 2 }}>ยังไม่มีคอร์สในระบบ</Typography>}
            </Paper>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Paper elevation={0} sx={{ height: '100%', p: { xs: 2.25, sm: 3 }, borderRadius: 3, border: '1px solid #e7ece5' }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>ทางลัดสำหรับผู้ดูแล</Typography>
              <Grid container spacing={1.25}>
                {quickLinks.map(({ title, description, path, icon: Icon, color }) => (
                  <Grid item xs={12} sm={6} key={title}>
                    <Card elevation={0} sx={{ height: '100%', border: '1px solid #edf0eb', borderRadius: 2.5 }}>
                      <CardActionArea onClick={() => history.push(path)} sx={{ p: 1.5, height: '100%' }}>
                        <Stack direction="row" spacing={1.25} alignItems="flex-start">
                          <Avatar variant="rounded" sx={{ width: 38, height: 38, bgcolor: `${color}16`, color, borderRadius: 2 }}><Icon fontSize="small" /></Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={800}>{title}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: .4, lineHeight: 1.5 }}>{description}</Typography>
                          </Box>
                        </Stack>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
