import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useHistory } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SchoolIcon from '@mui/icons-material/School';
import { useAuth } from 'auth/AuthContext';
import { ROLES } from 'auth/roles';
import { ROUTE_PATHS } from 'routes';
import { createCourse, getCategories, type CategoryOption } from 'services/course-api';

type CourseFormState = {
  shortName: string;
  fullName: string;
  categoryId: string;
  summary: string;
  visible: boolean;
};

const initialState: CourseFormState = {
  shortName: '',
  fullName: '',
  categoryId: '',
  summary: '',
  visible: true
};

export default function CourseCreatePage(): JSX.Element {
  const history = useHistory();
  const { getRole } = useAuth();
  const [form, setForm] = useState<CourseFormState>(initialState);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      try {
        const data = await getCategories();
        if (!active) return;
        setCategories(data);
      } catch (error: any) {
        if (!active) return;
        setErrorMessage(error?.response?.data?.message || 'ไม่สามารถโหลดหมวดหมู่คอร์สได้');
      } finally {
        if (active) {
          setIsLoadingCategories(false);
        }
      }
    };

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((left, right) =>
        (left.path || left.name || '').localeCompare(right.path || right.name || '')
      ),
    [categories]
  );

  const handleChange =
    (field: 'shortName' | 'fullName' | 'summary') =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        setForm((current) => ({
          ...current,
          [field]: value
        }));
      };

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setForm((current) => ({
      ...current,
      categoryId: event.target.value || ''
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (!form.shortName.trim() || !form.fullName.trim() || !form.categoryId.trim()) {
      setErrorMessage('กรุณากรอกข้อมูลที่จำเป็นให้ครบ');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createCourse({
        shortName: form.shortName.trim(),
        fullName: form.fullName.trim(),
        categoryId: Number(form.categoryId),
        summary: form.summary.trim() || undefined,
        visible: form.visible
      });

      if (created?.id) {
        history.replace(ROUTE_PATHS.COURSE_DETAIL.replace(':id', String(created.id)));
        return;
      }

      history.replace(ROUTE_PATHS.COURSES);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถสร้างคอร์สได้ในขณะนี้');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (getRole() !== ROLES.ADMIN) {
    return (
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
            maxWidth: 980,
            mx: 'auto',
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            border: '1px solid rgba(39, 65, 31, 0.08)',
            boxShadow: '0 20px 50px rgba(27, 38, 22, 0.08)'
          }}>
          <Alert severity="warning">หน้านี้รองรับเฉพาะผู้ดูแลระบบเท่านั้น</Alert>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => history.push(ROUTE_PATHS.COURSES)}>
            กลับไปหน้ารายการคอร์ส
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
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
          maxWidth: 1160,
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
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
              <AddCircleOutlineIcon />
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
                สร้างคอร์สใหม่
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ maxWidth: 780, lineHeight: 1.7, opacity: 0.9 }}>
            กรอกข้อมูลหลักของคอร์สตาม payload ของ backend: short name, full name, category,
            summary และสถานะการแสดงผล
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
          {errorMessage ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMessage}
            </Alert>
          ) : null}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Short name"
                value={form.shortName}
                onChange={handleChange('shortName')}
                helperText="ตัวอย่าง: CE-101"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Full name"
                value={form.fullName}
                onChange={handleChange('fullName')}
                helperText="ชื่อเต็มของคอร์ส"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="course-category-label">Category</InputLabel>
                <Select
                  labelId="course-category-label"
                  label="Category"
                  value={form.categoryId}
                  onChange={handleCategoryChange}
                  disabled={isLoadingCategories || sortedCategories.length === 0}>
                  {sortedCategories.map((category) => (
                    <MenuItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {isLoadingCategories ? (
                <Typography
                  variant="caption"
                  sx={{ display: 'flex', alignItems: 'center', mt: 1, color: '#62715b' }}>
                  <CircularProgress size={14} sx={{ mr: 1 }} />
                  กำลังโหลดหมวดหมู่คอร์ส
                </Typography>
              ) : sortedCategories.length === 0 ? (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#a15b3b' }}>
                  ไม่พบหมวดหมู่คอร์ส
                </Typography>
              ) : null}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.visible}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        visible: event.target.checked
                      }))
                    }
                  />
                }
                label="Visible"
              />
              <Typography variant="body2" sx={{ color: '#687266', mt: 1 }}>
                ถ้าเปิดไว้ คอร์สจะมองเห็นได้ตามการตั้งค่าฝั่ง Moodle
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={5}
                label="Summary"
                value={form.summary}
                onChange={handleChange('summary')}
                helperText="รายละเอียดสรุปของคอร์ส ความยาวไม่เกิน 1000 ตัวอักษร"
              />
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  flexWrap: 'wrap',
                  pt: 1
                }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: '#61705a' }}>
                  <SchoolIcon fontSize="small" />
                  <Typography variant="body2">
                    ข้อมูลนี้จะถูกส่งไปยัง backend เพื่อสร้าง course record
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.25 }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => history.push(ROUTE_PATHS.COURSES)}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                    sx={{
                      borderRadius: 999,
                      textTransform: 'none',
                      fontWeight: 700,
                      backgroundColor: '#244026 !important'
                    }}>
                    {isSubmitting ? 'กำลังสร้าง...' : 'สร้างคอร์ส'}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
