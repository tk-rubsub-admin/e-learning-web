import { api } from 'api/api';

export type CourseSummary = {
  id: number;
  shortName: string;
  fullName: string;
  displayName?: string;
  categoryId?: number | null;
  summary?: string | null;
  enrollmentStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | null;
  courseStartedAt?: string | null;
  courseCompletedAt?: string | null;
  studentCount?: number | null;
};

export type CourseTeacher = {
  userId: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

export type CourseContentItem = {
  id: number;
  sectionId: number;
  type?: string;
  renderKind?: string;
  title?: string;
  description?: string | null;
  orderIndex?: number;
  required?: boolean;
  visible?: boolean;
  durationSeconds?: number | null;
  sourceUrl?: string | null;
  payloadJson?: string | null;
  publishedAt?: string | null;
};

export type CourseSection = {
  id: number;
  courseId: number;
  title?: string;
  description?: string | null;
  orderIndex?: number;
  visible?: boolean;
  locked?: boolean;
  items?: CourseContentItem[];
};

export type CourseDetails = CourseSummary & {
  teachers?: CourseTeacher[];
  studentCount?: number | null;
  sectionCount?: number | null;
  itemCount?: number | null;
  sections?: CourseSection[];
};

export type CourseLaunch = {
  courseId?: number;
  launchUrl?: string;
  expiresAt?: string;
};

export type StudentSearchResult = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  role: string;
  moodleUserId?: number | null;
};

