import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CssBaseline from '@mui/material/CssBaseline';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/Category';
import { useAuth } from 'auth/AuthContext';
import { ROLES } from 'auth/roles';
import { ROUTE_PATHS } from 'routes';
import { getCategories, type CategoryRecord } from 'services/category-api';

const normalizeText = (value?: string | null): string => (value || '').trim().toLowerCase();

export default function CategoriesPage(): JSX.Element {
  const history = useHistory();
  const { getRole } = useAuth();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('ไม่สามารถโหลดหมวดหมู่คอร์สได้');

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      try {
        const data = await getCategories();
        if (!active) return;
        setCategories(data);
      } catch (error: any) {
        if (!active) return;
        setErrorMessage(error?.response?.data?.message || 'ไม่สามารถโหลดหมวดหมู่คอร์สได้ในขณะนี้');
        setOpenErrorDialog(true);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return categories;

    return categories.filter((category) => {
      const haystack = [
        category.name,
        category.idNumber,
        category.description,
        category.path,
        category.theme,
        String(category.id),
        String(category.parent ?? '')
      ]
        .map(normalizeText)
        .join(' ');

      return haystack.includes(keyword);
    });
  }, [categories, search]);

  const stats = useMemo(
    () => ({
      total: categories.length,
      filtered: filteredCategories.length,
      visible: categories.filter((category) => category.visible !== false).length
    }),
    [categories, filteredCategories.length]
  );

  const canCreate = getRole() === ROLES.ADMIN;

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
                mb: 1.25
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
                  <CategoryIcon />
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
                    หมวดหมู่คอร์ส
                  </Typography>
                </Box>
              </Box>

              {canCreate ? (
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => history.push(ROUTE_PATHS.CATEGORY_CREATE)}
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
                  เพิ่มหมวดหมู่
                </Button>
              ) : null}
            </Box>
            <Typography sx={{ maxWidth: 760, lineHeight: 1.7, opacity: 0.9 }}>
              จัดการหมวดหมู่คอร์สจาก Moodle ที่ backend ดึงมาให้ โดยดู path, จำนวนคอร์ส และสถานะ visible
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
                    ที่มองเห็น
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#20301d' }}>
                    {stats.visible}
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
              placeholder="ค้นหาด้วยชื่อ, path, id, theme หรือรายละเอียด"
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
                  minHeight: 280,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#62715b'
                }}>
                กำลังโหลดหมวดหมู่คอร์ส...
              </Box>
            ) : filteredCategories.length === 0 ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  borderRadius: 3,
                  borderStyle: 'dashed',
                  textAlign: 'center',
                  color: '#5f6a58'
                }}>
                ไม่พบหมวดหมู่คอร์สที่ตรงกับคำค้น
              </Paper>
            ) : (
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: 'rgba(39, 65, 31, 0.08)',
                  boxShadow: '0 12px 28px rgba(27, 38, 22, 0.05)'
                }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Path</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Parent</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Courses</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Visible</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Theme</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 800, color: '#1f2b1d' }}>
                            {category.name}
                          </Typography>
                          {category.description ? (
                            <Typography variant="body2" sx={{ color: '#687266', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                              {category.description}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>{category.id}</TableCell>
                        <TableCell sx={{ minWidth: 260 }}>
                          <Typography variant="body2" sx={{ color: '#5f6b59', wordBreak: 'break-word' }}>
                            {category.path || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{category.parent ?? 0}</TableCell>
                        <TableCell>{category.courseCount ?? 0}</TableCell>
                        <TableCell>
                          <Chip
                            label={category.visible === false ? 'Hidden' : 'Visible'}
                            size="small"
                            sx={{
                              bgcolor: category.visible === false ? 'rgba(226, 103, 55, 0.12)' : 'rgba(39, 65, 31, 0.10)',
                              color: category.visible === false ? '#b24c23' : '#244026',
                              fontWeight: 700
                            }}
                          />
                        </TableCell>
                        <TableCell>{category.theme || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
    </>
  );
}
