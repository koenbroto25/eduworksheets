import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

// Define a type for the performance details
interface PerformanceDetail {
  id: string;
  title: string;
  subject: string;
  grade: string;
  difficulty: string;
  final_status: string;
  attempts: any[];
}

const ChildReportPage: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const { supabase } = useAuth();
  const [reportData, setReportData] = useState<PerformanceDetail[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!childId || !supabase) return;

      setLoading(true);
      const { data, error } = await supabaseService.getChildPerformanceDetails(supabase, childId);

      if (error) {
        setError('Gagal memuat data laporan. Silakan coba lagi.');
        console.error(error);
      } else {
        setReportData(data);
      }
      setLoading(false);
    };

    fetchReportData();
  }, [childId, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Laporan Belajar Anak</h1>
      
      {reportData && reportData.length > 0 ? (
        <div className="space-y-4">
          {reportData.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <div className="text-sm text-gray-600 mb-2">
                <span>{item.subject}</span> | <span>Kelas {item.grade}</span> | <span>{item.difficulty}</span>
              </div>
              <p>Status: <span className={`font-medium ${
                item.final_status === 'completed_passed' ? 'text-green-600' :
                item.final_status === 'completed_failed' ? 'text-red-600' :
                'text-gray-500'
              }`}>{item.final_status.replace('_', ' ')}</span></p>
              <p>Jumlah Percobaan: {item.attempts.length}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>Tidak ada data laporan yang tersedia untuk anak ini.</p>
      )}
    </div>
  );
};

export default ChildReportPage;