export type StudentSearchResponse = {
  items: StudentSearchResult[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type BulkStudentCreationRow = {
  rowNumber: number;
  username: string;
  status: 'CREATED' | 'FAILED';
  message: string;
};

export type BulkStudentCreationResponse = {
  totalRows: number;
  createdCount: number;
  failedCount: number;
  results: BulkStudentCreationRow[];
};

export type CourseStudent = {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  enrollmentStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  courseStartedAt?: string | null;
  courseCompletedAt?: string | null;
  completedRequiredItems: number;
  totalRequiredItems: number;
  progressPercent: number;
};

export type CourseStudentPageResponse = {
  items: CourseStudent[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type BulkStudentEnrollmentRow = {
  rowNumber: number;
  username: string;
  status: 'ENROLLED' | 'ALREADY_ENROLLED' | 'FAILED';
  message: string;
};

export type BulkStudentEnrollmentResponse = {
  totalRows: number;
  enrolledCount: number;
  alreadyEnrolledCount: number;
  failedCount: number;
  results: BulkStudentEnrollmentRow[];
};

export type CategoryOption = {
  id: number;
  name: string;
  path?: string | null;
  visible?: boolean | null;
  courseCount?: number | null;
};

export type CreateCoursePayload = {
  shortName: string;
  fullName: string;
  categoryId: number;
  summary?: string;
  visible?: boolean;
};

export type CourseContentFile = {
  fileName: string;
  sourceUrl: string;
};

export type QuizOptionInput = { text: string; correct: boolean };
export type QuizQuestionInput = { type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE'; prompt: string; feedback?: string; points: number; options: QuizOptionInput[] };
export type QuizDefinition = { id: number; contentItemId: number; passingScore: number; maxAttempts?: number | null; timeLimitSeconds?: number | null; opensAt?: string | null; closesAt?: string | null; published: boolean; randomizeQuestions: boolean; randomizeOptions: boolean; questions: Array<QuizQuestionInput & { id: number; orderIndex: number; options: Array<QuizOptionInput & { id: number; orderIndex: number }> }> };
export type QuizDefinitionPayload = { passingScore: number; maxAttempts?: number | null; timeLimitSeconds?: number | null; opensAt?: string | null; closesAt?: string | null; published: boolean; randomizeQuestions: boolean; randomizeOptions: boolean; questions: QuizQuestionInput[] };

export const getMyCourses = async (): Promise<CourseSummary[]> => {
  const response = await api.get<CourseSummary[]>('/courses/my');
  return response.data || [];
};

export const deleteCourse = async (courseId: string | number): Promise<void> => {
  await api.delete(`/courses/${courseId}`);
};

export const getCourseContent = async (courseId: string | number): Promise<CourseSection[]> => {
  const response = await api.get<CourseSection[]>(`/courses/${courseId}/content`);
  return response.data || [];
};

export const getMyCourseById = async (courseId: string | number): Promise<CourseSummary> => {
  const response = await api.get<CourseSummary>(`/courses/${courseId}`);
  return response.data;
};

export const getMyCourseDetails = async (courseId: string | number): Promise<CourseDetails> => {
  const response = await api.get<CourseDetails>(`/courses/${courseId}/details`);
  return response.data;
};

export const getMyCourseLaunch = async (courseId: string | number): Promise<CourseLaunch> => {
  const response = await api.get<CourseLaunch>(`/courses/${courseId}/launch`);
  return response.data;
};

export const enrollStudentToCourse = async (courseId: string | number, userId: number): Promise<void> => {
  await api.post(`/courses/${courseId}/students/${userId}`);
};

export const bulkEnrollStudentsToCourse = async (
  courseId: string | number,
  file: File
): Promise<BulkStudentEnrollmentResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<BulkStudentEnrollmentResponse>(
    `/courses/${courseId}/students/bulk-upload`,
    formData
  );
  return response.data;
};

export const getCourseStudents = async (
  courseId: string | number,
  page = 1,
  size = 10
): Promise<CourseStudentPageResponse> => {
  const response = await api.get<CourseStudentPageResponse>(`/courses/${courseId}/students`, {
    params: { page, size }
  });
  const data = response.data;

  // Supports the previous list response until the backend is deployed with pagination.
  if (Array.isArray(data)) {
    return {
      items: data as unknown as CourseStudent[],
      page: 1,
      size,
      totalElements: data.length,
      totalPages: 1
    };
  }

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    page: data?.page || page,
    size: data?.size || size,
    totalElements: data?.totalElements || 0,
    totalPages: data?.totalPages || 0
  };
};

export const getCourseStudentIds = async (courseId: string | number): Promise<number[]> => {
  const response = await api.get<number[]>(`/courses/${courseId}/student-ids`);
  return Array.isArray(response.data) ? response.data : [];
};

export const searchSystemCourses = async (keyword?: string): Promise<CourseSummary[]> => {
  const response = await api.post<CourseSummary[]>('/v1/courses', {
    keyword: keyword?.trim() || undefined
  });
  return response.data || [];
};

export const searchStudents = async (
  keyword?: string,
  page = 1,
  size = 10
): Promise<StudentSearchResponse> => {
  const response = await api.post<StudentSearchResponse>('/v1/students', {
    keyword: keyword?.trim() || undefined,
    page,
    size
  });
  return (
    response.data || {
      items: [],
      page,
      size,
      totalElements: 0,
      totalPages: 0
    }
  );
};

export const approveStudent = async (studentId: number): Promise<StudentSearchResult> => {
  const response = await api.patch<StudentSearchResult>(`/v1/students/${studentId}/approve`);
  return response.data;
};

export const suspendStudent = async (studentId: number): Promise<StudentSearchResult> => {
  const response = await api.patch<StudentSearchResult>(`/v1/students/${studentId}/suspend`);
  return response.data;
};

export const bulkCreateStudents = async (file: File): Promise<BulkStudentCreationResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<BulkStudentCreationResponse>('/v1/students/bulk-upload', formData);
  return response.data;
};

export const getCategories = async (): Promise<CategoryOption[]> => {
  const response = await api.get<CategoryOption[]>('/categories');
  return response.data || [];
};

export const createCourse = async (payload: CreateCoursePayload): Promise<CourseSummary> => {
  const response = await api.post<CourseSummary>('/courses', payload);
  return response.data;
};

export const uploadCourseContentPdf = async (
  courseId: string | number,
  file: File
): Promise<CourseContentFile> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<CourseContentFile>(`/courses/${courseId}/content-files`, formData);
  return response.data;
};

export const uploadCourseContentVideo = async (
  courseId: string | number,
  file: File
): Promise<CourseContentFile> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<CourseContentFile>(`/courses/${courseId}/content-videos`, formData);
  return response.data;
};

