import { useEffect, useRef, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  CircularProgress,
  CssBaseline,
  Divider,
  Button,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from 'auth/AuthContext';
import { ROLES } from 'auth/roles';
import {
  CourseContentItem,
  CourseSection,
  CourseSummary,
  getCourseContent,
  getMyCourses,
  searchStudents,
  StudentSearchResult
} from 'services/course-api';
import {
  getLearningHistory,
  getStudentCourses,
  getStudentLearningHistory,
  TimelineEvent
} from 'services/learning-insights-api';

type CourseHistory = CourseSummary & { sections: CourseSection[] };

const courseStatusLabels: Record<string, string> = {
  NOT_STARTED: 'ยังไม่เริ่มเรียน',
  IN_PROGRESS: 'กำลังเรียน',
  COMPLETED: 'เรียนจบแล้ว'
};

const itemTypeLabels: Record<string, string> = {
  PDF: 'เอกสาร PDF',
  VIDEO: 'วิดีโอ',
  QUIZ: 'แบบทดสอบ',
  TEXT: 'เนื้อหา'
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '';

function ContentHistory({
  item,
  events
}: {
  item: CourseContentItem;
  events: TimelineEvent[];
}): JSX.Element {
  const itemEvents = events.filter((event) => event.contentItemId === item.id);
  const completedAt = itemEvents.find((event) => event.type === 'CONTENT_COMPLETED')?.occurredAt;
  const viewedAt = itemEvents.find((event) => event.type === 'CONTENT_VIEWED')?.occurredAt;
  const startedAt = itemEvents.find((event) => event.type === 'CONTENT_STARTED')?.occurredAt;
  const quizAttempts = itemEvents
    .filter((event) => event.type === 'QUIZ_SUBMITTED')
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  const activityAt = completedAt || viewedAt || startedAt;
  const activityLabel = completedAt
    ? 'เรียนจบแล้ว'
    : viewedAt
      ? 'เข้าเรียนแล้ว'
      : startedAt
        ? 'เริ่มเรียนแล้ว'
        : 'ยังไม่เริ่ม';

  return (
    <Box sx={{ py: 1.5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
        <Box>
          <Typography fontWeight={700}>{item.title || 'เนื้อหาไม่มีชื่อ'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {item.required ? 'เนื้อหาบังคับ' : ' เนื้อหาเสริม'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip
            size="small"
            label={activityLabel}
            color={completedAt ? 'success' : activityAt ? 'primary' : 'default'}
          />
          {activityAt && (
            <Typography variant="caption" color="text.secondary">
              {formatDate(activityAt)}
            </Typography>
          )}
        </Stack>
      </Stack>

      {quizAttempts.length > 0 && (
        <Paper
          variant="outlined"
          sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}>
          <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
            ผลการทำแบบทดสอบ
          </Typography>
          <Stack spacing={0.75}>
            {quizAttempts.map((attempt, index) => (
              <Stack
                key={`${attempt.occurredAt}-${index}`}
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={0.5}>
                <Typography variant="body2">
                  ครั้งที่ {attempt.attemptNumber ?? quizAttempts.length - index}: คะแนน{' '}
                  {attempt.score ?? '-'} / {attempt.maxScore ?? '-'}
                  {attempt.passed != null && ` · ${attempt.passed ? 'ผ่าน' : 'ไม่ผ่าน'}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(attempt.occurredAt)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}

function StudentLearningHistory(): JSX.Element {
  const [courses, setCourses] = useState<CourseHistory[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getMyCourses(), getLearningHistory()])
      .then(async ([myCourses, history]) => {
        const courseHistories = await Promise.all(
          myCourses.map(async (course) => ({
            ...course,
            sections: await getCourseContent(course.id)
          }))
        );
        setCourses(courseHistories);
        setEvents(history);
      })
      .catch((requestError) =>
        setError(requestError?.response?.data?.message || 'ไม่สามารถโหลดประวัติการเรียนได้')
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box component="main" sx={{ minHeight: '100vh', p: { xs: 2, md: 4 } }}>
      <CssBaseline />
      <Paper sx={{ maxWidth: 1100, mx: 'auto', overflow: 'hidden', borderRadius: 4 }}>
        <Box sx={{ p: 4, color: '#fff', background: 'linear-gradient(135deg,#17361e,#3f6c3a)' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <HistoryIcon />
            <Typography variant="h4" fontWeight={800}>
              ประวัติการเรียน
            </Typography>
          </Stack>
          <Typography sx={{ opacity: 0.85, mt: 1 }}>
            ดูคอร์ส บทเรียน ความคืบหน้า และผลแบบทดสอบของคุณ
          </Typography>
        </Box>

        <Stack spacing={1.5} sx={{ p: { xs: 2, md: 3 } }}>
          {loading ? (
            <CircularProgress sx={{ mx: 'auto', my: 4 }} />
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : courses.length ? (
            courses.map((course) => {
              const courseEvents = events.filter((event) => event.courseId === course.id);
              const completedItems = new Set(
                courseEvents
                  .filter((event) => event.type === 'CONTENT_COMPLETED')
                  .map((event) => event.contentItemId)
              ).size;
              const itemCount = course.sections.reduce(
                (count, section) => count + (section.items?.length || 0),
                0
              );
              const status = course.enrollmentStatus || 'NOT_STARTED';

              return (
                <Accordion
                  key={course.id}
                  disableGutters
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' }
                  }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2.5, py: 1 }}>
                    <Box sx={{ width: '100%', pr: 1 }}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        spacing={1}>
                        <Box>
                          <Typography variant="h6" fontWeight={800}>
                            {course.displayName || course.fullName || course.shortName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {completedItems} / {itemCount} เนื้อหาเรียนจบแล้ว
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={courseStatusLabels[status] || status}
                          color={
                            status === 'COMPLETED'
                              ? 'success'
                              : status === 'IN_PROGRESS'
                                ? 'primary'
                                : 'default'
                          }
                          sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
                        />
                      </Stack>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0, px: { xs: 2, md: 3 } }}>
                    {course.sections.length ? (
                      course.sections.map((section) => (
                        <Box key={section.id} sx={{ mb: 2 }}>
                          <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                            {section.title}
                          </Typography>
                          {section.items?.length ? (
                            section.items.map((item) => (
                              <Box key={item.id} sx={{ pl: { xs: 0, sm: 2 } }}>
                                <ContentHistory item={item} events={courseEvents} />
                                <Divider />
                              </Box>
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              ยังไม่มีเนื้อหาในบทนี้
                            </Typography>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography color="text.secondary">คอร์สนี้ยังไม่มีบทเรียน</Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })
          ) : (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 5 }}>
              ยังไม่มีคอร์สที่ลงทะเบียน
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}

type StudentCourseHistory = CourseSummary & { sections: CourseSection[] };

function AdminLearningHistory(): JSX.Element {
  const [keyword, setKeyword] = useState('');
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [listError, setListError] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);
  const [studentCourses, setStudentCourses] = useState<StudentCourseHistory[]>([]);
  const [studentEvents, setStudentEvents] = useState<TimelineEvent[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailError, setDetailError] = useState('');
  const requestSequence = useRef(0);
  const pageSize = 10;

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(async () => {
      try {
        setLoadingStudents(true);
        const response = await searchStudents(keyword, page, pageSize);
        if (!active) return;
        setStudents(response.items || []);
        setPageCount(Math.max(1, response.totalPages || 0));
        setTotalStudents(response.totalElements || 0);
        setListError('');
      } catch (error: any) {
        if (active) setListError(error?.response?.data?.message || 'ไม่สามารถโหลดรายชื่อนักเรียนได้');
      } finally {
        if (active) setLoadingStudents(false);
      }
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [keyword, page]);

  const toggleStudentDetails = async (studentId: number) => {
    const requestId = ++requestSequence.current;
    if (expandedStudentId === studentId) {
      setExpandedStudentId(null);
      setLoadingDetails(false);
      return;
    }
    setExpandedStudentId(studentId);
    setStudentCourses([]);
    setStudentEvents([]);
    setDetailError('');
    setLoadingDetails(true);
    try {
      const [courses, events] = await Promise.all([
        getStudentCourses(studentId),
        getStudentLearningHistory(studentId)
      ]);
      const courseHistories = await Promise.all(courses.map(async (course) => ({
        ...course,
        sections: await getCourseContent(course.id)
      })));
      if (requestSequence.current !== requestId) return;
      setStudentCourses(courseHistories);
      setStudentEvents(events);
    } catch (error: any) {
      if (requestSequence.current === requestId) {
        setDetailError(error?.response?.data?.message || 'ไม่สามารถโหลดประวัติการเรียนของนักเรียนได้');
      }
    } finally {
      if (requestSequence.current === requestId) setLoadingDetails(false);
    }
  };

  const resetExpanded = () => {
    requestSequence.current += 1;
    setExpandedStudentId(null);
    setLoadingDetails(false);
  };

  return (
    <Box component="main" sx={{ minHeight: '100vh', p: { xs: 2, md: 4 } }}>
      <CssBaseline />
      <Paper sx={{ maxWidth: 1100, mx: 'auto', overflow: 'hidden', borderRadius: 4 }}>
        <Box sx={{ p: 4, color: '#fff', background: 'linear-gradient(135deg,#17361e,#3f6c3a)' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <HistoryIcon />
            <Typography variant="h4" fontWeight={800}>ประวัติการเรียน</Typography>
          </Stack>
          <Typography sx={{ opacity: 0.85, mt: 1 }}>
            เลือกนักเรียนเพื่อดูคอร์ส บทเรียน ความคืบหน้า และผลแบบทดสอบ
          </Typography>
        </Box>

        <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
            <TextField
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage(1);
                resetExpanded();
              }}
              placeholder="ค้นหาชื่อ, username หรือ email"
              InputProps={{ startAdornment: <SearchIcon sx={{ color: '#75806e', mr: 1 }} /> }}
              sx={{ width: { xs: '100%', sm: 380 } }}
            />
            <Chip label={`นักเรียนทั้งหมด ${totalStudents} คน`} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }} />
          </Stack>

          {loadingStudents ? (
            <CircularProgress sx={{ mx: 'auto', my: 4 }} />
          ) : listError ? (
            <Typography color="error">{listError}</Typography>
          ) : students.length ? (
            <Stack spacing={1.25}>
              {students.map((student) => {
                const fullName = [student.firstName, student.lastName].filter(Boolean).join(' ').trim();
                const expanded = expandedStudentId === student.id;
                return (
                  <Paper key={student.id} variant="outlined" sx={{ p: { xs: 1.75, sm: 2 }, borderRadius: 3 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
                      <Box>
                        <Typography fontWeight={800}>{fullName || student.username}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {student.username}{student.email ? ` · ${student.email}` : ''}
                        </Typography>
                      </Box>
                      <Button variant={expanded ? 'outlined' : 'contained'} onClick={() => void toggleStudentDetails(student.id)}>
                        {expanded ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
                      </Button>
                    </Stack>

                    {expanded && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        {loadingDetails ? (
                          <CircularProgress size={26} />
                        ) : detailError ? (
                          <Typography color="error">{detailError}</Typography>
                        ) : studentCourses.length ? (
                          <Stack spacing={1.25}>
                            {studentCourses.map((course) => {
                              const courseEvents = studentEvents.filter((event) => event.courseId === course.id);
                              const completedItems = new Set(courseEvents.filter((event) => event.type === 'CONTENT_COMPLETED').map((event) => event.contentItemId)).size;
                              const itemCount = course.sections.reduce((count, section) => count + (section.items?.length || 0), 0);
                              const status = course.enrollmentStatus || 'NOT_STARTED';
                              return (
                                <Accordion key={course.id} disableGutters sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '10px !important', '&:before': { display: 'none' } }}>
                                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ width: '100%', pr: 1 }}>
                                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={0.75}>
                                        <Box>
                                          <Typography fontWeight={800}>{course.displayName || course.fullName || course.shortName}</Typography>
                                          <Typography variant="body2" color="text.secondary">{completedItems} / {itemCount} เนื้อหาเรียนจบแล้ว</Typography>
                                        </Box>
                                        <Chip size="small" label={courseStatusLabels[status] || status} color={status === 'COMPLETED' ? 'success' : status === 'IN_PROGRESS' ? 'primary' : 'default'} />
                                      </Stack>
                                    </Box>
                                  </AccordionSummary>
                                  <AccordionDetails sx={{ pt: 0 }}>
                                    {course.sections.length ? course.sections.map((section) => (
                                      <Box key={section.id} sx={{ mb: 2 }}>
                                        <Typography fontWeight={800} sx={{ mb: 0.5 }}>{section.title}</Typography>
                                        {section.items?.length ? section.items.map((item) => (
                                          <Box key={item.id} sx={{ pl: { xs: 0, sm: 2 } }}>
                                            <ContentHistory item={item} events={courseEvents} />
                                            <Divider />
                                          </Box>
                                        )) : <Typography variant="body2" color="text.secondary">ยังไม่มีเนื้อหาในบทนี้</Typography>}
                                      </Box>
                                    )) : <Typography color="text.secondary">คอร์สนี้ยังไม่มีบทเรียน</Typography>}
                                  </AccordionDetails>
                                </Accordion>
                              );
                            })}
                          </Stack>
                        ) : (
                          <Typography color="text.secondary">นักเรียนคนนี้ยังไม่มีคอร์สที่ลงทะเบียน</Typography>
                        )}
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Stack>
          ) : (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 5 }}>ไม่พบนักเรียน</Typography>
          )}

          {!loadingStudents && !listError && pageCount > 1 && (
            <Pagination count={pageCount} page={page} onChange={(_, value) => { setPage(value); resetExpanded(); }} sx={{ alignSelf: 'center' }} />
          )}
        </Stack>
      </Paper>
    </Box>
  );
}

export default function LearningHistory(): JSX.Element {
  const { getRole } = useAuth();
  return getRole() === ROLES.ADMIN ? <AdminLearningHistory /> : <StudentLearningHistory />;
}
