import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { reportService } from '../services/reportService';
import { classService } from '../services/classService';
import { StudentReport, ReportAssignment } from '../types';
import { useAuth } from '../hooks/useAuth';

// This interface now matches the flat structure returned by our RPC
interface ClassInfo {
  class_id: string;
  class_name: string;
}

const StudentReportPage: React.FC = () => {
  const { classId } = useParams<{ classId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState<StudentReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studentClasses, setStudentClasses] = useState<ClassInfo[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoadingReport(false);
      setLoadingClasses(false);
      return;
    }

    const fetchReport = async (currentClassId: string) => {
      setLoadingReport(true);
      setError(null);
      try {
        const { data, error: rpcError } = await reportService.getStudentClassReport(supabase, user.id, currentClassId);
        if (rpcError) throw rpcError;
        console.log('Fetched Report Data:', data); // Log data for debugging
        setReport(data as StudentReport);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch report.');
        console.error(err);
      } finally {
        setLoadingReport(false);
      }
    };

    const fetchClasses = async () => {
      setLoadingClasses(true);
      setError(null);
      try {
        const { data, error: classesError } = await classService.getStudentClasses(supabase, user.id);
        if (classesError) throw classesError;
        
        // The RPC returns a clean, flat array. No complex mapping needed.
        const classes = data || [];
        setStudentClasses(classes);

        // If there's only one class, automatically redirect to its report
        if (classes.length === 1 && !classId) {
          navigate(`/student/report/${classes[0].class_id}`, { replace: true });
        }

      } catch (err: any) {
        setError(err.message || 'Failed to fetch classes.');
        console.error(err);
      } finally {
        setLoadingClasses(false);
      }
    };

    if (classId) {
      fetchReport(classId);
    } else {
      fetchClasses();
    }
  }, [classId, user, navigate]);

  // Class Selection View
  if (!classId) {
    if (loadingClasses) {
      return <div className="text-center p-8">Loading your classes...</div>;
    }
    if (error) {
      return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    }
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Pilih Rapor Kelas</h1>
        {studentClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentClasses.map((studentClass) => (
              <Link
                key={studentClass.class_id}
                to={`/student/report/${studentClass.class_id}`}
                className="block p-6 bg-white rounded-lg shadow hover:bg-blue-50 transition-colors"
              >
                <h2 className="text-xl font-semibold">{studentClass.class_name}</h2>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">Anda belum terdaftar di kelas mana pun.</p>
        )}
      </div>
    );
  }

  // Report Detail View
  if (loadingReport) {
    return <div className="text-center p-8">Loading report...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (!report) {
    return <div className="text-center p-8">No report data available for this class.</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Rapor Belajar</h1>
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

export default StudentReportPage;
