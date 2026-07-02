import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabaseService } from '../../services/supabaseService';
import { supabase } from '../../services/supabaseClient'; // Import the raw client
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '../common/Button';

interface ChildCardProps {
  child: {
    id: string;
    name: string;
    recent_scores: any[];
    assignments: any[];
  };
}

const ChildCard: React.FC<ChildCardProps> = ({ child }) => {
  const [classReports, setClassReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchClassReports = async () => {
      if (!child.assignments) return;

      // Use the new 'assignment_type' and 'class_id' from our RPC
      const classAssignments = child.assignments.filter(a => a.assignment_type === 'class' && a.class_id);
      const uniqueClassIds = [...new Set(classAssignments.map(a => a.class_id))];
      
      if (uniqueClassIds.length === 0) {
        setClassReports([]);
        return;
      }

      const reportPromises = uniqueClassIds.map(classId => 
        supabaseService.getStudentClassReport(supabase, child.id, classId)
      );
      
      const results = await Promise.all(reportPromises);
      
      const successfulReports = results
        .map((res, index) => ({ ...res.data, classId: uniqueClassIds[index] }))
        .filter(report => report && report.total_assignments !== undefined);

      // Add class names to the reports using the pre-formatted assigner_name
      const reportsWithClassNames = successfulReports.map(report => {
        const assignment = classAssignments.find(a => a.class_id === report.classId);
        // Extract class name from "Guru Name (Class Name)"
        const classNameMatch = assignment?.assigner_name?.match(/\(([^)]+)\)/);
        return {
          ...report,
          className: classNameMatch ? classNameMatch[1] : 'Kelas'
        };
      });

      setClassReports(reportsWithClassNames);
    };

    fetchClassReports();
  }, [child.id, child.assignments]);

  const averageScore =
    child.recent_scores.length > 0
      ? (child.recent_scores.reduce((acc, s) => acc + s.score, 0) / child.recent_scores.length).toFixed(1)
      : 'N/A';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md transition-shadow duration-300 hover:shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800">{child.name}</h3>
        <div className="flex items-center space-x-2">
          <Link to={`/child-report/${child.id}`}>
            <Button size="sm" variant="outline">Lihat Laporan</Button>
          </Link>
          <Link
            to="/library"
            state={{ assigningToChildId: child.id }}
          >
            <Button size="sm">Berikan Latihan</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <h4 className="text-sm font-medium text-gray-500">Rata-rata Skor</h4>
          <p className="text-3xl font-bold text-blue-600">{averageScore}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <h4 className="text-sm font-medium text-gray-500">Tugas Aktif</h4>
          <p className="text-3xl font-bold text-green-600">{child.assignments.length}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <h4 className="text-sm font-medium text-gray-500">Waktu Belajar</h4>
          <p className="text-3xl font-bold text-purple-600">N/A</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-xl font-semibold mb-4 text-gray-700">Skor Terbaru</h4>
          {child.recent_scores && child.recent_scores.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={child.recent_scores} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="exercise_title" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#8884d8" name="Skor" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">Tidak ada skor terbaru untuk ditampilkan.</p>
          )}
        </div>
        <div>
          <h4 className="text-xl font-semibold mb-4 text-gray-700">Daftar Tugas</h4>
          {child.assignments && child.assignments.length > 0 ? (
            <ul className="space-y-3">
              {child.assignments.map((assignment: any) => (
                <li key={`${assignment.assignment_type}-${assignment.exercise_id}`} className="border-b border-gray-200 pb-2">
                  <p className="font-medium text-gray-800">
                    {assignment.exercise_title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {assignment.assigner_name}
                  </p>
                  {assignment.due_date && (
                    <p className="text-sm text-red-500">
                      Tenggat: {new Date(assignment.due_date).toLocaleDateString('id-ID')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Tidak ada tugas yang diberikan.</p>
          )}
        </div>
        <div>
          <h4 className="text-xl font-semibold mb-4 text-gray-700">Partisipasi Kelas</h4>
          {classReports.length > 0 ? (
            <ul className="space-y-4">
              {classReports.map((report) => (
                <li key={report.classId} className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-bold text-gray-800">{report.className}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <p className="text-gray-600">Tugas Selesai:</p>
                    <p className="font-medium text-right">{report.completed_assignments} / {report.total_assignments}</p>
                    <p className="text-gray-600">Rata-rata Skor:</p>
                    <p className="font-medium text-right">{report.average_score ? Number(report.average_score).toFixed(1) : 'N/A'}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Belum ada laporan partisipasi kelas.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildCard;
