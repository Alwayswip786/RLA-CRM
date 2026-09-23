import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { MobileVerification } from './pages/auth/MobileVerification';
import { EmailVerification } from './pages/auth/EmailVerification';
import { OAuthCallback } from './pages/auth/OAuthCallback';
import { LandingIntroPage } from './pages/LandingIntroPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { GuestRoute } from './components/auth/GuestRoute';
import { OnboardingRoute } from './components/auth/OnboardingRoute';
import { OnboardingPage } from './pages/auth/OnboardingPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPreview } from './pages/DashboardPreview';
import { LiveClassesPage } from './pages/dashboard/LiveClassesPage';
import { TimetablePage } from './pages/dashboard/TimetablePage';
import { DailyDigestPage } from './pages/dashboard/DailyDigestPage';
import { MockSeriesPage } from './pages/dashboard/tests/MockSeriesPage';
import { PracticeQuizzesPage } from './pages/dashboard/tests/PracticeQuizzesPage';
import { TestResultsPage } from './pages/dashboard/tests/TestResultsPage';
import { MainsQuestionsPage } from './pages/dashboard/mains/MainsQuestionsPage';
import { MainsEvaluatedPage } from './pages/dashboard/mains/MainsEvaluatedPage';
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
import { ChamberChatPage } from './pages/dashboard/ChamberChatPage';

function App() {
  const initSession = useAuthStore((state) => state.initSession);

  useEffect(() => {
    initSession();
  }, [initSession]);

  return (
    <BrowserRouter>
      {/* Toast Notification Container (react-hot-toast) */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1E1E1E',
            color: '#F7F3E6',
            border: '1px solid #3D3D3D',
            borderRadius: '12px',
            fontSize: '12px',
            padding: '12px 16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
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
        {/* Auth Routes (Guest Only) */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute>
              <Signup />
            </GuestRoute>
          }
        />
        <Route
          path="/mobile-verification"
          element={
            <GuestRoute>
              <MobileVerification />
            </GuestRoute>
          }
        />
        <Route
          path="/email-verification"
          element={
            <GuestRoute>
              <EmailVerification />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPassword />
            </GuestRoute>
          }
        />
        <Route path="/auth/success" element={<OAuthCallback />} />

        {/* Dedicated Student Onboarding Route */}
        <Route
          path="/onboarding"
          element={
            <OnboardingRoute>
              <OnboardingPage />
            </OnboardingRoute>
          }
        />

        {/* Fullscreen Immersive Classroom / Lecture Player */}
        <Route
          path="/dashboard/courses/:courseId/learn/:lessonId"
          element={
            <ProtectedRoute>
              <LecturePlayerPage />
            </ProtectedRoute>
          }
        />

        {/* Fullscreen Course Detail (without navbar or sidebar) */}
        <Route
          path="/dashboard/courses/:courseId"
          element={
            <ProtectedRoute>
              <CourseDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Fullscreen Live Faculty Mentorship Chamber (WhatsApp-like standalone view) */}
        <Route
          path="/dashboard/chamber"
          element={
            <ProtectedRoute>
              <ChamberChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/doubts/:queryId/chamber"
          element={
            <ProtectedRoute>
              <ChamberChatPage />
            </ProtectedRoute>
          }
        />

        {/* Classroom Portal / Dashboard Nested Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
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
          <Route path="mains/submit" element={<Navigate to="/dashboard/mains/questions" replace />} />
          <Route path="mains/evaluated" element={<MainsEvaluatedPage />} />

          {/* Bookmarks */}
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

        {/* Landing / Welcome Screen */}
        <Route path="/" element={<LandingIntroPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
