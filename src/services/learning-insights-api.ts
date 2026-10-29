import { api } from 'api/api';
import type { CourseSummary } from 'services/course-api';

export type TimelineEvent = { type: string; occurredAt: string; courseId: number; contentItemId: number; title: string; score?: number | null; maxScore?: number | null; passed?: boolean | null; attemptNumber?: number | null };
export type RiskUser = { userId: number; username: string; courseId: number; reason: string; lastActivityAt?: string | null };
export type Engagement = { totalUsers: number; totalEnrollments: number; engagedEnrollments: number; atRiskEnrollments: number; atRiskUsers: RiskUser[] };
export type Certificate = { verificationCode: string; courseId: number; courseTitle?: string; issuedAt: string; learnerName: string; verificationUrl: string; pdfUrl: string };
export const getLearningHistory = async (courseId?: number) => (await api.get<TimelineEvent[]>('/learning-history', { params: courseId ? { courseId } : undefined })).data || [];
export const getStudentLearningHistory = async (studentId: number) =>
  (await api.get<TimelineEvent[]>(`/admin/students/${studentId}/learning-history`)).data || [];
export const getStudentCourses = async (studentId: number) =>
  (await api.get<CourseSummary[]>(`/admin/students/${studentId}/courses`)).data || [];
export const getEngagement = async () => (await api.get<Engagement>('/admin/engagement')).data;
export const issueCertificate = async (courseId: number) => (await api.post<Certificate>(`/certificates/courses/${courseId}/mine`)).data;
export const verifyCertificate = async (code: string) => (await api.get<Certificate>(`/certificates/verify/${code}`)).data;
