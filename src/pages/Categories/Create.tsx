import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useHistory } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CategoryIcon from '@mui/icons-material/Category';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useAuth } from 'auth/AuthContext';
import { ROLES } from 'auth/roles';
import { ROUTE_PATHS } from 'routes';
import { createCategory } from 'services/category-api';

type CategoryFormState = {
  name: string;
  parent: string;
  idNumber: string;
  description: string;
  visible: boolean;
  theme: string;
};

const initialState: CategoryFormState = {
  name: '',
  parent: '0',
  idNumber: '',
  description: '',
  visible: true,
  theme: ''
};

export default function CategoryCreatePage(): JSX.Element {
  const history = useHistory();
  const { getRole } = useAuth();
  const [form, setForm] = useState<CategoryFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange =
    (field: 'name' | 'parent' | 'idNumber' | 'description' | 'theme') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value
      }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    const parentId = Number(form.parent);
    if (!form.name.trim()) {
      setErrorMessage('กรุณากรอกชื่อหมวดหมู่');
      return;
    }
    if (Number.isNaN(parentId) || parentId < 0) {
      setErrorMessage('Parent ต้องเป็นตัวเลข 0 หรือมากกว่า');
      return;
    }

    setIsSubmitting(true);

    try {
      await createCategory({
        name: form.name.trim(),
        parent: parentId,
        idNumber: form.idNumber.trim() || undefined,
        description: form.description.trim() || undefined,
        visible: form.visible,
        theme: form.theme.trim() || undefined
      });

      history.replace(ROUTE_PATHS.CATEGORIES);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถสร้างหมวดหมู่ได้ในขณะนี้');
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
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => history.push(ROUTE_PATHS.CATEGORIES)}>
            กลับไปหน้ารายการหมวดหมู่
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
                สร้างหมวดหมู่คอร์ส
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ maxWidth: 780, lineHeight: 1.7, opacity: 0.9 }}>
            ฟอร์มนี้ส่งข้อมูลตาม field ของ backend: name, parent, idNumber, description, visible และ theme
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
                label="Name"
                value={form.name}
                onChange={handleChange('name')}
                helperText="ชื่อหมวดหมู่"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Parent ID"
                value={form.parent}
                onChange={handleChange('parent')}
                inputProps={{ min: 0, step: 1 }}
                helperText="ใส่ 0 ถ้าเป็นหมวดหมู่ระดับบนสุด"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID Number"
                value={form.idNumber}
                onChange={handleChange('idNumber')}
                helperText="รหัสอ้างอิงของหมวดหมู่"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Theme"
                value={form.theme}
                onChange={handleChange('theme')}
                helperText="เช่น boost หรือ theme code ของ Moodle"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={5}
                label="Description"
                value={form.description}
                onChange={handleChange('description')}
                helperText="รายละเอียดหมวดหมู่"
              />
            </Grid>

            <Grid item xs={12}>
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
                ถ้าไม่เปิด visible หมวดหมู่อาจถูกซ่อนใน Moodle
              </Typography>
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
                  <CategoryIcon fontSize="small" />
                  <Typography variant="body2">
                    ข้อมูลนี้จะถูกส่งไปยัง backend เพื่อสร้าง category record
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.25 }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => history.push(ROUTE_PATHS.CATEGORIES)}
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
                    {isSubmitting ? 'กำลังสร้าง...' : 'สร้างหมวดหมู่'}
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
