import React, { ChangeEvent, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SaveIcon from '@mui/icons-material/Save';
import { getCertificateTemplate, saveCertificateTemplate, uploadCertificateTemplateAsset, type CertificateTemplateSettings } from 'services/certificate-template-api';

const SAMPLE = {
  name: 'นางสาวกัญญารา ชายกลิ่น',
  course: 'การจัดการคาร์บอนและการใช้ไบโอชาร์',
  date: 'ให้ไว้ ณ วันที่ 4 ตุลาคม 2569',
  certificateId: 'Certificate ID: CERT-EXAMPLE-2026'
};

const FIXED_COPY: Array<{ key: keyof CertificateTemplateSettings; label: string; value: string; box: Record<string, string>; multiline?: boolean }> = [
  { key: 'certificateTitle', label: 'หัวข้อใบประกาศ', value: 'ใบประกาศนียบัตร', box: { left: '22%', top: '28.5%', width: '56%', height: '6%' } },
  { key: 'recipientIntro', label: 'ข้อความเกริ่นนำ', value: 'ฉบับนี้ให้ไว้เพื่อแสดงว่า', box: { left: '32%', top: '36.5%', width: '36%', height: '3.8%' } },
  { key: 'courseIntro', label: 'ข้อความก่อนชื่อหลักสูตร', value: 'ได้ผ่านการอบรมและทดสอบตามหลักสูตร', box: { left: '28%', top: '54%', width: '44%', height: '3.5%' } },
  { key: 'achievementLine1', label: 'ข้อความรับรองบรรทัดที่ 1', value: 'และผ่านการประเมินตามเกณฑ์ที่กำหนด', box: { left: '15%', top: '74.5%', width: '70%', height: '3%' } },
  { key: 'achievementLine2', label: 'ข้อความรับรองบรรทัดที่ 2', value: 'ขอให้มีความมุ่งมั่นพัฒนาองค์ความรู้ เพื่อประโยชน์ต่อสิ่งแวดล้อมและสังคมสืบไป', box: { left: '12%', top: '77%', width: '76%', height: '3.5%' } },
  { key: 'signatoryName', label: 'ชื่อผู้ลงนาม (เว้นว่างเพื่อคงข้อความเดิม)', value: '', box: { left: '32%', top: '84%', width: '36%', height: '3%' } },
  { key: 'signatoryTitle', label: 'ตำแหน่งผู้ลงนาม (เว้นว่างเพื่อคงข้อความเดิม)', value: '', box: { left: '32%', top: '87%', width: '36%', height: '3%' } }
];

export default function CertificateTemplateEditor(): JSX.Element {
  const [template, setTemplate] = useState<CertificateTemplateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getCertificateTemplate().then(setTemplate)
      .catch((error) => setMessage({ type: 'error', text: error?.response?.data?.message || 'โหลดเทมเพลตไม่สำเร็จ' }))
      .finally(() => setLoading(false));
  }, []);

  const updateText = (key: keyof CertificateTemplateSettings, value: string) => {
    setTemplate((current) => current ? { ...current, [key]: value } : current);
  };

  const updateSignatureVisibility = (enabled: boolean) => {
    setTemplate((current) => current ? {
      ...current,
      elements: current.elements.map((item) => item.key === 'signature' ? { ...item, enabled } : item)
    } : current);
  };

  const uploadSignature = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !template) return;
    setUploading(true);
    try {
      const url = await uploadCertificateTemplateAsset('signature', file);
      setTemplate((current) => current ? {
        ...current,
        signatureUrl: url,
        elements: current.elements.map((item) => item.key === 'signature' ? { ...item, enabled: true } : item)
      } : current);
      setMessage({ type: 'success', text: 'อัปโหลดลายเซ็นแล้ว กดบันทึกเพื่อใช้งาน' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'อัปโหลดลายเซ็นไม่สำเร็จ' });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!template) return;
    setSaving(true);
    try {
      setTemplate(await saveCertificateTemplate(template));
      setMessage({ type: 'success', text: 'บันทึกข้อความและลายเซ็นแล้ว' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'บันทึกเทมเพลตไม่สำเร็จ' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>;
  if (!template) return <Alert severity="error">{message?.text || 'ไม่สามารถโหลดเทมเพลตได้'}</Alert>;

  const element = (key: string) => template.elements.find((item) => item.key === key);
  const visibleElements = template.elements.filter((item) => item.enabled);

  return <Stack spacing={2.5}>
    <Alert severity="info">เลย์เอาต์กระดาษ A4, พื้นหลัง, โลโก้, QR Code และตำแหน่ง/ขนาดทุกองค์ประกอบถูกล็อกไว้ แก้ไขได้เฉพาะข้อความและลายเซ็น</Alert>
    {message && <Alert severity={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(440px, 1.15fr) minmax(340px, .85fr)' }, gap: 3, alignItems: 'start' }}>
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.5 }, bgcolor: '#edf0ed', border: '1px solid #dde2dd', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={800}>ตัวอย่างเอกสาร</Typography>
          <Typography variant="caption" color="text.secondary">A4 · แนวตั้ง · ตำแหน่งคงที่</Typography>
        </Stack>
        <Paper elevation={4} sx={{ width: 'min(100%, 560px)', mx: 'auto', aspectRatio: '210 / 297', position: 'relative', overflow: 'hidden', containerType: 'inline-size', bgcolor: '#fff', backgroundImage: template.backgroundUrl ? `url("${template.backgroundUrl}")` : 'url("/certificate-default-preview.png")', backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' }}>
          {FIXED_COPY.map((item) => {
            const text = String(template[item.key] ?? item.value);
            if ((item.key === 'signatoryName' || item.key === 'signatoryTitle') && !text) return null;
            const copySize = item.key === 'certificateTitle' ? '6.5cqw'
              : item.key === 'achievementLine1' || item.key === 'achievementLine2' ? '2.25cqw'
                : item.key === 'signatoryName' || item.key === 'signatoryTitle' ? '2.5cqw' : '3.1cqw';
            return <React.Fragment key={item.key}>
              <Box sx={{ position: 'absolute', ...item.box, bgcolor: 'rgba(255,255,255,.98)' }} />
              <Typography sx={{ position: 'absolute', ...item.box, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden', color: item.key === 'achievementLine1' || item.key === 'achievementLine2' ? '#828282' : '#0B4A31', fontFamily: 'Sarabun, sans-serif', fontWeight: ['certificateTitle', 'signatoryName'].includes(item.key) ? 700 : 500, fontSize: copySize, lineHeight: 1.15 }}>
                {text}
              </Typography>
            </React.Fragment>;
          })}
          {visibleElements.map((item) => {
            if (item.key === 'name' || item.key === 'course' || item.key === 'date' || item.key === 'certificateId') {
              const text = SAMPLE[item.key as keyof typeof SAMPLE];
              const isId = item.key === 'certificateId';
              return <Typography key={item.key} sx={{ position: 'absolute', left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, height: `${item.height}%`, display: 'flex', alignItems: 'center', justifyContent: isId ? 'flex-start' : 'center', textAlign: isId ? 'left' : 'center', overflow: 'hidden', color: item.color, fontFamily: 'Sarabun, sans-serif', fontWeight: item.key === 'name' || item.key === 'course' ? 700 : 400, fontSize: `${Math.max(1, item.fontSize / 10)}cqw`, lineHeight: 1.15 }}>{text}</Typography>;
            }
            if (item.key === 'qr') return <Box key={item.key} sx={{ position: 'absolute', left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, height: `${item.height}%`, bgcolor: '#fff', border: '1px solid #222', display: 'grid', placeItems: 'center', fontSize: 8 }}>QR</Box>;
            if (item.key === 'signature' && template.signatureUrl) return <Box key={item.key} component="img" src={template.signatureUrl} alt="ลายเซ็น" sx={{ position: 'absolute', left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, height: `${item.height}%`, objectFit: 'contain', bgcolor: 'white' }} />;
            return null;
          })}
        </Paper>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={800}>แก้ไขข้อความ</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>ตัวอย่างทางซ้ายจะเปลี่ยนตามข้อความ โดยระบบล็อกตำแหน่งและขนาดไว้</Typography>
        <Stack spacing={1.75}>
          {FIXED_COPY.map((item) => <TextField key={item.key} fullWidth multiline={item.multiline || item.key === 'achievementLine2'} minRows={item.key === 'achievementLine2' ? 2 : 1} label={item.label} value={String(template[item.key] ?? item.value)} onChange={(event) => updateText(item.key, event.target.value)} inputProps={{ maxLength: 300 }} />)}

          <Box sx={{ pt: 1, borderTop: '1px solid #e5e9e4' }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>ลายเซ็น</Typography>
            {template.signatureUrl && <Box component="img" src={template.signatureUrl} alt="ตัวอย่างลายเซ็น" sx={{ display: 'block', maxWidth: 220, maxHeight: 90, objectFit: 'contain', mb: 1, p: 1, bgcolor: '#fafafa', border: '1px solid #e5e9e4', borderRadius: 1 }} />}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
              <Button component="label" variant="outlined" disabled={uploading}>
                {uploading ? <CircularProgress size={18} /> : template.signatureUrl ? 'เปลี่ยนรูปลายเซ็น' : 'อัปโหลดรูปลายเซ็น'}
                <input hidden type="file" accept="image/png,image/jpeg" onChange={(event) => void uploadSignature(event)} />
              </Button>
              <Typography variant="caption" color="text.secondary">PNG/JPEG ไม่เกิน 10 MB</Typography>
            </Stack>
            <FormControlLabel sx={{ mt: 1 }} control={<Switch checked={element('signature')?.enabled || false} onChange={(event) => updateSignatureVisibility(event.target.checked)} disabled={!template.signatureUrl} />} label="แสดงรูปลายเซ็น" />
            {template.signatureUrl && <Button size="small" color="error" onClick={() => setTemplate((current) => current ? { ...current, signatureUrl: null, elements: current.elements.map((item) => item.key === 'signature' ? { ...item, enabled: false } : item) } : current)}>นำรูปลายเซ็นออก</Button>}
          </Box>
          <Button variant="contained" size="large" startIcon={saving ? <CircularProgress size={17} color="inherit" /> : <SaveIcon />} disabled={saving || uploading} onClick={() => void save()}>บันทึกการแก้ไข</Button>
        </Stack>
      </Paper>
    </Box>
  </Stack>;
}
