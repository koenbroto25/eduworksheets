import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ExerciseDetailPage from '../pages/ExerciseDetailPage';
import ClassesPage from '../pages/ClassesPage';
import ClassReport from '../components/classroom/ClassReport';
import StudentReports from '../components/classroom/StudentReports';
import CreateClassPage from '../pages/CreateClassPage';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { Login } from '../components/auth/Login';
import { Signup } from '../components/auth/Signup';
import { HomePage } from '../pages/HomePage';
import { LibraryPage } from '../pages/LibraryPage';
import { ExerciseBuilderPage } from '../pages/ExerciseBuilderPage';
import DashboardPage from '../pages/DashboardPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProfilePage } from '../pages/ProfilePage';
import { SettingsPage } from '../pages/SettingsPage';
import StudentDashboardPage from '../pages/StudentDashboardPage';
import StudentReportPage from '../pages/StudentReportPage';
import ClassExercisesPage from '../pages/ClassExercisesPage';
import TakeExercisePage from '../pages/TakeExercisePage';
import JoinClassPage from '../pages/JoinClassPage';
import ClassPage from '../pages/ClassPage';
import { TeacherTakeExercisePage } from '../pages/TeacherTakeExercisePage';
import PublicTakeExercisePage from '../pages/PublicTakeExercisePage';
import AcceptInvitationPage from '../pages/AcceptInvitationPage';
import ForTeachersPage from '../pages/ForTeachersPage';
import ForStudentsPage from '../pages/ForStudentsPage';
import ForParentsPage from '../pages/ForParentsPage';
import SearchPage from '../pages/SearchPage';
import { LinkChildPage } from '../pages/LinkChildPage';
import ChildReportPage from '../pages/ChildReportPage';
import NotificationsPage from '../pages/NotificationsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to a default page if the role is not allowed
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <AuthLayout>
            <Login />
          </AuthLayout>
        </PublicRoute>
      } />

      <Route path="/signup" element={
        <PublicRoute>
          <AuthLayout>
            <Signup />
          </AuthLayout>
        </PublicRoute>
      } />

      {/* Public Pages */}
      <Route path="/" element={
        <MainLayout>
          <HomePage />
        </MainLayout>
      } />

      <Route path="/library" element={
        <MainLayout>
          <LibraryPage />
        </MainLayout>
      } />

      <Route path="/for-teachers" element={
        <MainLayout>
          <ForTeachersPage />
        </MainLayout>
      } />

      <Route path="/for-students" element={
        <MainLayout>
          <ForStudentsPage />
        </MainLayout>
      } />

      <Route path="/for-parents" element={
        <MainLayout>
          <ForParentsPage />
        </MainLayout>
      } />

      <Route path="/accept-invitation/:invitationId" element={
        <MainLayout>
          <AcceptInvitationPage />
        </MainLayout>
      } />

      <Route path="/take-exercise/:exerciseId" element={
        <MainLayout>
          <PublicTakeExercisePage />
        </MainLayout>
      } />

      {/* Protected Routes */}
      <Route path="/library/exercise/:exerciseId" element={
        <ProtectedRoute>
          <MainLayout>
            <ExerciseDetailPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/library/exercise/:exerciseId/take" element={
        <ProtectedRoute>
          <MainLayout>
            <PublicTakeExercisePage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <MainLayout>
            <DashboardPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/student-dashboard" element={
        <ProtectedRoute allowedRoles={['student']}>
          <MainLayout>
            <StudentDashboardPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <MainLayout>
            <ProfilePage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <MainLayout>
            <SettingsPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/search" element={
        <ProtectedRoute>
          <MainLayout>
            <SearchPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/link-child" element={
        <ProtectedRoute>
          <MainLayout>
            <LinkChildPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/child-report/:childId" element={
        <ProtectedRoute>
          <MainLayout>
            <ChildReportPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/student/report" element={
        <ProtectedRoute allowedRoles={['student']}>
          <MainLayout>
            <StudentReportPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/student/report/:classId" element={
        <ProtectedRoute allowedRoles={['student']}>
          <MainLayout>
            <StudentReportPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/parent/report/:childId/:classId" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <MainLayout>
            <ChildReportPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/notifications" element={
        <ProtectedRoute>
          <MainLayout>
            <NotificationsPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Teacher Only Routes */}
      <Route path="/exercise-builder" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <MainLayout>
            <ExerciseBuilderPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/create-class" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <MainLayout>
            <CreateClassPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/classes" element={
        <ProtectedRoute>
          <MainLayout>
            <ClassesPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/class/:classId" element={
        <ProtectedRoute>
          <MainLayout>
            <ClassPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/class/:classId/report" element={
        <ProtectedRoute>
          <MainLayout>
            <ClassReport />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/class/:classId/student-reports" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <MainLayout>
            <StudentReports />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/join-class/:classId" element={
        <MainLayout>
          <JoinClassPage />
        </MainLayout>
      } />

      {/* Student Exercise Routes */}
      <Route path="/class/:classId/exercises" element={
        <ProtectedRoute>
          <MainLayout>
            <ClassExercisesPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/class/:classId/exercise/:exerciseId/take" element={
        <ProtectedRoute>
          <MainLayout>
            <TakeExercisePage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/class/:classId/take-exercise/:exerciseId" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <MainLayout>
            <TeacherTakeExercisePage />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};
