import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';
import AssignmentsWidget from '../components/student-dashboard/AssignmentsWidget';
import ProgressWidget from '../components/student-dashboard/ProgressWidget';
import TodayFocusWidget from '../components/student-dashboard/TodayFocusWidget';

const StudentDashboardPage = () => {
  const { user, supabase, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || !supabase) return;

    setIsLoading(true);
    try {
      // Hanya mengambil data untuk student
      const result = await supabaseService.getStudentDashboardData(supabase, user.id);

      if (result.error) {
        console.error('Error fetching student dashboard data:', result.error);
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

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-lg">Memuat dasbor...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">My Dashboard</h1>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">✨</span>
            <span className="text-lg font-semibold text-yellow-600">1,250 Poin</span>
          </div>
          <button className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
          <img
            src={user?.avatar_url || `https://placehold.co/48x48`}
            alt="Avatar"
            className="h-12 w-12 rounded-full border-2 border-blue-500"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri */}
        <div className="lg:col-span-2">
          <AssignmentsWidget assignments={dashboardData?.allAssignments} />
        </div>

        {/* Kolom Kanan */}
        <div className="space-y-8">
          <TodayFocusWidget assignments={dashboardData?.allAssignments} />
          <ProgressWidget recentGrades={dashboardData?.recentGrades} />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
