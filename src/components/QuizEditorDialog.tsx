import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { getQuizDefinition, saveQuizDefinition, type QuizDefinitionPayload, type QuizQuestionInput } from 'services/course-api';

type Props = { open: boolean; courseId: string; sectionId: number; itemId: number; onClose: () => void; onSaved: () => void };
const blankQuestion = (): QuizQuestionInput => ({ type: 'SINGLE_CHOICE', prompt: '', feedback: '', points: 1, options: [{ text: '', correct: true }, { text: '', correct: false }] });
const defaults = (): QuizDefinitionPayload => ({ passingScore: 0, maxAttempts: null, timeLimitSeconds: null, opensAt: null, closesAt: null, published: true, randomizeQuestions: false, randomizeOptions: false, questions: [blankQuestion()] });

export default function QuizEditorDialog({ open, courseId, sectionId, itemId, onClose, onSaved }: Props): JSX.Element {
  const [form, setForm] = useState<QuizDefinitionPayload>(defaults());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (!open) return; setLoading(true); setError(''); getQuizDefinition(courseId, sectionId, itemId).then((value) => setForm({ passingScore: value.passingScore, maxAttempts: value.maxAttempts, timeLimitSeconds: value.timeLimitSeconds, opensAt: value.opensAt, closesAt: value.closesAt, published: value.published, randomizeQuestions: Boolean(value.randomizeQuestions), randomizeOptions: Boolean(value.randomizeOptions), questions: value.questions.map(({ type, prompt, feedback, points, options }) => ({ type, prompt, feedback, points, options: options.map(({ text, correct }) => ({ text, correct })) })) })).catch(() => setForm(defaults())).finally(() => setLoading(false)); }, [open, courseId, sectionId, itemId]);
  const updateQuestion = (index: number, value: QuizQuestionInput) => setForm((current) => ({ ...current, questions: current.questions.map((question, questionIndex) => questionIndex === index ? value : question) }));
  const save = async () => { setSaving(true); setError(''); try { await saveQuizDefinition(courseId, sectionId, itemId, form); onSaved(); onClose(); } catch (e: any) { setError(e?.response?.data?.message || 'ไม่สามารถบันทึกแบบทดสอบได้'); } finally { setSaving(false); } };
  return <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md"><DialogTitle>จัดการแบบทดสอบ</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
    {error ? <Typography color="error">{error}</Typography> : null}
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField label="คะแนนผ่าน" type="number" InputLabelProps={{ shrink: true }} value={form.passingScore} onChange={(e) => setForm((v) => ({ ...v, passingScore: Number(e.target.value) }))} /><TextField label="จำนวนครั้ง (ว่าง = ไม่จำกัด)" type="number" InputLabelProps={{ shrink: true }} value={form.maxAttempts ?? ''} onChange={(e) => setForm((v) => ({ ...v, maxAttempts: e.target.value ? Number(e.target.value) : null }))} /><TextField label="เวลาทำ (นาที)" type="number" value={form.timeLimitSeconds ?? ''} InputLabelProps={{ shrink: true }} onChange={(e) => setForm((v) => ({ ...v, timeLimitSeconds: e.target.value ? Number(e.target.value) : null }))} /></Stack>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <FormControlLabel control={<Switch checked={form.published} onChange={(_, published) => setForm((v) => ({ ...v, published }))} />} label="เผยแพร่แบบทดสอบ" />
      <FormControlLabel control={<Switch checked={form.randomizeQuestions} onChange={(_, randomizeQuestions) => setForm((v) => ({ ...v, randomizeQuestions }))} />} label="สุ่มลำดับคำถาม" />
      <FormControlLabel control={<Switch checked={form.randomizeOptions} onChange={(_, randomizeOptions) => setForm((v) => ({ ...v, randomizeOptions }))} />} label="สุ่มลำดับตัวเลือก" />
    </Stack>
    {form.questions.map((question, index) => <Box key={index} sx={{ border: '1px solid #dce5d8', borderRadius: 2, p: 2 }}><Stack spacing={1.5}><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography fontWeight={800}>ข้อ {index + 1}</Typography><Button size="small" color="error" startIcon={<DeleteIcon />} disabled={form.questions.length === 1} onClick={() => setForm((v) => ({ ...v, questions: v.questions.filter((_, i) => i !== index) }))}>ลบคำถาม</Button></Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><TextField select label="ประเภท" value={question.type} onChange={(e) => { const type = e.target.value as QuizQuestionInput['type']; updateQuestion(index, { ...question, type, options: type === 'TRUE_FALSE' ? [{ text: 'ถูก', correct: true }, { text: 'ผิด', correct: false }] : question.options }); }}><MenuItem value="SINGLE_CHOICE">เลือกคำตอบเดียว</MenuItem><MenuItem value="MULTIPLE_CHOICE">เลือกได้หลายคำตอบ</MenuItem><MenuItem value="TRUE_FALSE">ถูก / ผิด</MenuItem></TextField><TextField label="คะแนน" type="number" value={question.points} onChange={(e) => updateQuestion(index, { ...question, points: Number(e.target.value) })} /></Stack>
      <TextField fullWidth InputLabelProps={{ shrink: true }} label="คำถาม" value={question.prompt} onChange={(e) => updateQuestion(index, { ...question, prompt: e.target.value })} /><TextField fullWidth label="Feedback หลังส่งคำตอบ" InputLabelProps={{ shrink: true }} value={question.feedback || ''} onChange={(e) => updateQuestion(index, { ...question, feedback: e.target.value })} />
      {question.options.map((option, optionIndex) => <Stack key={optionIndex} direction="row" alignItems="center" spacing={0.5}><Checkbox checked={option.correct} disabled={question.type === 'TRUE_FALSE'} onChange={(_, correct) => updateQuestion(index, { ...question, options: question.options.map((value, i) => ({ ...value, correct: question.type === 'SINGLE_CHOICE' ? (i === optionIndex ? correct : false) : i === optionIndex ? correct : value.correct })) })} /><TextField fullWidth InputLabelProps={{ shrink: true }} label={`ตัวเลือก ${optionIndex + 1}`} value={option.text} disabled={question.type === 'TRUE_FALSE'} onChange={(e) => updateQuestion(index, { ...question, options: question.options.map((value, i) => i === optionIndex ? { ...value, text: e.target.value } : value) })} /><IconButton aria-label={`ลบตัวเลือก ${optionIndex + 1}`} color="error" disabled={question.type === 'TRUE_FALSE' || question.options.length <= 2} onClick={() => updateQuestion(index, { ...question, options: question.options.filter((_, i) => i !== optionIndex) })}><DeleteIcon /></IconButton></Stack>)}
      {question.type !== 'TRUE_FALSE' ? <Button size="small" startIcon={<AddIcon />} onClick={() => updateQuestion(index, { ...question, options: [...question.options, { text: '', correct: false }] })}>เพิ่มตัวเลือก</Button> : null}
    </Stack></Box>)}
    <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setForm((v) => ({ ...v, questions: [...v.questions, blankQuestion()] }))}>เพิ่มคำถาม</Button>
  </Stack></DialogContent><DialogActions><Button onClick={onClose}>ยกเลิก</Button><Button variant="contained" disabled={loading || saving} onClick={save}>บันทึกแบบทดสอบ</Button></DialogActions></Dialog>;
}
