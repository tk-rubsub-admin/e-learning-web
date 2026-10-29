import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CssBaseline from '@mui/material/CssBaseline';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SchoolIcon from '@mui/icons-material/School';
import RateReviewIcon from '@mui/icons-material/RateReview';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useAuth } from 'auth/AuthContext';
import { ROLES } from 'auth/roles';
import { ROUTE_PATHS } from 'routes';
import ConfirmDialog from 'components/ConfirmDialog';
import QuizEditorDialog from 'components/QuizEditorDialog';
import {
  createCourseContentItem,
  createCourseSection,
  deleteCourseContentItem,
  deleteCourseSection,
  getMyCourseDetails,
  getMyCourseLaunch,
  getCourseStudentIds,
  getCourseStudents,
  enrollStudentToCourse,
  bulkEnrollStudentsToCourse,
  reorderCourseContentItem,
  reorderCourseSection,
  searchStudents,
  updateCourseContentItem,
  updateCourseSection,
  uploadCourseContentPdf,
  uploadCourseContentVideo,
  type CourseDetails,
  type CourseSection,
  type CourseContentItem,
  type CourseStudent,
  type StudentSearchResult
} from 'services/course-api';
import { getCourseSatisfactionSummary, type CourseSatisfactionSummary } from 'services/satisfaction-api';

type RouteParams = {
  id: string;
};

type SectionDialogMode = 'create' | 'edit';
type ItemDialogMode = 'create' | 'edit';

type SectionFormState = {
  title: string;
  description: string;
  orderIndex: string;
  visible: boolean;
  locked: boolean;
};

type ItemFormState = {
  type: string;
  title: string;
  description: string;
  orderIndex: string;
  required: boolean;
  visible: boolean;
  durationSeconds: string;
  sourceUrl: string;
  payloadJson: string;
  published: boolean;
};

const formatDuration = (seconds?: number | null): string => {
  if (!seconds || seconds <= 0) return '-';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (!minutes) {
    return `${seconds} วินาที`;
  }

  if (!remainingSeconds) {
    return `${minutes} นาที`;
  }

  return `${minutes} นาที ${remainingSeconds} วินาที`;
};

const getSectionItemCount = (section: CourseSection): number => section.items?.length || 0;

const openLaunchUrl = (launchUrl?: string) => {
  if (!launchUrl) return false;

  window.open(launchUrl, '_blank', 'noopener,noreferrer');
  return true;
};

