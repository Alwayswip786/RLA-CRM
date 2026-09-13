import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPreview } from './pages/DashboardPreview';
import { LiveClassesPage } from './pages/dashboard/LiveClassesPage';
import { TimetablePage } from './pages/dashboard/TimetablePage';
import { DailyDigestPage } from './pages/dashboard/DailyDigestPage';
import { MockSeriesPage } from './pages/dashboard/tests/MockSeriesPage';
import { PracticeQuizzesPage } from './pages/dashboard/tests/PracticeQuizzesPage';
import { TestResultsPage } from './pages/dashboard/tests/TestResultsPage';
import { MainsQuestionsPage } from './pages/dashboard/mains/MainsQuestionsPage';
import { MainsSubmitPage } from './pages/dashboard/mains/MainsSubmitPage';
import { MainsEvaluatedPage } from './pages/dashboard/mains/MainsEvaluatedPage';
import { InterviewChamberPage } from './pages/dashboard/InterviewChamberPage';
import { BookmarksPage } from './pages/dashboard/BookmarksPage';
import { BareActsPage } from './pages/dashboard/BareActsPage';
import { JudgmentsPage } from './pages/dashboard/JudgmentsPage';
import { PyqArchivePage } from './pages/dashboard/PyqArchivePage';
import { StudentIdPage } from './pages/dashboard/StudentIdPage';
import { DoubtsPage } from './pages/dashboard/DoubtsPage';
import { FeesPage } from './pages/dashboard/FeesPage';
import { NoticesPage } from './pages/dashboard/NoticesPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { CoursesHubPage } from './pages/dashboard/courses/CoursesHubPage';
import { CourseDetailPage } from './pages/dashboard/courses/CourseDetailPage';
import { LecturePlayerPage } from './pages/dashboard/courses/LecturePlayerPage';

function App() {
  return (
    <BrowserRouter>
      {/* Toast Notification Container */}
      <Toaster position="top-right" richColors closeButton />

      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Fullscreen Immersive Classroom / Lecture Player */}
        <Route path="/dashboard/courses/:courseId/learn/:lessonId" element={<LecturePlayerPage />} />

        {/* Fullscreen Course Detail (without navbar or sidebar) */}
        <Route path="/dashboard/courses/:courseId" element={<CourseDetailPage />} />

        {/* Classroom Portal / Dashboard Nested Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPreview />} />
          <Route path="courses" element={<CoursesHubPage />} />
          <Route path="live-classes" element={<LiveClassesPage />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="daily-digest" element={<DailyDigestPage />} />

          {/* Tests */}
          <Route path="tests" element={<Navigate to="/dashboard/tests/mock-series" replace />} />
          <Route path="tests/mock-series" element={<MockSeriesPage />} />
          <Route path="tests/practice" element={<PracticeQuizzesPage />} />
          <Route path="tests/results" element={<TestResultsPage />} />

          {/* Mains Answer Writing */}
          <Route path="mains" element={<Navigate to="/dashboard/mains/questions" replace />} />
          <Route path="mains/questions" element={<MainsQuestionsPage />} />
          <Route path="mains/submit" element={<MainsSubmitPage />} />
          <Route path="mains/evaluated" element={<MainsEvaluatedPage />} />

          {/* Interviews & Bookmarks */}
          <Route path="interviews" element={<InterviewChamberPage />} />
          <Route path="bookmarks" element={<BookmarksPage />} />

          {/* Knowledge Vault */}
          <Route path="bare-acts" element={<BareActsPage />} />
          <Route path="judgments" element={<JudgmentsPage />} />
          <Route path="pyqs" element={<PyqArchivePage />} />

          {/* Campus & Services */}
          <Route path="student-id" element={<StudentIdPage />} />
          <Route path="doubts" element={<DoubtsPage />} />
          <Route path="fees" element={<FeesPage />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
