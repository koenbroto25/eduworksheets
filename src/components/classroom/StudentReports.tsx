import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../services/supabaseService';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const StudentReports: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const { supabase } = useAuth();
  const [studentReports, setStudentReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentReports = async () => {
      if (!classId || !supabase) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabaseService.getStudentReports(supabase, classId);
        if (error) throw error;
        setStudentReports(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch student reports');
        console.error('Error fetching student reports:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentReports();
  }, [classId, supabase]);

  if (isLoading) {
    return <div className="text-center p-8">Loading Student Reports...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (!studentReports || studentReports.length === 0) {
    return <div className="text-center p-8">No student reports available.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Student Reports</h1>
      <div className="space-y-8">
        {studentReports.map((report) => (
          <div key={report.student_id} className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">{report.student_name}</h2>
            {report.attempts && report.attempts.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exercise
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.attempts.map((attempt: any) => (
                    <tr key={attempt.exercise_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.exercise_title || `Exercise ID: ${attempt.exercise_id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.score}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No exercise attempts available for this student.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentReports;
