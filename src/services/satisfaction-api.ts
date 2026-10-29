import { api } from 'api/api';

export type SatisfactionQuestionType = 'RATING' | 'SINGLE_CHOICE' | 'TEXT';
export type SatisfactionQuestion = {
  id?: number;
  type: SatisfactionQuestionType;
  prompt: string;
  options: string[];
  required: boolean;
  orderIndex?: number;
};
export type SatisfactionSurvey = {
  id: number;
  courseId: number;
  title: string;
  description?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  opensAt?: string | null;
  closesAt?: string | null;
  responseCount: number;
  questions: SatisfactionQuestion[];
  submitted: boolean;
  defaultSurvey?: boolean;
};
export type SatisfactionSurveyPayload = Omit<SatisfactionSurvey, 'id' | 'responseCount' | 'submitted'>;
export type SatisfactionResults = {
  surveyId: number;
  title: string;
  responseCount: number;
  questions: Array<{
    prompt: string;
    type: SatisfactionQuestionType;
    answerCount: number;
    averageRating?: number;
    ratingCounts?: Record<string, number>;
    choiceCounts?: Record<string, number>;
    comments?: string[];
  }>;
};
export type CourseSatisfactionSummary = {
  courseId: number;
  averageRating: number | null;
  ratingCount: number;
  responseCount: number;
  surveyCount: number;
};
export type StudentCourseSatisfactionStatus = {
  courseId: number;
  surveys: Array<{ id: number; title: string; submitted: boolean; available: boolean }>;
  evaluationComplete: boolean;
};
export type SatisfactionDefaultQuestion = { orderIndex: number; prompt: string };
export type CourseSatisfactionQuestionnaire = {
  courseId: number;
  surveys: Array<{ id: number; title: string; defaultSurvey: boolean; submitted: boolean }>;
  questions: Array<SatisfactionQuestion & { id: number; surveyId: number; surveyTitle: string }>;
};

export const listSatisfactionSurveys = async () => (await api.get<SatisfactionSurvey[]>('/satisfaction/admin')).data || [];
export const getDefaultSatisfactionQuestions = async () => (await api.get<SatisfactionDefaultQuestion[]>('/satisfaction/admin/default-questions')).data || [];
export const saveDefaultSatisfactionQuestions = async (prompts: string[]) =>
  (await api.put<SatisfactionDefaultQuestion[]>('/satisfaction/admin/default-questions', { prompts })).data || [];
export const getSatisfactionSurvey = async (surveyId: number) => (await api.get<SatisfactionSurvey>(`/satisfaction/admin/${surveyId}`)).data;
export const saveSatisfactionSurvey = async (payload: SatisfactionSurveyPayload, surveyId?: number) =>
  surveyId
    ? (await api.put<SatisfactionSurvey>(`/satisfaction/admin/${surveyId}`, payload)).data
    : (await api.post<SatisfactionSurvey>('/satisfaction/admin', payload)).data;
export const deleteSatisfactionSurvey = async (surveyId: number) => api.delete(`/satisfaction/admin/${surveyId}`);
export const getSatisfactionResults = async (surveyId: number) => (await api.get<SatisfactionResults>(`/satisfaction/admin/${surveyId}/results`)).data;
export const getCourseSatisfactionSummary = async (courseId: number) =>
  (await api.get<CourseSatisfactionSummary>(`/satisfaction/courses/${courseId}/summary`)).data;
export const getAvailableSatisfactionSurveys = async () => (await api.get<SatisfactionSurvey[]>('/satisfaction/available')).data || [];
export const getStudentCourseSatisfactionStatus = async (courseId: number) =>
  (await api.get<StudentCourseSatisfactionStatus>(`/satisfaction/courses/${courseId}/student-status`)).data;
export const getCourseSatisfactionQuestionnaire = async (courseId: number) =>
  (await api.get<CourseSatisfactionQuestionnaire>(`/satisfaction/courses/${courseId}/questionnaire`)).data;
export const submitCourseSatisfactionQuestionnaire = async (courseId: number, answers: Array<{ surveyId: number; questionId: number; answer: string }>) =>
  (await api.post<{ submitted: boolean; surveyCount: number }>(`/satisfaction/courses/${courseId}/questionnaire/responses`, { answers })).data;
export const getSatisfactionSurveyForStudent = async (surveyId: number) => (await api.get<SatisfactionSurvey>(`/satisfaction/${surveyId}`)).data;
export const submitSatisfactionSurvey = async (surveyId: number, answers: Array<{ questionId: number; answer: string }>) =>
  (await api.post<{ submitted: boolean; submittedAt: string }>(`/satisfaction/${surveyId}/responses`, { answers })).data;