export const getQuizDefinition = async (courseId: string | number, sectionId: number, itemId: number): Promise<QuizDefinition> => {
  const response = await api.get<QuizDefinition>(`/courses/${courseId}/sections/${sectionId}/items/${itemId}/quiz`);
  return response.data;
};

export const saveQuizDefinition = async (courseId: string | number, sectionId: number, itemId: number, payload: QuizDefinitionPayload): Promise<QuizDefinition> => {
  const response = await api.put<QuizDefinition>(`/courses/${courseId}/sections/${sectionId}/items/${itemId}/quiz`, payload);
  return response.data;
};

export type CreateCourseSectionPayload = {
  title: string;
  description?: string;
  orderIndex?: number | null;
  visible?: boolean;
  locked?: boolean;
};

export type UpdateCourseSectionPayload = {
  title?: string;
  description?: string;
  orderIndex?: number | null;
  visible?: boolean;
  locked?: boolean;
};

export type CreateCourseContentItemPayload = {
  type: string;
  title: string;
  description?: string;
  orderIndex?: number | null;
  required?: boolean;
  visible?: boolean;
  durationSeconds?: number | null;
  sourceUrl?: string;
  payloadJson?: string;
  published?: boolean;
};

export type UpdateCourseContentItemPayload = {
  type?: string;
  title?: string;
  description?: string;
  orderIndex?: number | null;
  required?: boolean;
  visible?: boolean;
  durationSeconds?: number | null;
  sourceUrl?: string;
  payloadJson?: string;
  published?: boolean;
};

export const createCourseSection = async (
  courseId: string | number,
  payload: CreateCourseSectionPayload
): Promise<CourseSection> => {
  const response = await api.post<CourseSection>(`/courses/${courseId}/sections`, payload);
  return response.data;
};

export const updateCourseSection = async (
  courseId: string | number,
  sectionId: string | number,
  payload: UpdateCourseSectionPayload
): Promise<CourseSection> => {
  const response = await api.patch<CourseSection>(`/courses/${courseId}/sections/${sectionId}`, payload);
  return response.data;
};

export const reorderCourseSection = async (
  courseId: string | number,
  sectionId: string | number,
  orderIndex: number
): Promise<CourseSection> => {
  const response = await api.patch<CourseSection>(`/courses/${courseId}/sections/${sectionId}/reorder`, {
    orderIndex
  });
  return response.data;
};

export const deleteCourseSection = async (courseId: string | number, sectionId: string | number): Promise<void> => {
  await api.delete(`/courses/${courseId}/sections/${sectionId}`);
};

export const createCourseContentItem = async (
  courseId: string | number,
  sectionId: string | number,
  payload: CreateCourseContentItemPayload
): Promise<CourseContentItem> => {
  const response = await api.post<CourseContentItem>(`/courses/${courseId}/sections/${sectionId}/items`, payload);
  return response.data;
};

export const updateCourseContentItem = async (
  courseId: string | number,
  sectionId: string | number,
  itemId: string | number,
  payload: UpdateCourseContentItemPayload
): Promise<CourseContentItem> => {
  const response = await api.patch<CourseContentItem>(
    `/courses/${courseId}/sections/${sectionId}/items/${itemId}`,
    payload
  );
  return response.data;
};

export const reorderCourseContentItem = async (
  courseId: string | number,
  sectionId: string | number,
  itemId: string | number,
  orderIndex: number
): Promise<CourseContentItem> => {
  const response = await api.patch<CourseContentItem>(
    `/courses/${courseId}/sections/${sectionId}/items/${itemId}/reorder`,
    { orderIndex }
  );
  return response.data;
};

export const deleteCourseContentItem = async (
  courseId: string | number,
  sectionId: string | number,
  itemId: string | number
): Promise<void> => {
  await api.delete(`/courses/${courseId}/sections/${sectionId}/items/${itemId}`);
};
