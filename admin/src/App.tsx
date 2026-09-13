import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminLayout } from './components/layout/AdminLayout';

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
import { InterviewsPage } from './pages/exams/InterviewsPage';

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

function App() {
  return (
    <BrowserRouter>
      {/* Dark Themed Luxury Toast Notifications */}
      <Toaster
        position="top-right"
        theme="dark"
        richColors
        closeButton
        toastOptions={{
          style: {
            backgroundColor: '#1E1E1E',
            border: '1px solid #3D3D3D',
            color: '#F7F3E6',
          },
        }}
      />

      <Routes>
        {/* Authentication Route (Standalone, without sidebar/navbar) */}
        <Route path="/login" element={<LoginPage />} />

        {/* Chamber Administration Layout Shell */}
        <Route element={<AdminLayout />}>
          {/* Executive Operations */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* Admissions & Leads CRM */}
          <Route path="/leads" element={<Navigate to="/leads/pipeline" replace />} />
          <Route path="/leads/pipeline" element={<LeadsPipelinePage />} />
          <Route path="/leads/demos" element={<LeadsDemosPage />} />
          <Route path="/leads/new-enrollment" element={<LeadsNewEnrollmentPage />} />

          {/* Academic & Classroom CMS */}
          <Route path="/courses" element={<Navigate to="/courses/all" replace />} />
          <Route path="/courses/all" element={<CoursesAllPage />} />
          <Route path="/courses/batches" element={<CoursesBatchesPage />} />
          <Route path="/courses/recordings" element={<CoursesRecordingsPage />} />
          <Route path="/live-classes" element={<LiveClassesPage />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/daily-digest" element={<DailyDigestPage />} />

          {/* Exams & Evaluation Center */}
          <Route path="/mains-evaluation" element={<Navigate to="/mains-evaluation/inbox" replace />} />
          <Route path="/mains-evaluation/inbox" element={<MainsInboxPage />} />
          <Route path="/mains-evaluation/graded" element={<MainsGradedPage />} />
          <Route path="/mains-evaluation/questions" element={<MainsQuestionsPage />} />

          <Route path="/tests" element={<Navigate to="/tests/all" replace />} />
          <Route path="/tests/all" element={<TestsAllPage />} />
          <Route path="/tests/bank" element={<TestsQuestionBankPage />} />
          <Route path="/tests/rankings" element={<TestsRankingsPage />} />

          <Route path="/interviews" element={<InterviewsPage />} />

          {/* Legal Knowledge Vault */}
          <Route path="/bare-acts" element={<BareActsPage />} />
          <Route path="/judgments" element={<JudgmentsPage />} />
          <Route path="/pyqs" element={<PyqsPage />} />

          {/* Student Directory & Analytics */}
          <Route path="/students" element={<Navigate to="/students/roster" replace />} />
          <Route path="/students/roster" element={<StudentsDirectoryPage />} />
          <Route path="/students/video-tracking" element={<StudentsVideoTrackingPage />} />
          <Route path="/students/:studentId" element={<StudentsDirectoryPage />} />

          {/* Campus & Institutional CRM */}
          <Route path="/doubts" element={<DoubtsPage />} />
          <Route path="/fees" element={<FeesPage />} />
          <Route path="/notices" element={<NoticesPage />} />
          <Route path="/staff" element={<StaffPage />} />
        </Route>

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
