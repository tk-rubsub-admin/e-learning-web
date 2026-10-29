import { useEffect, useState, type FormEvent } from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { api } from 'api/api';
import { ROUTE_PATHS } from 'routes';

const BRAND_GREEN = '#1f7654';
const DARK_GREEN = '#1d2d25';
const FIELD_BORDER = '#d8d2c3';
const GEOTH_API_BASE = 'https://geoth.thiti.dev/api';

type GeoOption = {
  code: string;
  nameTh: string;
  postalCode?: string;
};

const readGeoList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result?.data)) return payload.result.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (payload?.data && typeof payload.data === 'object') return readGeoList(payload.data);
  if (payload?.result && typeof payload.result === 'object') return readGeoList(payload.result);
  const nestedArray = Object.values(payload || {}).find((value) => Array.isArray(value));
  return Array.isArray(nestedArray) ? nestedArray : [];
};

const normalizeGeoOptions = (payload: any): GeoOption[] =>
  readGeoList(payload)
    .map((item: any) => {
      const postalCode = item.postalCode ?? item.zipCode ?? item.zipcode ?? item.zip;
      return {
        code: String(item.code ?? item.id ?? item.provinceCode ?? item.districtCode ?? item.subdistrictCode ?? ''),
        nameTh: String(item.nameTh ?? item.provinceNameTh ?? item.districtNameTh ?? item.subdistrictNameTh ?? item.name_th ?? item.name ?? ''),
        postalCode: postalCode == null ? undefined : String(postalCode)
      };
    })
    .filter((item) => item.code && item.nameTh);

const fetchGeoOptions = async (path: string): Promise<GeoOption[]> => {
  const response = await fetch(`${GEOTH_API_BASE}${path}`);
  if (!response.ok) throw new Error(`GeoTH request failed: ${response.status}`);
  return normalizeGeoOptions(await response.json());
};

