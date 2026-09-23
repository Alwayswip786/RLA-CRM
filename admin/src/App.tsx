import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute';
import { useAdminAuthStore } from './store/useAdminAuthStore';

// Leads Pages
import { LeadsPipelinePage } from './pages/leads/LeadsPipelinePage';
import { LeadsDemosPage } from './pages/leads/LeadsDemosPage';
import { LeadsNewEnrollmentPage } from './pages/leads/LeadsNewEnrollmentPage';

// Courses Pages
import { CoursesAllPage } from './pages/courses/CoursesAllPage';
import { CoursesBatchesPage } from './pages/courses/CoursesBatchesPage';
import { CoursesRecordingsPage } from './pages/courses/CoursesRecordingsPage';

// Academic Pages
import { LiveClassesPage } from './pages/academic/LiveClassesPage';
import { TimetablePage } from './pages/academic/TimetablePage';
import { DailyDigestPage } from './pages/academic/DailyDigestPage';

// Exam & Evaluation Pages
import { MainsInboxPage } from './pages/exams/MainsInboxPage';
import { MainsGradedPage } from './pages/exams/MainsGradedPage';
import { MainsQuestionsPage } from './pages/exams/MainsQuestionsPage';
import { TestsAllPage } from './pages/exams/TestsAllPage';
import { TestsQuestionBankPage } from './pages/exams/TestsQuestionBankPage';
import { TestsRankingsPage } from './pages/exams/TestsRankingsPage';

// Legal Knowledge Vault Pages
import { BareActsPage } from './pages/vault/BareActsPage';
import { JudgmentsPage } from './pages/vault/JudgmentsPage';
import { PyqsPage } from './pages/vault/PyqsPage';

// Students Directory Pages
import { StudentsDirectoryPage } from './pages/students/StudentsDirectoryPage';
import { StudentsVideoTrackingPage } from './pages/students/StudentsVideoTrackingPage';

// Campus CRM Pages
import { DoubtsPage } from './pages/campus/DoubtsPage';
import { FeesPage } from './pages/campus/FeesPage';
import { NoticesPage } from './pages/campus/NoticesPage';
import { StaffPage } from './pages/campus/StaffPage';
import { SystemSettingsPage } from './pages/settings/SystemSettingsPage';

