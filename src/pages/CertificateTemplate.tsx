import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useHistory } from 'react-router-dom';
import CertificateTemplateEditor from 'components/CertificateTemplateEditor';

export default function CertificateTemplatePage(): JSX.Element {
  const history = useHistory();

  return <Box component="main" sx={{ minHeight: '100vh', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 }, bgcolor: '#f6f8f5' }}>
    <Paper sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <WorkspacePremiumIcon color="primary" />
            <Typography variant="h4" fontWeight={800}>เทมเพลตใบประกาศนียบัตร</Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 1 }}>จัดการพื้นหลัง โลโก้ ลายเซ็น และตำแหน่งข้อความบนใบประกาศ</Typography>
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => history.goBack()}>กลับ</Button>
      </Stack>
      <CertificateTemplateEditor />
    </Paper>
  </Box>;
}
