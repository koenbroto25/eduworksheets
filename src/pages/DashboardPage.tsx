import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';
import { Link, useLocation, Navigate } from 'react-router-dom';
import MyExercises from '../components/dashboard/MyExercises';
import ParentDashboard from '../components/dashboard/ParentDashboard';
import ClassList from '../components/classroom/ClassList';

const DashboardPage: React.FC = () => {
  const { user, supabase, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || !supabase) return;

    // No need to fetch data for students, they will be redirected.
    if (user.role === 'student') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (user.role === 'teacher') {
        result = await supabaseService.getTeacherDashboardData(supabase, user.id);
      } else if (user.role === 'parent') {
        result = await supabaseService.getParentDashboardData(supabase, user.id);
      } else {
        setDashboardData(null);
        return;
      }

      if (result.error) {
        console.error('Error fetching dashboard data:', result.error);
        setDashboardData(null);
      } else {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
      setDashboardData(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData, location.key]);

  if (isAuthLoading || !user) {
    return <div className="text-center p-8">Memuat sesi pengguna...</div>;
  }

  // Redirect students to the new dashboard
  if (user.role === 'student') {
    return <Navigate to="/student-dashboard" replace />;
  }

  if (isLoading) {
    return <div className="text-center p-8">Memuat dasbor...</div>;
  }

  const renderTeacherDashboard = () => (
    <div className="flex flex-col gap-8">
      {/* My Classes */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Kelas Saya</h2>
        <ClassList />
      </div>

      {/* My Exercises */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Latihan Saya</h2>
        <MyExercises />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Selamat datang kembali, {user.name}!</h1>
      
      {user.role === 'teacher' && renderTeacherDashboard()}
      {user.role === 'parent' && <ParentDashboard dashboardData={dashboardData} />}
    </div>
  );
};

export default DashboardPage;
