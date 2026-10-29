import { api } from 'api/api';

export type CertificateTemplateElement = {
  key: 'name' | 'course' | 'date' | 'qr' | 'certificateId' | 'logo' | 'signature';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  enabled: boolean;
};

export type CertificateTemplateSettings = {
  backgroundUrl?: string | null;
  logoUrl?: string | null;
  signatureUrl?: string | null;
  elements: CertificateTemplateElement[];
  certificateTitle: string;
  recipientIntro: string;
  courseIntro: string;
  achievementLine1: string;
  achievementLine2: string;
  signatoryName: string;
  signatoryTitle: string;
};

export const getCertificateTemplate = async () =>
  (await api.get<CertificateTemplateSettings>('/admin/certificate-template')).data;

export const saveCertificateTemplate = async (template: CertificateTemplateSettings) =>
  (await api.put<CertificateTemplateSettings>('/admin/certificate-template', template)).data;

export const uploadCertificateTemplateAsset = async (kind: 'signature', file: File) => {
  const body = new FormData();
  body.append('kind', kind);
  body.append('file', file);
  return (await api.post<string>('/admin/certificate-template/assets', body)).data;
};
