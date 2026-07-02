import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { reportService } from '../services/reportService';
import { StudentReport, ReportAssignment } from '../types';
import { useAuth } from '../hooks/useAuth';

const ChildReportPage: React.FC = () => {
  const { childId, classId } = useParams<{ childId: string; classId: string }>();
  const { user } = useAuth();
  const [report, setReport] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!classId || !childId || !user) {
        setError('Class ID, Child ID, or user not found.');
        setLoading(false);
        return;
      }

      // Basic authorization: ensure the user is a parent.
      // More robust RLS policies on the backend should handle the rest.
      if (user.role !== 'parent') {
        setError('You are not authorized to view this page.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: rpcError } = await reportService.getStudentClassReport(supabase, childId, classId);

        if (rpcError) {
          throw new Error(rpcError.message);
        }
        
        console.log('Fetched Child Report Data:', data); // Log data for debugging
        setReport(data as StudentReport);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch report.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [classId, childId, user]);

  if (loading) {
    return <div className="text-center p-8">Loading report...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (!report) {
    return <div className="text-center p-8">No report data available for this child in this class.</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Rapor Belajar Anak</h1>
        <p className="text-lg text-gray-600">Kelas: {report.class_name}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Total Latihan Dikerjakan</h3>
          <p className="text-3xl font-bold text-blue-600">{report.total_assignments_completed}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Rata-rata Nilai</h3>
          <p className="text-3xl font-bold text-green-600">{report.average_score?.toFixed(2) ?? 'N/A'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Total Waktu Belajar</h3>
          <p className="text-3xl font-bold text-purple-600">{Math.round(report.total_time_spent / 60)} Menit</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Detail Pengerjaan Latihan</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Judul Latihan</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Nilai Terbaik</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Jumlah Percobaan</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {report && report.assignments && report.assignments.length > 0 ? (
                report.assignments.map((assignment: ReportAssignment, index: number) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700">{assignment.exercise_title}</td>
                    <td className="py-3 px-4 text-gray-700">{assignment.best_score ?? 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-700">{assignment.attempts_count}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          assignment.status === 'completed_passed'
                            ? 'bg-green-100 text-green-800'
                            : assignment.status === 'completed_failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {assignment.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    Tidak ada data pengerjaan latihan yang tersedia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChildReportPage;