export default function RegisterPage(): JSX.Element {
  const history = useHistory();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressHouseNumber, setAddressHouseNumber] = useState('');
  const [addressMoo, setAddressMoo] = useState('');
  const [addressBuilding, setAddressBuilding] = useState('');
  const [addressAlley, setAddressAlley] = useState('');
  const [addressRoad, setAddressRoad] = useState('');
  const [addressProvince, setAddressProvince] = useState('');
  const [addressDistrict, setAddressDistrict] = useState('');
  const [addressSubdistrict, setAddressSubdistrict] = useState('');
  const [addressPostalCode, setAddressPostalCode] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [subdistrictCode, setSubdistrictCode] = useState('');
  const [provinces, setProvinces] = useState<GeoOption[]>([]);
  const [districts, setDistricts] = useState<GeoOption[]>([]);
  const [subdistricts, setSubdistricts] = useState<GeoOption[]>([]);
  const [postalCodes, setPostalCodes] = useState<string[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [informationCertified, setInformationCertified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('ไม่สามารถสร้างบัญชีผู้ใช้ได้');
  const [successMessage, setSuccessMessage] = useState('');
  const [usernameAvailability, setUsernameAvailability] = useState('');
  const [emailAvailability, setEmailAvailability] = useState('');
  const [website, setWebsite] = useState('');
  const [formStartedAt] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    setGeoLoading(true);
    fetchGeoOptions('/provinces/all')
      .then((options) => {
        if (active) setProvinces(options);
      })
      .catch(() => {
        if (active) setGeoError('ไม่สามารถโหลดข้อมูลจังหวัดได้ กรุณาลองใหม่อีกครั้ง');
      })
      .finally(() => {
        if (active) setGeoLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!provinceCode) {
      setDistricts([]);
      return undefined;
    }
    let active = true;
    setGeoLoading(true);
    fetchGeoOptions(`/provinces-with-districts/${encodeURIComponent(provinceCode)}`)
      .then((options) => {
        if (active) setDistricts(options);
      })
      .catch(() => {
        if (active) setGeoError('ไม่สามารถโหลดข้อมูลเขต/อำเภอได้ กรุณาลองใหม่อีกครั้ง');
      })
      .finally(() => {
        if (active) setGeoLoading(false);
      });
    return () => {
      active = false;
    };
  }, [provinceCode]);

  useEffect(() => {
    if (!districtCode) {
      setSubdistricts([]);
      return undefined;
    }
    let active = true;
    setGeoLoading(true);
    fetchGeoOptions(`/districts-with-subdistricts/${encodeURIComponent(districtCode)}`)
      .then((options) => {
        if (active) setSubdistricts(options);
      })
      .catch(() => {
        if (active) setGeoError('ไม่สามารถโหลดข้อมูลแขวง/ตำบลได้ กรุณาลองใหม่อีกครั้ง');
      })
      .finally(() => {
        if (active) setGeoLoading(false);
      });
    return () => {
      active = false;
    };
  }, [districtCode]);

  useEffect(() => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    if ((!trimmedUsername || trimmedUsername.length < 3) && !trimmedEmail) {
      setUsernameAvailability('');
      setEmailAvailability('');
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      try {
        const response = await api.get('/auth/availability', {
          params: {
            username: trimmedUsername || undefined,
            email: trimmedEmail || undefined
          }
        });
        setUsernameAvailability(
          trimmedUsername
            ? response.data.usernameAvailable
              ? 'ชื่อนี้สามารถใช้ได้'
              : 'ชื่อนี้ถูกใช้งานแล้ว'
            : ''
        );
        setEmailAvailability(
          trimmedEmail
            ? response.data.emailAvailable
              ? 'อีเมลนี้สามารถใช้ได้'
              : 'อีเมลนี้ถูกใช้งานแล้ว'
            : ''
        );
      } catch {
        setUsernameAvailability('');
        setEmailAvailability('');
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [username, email]);

  const handleClear = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setTitle('');
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    setAddressHouseNumber('');
    setAddressMoo('');
    setAddressBuilding('');
    setAddressAlley('');
    setAddressRoad('');
    setAddressProvince('');
    setAddressDistrict('');
    setAddressSubdistrict('');
    setAddressPostalCode('');
    setProvinceCode('');
    setDistrictCode('');
    setSubdistrictCode('');
    setPostalCodes([]);
    setPdpaConsent(false);
    setInformationCertified(false);
    setUsernameAvailability('');
    setEmailAvailability('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUsername = username.trim();
    const normalizedPhoneNumber = phoneNumber.replace(/\D/g, '');

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !normalizedPhoneNumber ||
      !email.trim() ||
      !addressHouseNumber.trim() ||
      !addressProvince.trim() ||
      !addressDistrict.trim() ||
      !addressSubdistrict.trim() ||
      !addressPostalCode.trim() ||
      !trimmedUsername ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setDialogMessage('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
      setOpenDialog(true);
      return;
    }
    if (!/^0\d{9}$/.test(normalizedPhoneNumber)) {
      setDialogMessage('กรุณากรอกเบอร์โทรศัพท์มือถือ 10 หลัก โดยขึ้นต้นด้วย 0');
      setOpenDialog(true);
      return;
    }
    if (!/^\d{5}$/.test(addressPostalCode.trim())) {
      setDialogMessage('กรุณากรอกรหัสไปรษณีย์เป็นตัวเลข 5 หลัก');
      setOpenDialog(true);
      return;
    }
    if (!pdpaConsent || !informationCertified) {
      setDialogMessage('กรุณายอมรับการเก็บข้อมูลตามนโยบาย PDPA และรับรองว่าข้อมูลเป็นความจริง');
      setOpenDialog(true);
      return;
    }
    if (!/^[a-zA-Z0-9._-]{3,50}$/.test(trimmedUsername)) {
      setDialogMessage(
        'ชื่อผู้ใช้งานต้องมี 3-50 ตัวอักษร และใช้ได้เฉพาะ a-z, A-Z, 0-9, จุด, ขีดกลาง หรือขีดล่าง'
      );
      setOpenDialog(true);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setDialogMessage('กรุณากรอกอีเมลให้ถูกต้อง');
      setOpenDialog(true);
      return;
    }
    if (
      usernameAvailability === 'ชื่อนี้ถูกใช้งานแล้ว' ||
      emailAvailability === 'อีเมลนี้ถูกใช้งานแล้ว'
    ) {
      setDialogMessage('ชื่อผู้ใช้งานหรืออีเมลนี้ถูกใช้งานแล้ว');
      setOpenDialog(true);
      return;
    }
    if (password.length < 8) {
      setDialogMessage('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      setOpenDialog(true);
      return;
    }
    if (password !== confirmPassword) {
      setDialogMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      setOpenDialog(true);
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/register', {
        username: trimmedUsername,
        email: email.trim(),
        password,
        title: title.trim() || null,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: normalizedPhoneNumber,
        addressHouseNumber: addressHouseNumber.trim(),
        addressMoo: addressMoo.trim() || null,
        addressBuilding: addressBuilding.trim() || null,
        addressAlley: addressAlley.trim() || null,
        addressRoad: addressRoad.trim() || null,
        addressProvince: addressProvince.trim(),
        addressDistrict: addressDistrict.trim(),
        addressSubdistrict: addressSubdistrict.trim(),
        addressPostalCode: addressPostalCode.trim(),
        pdpaConsent,
        informationCertified,
        website,
        formStartedAt
      });
      setSuccessMessage('สร้างบัญชีเรียบร้อยแล้ว กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ');
    } catch (error: any) {
      setDialogMessage(error?.response?.data?.message || 'ไม่สามารถสร้างบัญชีผู้ใช้ได้ในขณะนี้');
      setOpenDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2.5,
      backgroundColor: '#fff',
      '& fieldset': { borderColor: FIELD_BORDER },
      '&:hover fieldset': { borderColor: '#aaa38f' },
      '&.Mui-focused fieldset': { borderColor: BRAND_GREEN, borderWidth: 1.5 }
    },
    '& .MuiFormHelperText-root': { mx: 0, mt: 0.75 }
  };

  const fieldLabel = (label: string, required = true) => (
    <Typography sx={{ mb: 0.85, color: DARK_GREEN, fontWeight: 700, fontSize: '0.94rem' }}>
      {label} {required ? <Box component="span" sx={{ color: '#a83d34' }}>*</Box> : null}
    </Typography>
  );

  const geoFieldSx = {
    ...fieldSx,
    '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#6b716c' }
  };

  const activeStep = successMessage ? 2 : 0;

  const sectionHeading = (number: number, label: string, first = false) => (
    <Typography
      variant="h5"
      sx={{
        fontWeight: 800,
        mt: first ? 0 : 5,
        pb: 2,
        mb: 3,
        borderBottom: '1px solid #e5e1d7'
      }}>
      {number}. {label}
    </Typography>
  );

  return (
    <>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f4ee', color: DARK_GREEN }}>
        <Box
          component="header"
          sx={{
            height: { xs: 68, md: 76 },
            px: { xs: 2, md: 4 },
            bgcolor: '#fff',
            borderBottom: '1px solid #e2ded1',
            display: 'flex',
            alignItems: 'center'
          }}>
          <Box
            sx={{
              width: '100%',
              maxWidth: 1320,
              mx: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2
            }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 2,
                  // bgcolor: BRAND_GREEN,
                  p: 0.6,
                  display: 'grid',
                  placeItems: 'center'
                }}>
                <Box
                  component="img"
                  src="/logo-carbon-edge.png"
                  alt="Carbon Edge"
                  sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>
                  Carbon Edge
                </Typography>
                <Typography sx={{ color: '#777d76', fontSize: '0.78rem', mt: 0.25 }}>
                  ระบบ E-Learning ออนไลน์
                </Typography>
              </Box>
            </Box>
            <Button
              type="button"
              variant="text"
              onClick={() => history.push(ROUTE_PATHS.LOGIN)}
              sx={{ color: BRAND_GREEN, textTransform: 'none', fontWeight: 600 }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                มีบัญชีแล้ว?&nbsp;
              </Box>
              เข้าสู่ระบบ
            </Button>
          </Box>
        </Box>

        <Box
          component="main"
          sx={{
            maxWidth: 1320,
            mx: 'auto',
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 3, md: 6 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '350px minmax(0, 1fr)' },
            gap: { xs: 3, md: 5, lg: 7 },
            alignItems: 'start'
          }}>
          <Box component="aside" sx={{ pt: { md: 1 } }}>
            <Typography sx={{ color: BRAND_GREEN, fontWeight: 800, mb: 1.25 }}>
              ใบสมัคร
            </Typography>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '2rem', md: '2.55rem' },
                lineHeight: 1.22,
                letterSpacing: '-0.025em',
                fontWeight: 800,
                mb: 2
              }}>
              สมัครเข้าใช้งาน Carbon Edge E-Learning
            </Typography>
            <Typography sx={{ color: '#646b65', lineHeight: 1.8, mb: 3.5 }}>
              กรอกข้อมูลบัญชีให้ครบถ้วน
            </Typography>

            <Box sx={{ display: 'grid', gap: 1.25, mb: 3.5 }}>
              {[
                ['1', 'กรอกข้อมูลบัญชี'],
                ['2', 'เริ่มต้นเรียน']
              ].map(([number, label], index) => (
                <Box
                  key={number}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1.4,
                    border: index === activeStep ? `1.5px solid ${BRAND_GREEN}` : '1px solid transparent',
                    borderRadius: 2.5,
                    bgcolor: index === activeStep ? 'rgba(255,255,255,0.66)' : 'transparent'
                  }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: index === activeStep ? BRAND_GREEN : 'transparent',
                      border: index === activeStep ? 'none' : '1.5px solid #a6ada5',
                      color: index === activeStep ? '#fff' : '#6e756e',
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                    {number}
                  </Box>
                    <Typography sx={{ fontWeight: index === activeStep ? 800 : 500, color: index === activeStep ? DARK_GREEN : '#6e756e' }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ p: 2.4, borderRadius: 3, bgcolor: '#e5f0e9', mb: 3 }}>
              <Typography sx={{ color: '#15563e', fontWeight: 800, mb: 1.1 }}>
                ต้องใช้อะไรบ้าง
              </Typography>
              <Typography sx={{ color: '#52635a', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
                {'• เบอร์โทรศัพท์มือถือที่ติดต่อได้\n• อีเมลที่ใช้งานอยู่\n• ที่อยู่ปัจจุบันสำหรับติดต่อ\n• รหัสผ่านอย่างน้อย 8 ตัวอักษร'}
              </Typography>
            </Box>

            <Typography sx={{ color: '#737a74', fontSize: '0.86rem', lineHeight: 1.7 }}>
              หากพบปัญหาในการสมัคร กรุณาติดต่อผู้ดูแลระบบ
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: { xs: 3, md: 4 },
              border: '1px solid #ded9ca',
              bgcolor: 'rgba(255,255,255,0.94)',
              overflow: 'hidden'
            }}>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ px: { xs: 2.5, sm: 4.5, lg: 6 }, py: { xs: 3, sm: 4.5 } }}>
              {successMessage ? (
                <Box sx={{ py: { xs: 4, sm: 8 }, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      mx: 'auto',
                      mb: 2,
                      bgcolor: '#e5f0e9',
                      color: BRAND_GREEN,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '2rem',
                      fontWeight: 800
                    }}>
                    ✓
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                    ลงทะเบียนเรียบร้อยแล้ว
                  </Typography>
                  <Typography sx={{ color: '#68716b', lineHeight: 1.8, mb: 3 }}>
                    {successMessage}
                  </Typography>
                  <Button
                    type="button"
                    variant="contained"
                    onClick={() => history.push(ROUTE_PATHS.LOGIN)}
                    sx={{
                      borderRadius: 2.5,
                      px: 4,
                      py: 1.25,
                      bgcolor: `${BRAND_GREEN} !important`,
                      textTransform: 'none',
                      fontWeight: 800
                    }}>
                    ไปหน้าเข้าสู่ระบบ
                  </Button>
                </Box>
              ) : (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      pb: 2,
                      mb: 3,
                      borderBottom: '1px solid #e5e1d7'
                    }}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      1. ข้อมูลส่วนตัว
                    </Typography>
                    <Typography sx={{ color: '#737a74', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      <Box component="span" sx={{ color: '#a83d34' }}>*</Box> จำเป็นต้องกรอก
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '0.7fr 1fr 1fr' },
                      gap: { xs: 2.2, sm: 3 }
                    }}>
                    <Box>
                      {fieldLabel('คำนำหน้า', false)}
                      <TextField
                        select
                        fullWidth
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        SelectProps={{ displayEmpty: true }}
                        inputProps={{ 'aria-label': 'คำนำหน้า' }}
                        sx={fieldSx}>
                        <MenuItem value=""><em>เลือก</em></MenuItem>
                        <MenuItem value="นาย">นาย</MenuItem>
                        <MenuItem value="นาง">นาง</MenuItem>
                        <MenuItem value="นางสาว">นางสาว</MenuItem>
                        <MenuItem value="อื่น ๆ">อื่น ๆ</MenuItem>
                      </TextField>
                    </Box>
                    <Box>
                      {fieldLabel('ชื่อ')}
                      <TextField
                        autoFocus
                        fullWidth
                        placeholder="ชื่อจริง (ภาษาไทย)"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        autoComplete="given-name"
                        inputProps={{ 'aria-label': 'ชื่อ', maxLength: 100 }}
                        sx={fieldSx}
                      />
                    </Box>
                    <Box>
                      {fieldLabel('นามสกุล')}
                      <TextField
                        fullWidth
                        placeholder="นามสกุล (ภาษาไทย)"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        autoComplete="family-name"
                        inputProps={{ 'aria-label': 'นามสกุล', maxLength: 100 }}
                        sx={fieldSx}
                      />
                    </Box>
                  </Box>

                  {sectionHeading(2, 'ข้อมูลการติดต่อ')}

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: { xs: 2.2, sm: 3 }
                    }}>
                    <Box>
                      {fieldLabel('เบอร์โทรศัพท์มือถือ')}
                      <TextField
                        fullWidth
                        type="tel"
                        placeholder="0XX-XXX-XXXX"
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        autoComplete="tel"
                        helperText="ตัวเลข 10 หลัก ใช้สำหรับติดต่อกลับ"
                        inputProps={{ 'aria-label': 'เบอร์โทรศัพท์มือถือ', maxLength: 12 }}
                        sx={fieldSx}
                      />
                    </Box>
                    <Box>
                      {fieldLabel('อีเมล')}
                      <TextField
                        fullWidth
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        helperText={emailAvailability || 'ระบบจะส่งลิงก์ยืนยันไปที่อีเมลนี้'}
                        error={emailAvailability === 'อีเมลนี้ถูกใช้งานแล้ว'}
                        inputProps={{ 'aria-label': 'อีเมล' }}
                        sx={fieldSx}
                      />
                    </Box>
                  </Box>

                  {sectionHeading(3, 'ที่อยู่ปัจจุบัน')}

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 2fr' }, gap: { xs: 2.2, sm: 3 } }}>
                    <Box>
                      {fieldLabel('บ้านเลขที่')}
                      <TextField fullWidth placeholder="เช่น 99/1" value={addressHouseNumber} onChange={(event) => setAddressHouseNumber(event.target.value)} inputProps={{ maxLength: 50 }} sx={fieldSx} />
                    </Box>
                    <Box>
                      {fieldLabel('หมู่ที่', false)}
                      <TextField fullWidth placeholder="-" value={addressMoo} onChange={(event) => setAddressMoo(event.target.value)} inputProps={{ maxLength: 50 }} sx={fieldSx} />
                    </Box>
                    <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
                      {fieldLabel('อาคาร / หมู่บ้าน', false)}
                      <TextField fullWidth placeholder="ชื่ออาคาร หรือหมู่บ้าน (ถ้ามี)" value={addressBuilding} onChange={(event) => setAddressBuilding(event.target.value)} inputProps={{ maxLength: 255 }} sx={fieldSx} />
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 2.2, sm: 3 } }}>
                    <Box>
                      {fieldLabel('ซอย', false)}
                      <TextField fullWidth placeholder="-" value={addressAlley} onChange={(event) => setAddressAlley(event.target.value)} inputProps={{ maxLength: 255 }} sx={fieldSx} />
                    </Box>
                    <Box>
                      {fieldLabel('ถนน', false)}
                      <TextField fullWidth placeholder="-" value={addressRoad} onChange={(event) => setAddressRoad(event.target.value)} inputProps={{ maxLength: 255 }} sx={fieldSx} />
                    </Box>
                    <Box>
                      {fieldLabel('จังหวัด')}
                      <TextField
                        select
                        fullWidth
                        value={provinceCode}
                        onChange={(event) => {
                          const selected = provinces.find((option) => option.code === event.target.value);
                          setProvinceCode(event.target.value);
                          setAddressProvince(selected?.nameTh || '');
                          setDistrictCode('');
                          setSubdistrictCode('');
                          setAddressDistrict('');
                          setAddressSubdistrict('');
                          setAddressPostalCode('');
                          setPostalCodes([]);
                        }}
                        SelectProps={{ displayEmpty: true }}
                        helperText={geoLoading && !provinces.length ? 'กำลังโหลดข้อมูลจังหวัด...' : undefined}
                        sx={geoFieldSx}>
                        <MenuItem value=""><em>เลือกจังหวัด</em></MenuItem>
                        {provinces.map((option) => <MenuItem key={option.code} value={option.code}>{option.nameTh}</MenuItem>)}
                      </TextField>
                    </Box>
                    <Box>
                      {fieldLabel('อำเภอ / เขต')}
                      <TextField
                        select
                        fullWidth
                        disabled={!provinceCode || geoLoading}
                        value={districtCode}
                        onChange={(event) => {
                          const selected = districts.find((option) => option.code === event.target.value);
                          setDistrictCode(event.target.value);
                          setAddressDistrict(selected?.nameTh || '');
                          setSubdistrictCode('');
                          setAddressSubdistrict('');
                          setAddressPostalCode('');
                          setPostalCodes([]);
                        }}
                        SelectProps={{ displayEmpty: true }}
                        sx={geoFieldSx}>
                        <MenuItem value=""><em>{provinceCode ? 'เลือกอำเภอ / เขต' : 'เลือกจังหวัดก่อน'}</em></MenuItem>
                        {districts.map((option) => <MenuItem key={option.code} value={option.code}>{option.nameTh}</MenuItem>)}
                      </TextField>
                    </Box>
                    <Box>
                      {fieldLabel('ตำบล / แขวง')}
                      <TextField
                        select
                        fullWidth
                        disabled={!districtCode || geoLoading}
                        value={subdistrictCode}
                        onChange={(event) => {
                          const selected = subdistricts.find((option) => option.code === event.target.value);
                          const selectedPostalCode = selected?.postalCode || '';
                          setSubdistrictCode(event.target.value);
                          setAddressSubdistrict(selected?.nameTh || '');
                          setPostalCodes(selectedPostalCode ? [selectedPostalCode] : []);
                          setAddressPostalCode(selectedPostalCode);
                        }}
                        SelectProps={{ displayEmpty: true }}
                        sx={geoFieldSx}>
                        <MenuItem value=""><em>{districtCode ? 'เลือกตำบล / แขวง' : 'เลือกอำเภอ / เขตก่อน'}</em></MenuItem>
                        {subdistricts.map((option) => <MenuItem key={option.code} value={option.code}>{option.nameTh}</MenuItem>)}
                      </TextField>
                    </Box>
                    <Box>
                      {fieldLabel('รหัสไปรษณีย์')}
                      <TextField
                        select
                        fullWidth
                        disabled={!subdistrictCode || !postalCodes.length}
                        value={addressPostalCode}
                        onChange={(event) => setAddressPostalCode(event.target.value)}
                        SelectProps={{ displayEmpty: true }}
                        sx={geoFieldSx}>
                        <MenuItem value=""><em>{subdistrictCode ? 'เลือกรหัสไปรษณีย์' : 'เลือกตำบล / แขวงก่อน'}</em></MenuItem>
                        {postalCodes.map((postalCode) => <MenuItem key={postalCode} value={postalCode}>{postalCode}</MenuItem>)}
                      </TextField>
                    </Box>
                  </Box>

                  {geoError ? <Typography sx={{ mt: 2, color: '#a83d34', fontSize: '0.86rem' }}>{geoError}</Typography> : null}

                  {sectionHeading(4, 'ข้อมูลบัญชีผู้ใช้งาน')}

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 2.2, sm: 3 } }}>
                    <Box>
                      {fieldLabel('ชื่อผู้ใช้งาน')}
                      <TextField fullWidth placeholder="เช่น carbon.student" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" helperText={usernameAvailability || 'ใช้ a-z, A-Z, 0-9, จุด, ขีดกลาง หรือขีดล่าง'} error={usernameAvailability === 'ชื่อนี้ถูกใช้งานแล้ว'} inputProps={{ 'aria-label': 'ชื่อผู้ใช้งาน' }} sx={fieldSx} />
                    </Box>
                    <Box />
                    <Box>
                      {fieldLabel('รหัสผ่าน')}
                      <TextField fullWidth type="password" placeholder="อย่างน้อย 8 ตัวอักษร" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" helperText="ต้องมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ" inputProps={{ 'aria-label': 'รหัสผ่าน' }} sx={fieldSx} />
                    </Box>
                    <Box>
                      {fieldLabel('ยืนยันรหัสผ่าน')}
                      <TextField fullWidth type="password" placeholder="กรอกรหัสผ่านอีกครั้ง" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" helperText="ต้องตรงกับรหัสผ่านด้านซ้าย" inputProps={{ 'aria-label': 'ยืนยันรหัสผ่าน' }} sx={fieldSx} />
                    </Box>
                  </Box>

                  <Box sx={{ mt: 4, p: { xs: 1.5, sm: 2.25 }, borderRadius: 2.5, bgcolor: '#f6f5f1' }}>
                    <FormControlLabel
                      control={<Checkbox checked={pdpaConsent} onChange={(event) => setPdpaConsent(event.target.checked)} sx={{ color: '#90988f', '&.Mui-checked': { color: BRAND_GREEN } }} />}
                      label={<Typography sx={{ color: '#4f5852', lineHeight: 1.65, fontSize: '0.92rem' }}>ข้าพเจ้ายินยอมให้ Carbon Edge เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลข้างต้น เพื่อวัตถุประสงค์ในการรับสมัครและติดต่อประสานงาน ตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) <Box component="span" sx={{ color: '#a83d34' }}>*</Box></Typography>}
                      sx={{ alignItems: 'center', m: 0 }}
                    />
                    <FormControlLabel
                      control={<Checkbox checked={informationCertified} onChange={(event) => setInformationCertified(event.target.checked)} sx={{ color: '#90988f', '&.Mui-checked': { color: BRAND_GREEN } }} />}
                      label={<Typography sx={{ color: '#4f5852', lineHeight: 1.65, fontSize: '0.92rem' }}>ข้าพเจ้าขอรับรองว่าข้อมูลที่กรอกเป็นความจริงทุกประการ <Box component="span" sx={{ color: '#a83d34' }}>*</Box></Typography>}
                      sx={{ alignItems: 'center', m: 0, mt: 0.5 }}
                    />
                  </Box>

                  <TextField
                    name="website"
                    tabIndex={-1}
                    aria-hidden="true"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    sx={{ position: 'absolute', left: '-10000px', opacity: 0 }}
                    autoComplete="off"
                  />

                  <Box
                    sx={{
                      mt: 4,
                      p: 2.25,
                      borderRadius: 2.5,
                      bgcolor: '#f6f5f1',
                      color: '#5f6861',
                      lineHeight: 1.75,
                      fontSize: '0.92rem'
                    }}>
                    เมื่อสมัครเข้าใช้งาน ระบบจะส่งอีเมลยืนยันบัญชี กรุณาตรวจสอบกล่องข้อความและยืนยันอีเมลก่อนเข้าสู่ระบบ
                  </Box>

                  <Box
                    sx={{
                      mt: 4,
                      display: 'flex',
                      flexDirection: { xs: 'column-reverse', sm: 'row' },
                      justifyContent: 'space-between',
                      gap: 1.5
                    }}>
                    <Button
                      type="button"
                      variant="outlined"
                      disabled={isLoading}
                      onClick={handleClear}
                      sx={{
                        borderRadius: 2.5,
                        px: 3,
                        py: 1.2,
                        borderColor: FIELD_BORDER,
                        color: '#4d554f',
                        textTransform: 'none',
                        fontWeight: 700
                      }}>
                      ล้างข้อมูล
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isLoading}
                      sx={{
                        borderRadius: 2.5,
                        px: { xs: 3, sm: 4 },
                        py: 1.2,
                        bgcolor: `${BRAND_GREEN} !important`,
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 800,
                        boxShadow: 'none',
                        '&:hover': { boxShadow: 'none', bgcolor: '#185f43 !important' }
                      }}>
                      {isLoading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนเข้าใช้งาน →'}
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>เกิดข้อผิดพลาด</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-line' }}>{dialogMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setOpenDialog(false)}>
            ตกลง
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
