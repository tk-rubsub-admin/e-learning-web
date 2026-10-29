import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, CssBaseline,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl,
  FormControlLabel, FormLabel, IconButton, MenuItem, Paper, Radio, RadioGroup,
  Stack, Switch, TextField, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useAuth } from 'auth/AuthContext';
import { ROLES } from 'auth/roles';
import { ROUTE_PATHS } from 'routes';
import { getMyCourses, searchSystemCourses, type CourseSummary } from 'services/course-api';
import {
  deleteSatisfactionSurvey, getAvailableSatisfactionSurveys, getSatisfactionResults,
  getSatisfactionSurvey, listSatisfactionSurveys,
  saveSatisfactionSurvey, getDefaultSatisfactionQuestions,
  saveDefaultSatisfactionQuestions, getCourseSatisfactionQuestionnaire, submitCourseSatisfactionQuestionnaire,
  type CourseSatisfactionQuestionnaire, type SatisfactionDefaultQuestion, type SatisfactionQuestion,
  type SatisfactionResults, type SatisfactionSurvey, type SatisfactionSurveyPayload
} from 'services/satisfaction-api';

const blankQuestion = (): SatisfactionQuestion => ({ type: 'RATING', prompt: '', options: [], required: true });
const pad2 = (value: number) => String(value).padStart(2, '0');
const formatDateTimeDisplay = (dateOrValue: Date | string) => {
  const date = dateOrValue instanceof Date ? dateOrValue : new Date(dateOrValue);
  if (!Number.isFinite(date.getTime())) return '';
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
};
const parseDateTimeDisplay = (value?: string | null, endOfSecond = false) => {
  if (!value?.trim()) return null;
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, dayText, monthText, yearText, hourText, minuteText, secondText] = match;
  const date = new Date(Number(yearText), Number(monthText) - 1, Number(dayText), Number(hourText), Number(minuteText), Number(secondText), endOfSecond ? 999 : 0);
  if (date.getFullYear() !== Number(yearText) || date.getMonth() !== Number(monthText) - 1
      || date.getDate() !== Number(dayText) || date.getHours() !== Number(hourText)
      || date.getMinutes() !== Number(minuteText) || date.getSeconds() !== Number(secondText)) return null;
  return date.toISOString();
};
const newForm = (): SatisfactionSurveyPayload => {
  const now = new Date();
  const opensAt = new Date(now);
  opensAt.setHours(0, 0, 0, 0);
  const closesAt = new Date(now);
  const targetMonth = closesAt.getMonth() + 6;
  const targetDay = closesAt.getDate();
  closesAt.setDate(1);
  closesAt.setMonth(targetMonth);
  const lastDayOfTargetMonth = new Date(closesAt.getFullYear(), closesAt.getMonth() + 1, 0).getDate();
  closesAt.setDate(Math.min(targetDay, lastDayOfTargetMonth));
  closesAt.setHours(23, 59, 59, 999);
  return {
    courseId: 0, title: '', description: '', status: 'DRAFT',
    opensAt: formatDateTimeDisplay(opensAt), closesAt: formatDateTimeDisplay(closesAt), questions: []
  };
};
const statusLabels: Record<string, string> = { DRAFT: 'ฉบับร่าง', PUBLISHED: 'เผยแพร่', ARCHIVED: 'เก็บถาวร' };

export default function Satisfaction(): JSX.Element {
  const { getRole } = useAuth();
  return getRole() === ROLES.ADMIN ? <AdminSatisfaction /> : <StudentSatisfaction />;
}