export default function CourseDetailPage(): JSX.Element {
  const history = useHistory();
  const { id } = useParams<RouteParams>();
  const { getRole } = useAuth();
  const courseId = id?.trim();
  const currentRole = getRole();
  const isStudent = currentRole === ROLES.STUDENT;
  const canManageStudents = currentRole === ROLES.ADMIN;
  const canManageCourseContent = currentRole === ROLES.ADMIN;

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [satisfactionSummary, setSatisfactionSummary] = useState<CourseSatisfactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('ไม่สามารถโหลดรายละเอียดคอร์สได้');
  const [expandedSection, setExpandedSection] = useState<string | false>(false);
  const [openAddStudentsDialog, setOpenAddStudentsDialog] = useState(false);
  const [studentKeyword, setStudentKeyword] = useState('');
  const [studentResults, setStudentResults] = useState<StudentSearchResult[]>([]);
  const [studentDirectory, setStudentDirectory] = useState<Record<number, StudentSearchResult>>({});
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageCount, setStudentPageCount] = useState(1);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<number[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<CourseStudent[]>([]);
  const [isLoadingEnrolledStudents, setIsLoadingEnrolledStudents] = useState(false);
  const [enrolledStudentPage, setEnrolledStudentPage] = useState(1);
  const [enrolledStudentPageCount, setEnrolledStudentPageCount] = useState(1);
  const [studentListRefreshKey, setStudentListRefreshKey] = useState(0);
  const [openEnrollConfirmDialog, setOpenEnrollConfirmDialog] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [isEnrollingStudents, setIsEnrollingStudents] = useState(false);
  const [isBulkUploadingStudents, setIsBulkUploadingStudents] = useState(false);
  const [openEnrollResultDialog, setOpenEnrollResultDialog] = useState(false);
  const [enrollResultMessage, setEnrollResultMessage] = useState('');
  const [failedEnrollments, setFailedEnrollments] = useState<Array<{ name: string; message: string }>>([]);
  const [successEnrollCount, setSuccessEnrollCount] = useState(0);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [quizEditorTarget, setQuizEditorTarget] = useState<{ sectionId: number; itemId: number } | null>(null);
  const [openSectionDialog, setOpenSectionDialog] = useState(false);
  const [sectionDialogMode, setSectionDialogMode] = useState<SectionDialogMode>('create');
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [sectionForm, setSectionForm] = useState<SectionFormState>({
    title: '',
    description: '',
    orderIndex: '',
    visible: true,
    locked: false
  });
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [itemDialogMode, setItemDialogMode] = useState<ItemDialogMode>('create');
  const [editingItemIds, setEditingItemIds] = useState<{ sectionId: number | null; itemId: number | null }>({
    sectionId: null,
    itemId: null
  });
  const [itemForm, setItemForm] = useState<ItemFormState>({
    type: 'TEXT',
    title: '',
    description: '',
    orderIndex: '',
    required: true,
    visible: true,
    durationSeconds: '',
    sourceUrl: '',
    payloadJson: '',
    published: false
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('');
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState('');
  const [deleteConfirmBusy, setDeleteConfirmBusy] = useState(false);
  const [deleteAction, setDeleteAction] = useState<null | (() => Promise<void>)>(null);
  const studentRowsPerPage = 6;
  const enrolledStudentRowsPerPage = 6;
  const contentTypeOptions = ['VIDEO', 'PDF', 'QUIZ'];

  const loadCourse = useCallback(async (): Promise<CourseDetails> => {
    if (!courseId) {
      throw new Error('ไม่พบรหัสคอร์ส');
    }

    return getMyCourseDetails(courseId);
  }, [courseId]);

  const applyCourseDetails = (data: CourseDetails) => {
    setCourse(data);
    const firstSectionId = data.sections?.[0]?.id;
    setExpandedSection(firstSectionId ? String(firstSectionId) : false);
  };

  useEffect(() => {
    let active = true;
    console.log('Get Course Detail : ', id);

    const loadCourseData = async () => {
      try {
        const data = await loadCourse();
        if (!active) return;
        applyCourseDetails(data);
      } catch (error: any) {
        if (!active) return;
        setErrorMessage(error?.response?.data?.message || 'ไม่สามารถโหลดรายละเอียดคอร์สได้ในขณะนี้');
        setOpenErrorDialog(true);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    if (courseId) {
      loadCourseData();
    } else {
      setErrorMessage('ไม่พบรหัสคอร์ส');
      setOpenErrorDialog(true);
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [courseId, loadCourse]);

  useEffect(() => {
    let active = true;
    if (!courseId) return () => { active = false; };
    setSatisfactionSummary(null);
    getCourseSatisfactionSummary(Number(courseId))
      .then((summary) => { if (active) setSatisfactionSummary(summary); })
      .catch(() => { if (active) setSatisfactionSummary(null); });
    return () => { active = false; };
  }, [courseId]);

  useEffect(() => {
    if (!courseId || !canManageStudents) {
      return;
    }

    let active = true;
    const loadEnrolledStudents = async () => {
      try {
        setIsLoadingEnrolledStudents(true);
        const data = await getCourseStudents(courseId, enrolledStudentPage, enrolledStudentRowsPerPage);
        if (!active) return;
        setEnrolledStudents(data.items);
        setEnrolledStudentPageCount(Math.max(1, data.totalPages || 0));
      } catch (error: any) {
        if (!active) return;
        setErrorMessage(error?.response?.data?.message || 'ไม่สามารถโหลดรายชื่อผู้เรียนได้ในขณะนี้');
        setOpenErrorDialog(true);
      } finally {
        if (active) {
          setIsLoadingEnrolledStudents(false);
        }
      }
    };

    loadEnrolledStudents();

    return () => {
      active = false;
    };
  }, [canManageStudents, courseId, enrolledStudentPage, studentListRefreshKey]);

  useEffect(() => {
    if (!openAddStudentsDialog || !courseId) {
      return;
    }

    let active = true;
    const loadEnrolledStudentIds = async () => {
      try {
        const ids = await getCourseStudentIds(courseId);
        if (active) setEnrolledStudentIds(ids);
      } catch (error: any) {
        if (!active) return;
        setErrorMessage(error?.response?.data?.message || 'ไม่สามารถตรวจสอบผู้เรียนในคอร์สได้');
        setOpenErrorDialog(true);
      }
    };

    loadEnrolledStudentIds();
    return () => {
      active = false;
    };
  }, [courseId, openAddStudentsDialog, studentListRefreshKey]);

  useEffect(() => {
    if (!openAddStudentsDialog) {
      return;
    }

    let active = true;
    const timeout = window.setTimeout(async () => {
      try {
        setIsSearchingStudents(true);
        const data = await searchStudents(studentKeyword, studentPage, studentRowsPerPage);
        if (!active) return;
        setStudentResults(data.items);
        setStudentDirectory((current) => {
          const nextDirectory = { ...current };
          data.items.forEach((student) => {
            nextDirectory[student.id] = student;
          });
          return nextDirectory;
        });
        setStudentPageCount(Math.max(1, data.totalPages || 0));
      } catch (error: any) {
        if (!active) return;
        setErrorMessage(error?.response?.data?.message || 'ไม่สามารถค้นหานักเรียนได้ในขณะนี้');
        setOpenErrorDialog(true);
      } finally {
        if (active) {
          setIsSearchingStudents(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [openAddStudentsDialog, studentKeyword, studentPage]);

  const stats = useMemo(
    () => [
      {
        label: 'ความพึงพอใจเฉลี่ย',
        value: satisfactionSummary?.averageRating == null ? '-' : `${Number.isInteger(satisfactionSummary.averageRating) ? satisfactionSummary.averageRating : satisfactionSummary.averageRating.toFixed(2)} / 5`,
        detail: satisfactionSummary?.ratingCount
          ? `เฉลี่ยจากคะแนน ${satisfactionSummary.ratingCount} รายการ · ตอบแบบประเมิน ${satisfactionSummary.responseCount} ครั้ง`
          : 'ยังไม่มีผลประเมินคะแนน',
        icon: <RateReviewIcon />
      },
      { label: 'sections', value: course?.sectionCount || course?.sections?.length || 0, icon: <MenuBookIcon /> },
      { label: 'items', value: course?.itemCount || 0, icon: <MenuBookIcon /> },
      { label: 'students', value: course?.studentCount || 0, icon: <PeopleIcon /> }
    ],
    [course, satisfactionSummary]
  );

  const handleStartCourse = async () => {
    if (!courseId) return;

    try {
      const launch = await getMyCourseLaunch(courseId);
      if (!openLaunchUrl(launch.launchUrl)) {
        setErrorMessage('ไม่พบลิงก์เข้าเรียน');
        setOpenErrorDialog(true);
      }
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถเปิดลิงก์เข้าเรียนได้ในขณะนี้');
      setOpenErrorDialog(true);
    }
  };

  const handleOpenAddStudentsDialog = () => {
    setStudentKeyword('');
    setStudentResults([]);
    setStudentDirectory({});
    setSelectedStudentIds([]);
    setStudentPage(1);
    setStudentPageCount(1);
    setEnrolledStudentIds([]);
    setOpenAddStudentsDialog(true);
  };

  const handleCloseAddStudentsDialog = () => {
    setOpenAddStudentsDialog(false);
    setStudentKeyword('');
    setStudentResults([]);
    setStudentDirectory({});
    setSelectedStudentIds([]);
    setStudentPage(1);
    setStudentPageCount(1);
    setEnrolledStudentIds([]);
  };

  const getStudentDisplayName = (studentId: number): string => {
    const student = studentDirectory[studentId];
    if (!student) {
      return `Student ${studentId}`;
    }

    const fullName = [student.firstName, student.lastName].filter(Boolean).join(' ').trim();
    return fullName || student.username || `Student ${studentId}`;
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((value) => value !== studentId)
        : [...current, studentId]
    );
  };

  const handleConfirmAddStudents = () => {
    if (!selectedStudentIds.length) {
      setErrorMessage('กรุณาเลือกนักเรียนอย่างน้อย 1 คน');
      setOpenErrorDialog(true);
      return;
    }

    setConfirmMessage(`คุณต้องการเพิ่มนักเรียนที่เลือก ${selectedStudentIds.length} คน เข้าเรียนในคอร์สนี้ใช่หรือไม่`);
    setOpenEnrollConfirmDialog(true);
  };

  const handleEnrollSelectedStudents = async () => {
    if (!courseId || !selectedStudentIds.length) {
      setOpenEnrollConfirmDialog(false);
      return;
    }

    const uniqueStudentIds = Array.from(new Set(selectedStudentIds));
    setOpenEnrollConfirmDialog(false);
    setIsEnrollingStudents(true);

    try {
      const failedEnrollmentsList: Array<{ name: string; message: string }> = [];
      let successCount = 0;

      for (const studentId of uniqueStudentIds) {
        try {
          await enrollStudentToCourse(courseId, studentId);
          successCount += 1;
        } catch (error: any) {
          failedEnrollmentsList.push({
            name: getStudentDisplayName(studentId),
            message: error?.response?.data?.message || error?.message || 'ไม่สามารถเพิ่มได้'
          });
        }
      }

      let refreshWarning = '';
      if (successCount > 0) {
        try {
          const refreshedCourse = await loadCourse();
          applyCourseDetails(refreshedCourse);
          setEnrolledStudentPage(1);
          setStudentListRefreshKey((current) => current + 1);
        } catch {
          refreshWarning = '\nอัปเดตข้อมูลคอร์สไม่สำเร็จ';
        }
      }

      setSuccessEnrollCount(successCount);
      setFailedEnrollments(failedEnrollmentsList);

      const failureSummary = failedEnrollmentsList.length
        ? `\nไม่สำเร็จ ${failedEnrollmentsList.length} คน`
        : '';
      const resultMessage = `เพิ่มสำเร็จ ${successCount} คน${failureSummary}${refreshWarning}`;
      setEnrollResultMessage(resultMessage);
      setOpenEnrollResultDialog(true);
      handleCloseAddStudentsDialog();
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถเพิ่มนักเรียนเข้าเรียนได้ในขณะนี้');
      setOpenErrorDialog(true);
    } finally {
      setIsEnrollingStudents(false);
    }
  };

  const handleCloseEnrollResultDialog = () => {
    setOpenEnrollResultDialog(false);
    setEnrollResultMessage('');
    setFailedEnrollments([]);
    setSuccessEnrollCount(0);
  };

  const handleBulkStudentUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !courseId) return;

    setIsBulkUploadingStudents(true);
    try {
      const result = await bulkEnrollStudentsToCourse(courseId, file);
      const failedRows = (result.results || [])
        .filter((item) => item.status === 'FAILED')
        .map((item) => ({
          name: `แถว ${item.rowNumber}: ${item.username}`,
          message: item.message
        }));

      let refreshWarning = '';
      if (result.enrolledCount > 0) {
        try {
          const refreshedCourse = await loadCourse();
          applyCourseDetails(refreshedCourse);
          setEnrolledStudentPage(1);
          setStudentListRefreshKey((current) => current + 1);
        } catch {
          refreshWarning = '\nอัปเดตข้อมูลคอร์สไม่สำเร็จ';
        }
      }

      setSuccessEnrollCount(result.enrolledCount);
      setFailedEnrollments(failedRows);
      setEnrollResultMessage(
        `อ่านทั้งหมด ${result.totalRows} แถว\n` +
        `เพิ่มสำเร็จ ${result.enrolledCount} คน\n` +
        `อยู่ในคอร์สแล้ว ${result.alreadyEnrolledCount} คน\n` +
        `ไม่สำเร็จ ${result.failedCount} คน${refreshWarning}`
      );
      setOpenEnrollResultDialog(true);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถอัปโหลดรายชื่อนักเรียนได้ในขณะนี้');
      setOpenErrorDialog(true);
    } finally {
      setIsBulkUploadingStudents(false);
    }
  };

  const refreshCourseDetails = useCallback(async (): Promise<void> => {
    const refreshedCourse = await loadCourse();
    applyCourseDetails(refreshedCourse);
  }, [loadCourse]);

  const openDeleteConfirm = (title: string, message: string, action: () => Promise<void>) => {
    setDeleteConfirmTitle(title);
    setDeleteConfirmMessage(message);
    setDeleteAction(() => action);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    if (deleteConfirmBusy) return;
    setDeleteConfirmOpen(false);
    setDeleteConfirmTitle('');
    setDeleteConfirmMessage('');
    setDeleteAction(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAction) {
      closeDeleteConfirm();
      return;
    }

    setDeleteConfirmBusy(true);
    try {
      await deleteAction();
      await refreshCourseDetails();
      closeDeleteConfirm();
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถลบข้อมูลได้ในขณะนี้');
      setOpenErrorDialog(true);
    } finally {
      setDeleteConfirmBusy(false);
    }
  };

  const getNextSectionOrderIndex = (): number => {
    const sections = [...(course?.sections || [])].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    return (sections[sections.length - 1]?.orderIndex || sections.length || 0) + 1;
  };

  const getNextItemOrderIndex = (section: CourseSection): number => {
    const items = [...(section.items || [])].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    return (items[items.length - 1]?.orderIndex || items.length || 0) + 1;
  };

  const normalizeOrderIndex = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const getTypeSpecificHints = (type: string) => {
    const upperType = type.toUpperCase();
    return {
      needsSourceUrl: ['VIDEO', 'PDF', 'FILE', 'LINK', 'SCORM'].includes(upperType),
      needsPayloadJson: ['ASSIGNMENT', 'SCORM'].includes(upperType),
      showsDuration: ['VIDEO', 'PDF', 'FILE', 'LINK', 'SCORM', 'TEXT'].includes(upperType)
    };
  };

  const itemFormHints = getTypeSpecificHints(itemForm.type);

  const openCreateSectionDialog = () => {
    setSectionDialogMode('create');
    setEditingSectionId(null);
    setSectionForm({
      title: '',
      description: '',
      orderIndex: String(getNextSectionOrderIndex()),
      visible: true,
      locked: false
    });
    setOpenSectionDialog(true);
  };

  const openEditSectionDialog = (section: CourseSection) => {
    setSectionDialogMode('edit');
    setEditingSectionId(section.id);
    setSectionForm({
      title: section.title || '',
      description: section.description || '',
      orderIndex: section.orderIndex != null ? String(section.orderIndex) : '',
      visible: section.visible !== false,
      locked: !!section.locked
    });
    setOpenSectionDialog(true);
  };

  const closeSectionDialog = () => {
    if (isSavingContent) return;
    setOpenSectionDialog(false);
  };

  const submitSectionDialog = async () => {
    if (!courseId) return;
    const title = sectionForm.title.trim();
    if (!title) {
      setErrorMessage('กรุณากรอกชื่อ section');
      setOpenErrorDialog(true);
      return;
    }

    const payload = {
      title,
      description: sectionForm.description.trim() || undefined,
      orderIndex: normalizeOrderIndex(sectionForm.orderIndex),
      visible: sectionForm.visible,
      locked: sectionForm.locked
    };

    setIsSavingContent(true);
    try {
      if (sectionDialogMode === 'edit' && editingSectionId != null) {
        await updateCourseSection(courseId, editingSectionId, payload);
      } else {
        await createCourseSection(courseId, payload);
      }
      await refreshCourseDetails();
      setOpenSectionDialog(false);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถบันทึก section ได้ในขณะนี้');
      setOpenErrorDialog(true);
    } finally {
      setIsSavingContent(false);
    }
  };

  const openCreateItemDialog = (section: CourseSection) => {
    setItemDialogMode('create');
    setEditingItemIds({ sectionId: section.id, itemId: null });
    setItemForm({
      type: 'TEXT',
      title: '',
      description: '',
      orderIndex: String(getNextItemOrderIndex(section)),
      required: true,
      visible: true,
      durationSeconds: '',
      sourceUrl: '',
      payloadJson: '',
      published: false
    });
    setOpenItemDialog(true);
  };

  const openEditItemDialog = (section: CourseSection, item: CourseContentItem) => {
    setItemDialogMode('edit');
    setEditingItemIds({ sectionId: section.id, itemId: item.id });
    setItemForm({
      type: (item.type || 'TEXT').toUpperCase(),
      title: item.title || '',
      description: item.description || '',
      orderIndex: item.orderIndex != null ? String(item.orderIndex) : '',
      required: !!item.required,
      visible: item.visible !== false,
      durationSeconds: item.durationSeconds != null ? String(item.durationSeconds) : '',
      sourceUrl: item.sourceUrl || '',
      payloadJson: item.payloadJson || '',
      published: Boolean(item.publishedAt)
    });
    setOpenItemDialog(true);
  };

  const closeItemDialog = () => {
    if (isSavingContent || isUploadingPdf || isUploadingVideo) return;
    setOpenItemDialog(false);
  };

  const uploadPdfForItem = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !courseId) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setErrorMessage('กรุณาเลือกไฟล์ PDF เท่านั้น');
      setOpenErrorDialog(true);
      return;
    }

    setIsUploadingPdf(true);
    try {
      const uploaded = await uploadCourseContentPdf(courseId, file);
      setItemForm((current) => ({
        ...current,
        sourceUrl: uploaded.sourceUrl,
        title: current.title.trim() || uploaded.fileName.replace(/\.pdf$/i, '')
      }));
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถอัปโหลดไฟล์ PDF ได้ในขณะนี้');
      setOpenErrorDialog(true);
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const uploadVideoForItem = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !courseId) return;

    const supportedVideo = /\.(mp4|mov|webm|ogv)$/i.test(file.name);
    if (!supportedVideo) {
      setErrorMessage('กรุณาเลือกไฟล์วิดีโอ MP4, MOV, WebM หรือ OGV เท่านั้น');
      setOpenErrorDialog(true);
      return;
    }

    setIsUploadingVideo(true);
    try {
      const uploaded = await uploadCourseContentVideo(courseId, file);
      setItemForm((current) => ({
        ...current,
        sourceUrl: uploaded.sourceUrl,
        title: current.title.trim() || uploaded.fileName.replace(/\.(mp4|mov|webm|ogv)$/i, '')
      }));
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถอัปโหลดไฟล์วิดีโอได้ในขณะนี้');
      setOpenErrorDialog(true);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const submitItemDialog = async () => {
    if (!courseId || editingItemIds.sectionId == null) return;

    const title = itemForm.title.trim();
    const type = itemForm.type.trim().toUpperCase();
    if (!title) {
      setErrorMessage('กรุณากรอกชื่อ item');
      setOpenErrorDialog(true);
      return;
    }

    if (!type) {
      setErrorMessage('กรุณาเลือกประเภท content');
      setOpenErrorDialog(true);
      return;
    }

    const payload = {
      type,
      title,
      description: itemForm.description.trim() || undefined,
      orderIndex: normalizeOrderIndex(itemForm.orderIndex),
      required: itemForm.required,
      visible: itemForm.visible,
      durationSeconds: normalizeOrderIndex(itemForm.durationSeconds),
      sourceUrl: itemForm.sourceUrl.trim() || undefined,
      payloadJson: itemForm.payloadJson.trim() || undefined,
      published: itemForm.published
    };

    setIsSavingContent(true);
    try {
      if (itemDialogMode === 'edit' && editingItemIds.itemId != null) {
        await updateCourseContentItem(courseId, editingItemIds.sectionId, editingItemIds.itemId, payload);
      } else {
        await createCourseContentItem(courseId, editingItemIds.sectionId, payload);
      }
      await refreshCourseDetails();
      setOpenItemDialog(false);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถบันทึก item ได้ในขณะนี้');
      setOpenErrorDialog(true);
    } finally {
      setIsSavingContent(false);
    }
  };

  const moveSection = async (section: CourseSection, direction: -1 | 1) => {
    if (!courseId || !section.orderIndex) return;
    const target = section.orderIndex + direction;
    if (target < 1) return;

    setIsSavingContent(true);
    try {
      await reorderCourseSection(courseId, section.id, target);
      await refreshCourseDetails();
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถย้าย section ได้ในขณะนี้');
      setOpenErrorDialog(true);
    } finally {
      setIsSavingContent(false);
    }
  };

  const moveItem = async (section: CourseSection, item: CourseContentItem, direction: -1 | 1) => {
    if (!courseId || !item.orderIndex) return;
    const target = item.orderIndex + direction;
    if (target < 1) return;

    setIsSavingContent(true);
    try {
      await reorderCourseContentItem(courseId, section.id, item.id, target);
      await refreshCourseDetails();
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'ไม่สามารถย้าย item ได้ในขณะนี้');
      setOpenErrorDialog(true);
    } finally {
      setIsSavingContent(false);
    }
  };

  const requestDeleteSection = (section: CourseSection) => {
    openDeleteConfirm('ลบ section', 'ต้องการลบ section "' + (section.title || section.id) + '" ใช่หรือไม่', async () => {
      if (!courseId) return;
      await deleteCourseSection(courseId, section.id);
    });
  };

  const requestDeleteItem = (section: CourseSection, item: CourseContentItem) => {
    openDeleteConfirm('ลบ item', 'ต้องการลบ item "' + (item.title || item.id) + '" ใช่หรือไม่', async () => {
      if (!courseId) return;
      await deleteCourseContentItem(courseId, section.id, item.id);
    });
  };

  const renderItem = (section: CourseSection, item: CourseContentItem) => {
    const hints = getTypeSpecificHints(item.type || item.renderKind || '');

    return (
      <Card
        key={item.id}
        variant="outlined"
        sx={{
          mb: 1.5,
          borderRadius: 2.5,
          borderColor: 'rgba(39, 65, 31, 0.10)',
          backgroundColor: '#fbfcf8'
        }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" spacing={1.5} alignItems="flex-start">
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                <Chip
                  label={item.renderKind || item.type || 'ITEM'}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(39, 65, 31, 0.10)',
                    color: '#244026',
                    fontWeight: 700
                  }}
                />
              </Stack>

              {canManageCourseContent ? (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  <Button
                    size="small"
                    startIcon={<ArrowUpwardIcon fontSize="small" />}
                    onClick={() => moveItem(section, item, -1)}
                    disabled={item.orderIndex == null || item.orderIndex <= 1 || isSavingContent}
                    sx={{
                      flexShrink: 0,
                      borderRadius: 999,
                      textTransform: 'none',
                      fontWeight: 800,
                      color: '#244026'
                    }}>
                    ขึ้น
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ArrowDownwardIcon fontSize="small" />}
                    onClick={() => moveItem(section, item, 1)}
                    disabled={item.orderIndex == null || isSavingContent}
                    sx={{
                      flexShrink: 0,
                      borderRadius: 999,
                      textTransform: 'none',
                      fontWeight: 800,
                      color: '#244026'
                    }}>
                    ลง
                  </Button>
                  <Button
                    size="small"
                    startIcon={<EditIcon fontSize="small" />}
                    onClick={() => openEditItemDialog(section, item)}
                    sx={{
                      flexShrink: 0,
                      borderRadius: 999,
                      textTransform: 'none',
                      fontWeight: 800,
                      color: '#244026'
                    }}>
                    แก้ไข
                  </Button>
                  {(item.type || '').toUpperCase() === 'QUIZ' ? (
                    <Button size="small" startIcon={<MenuBookIcon fontSize="small" />} onClick={() => setQuizEditorTarget({ sectionId: section.id, itemId: item.id })} sx={{ flexShrink: 0, borderRadius: 999, textTransform: 'none', fontWeight: 800, color: '#244026' }}>
                      จัดการข้อสอบ
                    </Button>
                  ) : null}
                  <Button
                    size="small"
                    startIcon={<DeleteIcon fontSize="small" />}
                    onClick={() => requestDeleteItem(section, item)}
                    sx={{
                      flexShrink: 0,
                      borderRadius: 999,
                      textTransform: 'none',
                      fontWeight: 800,
                      color: '#b24c23'
                    }}>
                    ลบ
                  </Button>
                </Stack>
              ) : null}
            </Stack>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1f2b1d' }}>
              {item.title || ('Item ' + item.id)}
            </Typography>

            {item.description ? (
              <Typography sx={{ color: '#6a7464', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {item.description}
              </Typography>
            ) : null}

            {(item.type || '').toUpperCase() === 'VIDEO' && item.sourceUrl ? (
              <Box component="video" controls preload="metadata" src={item.sourceUrl} sx={{ width: '100%', maxWidth: 720, borderRadius: 2, bgcolor: 'black' }}>
                ไม่สามารถเล่นวิดีโอบนเบราว์เซอร์นี้ได้
              </Box>
            ) : !isStudent && item.sourceUrl && (item.type || '').toUpperCase() === 'PDF' ? (
              <Button
                component="a"
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<PictureAsPdfIcon />}
                variant="outlined"
                size="small"
                sx={{
                  alignSelf: 'flex-start',
                  borderColor: '#b24c23',
                  color: '#b24c23',
                  textTransform: 'none',
                  fontWeight: 800
                }}
              >
                เปิดไฟล์ PDF
              </Button>
            ) : item.sourceUrl ? (
              <Typography variant="body2" sx={{ color: '#4a6746', wordBreak: 'break-word' }}>
                แหล่งข้อมูล: {item.sourceUrl}
              </Typography>
            ) : null}

            {hints.needsPayloadJson && item.payloadJson ? (
              <Typography variant="body2" sx={{ color: '#4a6746', wordBreak: 'break-word' }}>
                Payload: {item.payloadJson}
              </Typography>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    );
  };


  return (
    <>
      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 3 },
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
              background:
                'linear-gradient(135deg, #17361e 0%, #244c2a 52%, #3f6c3a 100%)'
            }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => history.push(ROUTE_PATHS.COURSES)}
              variant="text"
              sx={{
                mb: 2,
                color: 'rgba(255,255,255,0.9)',
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.08)'
                }
              }}>
              กลับไปหน้าคอร์สเรียน
            </Button>

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
                <SchoolIcon />
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
                  {isLoading ? 'กำลังโหลดรายละเอียด...' : course?.displayName || course?.fullName || 'รายละเอียดคอร์ส'}
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              {course?.shortName ? <Chip label={course.shortName} sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', fontWeight: 700 }} /> : null}
              {course?.categoryId != null ? (
                <Chip label={`Category ${course.categoryId}`} sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', fontWeight: 700 }} />
              ) : null}
            </Stack>
          </Box>

          <Box sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 2.5, sm: 3 } }}>
            {isLoading ? (
              <Box
                sx={{
                  minHeight: 320,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#62715b'
                }}>
                กำลังโหลดรายละเอียดคอร์ส...
              </Box>
            ) : course ? (
              <>
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                  {stats.map((stat) => (
                    <Grid item xs={12} sm={6} md={3} key={stat.label}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2.25,
                          borderRadius: 3,
                          borderColor: 'rgba(39, 65, 31, 0.08)',
                          backgroundColor: '#fff',
                          height: '100%'
                        }}>
                        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: 'rgba(39, 65, 31, 0.10)',
                              color: '#244026',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                            {stat.icon}
                          </Box>
                          <Typography variant="body2" sx={{ color: '#677264', fontWeight: 700 }}>
                            {stat.label}
                          </Typography>
                        </Stack>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#20301d' }}>
                          {stat.value}
                        </Typography>
                        {'detail' in stat && <Typography variant="caption" color="text.secondary">{stat.detail}</Typography>}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                <Paper
                  variant="outlined"
                  sx={{
                    p: { xs: 2.25, sm: 3 },
                    borderRadius: 3,
                    borderColor: 'rgba(39, 65, 31, 0.08)',
                    backgroundColor: '#fff',
                    mb: 3
                  }}>
                  <Stack spacing={1.5}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1f2b1d' }}>
                      ภาพรวมคอร์ส
                    </Typography>
                    <Typography sx={{ color: '#687266', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                      {course.summary || 'ไม่มีรายละเอียดเพิ่มเติม'}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                      <Button
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        onClick={handleStartCourse}
                        sx={{
                          borderRadius: 999,
                          textTransform: 'none',
                          fontWeight: 800,
                          backgroundColor: '#244026 !important'
                        }}>
                        เข้าเรียน
                      </Button>
                      {canManageStudents ? (
                        <>
                          <Button
                            variant="outlined"
                            onClick={handleOpenAddStudentsDialog}
                            sx={{
                              borderRadius: 999,
                              textTransform: 'none',
                              fontWeight: 800,
                              borderColor: 'rgba(36, 64, 38, 0.35)',
                              color: '#244026'
                            }}>
                            เพิ่มนักเรียนเข้าเรียน
                          </Button>
                          <Button
                            component="label"
                            variant="outlined"
                            startIcon={isBulkUploadingStudents ? <CircularProgress size={16} /> : <UploadFileIcon />}
                            disabled={isBulkUploadingStudents}
                            title="ไฟล์ Excel ต้องมีคอลัมน์ username"
                            sx={{
                              borderRadius: 999,
                              textTransform: 'none',
                              fontWeight: 800,
                              borderColor: 'rgba(36, 64, 38, 0.35)',
                              color: '#244026'
                            }}>
                            {isBulkUploadingStudents ? 'กำลังอัปโหลด...' : 'เพิ่มนักเรียนเข้าเรียน (Bulk)'}
                            <input
                              hidden
                              type="file"
                              accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.xlsx,.xls"
                              onChange={handleBulkStudentUpload}
                            />
                          </Button>
                        </>
                      ) : null}
                      {!isStudent ? (
                        <Button
                          variant="outlined"
                          onClick={() => history.push(ROUTE_PATHS.COURSES)}
                          sx={{
                            borderRadius: 999,
                            textTransform: 'none',
                            fontWeight: 800
                          }}>
                          ดูคอร์สทั้งหมด
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                </Paper>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} lg={8}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 1.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#1f2b1d' }}>
                        โครงสร้างบทเรียน
                      </Typography>
                      {canManageCourseContent ? (
                        <Button
                          variant="contained"
                          startIcon={<AddCircleOutlineIcon />}
                          onClick={openCreateSectionDialog}
                          sx={{
                            borderRadius: 999,
                            textTransform: 'none',
                            fontWeight: 800,
                            backgroundColor: '#244026 !important'
                          }}>
                          เพิ่มบท
                        </Button>
                      ) : null}
                    </Stack>

                    {course.sections?.length ? (
                      course.sections.map((section) => (
                        <Accordion
                          key={section.id}
                          expanded={expandedSection === String(section.id)}
                          onChange={(_, expanded) => setExpandedSection(expanded ? String(section.id) : false)}
                          sx={{
                            mb: 1.5,
                            borderRadius: 2.5,
                            border: '1px solid rgba(39, 65, 31, 0.08)',
                            boxShadow: 'none',
                            '&::before': { display: 'none' },
                            overflow: 'hidden'
                          }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Stack spacing={0.75} sx={{ width: '100%' }}>
                              <Stack direction="row" justifyContent="space-between" spacing={1.5} alignItems="flex-start">
                                <Stack spacing={0.75}>
                                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Chip
                                      label={'บทที่ ' + (section.orderIndex ?? section.id)}
                                      size="small"
                                      sx={{
                                        bgcolor: 'rgba(39, 65, 31, 0.10)',
                                        color: '#244026',
                                        fontWeight: 700
                                      }}
                                    />
                                    {section.visible === false ? (
                                      <Chip
                                        label="ซ่อนอยู่"
                                        size="small"
                                        variant="outlined"
                                        sx={{ borderColor: 'rgba(39, 65, 31, 0.18)', color: '#6a7564' }}
                                      />
                                    ) : null}
                                    {section.locked ? (
                                      <Chip
                                        label="ล็อก"
                                        size="small"
                                        sx={{ bgcolor: 'rgba(226, 103, 55, 0.12)', color: '#b24c23', fontWeight: 700 }}
                                      />
                                    ) : null}
                                  </Stack>

                                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1f2b1d' }}>
                                    {section.title || ('บทที่ ' + section.id)}
                                  </Typography>

                                  <Typography variant="body2" sx={{ color: '#6a7464' }}>
                                    เนื้อหา {getSectionItemCount(section)} รายการ
                                  </Typography>
                                </Stack>

                                {canManageCourseContent ? (
                                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                    <Button
                                      size="small"
                                      startIcon={<ArrowUpwardIcon fontSize="small" />}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        moveSection(section, -1);
                                      }}
                                      disabled={section.orderIndex == null || section.orderIndex <= 1 || isSavingContent}
                                      sx={{
                                        flexShrink: 0,
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        color: '#244026'
                                      }}>
                                      ขึ้น
                                    </Button>
                                    <Button
                                      size="small"
                                      startIcon={<ArrowDownwardIcon fontSize="small" />}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        moveSection(section, 1);
                                      }}
                                      disabled={section.orderIndex == null || isSavingContent}
                                      sx={{
                                        flexShrink: 0,
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        color: '#244026'
                                      }}>
                                      ลง
                                    </Button>
                                    <Button
                                      size="small"
                                      startIcon={<EditIcon fontSize="small" />}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openEditSectionDialog(section);
                                      }}
                                      sx={{
                                        flexShrink: 0,
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        color: '#244026'
                                      }}>
                                      แก้ไข
                                    </Button>
                                    <Button
                                      size="small"
                                      startIcon={<DeleteIcon fontSize="small" />}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        requestDeleteSection(section);
                                      }}
                                      sx={{
                                        flexShrink: 0,
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        color: '#b24c23'
                                      }}>
                                      ลบ
                                    </Button>
                                  </Stack>
                                ) : null}
                              </Stack>
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails sx={{ pt: 0 }}>
                            <Stack spacing={1.5}>
                              {canManageCourseContent ? (
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<AddCircleOutlineIcon fontSize="small" />}
                                    onClick={() => openCreateItemDialog(section)}
                                    sx={{
                                      borderRadius: 999,
                                      textTransform: 'none',
                                      fontWeight: 800,
                                      borderColor: 'rgba(36, 64, 38, 0.28)',
                                      color: '#244026'
                                    }}>
                                    เพิ่มเนื้อหา
                                  </Button>
                                </Stack>
                              ) : null}
                              {section.description ? (
                                <Typography sx={{ color: '#687266', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                                  {section.description}
                                </Typography>
                              ) : null}
                              {section.items?.length ? (
                                section.items.map((item) => renderItem(section, item))
                              ) : (
                                <Paper
                                  variant="outlined"
                                  sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    borderStyle: 'dashed',
                                    color: '#6a7564'
                                  }}>
                                  ไม่มีรายการบทเรียนในส่วนนี้
                                </Paper>
                              )}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      ))
                    ) : (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 3,
                          borderRadius: 3,
                          borderStyle: 'dashed',
                          color: '#6a7564'
                        }}>
                        ยังไม่มีโครงสร้างบทเรียนในคอร์สนี้
                      </Paper>
                    )}
                  </Grid>

                  {canManageStudents ? (
                    <Grid item xs={12} lg={4}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1f2b1d' }}>
                          ผู้เรียน
                        </Typography>
                        <Chip
                          size="small"
                          label={`${course.studentCount || 0} คน`}
                          sx={{ fontWeight: 800, color: '#244026', backgroundColor: '#edf3e9' }}
                        />
                      </Stack>

                      <Stack spacing={1.25}>
                        {isLoadingEnrolledStudents ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={24} />
                          </Box>
                        ) : enrolledStudents?.length ? (
                          enrolledStudents.map((student) => {
                            const fullName = [student.firstName, student.lastName].filter(Boolean).join(' ').trim();
                            return (
                              <Paper
                                key={student.userId}
                                variant="outlined"
                                sx={{
                                  p: 2,
                                  borderRadius: 3,
                                  borderColor: 'rgba(39, 65, 31, 0.08)',
                                  backgroundColor: '#fff'
                                }}>
                                <Typography sx={{ fontWeight: 800, color: '#20301d' }}>
                                  {fullName || student.username || `User ${student.userId}`}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6a7564', overflowWrap: 'anywhere' }}>
                                  {student.username}{student.email ? ` • ${student.email}` : ''}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={student.enrollmentStatus === 'COMPLETED'
                                    ? 'เรียนจบแล้ว'
                                    : student.enrollmentStatus === 'IN_PROGRESS'
                                      ? 'กำลังเรียน'
                                      : 'ยังไม่เริ่มเรียน'}
                                  color={student.enrollmentStatus === 'COMPLETED'
                                    ? 'success'
                                    : student.enrollmentStatus === 'IN_PROGRESS'
                                      ? 'warning'
                                      : 'default'}
                                  sx={{ mt: 1, fontWeight: 700 }}
                                />
                                <Box sx={{ mt: 1.5 }}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      ความคืบหน้า ({student.completedRequiredItems}/{student.totalRequiredItems} เนื้อหาบังคับ)
                                    </Typography>
                                    <Typography variant="caption" fontWeight={800} color="text.primary">
                                      {student.progressPercent}%
                                    </Typography>
                                  </Stack>
                                  <LinearProgress
                                    variant="determinate"
                                    value={Math.min(100, Math.max(0, student.progressPercent || 0))}
                                    sx={{ height: 8, borderRadius: 4, bgcolor: '#edf1eb', '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
                                    aria-label={`ความคืบหน้าของ ${fullName || student.username || `ผู้เรียน ${student.userId}`}`}
                                  />
                                </Box>
                              </Paper>
                            );
                          })
                        ) : (
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              borderRadius: 3,
                              borderStyle: 'dashed',
                              color: '#6a7564'
                            }}>
                            ไม่พบรายชื่อผู้เรียน
                          </Paper>
                        )}

                        {enrolledStudentPageCount > 1 ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
                            <Pagination
                              count={enrolledStudentPageCount}
                              page={enrolledStudentPage}
                              onChange={(_, value) => setEnrolledStudentPage(value)}
                              color="primary"
                              size="small"
                            />
                          </Box>
                        ) : null}
                      </Stack>
                    </Grid>
                  ) : null}
                </Grid>
              </>
            ) : null}
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

      <Dialog
        open={openAddStudentsDialog}
        onClose={handleCloseAddStudentsDialog}
        fullWidth
        maxWidth="md">
        <DialogTitle>เพิ่มนักเรียนเข้าเรียน</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <DialogContentText>
              ค้นหานักเรียนจากชื่อ, username หรือ email แล้วเลือกนักเรียนที่ต้องการเพิ่มเข้าเรียน
            </DialogContentText>

            <TextField
              fullWidth
              value={studentKeyword}
              onChange={(event) => {
                setStudentKeyword(event.target.value);
                setStudentPage(1);
              }}
              placeholder="ค้นหานักเรียน"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#6c7a66', mr: 1 }} />
              }}
            />

            <Paper
              variant="outlined"
              sx={{
                maxHeight: 380,
                overflow: 'auto',
                borderRadius: 3,
                borderColor: 'rgba(39, 65, 31, 0.08)'
              }}>
              {isSearchingStudents ? (
                <Box
                  sx={{
                    minHeight: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                  <CircularProgress size={28} />
                </Box>
              ) : studentResults.length ? (
                <Stack spacing={0}>
                  {studentResults.map((student) => {
                    const fullName = [student.firstName, student.lastName].filter(Boolean).join(' ');
                    const checked = selectedStudentIds.includes(student.id);
                    const alreadyEnrolled = enrolledStudentIds.includes(student.id);

                    return (
                      <Box
                        key={student.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          px: 2,
                          py: 1.5,
                          borderBottom: '1px solid rgba(39, 65, 31, 0.08)',
                          '&:last-child': {
                            borderBottom: 'none'
                          }
                        }}>
                        <Checkbox
                          checked={checked || alreadyEnrolled}
                          disabled={alreadyEnrolled}
                          onChange={() => toggleStudentSelection(student.id)}
                        />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography sx={{ fontWeight: 800, color: '#20301d' }}>
                            {fullName || student.username || `Student ${student.id}`}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#687266' }}>
                            {student.username} • {student.email}
                          </Typography>
                        </Box>
                        <Chip
                          label={alreadyEnrolled ? 'อยู่ในคอร์สแล้ว' : student.role}
                          size="small"
                          sx={{
                            bgcolor: alreadyEnrolled ? 'rgba(93, 105, 89, 0.12)' : 'rgba(39, 65, 31, 0.10)',
                            color: alreadyEnrolled ? '#5d6959' : '#244026',
                            fontWeight: 700
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Box
                  sx={{
                    minHeight: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6a7464',
                    px: 2,
                    textAlign: 'center'
                  }}>
                  ไม่พบนักเรียนที่ตรงกับคำค้น
                </Box>
              )}
            </Paper>

            {studentPageCount > 1 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
                <Pagination
                  count={studentPageCount}
                  page={studentPage}
                  onChange={(_, value) => setStudentPage(value)}
                  color="primary"
                  shape="rounded"
                />
              </Box>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            variant="outlined"
            onClick={handleCloseAddStudentsDialog}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmAddStudents}
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 800,
              backgroundColor: '#244026 !important'
            }}>
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openSectionDialog} onClose={closeSectionDialog} fullWidth maxWidth="sm">
        <DialogTitle>{sectionDialogMode === 'edit' ? 'แก้ไข section' : 'เพิ่ม section'}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <DialogContentText>
              กำหนดชื่อ คำอธิบาย และลำดับของ section ที่จะแสดงในหน้าเรียน
            </DialogContentText>

            <TextField
              fullWidth
              label="ชื่อ section"
              value={sectionForm.title}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => setSectionForm((current) => ({ ...current, title: event.target.value }))}
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="รายละเอียด"
              InputLabelProps={{ shrink: true }}
              value={sectionForm.description}
              onChange={(event) => setSectionForm((current) => ({ ...current, description: event.target.value }))}
            />

            <TextField
              fullWidth
              type="number"
              label="ลำดับ"
              value={sectionForm.orderIndex}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => setSectionForm((current) => ({ ...current, orderIndex: event.target.value }))}
            />

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <FormControlLabel
                control={
                  <Switch
                    checked={sectionForm.visible}
                    onChange={(_, checked) => setSectionForm((current) => ({ ...current, visible: checked }))}
                  />
                }
                label="แสดง section"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={sectionForm.locked}
                    onChange={(_, checked) => setSectionForm((current) => ({ ...current, locked: checked }))}
                  />
                }
                label="ล็อก section"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            variant="outlined"
            onClick={closeSectionDialog}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={submitSectionDialog}
            disabled={isSavingContent}
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 800,
              backgroundColor: '#244026 !important'
            }}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openItemDialog} onClose={closeItemDialog} fullWidth maxWidth="md">
        <DialogTitle>{itemDialogMode === 'edit' ? 'แก้ไขเนื้อหา' : 'เพิ่มเนื้อหา'}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <DialogContentText>
              กำหนดประเภทและรายละเอียดของ item สำหรับใช้ในหน้าเรียน
            </DialogContentText>

            <TextField
              fullWidth
              select
              label="ประเภท"
              value={itemForm.type}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => setItemForm((current) => ({ ...current, type: event.target.value }))}
            >
              {contentTypeOptions.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="ชื่อ item"
              value={itemForm.title}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => setItemForm((current) => ({ ...current, title: event.target.value }))}
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="รายละเอียด"
              InputLabelProps={{ shrink: true }}
              value={itemForm.description}
              onChange={(event) => setItemForm((current) => ({ ...current, description: event.target.value }))}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                type="number"
                label="ลำดับ"
                InputLabelProps={{ shrink: true }}
                value={itemForm.orderIndex}
                onChange={(event) => setItemForm((current) => ({ ...current, orderIndex: event.target.value }))}
              />
              {itemFormHints.showsDuration ? (
                <TextField
                  fullWidth
                  type="number"
                  InputLabelProps={{ shrink: true }}
                  label="ระยะเวลา (วินาที)"
                  value={itemForm.durationSeconds}
                  onChange={(event) => setItemForm((current) => ({ ...current, durationSeconds: event.target.value }))}
                />
              ) : null}
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={itemForm.required}
                  onChange={(_, required) => setItemForm((current) => ({ ...current, required }))}
                />
              }
              label="เนื้อหาบังคับสำหรับการเรียนจบคอร์ส"
            />

            {itemFormHints.needsSourceUrl ? (
              <Stack spacing={1}>
                <TextField
                  fullWidth
                  label={itemForm.type === 'PDF' ? 'PDF URL' : 'Source URL'}
                  value={itemForm.sourceUrl}
                  onChange={(event) => setItemForm((current) => ({ ...current, sourceUrl: event.target.value }))}
                />
                {itemForm.type === 'PDF' ? (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={isUploadingPdf ? <CircularProgress size={16} /> : <UploadFileIcon />}
                      disabled={isUploadingPdf || isSavingContent}
                      sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                    >
                      {isUploadingPdf ? 'กำลังอัปโหลด PDF...' : 'อัปโหลดไฟล์ PDF'}
                      <input hidden type="file" accept="application/pdf,.pdf" onChange={uploadPdfForItem} />
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      รองรับ PDF และใช้ขนาดสูงสุดตาม System Settings
                    </Typography>
                  </Stack>
                ) : null}
                {itemForm.type === 'VIDEO' ? (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={isUploadingVideo ? <CircularProgress size={16} /> : <UploadFileIcon />}
                      disabled={isUploadingVideo || isSavingContent}
                      sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                    >
                      {isUploadingVideo ? 'กำลังอัปโหลดวิดีโอ...' : 'อัปโหลดไฟล์วิดีโอ'}
                      <input hidden type="file" accept="video/mp4,video/quicktime,video/webm,video/ogg,.mp4,.mov,.webm,.ogv" onChange={uploadVideoForItem} />
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      รองรับ MP4, MOV, WebM, OGV · แนะนำ 720p ไม่เกิน 30 นาที · สูงสุด 1,024 MB
                    </Typography>
                  </Stack>
                ) : null}
              </Stack>
            ) : null}

            {itemFormHints.needsPayloadJson ? (
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Payload JSON"
                value={itemForm.payloadJson}
                onChange={(event) => setItemForm((current) => ({ ...current, payloadJson: event.target.value }))}
                placeholder='{"key":"value"}'
              />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            variant="outlined"
            onClick={closeItemDialog}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={submitItemDialog}
            disabled={isSavingContent || isUploadingPdf || isUploadingVideo}
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 800,
              backgroundColor: '#244026 !important'
            }}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {courseId && quizEditorTarget ? (
        <QuizEditorDialog
          open
          courseId={courseId}
          sectionId={quizEditorTarget.sectionId}
          itemId={quizEditorTarget.itemId}
          onClose={() => setQuizEditorTarget(null)}
          onSaved={() => { setQuizEditorTarget(null); refreshCourseDetails(); }}
        />
      ) : null}

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={deleteConfirmTitle}
        message={deleteConfirmMessage}
        confirmText="ตกลง"
        cancelText="ยกเลิก"
        confirmDisabled={deleteConfirmBusy}
        isShowCancelButton
        isShowConfirmButton
        onConfirm={handleDeleteConfirm}
        onCancel={closeDeleteConfirm}
      />

      <ConfirmDialog
        open={openEnrollConfirmDialog}
        title="ยืนยันการเพิ่มนักเรียน"
        message={confirmMessage}
        confirmText="ตกลง"
        cancelText="ยกเลิก"
        isShowCancelButton
        isShowConfirmButton
        confirmDisabled={isEnrollingStudents}
        onConfirm={handleEnrollSelectedStudents}
        onCancel={() => setOpenEnrollConfirmDialog(false)}
      />

      <ConfirmDialog
        open={openEnrollResultDialog}
        title="สรุปผลการเพิ่มนักเรียน"
        confirmText="ตกลง"
        cancelText=""
        isShowCancelButton={false}
        isShowConfirmButton
        onConfirm={handleCloseEnrollResultDialog}>
        <Stack spacing={1.25} sx={{ mt: 0.5 }}>
          <Typography sx={{ color: '#20301d', fontWeight: 700, whiteSpace: 'pre-line' }}>
            {enrollResultMessage}
          </Typography>
          {failedEnrollments.length ? (
            <Box
              sx={{
                mt: 0.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(226, 103, 55, 0.08)',
                border: '1px solid rgba(226, 103, 55, 0.18)'
              }}>
              <Typography sx={{ fontWeight: 800, color: '#b24c23', mb: 1 }}>
                รายชื่อที่เพิ่มไม่สำเร็จ
              </Typography>
              <Stack spacing={0.75}>
                {failedEnrollments.map((item) => (
                  <Box key={`${item.name}-${item.message}`}>
                    <Typography sx={{ fontWeight: 700, color: '#7f3d1d' }}>{item.name}</Typography>
                    <Typography variant="body2" sx={{ color: '#9a5b36' }}>
                      {item.message}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : null}
        </Stack>
      </ConfirmDialog>
    </>
  );
}
