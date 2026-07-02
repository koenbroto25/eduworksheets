import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../services/supabaseService';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient'; // Direct import

const ClassReport: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!classId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabaseService.getTeacherClassDashboard(supabase, classId);
        if (error) throw error;
        setReportData(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch class report data');
        console.error('Error fetching class report data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [classId]);

  if (isLoading) {
    return <div className="text-center p-8">Loading Class Report...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (!reportData || reportData.length === 0) {
    return <div className="text-center p-8">No class report data available.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Class Dashboard</h1>
      <p className="text-lg text-gray-600 mb-8">
        Total Students in Class: <span className="font-bold">{reportData[0]?.total_students || 0}</span>
      </p>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Exercise Performance Overview</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exercise Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participation Rate</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((item: any) => (
                <tr key={item.exercise_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.exercise_title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Number(item.participation_rate).toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.average_score ? `${Number(item.average_score).toFixed(1)}%` : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClassReport;