function AdminSatisfaction(): JSX.Element {
  const [surveys, setSurveys] = useState<SatisfactionSurvey[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>();
  const [form, setForm] = useState<SatisfactionSurveyPayload>(newForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<SatisfactionResults | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [defaultQuestions, setDefaultQuestions] = useState<SatisfactionDefaultQuestion[]>([]);
  const [defaultEditorOpen, setDefaultEditorOpen] = useState(false);
  const [defaultPrompts, setDefaultPrompts] = useState<string[]>([]);

  const refresh = async () => {
    setLoading(true);
    try {
      const courseRows = await searchSystemCourses();
      const surveyRows = await listSatisfactionSurveys();
      const defaultRows = await getDefaultSatisfactionQuestions();
      setSurveys(surveyRows);
      setCourses(courseRows);
      setDefaultQuestions(defaultRows);
      setError('');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'ไม่สามารถโหลดแบบประเมินได้');
    } finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, []);

  const startCreate = () => {
    setEditingId(undefined);
    setForm(newForm());
    setError('');
    setOpen(true);
  };

  const startEdit = async (surveyId: number) => {
    setSaving(true);
    setError('');
    try {
      const survey = await getSatisfactionSurvey(surveyId);
      setEditingId(survey.id);
      setForm({
        courseId: survey.courseId, title: survey.title, description: survey.description || '',
        status: survey.status, opensAt: survey.opensAt ? formatDateTimeDisplay(survey.opensAt) : '', closesAt: survey.closesAt ? formatDateTimeDisplay(survey.closesAt) : '',
        questions: survey.questions.map((question) => ({ ...question, options: question.options || [] }))
      });
      setOpen(true);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'ไม่สามารถโหลดแบบประเมินได้');
    } finally { setSaving(false); }
  };

  const save = async () => {
    const opensAt = parseDateTimeDisplay(form.opensAt);
    const closesAt = parseDateTimeDisplay(form.closesAt, true);
    if ((form.opensAt && !opensAt) || (form.closesAt && !closesAt)) {
      setError('กรุณาระบุวันเวลาในรูปแบบ DD/MM/YYYY HH24:MI:SS');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: SatisfactionSurveyPayload = {
        ...form,
        opensAt,
        closesAt,
        questions: form.questions.map((question, index) => ({ ...question, orderIndex: index + 1 }))
      };
      await saveSatisfactionSurvey(payload, editingId);
      setOpen(false);
      await refresh();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'ไม่สามารถบันทึกแบบประเมินได้');
    } finally { setSaving(false); }
  };

  const removeSurvey = async (survey: SatisfactionSurvey) => {
    const action = survey.responseCount > 0 ? 'เก็บแบบประเมินนี้เข้าคลัง เนื่องจากมีคำตอบแล้ว' : 'ลบแบบประเมินนี้';
    if (!window.confirm(`${action}ใช่หรือไม่?`)) return;
    try {
      await deleteSatisfactionSurvey(survey.id);
      await refresh();
    } catch (requestError: any) { setError(requestError?.response?.data?.message || 'ไม่สามารถลบแบบประเมินได้'); }
  };

  const showResults = async (surveyId: number) => {
    setResultsOpen(true);
    setResultsLoading(true);
    try { setResults(await getSatisfactionResults(surveyId)); }
    catch (requestError: any) { setError(requestError?.response?.data?.message || 'ไม่สามารถโหลดผลประเมินได้'); setResultsOpen(false); }
    finally { setResultsLoading(false); }
  };

  const openDefaultEditor = () => {
    setDefaultPrompts(defaultQuestions.map((question) => question.prompt));
    setError('');
    setDefaultEditorOpen(true);
  };

  const saveDefaultPrompts = async () => {
    setSaving(true);
    setError('');
    try {
      await saveDefaultSatisfactionQuestions(defaultPrompts);
      setDefaultEditorOpen(false);
      await refresh();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'ไม่สามารถบันทึกคำถามหลักได้');
    } finally { setSaving(false); }
  };

  const updateQuestion = (index: number, next: SatisfactionQuestion) => setForm((current) => ({
    ...current, questions: current.questions.map((question, questionIndex) => questionIndex === index ? next : question)
  }));
  const moveQuestion = (index: number, offset: number) => setForm((current) => {
    const target = index + offset;
    if (target < 0 || target >= current.questions.length) return current;
    const questions = [...current.questions];
    [questions[index], questions[target]] = [questions[target], questions[index]];
    return { ...current, questions };
  });

  return (
    <Box component="main" sx={{ minHeight: '100vh', p: { xs: 2, md: 4 } }}>
      <CssBaseline />
      <Paper sx={{ maxWidth: 1180, mx: 'auto', overflow: 'hidden', borderRadius: 4 }}>
        <Box sx={{ p: 4, color: '#fff', background: 'linear-gradient(135deg,#17361e,#3f6c3a)' }}>
          <Stack direction="row" spacing={1.5} alignItems="center"><RateReviewIcon /><Typography variant="h4" fontWeight={800}>จัดการแบบประเมิน</Typography></Stack>
          <Typography sx={{ opacity: 0.85, mt: 1 }}>สร้างหัวข้อประเมินและติดตามความพึงพอใจของผู้เรียน</Typography>
        </Box>
        <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'info.light' }}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ sm: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>แบบประเมินความพึงพอใจหลัก</Typography>
                  <Typography variant="body2" color="text.secondary">คำถามหลัก 3 ข้อ ใช้กับทุกคอร์ส (ข้อเสนอแนะเป็นคำถามปลายเปิด ไม่บังคับตอบ)</Typography>
                  {defaultQuestions.map((question) => <Typography key={question.orderIndex} variant="body2" sx={{ mt: 0.5 }}>{question.orderIndex}. {question.prompt}</Typography>)}
                </Box>
                <Button variant="outlined" startIcon={<EditIcon />} onClick={openDefaultEditor} disabled={loading || saving}>แก้ไขคำถามหลัก</Button>
              </Stack>
            </CardContent>
          </Card>
          <Button variant="contained" startIcon={<AddIcon />} onClick={startCreate} sx={{ alignSelf: 'flex-start' }}>สร้างแบบประเมิน</Button>
          {loading ? <CircularProgress sx={{ alignSelf: 'center', my: 4 }} /> : surveys.length ? surveys.map((survey) => (
            <Card key={survey.id} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap"><Typography variant="h6" fontWeight={800}>{survey.title}</Typography>{survey.defaultSurvey && <Chip size="small" label="คำถามหลักทุกคอร์ส" color="info" />}<Chip size="small" label={statusLabels[survey.status] || survey.status} color={survey.status === 'PUBLISHED' ? 'success' : survey.status === 'ARCHIVED' ? 'default' : 'warning'} /></Stack>
                    <Typography variant="body2" color="text.secondary">{courses.find((course) => course.id === survey.courseId)?.displayName || courses.find((course) => course.id === survey.courseId)?.fullName || `คอร์ส #${survey.courseId}`} · {survey.questions.length} หัวข้อ · ผู้ตอบ {survey.responseCount} คน</Typography>
                    {survey.description && <Typography variant="body2" sx={{ mt: 0.5 }}>{survey.description}</Typography>}
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {survey.responseCount > 0 && <Button startIcon={<AssessmentIcon />} onClick={() => void showResults(survey.id)}>ผลประเมิน</Button>}
                    {survey.status !== 'ARCHIVED' && !survey.defaultSurvey && <IconButton aria-label="แก้ไขแบบประเมิน" onClick={() => void startEdit(survey.id)} disabled={saving}><EditIcon /></IconButton>}
                    {survey.status !== 'ARCHIVED' && !survey.defaultSurvey && <IconButton aria-label="ลบหรือเก็บแบบประเมิน" color="error" onClick={() => void removeSurvey(survey)}><DeleteIcon /></IconButton>}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )) : <Typography color="text.secondary" textAlign="center" sx={{ py: 5 }}>ยังไม่มีแบบประเมิน</Typography>}
        </Stack>
      </Paper>

      <Dialog open={defaultEditorOpen} onClose={() => !saving && setDefaultEditorOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>แก้ไขคำถามความพึงพอใจหลัก</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info">ข้อความจะอัปเดตในแบบประเมินหลักของทุกคอร์ส ส่วนคำตอบที่ส่งมาแล้วจะเก็บข้อความเดิมไว้</Alert>
            {defaultPrompts.map((prompt, index) => <TextField key={index} label={`คำถามที่ ${index + 1}${index === 2 ? ' (ปลายเปิด ไม่บังคับตอบ)' : ''}`} required multiline minRows={2} value={prompt} onChange={(event) => setDefaultPrompts((current) => current.map((value, i) => i === index ? event.target.value : value))} inputProps={{ maxLength: 2000 }} />)}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setDefaultEditorOpen(false)} disabled={saving}>ยกเลิก</Button><Button variant="contained" onClick={() => void saveDefaultPrompts()} disabled={saving || defaultPrompts.length !== 3 || defaultPrompts.some((prompt) => !prompt.trim())}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button></DialogActions>
      </Dialog>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? 'แก้ไขแบบประเมิน' : 'สร้างแบบประเมิน'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField select label="คอร์สเป้าหมาย" value={form.courseId || ''} onChange={(event) => setForm((current) => ({ ...current, courseId: Number(event.target.value) }))}>
              {courses.map((course) => <MenuItem key={course.id} value={course.id}>{course.displayName || course.fullName || course.shortName}</MenuItem>)}
            </TextField>
            <TextField label="ชื่อแบบประเมิน" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            <TextField label="คำอธิบาย" multiline minRows={2} value={form.description || ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="เปิดรับคำตอบ" placeholder="DD/MM/YYYY HH24:MI:SS" helperText="รูปแบบ DD/MM/YYYY HH24:MI:SS" value={form.opensAt || ''} onChange={(event) => setForm((current) => ({ ...current, opensAt: event.target.value }))} fullWidth />
              <TextField label="ปิดรับคำตอบ" placeholder="DD/MM/YYYY HH24:MI:SS" helperText="รูปแบบ DD/MM/YYYY HH24:MI:SS" value={form.closesAt || ''} onChange={(event) => setForm((current) => ({ ...current, closesAt: event.target.value }))} fullWidth />
            </Stack>
            <TextField select label="สถานะ" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as SatisfactionSurveyPayload['status'] }))}>
              <MenuItem value="DRAFT">ฉบับร่าง</MenuItem><MenuItem value="PUBLISHED">เผยแพร่</MenuItem>
            </TextField>
            <Divider />
            {form.questions.map((question, index) => (
              <Paper key={question.id ?? `new-${index}`} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography fontWeight={800}>หัวข้อ {index + 1}</Typography><Stack direction="row"><IconButton aria-label="เลื่อนหัวข้อขึ้น" disabled={index === 0} onClick={() => moveQuestion(index, -1)}><ArrowUpwardIcon /></IconButton><IconButton aria-label="เลื่อนหัวข้อลง" disabled={index === form.questions.length - 1} onClick={() => moveQuestion(index, 1)}><ArrowDownwardIcon /></IconButton><IconButton aria-label="ลบหัวข้อ" color="error" onClick={() => setForm((current) => ({ ...current, questions: current.questions.filter((_, questionIndex) => questionIndex !== index) }))}><DeleteIcon /></IconButton></Stack></Stack>
                  <TextField select label="รูปแบบคำถาม" value={question.type} onChange={(event) => updateQuestion(index, { ...question, type: event.target.value as SatisfactionQuestion['type'], options: event.target.value === 'SINGLE_CHOICE' ? (question.options.length ? question.options : ['', '']) : [] })}>
                    <MenuItem value="RATING">คะแนน 1–5</MenuItem><MenuItem value="SINGLE_CHOICE">ตัวเลือก</MenuItem><MenuItem value="TEXT">คำตอบปลายเปิด</MenuItem>
                  </TextField>
                  <TextField label="ข้อความหัวข้อ" required value={question.prompt} onChange={(event) => updateQuestion(index, { ...question, prompt: event.target.value })} />
                  {question.type === 'SINGLE_CHOICE' && <Stack spacing={1}>{question.options.map((option, optionIndex) => <Stack key={optionIndex} direction="row" spacing={1}><TextField fullWidth label={`ตัวเลือก ${optionIndex + 1}`} value={option} onChange={(event) => updateQuestion(index, { ...question, options: question.options.map((value, i) => i === optionIndex ? event.target.value : value) })} /><IconButton aria-label="ลบตัวเลือก" disabled={question.options.length <= 2} onClick={() => updateQuestion(index, { ...question, options: question.options.filter((_, i) => i !== optionIndex) })}><DeleteIcon /></IconButton></Stack>)}<Button startIcon={<AddIcon />} onClick={() => updateQuestion(index, { ...question, options: [...question.options, ''] })}>เพิ่มตัวเลือก</Button></Stack>}
                  <FormControlLabel control={<Switch checked={question.required} onChange={(_, required) => updateQuestion(index, { ...question, required })} />} label="ต้องตอบคำถามนี้" />
                </Stack>
              </Paper>
            ))}
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setForm((current) => ({ ...current, questions: [...current.questions, blankQuestion()] }))}>เพิ่มหัวข้อประเมิน</Button>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)} disabled={saving}>ยกเลิก</Button><Button variant="contained" onClick={() => void save()} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button></DialogActions>
      </Dialog>

      <Dialog open={resultsOpen} onClose={() => setResultsOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>ผลประเมิน{results ? `: ${results.title}` : ''}</DialogTitle>
        <DialogContent>
          {resultsLoading ? <CircularProgress /> : results ? <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>ผู้ตอบแบบประเมิน {results.responseCount} คน</Typography>
            {results.questions.map((question, index) => <Paper key={`${question.prompt}-${index}`} variant="outlined" sx={{ p: 2 }}>
              <Typography fontWeight={800}>{question.prompt}</Typography><Typography variant="caption" color="text.secondary">คำตอบ {question.answerCount} รายการ</Typography>
              {question.averageRating != null && <Typography sx={{ mt: 1 }}>คะแนนเฉลี่ย {question.averageRating.toFixed(2)} / 5</Typography>}
              {question.ratingCounts && Object.entries(question.ratingCounts).sort(([a], [b]) => Number(b) - Number(a)).map(([rating, count]) => <Typography key={rating} variant="body2">{rating} คะแนน: {count} คน</Typography>)}
              {question.choiceCounts && Object.entries(question.choiceCounts).map(([choice, count]) => <Typography key={choice} variant="body2">{choice}: {count} คน</Typography>)}
              {question.comments?.map((comment, commentIndex) => <Typography key={commentIndex} variant="body2" sx={{ mt: 1 }}>“{comment}”</Typography>)}
            </Paper>)}
          </Stack> : null}
        </DialogContent>
        <DialogActions><Button onClick={() => setResultsOpen(false)}>ปิด</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

function StudentSatisfaction(): JSX.Element {
  const history = useHistory();
  const location = useLocation();
  const courseId = Number(new URLSearchParams(location.search).get('courseId')) || null;
  const [surveys, setSurveys] = useState<SatisfactionSurvey[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [activeQuestionnaire, setActiveQuestionnaire] = useState<CourseSatisfactionQuestionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const available = await getAvailableSatisfactionSurveys();
      setSurveys(available);
      try { setCourses(await getMyCourses()); } catch { setCourses([]); }
      setError('');
    } catch (requestError: any) { setError(requestError?.response?.data?.message || 'ไม่สามารถโหลดแบบประเมินได้'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);

  const openQuestionnaire = async (targetCourseId: number) => {
    setError('');
    setSuccess('');
    try {
      const questionnaire = await getCourseSatisfactionQuestionnaire(targetCourseId);
      setActiveQuestionnaire(questionnaire);
      setAnswers({});
    } catch (requestError: any) { setError(requestError?.response?.data?.message || 'ไม่สามารถเปิดแบบประเมินได้'); }
  };

  const submit = async () => {
    if (activeQuestionnaire == null) return;
    setSaving(true);
    setError('');
    try {
      await submitCourseSatisfactionQuestionnaire(activeQuestionnaire.courseId, activeQuestionnaire.questions.map((question) => ({ surveyId: question.surveyId, questionId: question.id, answer: answers[question.id] || '' })));
      setSurveys((current) => current.map((survey) => activeQuestionnaire.surveys.some((item) => item.id === survey.id) ? { ...survey, submitted: true } : survey));
      setActiveQuestionnaire(null);
      await refresh();
      setSuccess('ส่งแบบประเมินเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็น');
    } catch (requestError: any) { setError(requestError?.response?.data?.message || 'ไม่สามารถส่งแบบประเมินได้'); }
    finally { setSaving(false); }
  };

  const visibleSurveys = useMemo(() => courseId ? surveys.filter((survey) => survey.courseId === courseId) : surveys, [courseId, surveys]);
  const courseNames = useMemo(() => new Map(courses.map((course) => [course.id, course.displayName || course.fullName || course.shortName])), [courses]);
  const surveyGroups = useMemo(() => {
    const groups = new Map<number, SatisfactionSurvey[]>();
    visibleSurveys.forEach((survey) => groups.set(survey.courseId, [...(groups.get(survey.courseId) || []), survey]));
    return [...groups.entries()].sort(([a], [b]) => a - b);
  }, [visibleSurveys]);

  return (
    <Box component="main" sx={{ minHeight: '100vh', p: { xs: 2, md: 4 } }}>
      <CssBaseline />
      <Paper sx={{ maxWidth: 1100, mx: 'auto', overflow: 'hidden', borderRadius: 4 }}>
        <Box sx={{ p: 4, color: '#fff', background: 'linear-gradient(135deg,#17361e,#3f6c3a)' }}><Stack direction="row" spacing={1.5} alignItems="center"><RateReviewIcon /><Typography variant="h4" fontWeight={800}>ประเมินความพึงพอใจ</Typography></Stack><Typography sx={{ opacity: 0.85, mt: 1 }}>ความคิดเห็นของคุณช่วยพัฒนาคอร์สเรียน</Typography>{courseId && <Button color="inherit" sx={{ mt: 1 }} onClick={() => history.push(ROUTE_PATHS.COURSES)}>กลับไปคอร์สเรียนของฉัน</Button>}</Box>
        <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
          {error && !activeQuestionnaire && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}
          {loading ? <CircularProgress sx={{ alignSelf: 'center', my: 4 }} /> : surveyGroups.length ? surveyGroups.map(([groupCourseId, groupSurveys]) => {
            const pending = groupSurveys.filter((survey) => !survey.submitted);
            return <Card key={groupCourseId} variant="outlined" sx={{ borderRadius: 3 }}><CardContent><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}><Box><Typography variant="h6" fontWeight={800}>{courseNames.get(groupCourseId) || `คอร์ส #${groupCourseId}`}</Typography><Typography variant="body2" color="text.secondary">แบบประเมิน {groupSurveys.length} รายการ · ประเมินแล้ว {groupSurveys.length - pending.length}/{groupSurveys.length}</Typography><Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>{groupSurveys.map((survey) => <Chip key={survey.id} size="small" label={`${survey.defaultSurvey ? 'หลัก' : 'เพิ่มเติม'}: ${survey.title}${survey.submitted ? ' · ประเมินแล้ว' : ''}`} color={survey.submitted ? 'success' : survey.defaultSurvey ? 'info' : 'default'} />)}</Stack></Box><Button variant={pending.length ? 'contained' : 'outlined'} disabled={!pending.length} onClick={() => void openQuestionnaire(groupCourseId)}>{pending.length ? 'เริ่มประเมินทั้งหมด' : 'ประเมินแล้ว'}</Button></Stack></CardContent></Card>;
          })
          : <Typography color="text.secondary" textAlign="center" sx={{ py: 5 }}>ขณะนี้ไม่มีแบบประเมินที่เปิดให้ตอบ</Typography>}
        </Stack>
      </Paper>

      <Dialog open={Boolean(activeQuestionnaire)} onClose={() => !saving && setActiveQuestionnaire(null)} fullWidth maxWidth="md">
        <DialogTitle>แบบประเมินความพึงพอใจ · {activeQuestionnaire ? courseNames.get(activeQuestionnaire.courseId) : ''}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
          {error && activeQuestionnaire && <Alert severity="error">{error}</Alert>}
          {activeQuestionnaire?.questions.map((question, index) => <FormControl key={`${question.surveyId}-${question.id}`} required={question.required}>
            <FormLabel sx={{ color: 'text.primary', fontWeight: 700, mb: 1 }}>{index + 1}. {question.prompt}{question.required ? ' *' : ''}{!question.required && <Typography component="span" color="text.secondary"> (ไม่บังคับตอบ)</Typography>}</FormLabel>
            {question.type === 'RATING' ? <RadioGroup row value={answers[question.id as number] || ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.id as number]: event.target.value }))}>{[1, 2, 3, 4, 5].map((rating) => <FormControlLabel key={rating} value={String(rating)} control={<Radio />} label={String(rating)} />)}</RadioGroup>
              : question.type === 'SINGLE_CHOICE' ? <RadioGroup value={answers[question.id as number] || ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.id as number]: event.target.value }))}>{question.options.map((option) => <FormControlLabel key={option} value={option} control={<Radio />} label={option} />)}</RadioGroup>
                : <TextField multiline minRows={3} value={answers[question.id as number] || ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.id as number]: event.target.value }))} />}
          </FormControl>)}
        </Stack></DialogContent>
        <DialogActions><Button onClick={() => setActiveQuestionnaire(null)} disabled={saving}>ยกเลิก</Button><Button variant="contained" onClick={() => void submit()} disabled={saving}>{saving ? 'กำลังส่ง...' : 'ส่งแบบประเมินทั้งหมด'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