function App() {
  const initSession = useAdminAuthStore((state) => state.initSession);

  useEffect(() => {
    initSession();
  }, [initSession]);

  return (
    <BrowserRouter>
      {/* Dark Themed Toast Notifications via react-hot-toast */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1E1E1E',
            color: '#F7F3E6',
            border: '1px solid #3D3D3D',
            borderRadius: '12px',
            fontSize: '13px',
            boxShadow: 'none',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#34D399',
              secondary: '#1E1E1E',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#1E1E1E',
            },
          },
        }}
      />

      <Routes>
        {/* Authentication Route (Standalone, without sidebar/navbar) */}
        <Route path="/login" element={<LoginPage />} />

        {/* Chamber Administration Layout Shell (Protected) */}
        <Route
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          {/* Executive Operations */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* Admissions & Leads CRM */}
          <Route path="/leads" element={<Navigate to="/leads/pipeline" replace />} />
          <Route path="/leads/pipeline" element={<AdminProtectedRoute requiredPermission="leads:view"><LeadsPipelinePage /></AdminProtectedRoute>} />
          <Route path="/leads/demos" element={<AdminProtectedRoute requiredPermission="leads:view"><LeadsDemosPage /></AdminProtectedRoute>} />
          <Route path="/leads/new-enrollment" element={<AdminProtectedRoute requiredPermission="leads:create"><LeadsNewEnrollmentPage /></AdminProtectedRoute>} />

          {/* Academic & Classroom CMS */}
          <Route path="/courses" element={<Navigate to="/courses/all" replace />} />
          <Route path="/courses/all" element={<AdminProtectedRoute requiredPermission="courses:view"><CoursesAllPage /></AdminProtectedRoute>} />
          <Route path="/courses/batches" element={<AdminProtectedRoute requiredPermission="courses:view"><CoursesBatchesPage /></AdminProtectedRoute>} />
          <Route path="/courses/recordings" element={<AdminProtectedRoute requiredPermission="courses:view"><CoursesRecordingsPage /></AdminProtectedRoute>} />
          <Route path="/live-classes" element={<AdminProtectedRoute requiredPermission="live_classes:view"><LiveClassesPage /></AdminProtectedRoute>} />
          <Route path="/timetable" element={<AdminProtectedRoute requiredPermission="timetable:view"><TimetablePage /></AdminProtectedRoute>} />
          <Route path="/daily-digest" element={<AdminProtectedRoute requiredPermission="daily_digest:view"><DailyDigestPage /></AdminProtectedRoute>} />

          {/* Exams & Evaluation Center */}
          <Route path="/mains-evaluation" element={<Navigate to="/mains-evaluation/inbox" replace />} />
          <Route path="/mains-evaluation/inbox" element={<AdminProtectedRoute requiredPermission="mains_evaluation:view"><MainsInboxPage /></AdminProtectedRoute>} />
          <Route path="/mains-evaluation/graded" element={<AdminProtectedRoute requiredPermission="mains_evaluation:view"><MainsGradedPage /></AdminProtectedRoute>} />
          <Route path="/mains-evaluation/questions" element={<AdminProtectedRoute requiredPermission="mains_evaluation:view"><MainsQuestionsPage /></AdminProtectedRoute>} />

          <Route path="/tests" element={<Navigate to="/tests/all" replace />} />
          <Route path="/tests/all" element={<AdminProtectedRoute requiredPermission="tests:view"><TestsAllPage /></AdminProtectedRoute>} />
          <Route path="/tests/bank" element={<AdminProtectedRoute requiredPermission="tests:view"><TestsQuestionBankPage /></AdminProtectedRoute>} />
          <Route path="/tests/rankings" element={<AdminProtectedRoute requiredPermission="tests:view"><TestsRankingsPage /></AdminProtectedRoute>} />

          {/* Legal Knowledge Vault */}
          <Route path="/bare-acts" element={<AdminProtectedRoute requiredPermission="vault:view"><BareActsPage /></AdminProtectedRoute>} />
          <Route path="/judgments" element={<AdminProtectedRoute requiredPermission="vault:view"><JudgmentsPage /></AdminProtectedRoute>} />
          <Route path="/pyqs" element={<AdminProtectedRoute requiredPermission="vault:view"><PyqsPage /></AdminProtectedRoute>} />

          {/* Student Directory & Analytics */}
          <Route path="/students" element={<Navigate to="/students/roster" replace />} />
          <Route path="/students/roster" element={<AdminProtectedRoute requiredPermission="students:view"><StudentsDirectoryPage /></AdminProtectedRoute>} />
          <Route path="/students/video-tracking" element={<AdminProtectedRoute requiredPermission="students:view"><StudentsVideoTrackingPage /></AdminProtectedRoute>} />
          <Route path="/students/:studentId" element={<AdminProtectedRoute requiredPermission="students:view"><StudentsDirectoryPage /></AdminProtectedRoute>} />

          {/* Campus & Institutional CRM */}
          <Route path="/doubts" element={<AdminProtectedRoute requiredPermission="doubts:view"><DoubtsPage /></AdminProtectedRoute>} />
          <Route path="/fees" element={<AdminProtectedRoute requiredPermission="fees:view"><FeesPage /></AdminProtectedRoute>} />
          <Route path="/notices" element={<AdminProtectedRoute requiredPermission="notices:view"><NoticesPage /></AdminProtectedRoute>} />
          <Route path="/staff" element={<AdminProtectedRoute requiredPermission="staff:view"><StaffPage /></AdminProtectedRoute>} />
          <Route path="/settings" element={<AdminProtectedRoute requiredPermission="settings:view"><SystemSettingsPage /></AdminProtectedRoute>} />
        </Route>

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
