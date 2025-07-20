import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/common/Button';
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

    setIsLoading(true);
    try {
      let result;
      if (user.role === 'teacher') {
        result = await supabaseService.getTeacherDashboardData(supabase, user.id);
      } else if (user.role === 'student') {
        result = await supabaseService.getStudentDashboardData(supabase, user.id);
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

  const renderStudentDashboard = () => (
    <>
      <div className="col-span-full bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Akses Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/search">
            <Button fullWidth variant="primary" size="lg">
              Cari & Gabung Kelas
            </Button>
          </Link>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Tugas Baru</h2>
        {dashboardData?.allAssignments?.length > 0 ? (
          <ul>
            {dashboardData.allAssignments.map((item: any) => (
              <li key={item.id} className="border-b py-2">
                <p>"{item.exercise.title}"</p>
                <p className="text-sm text-gray-600">Dari: {item.source.name}</p>
                {item.due_date && (
                  <p className="text-sm text-red-500">Tenggat: {new Date(item.due_date).toLocaleDateString()}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>Tidak ada tugas baru.</p>
        )}
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Nilai Terbaru</h2>
        {dashboardData?.recentGrades?.length > 0 ? (
          <ul>
            {dashboardData.recentGrades.map((item: any) => (
              <li key={item.id} className="border-b py-2">
                <p>"{item.exercise.title}" - Skor: {item.score}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>Tidak ada tugas yang baru dinilai.</p>
        )}
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Progres Saya</h2>
        <p>Grafik progres akan diimplementasikan di sini.</p>
      </div>
    </>
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Selamat datang kembali, {user.name}!</h1>
      
      {user.role === 'teacher' && renderTeacherDashboard()}
      {user.role === 'student' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderStudentDashboard()}
        </div>
      )}
      {user.role === 'parent' && <ParentDashboard dashboardData={dashboardData} />}
    </div>
  );
};

export default DashboardPage;
