import React, { useState, useEffect, useMemo } from 'react';
import { supabaseService } from '../../services/supabaseService';
import { supabase } from '../../services/supabaseClient';
import * as XLSX from 'xlsx';
import { Button } from '../common/Button';
import { Download } from 'lucide-react';

// Simplified interfaces based on the new RPC response
interface GradeReportRow {
  student_id: string;
  student_name: string;
  exercise_id: string;
  exercise_title: string;
  best_score: number | null;
  status: string;
}

interface PivotedData {
  students: { id: string; name: string }[];
  exercises: { id: string; title: string }[];
  gradesMap: Map<string, { score: number | null; status: string }>;
}

interface ClassGradesGridProps {
  classId: string;
}

const ClassGradesGrid: React.FC<ClassGradesGridProps> = ({ classId }) => {
  const [reportData, setReportData] = useState<GradeReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!classId) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabaseService.getClassGradesReport(supabase, classId);
        if (error) throw error;
        setReportData(data || []);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat laporan nilai.');
        console.error('Error fetching class grades report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [classId]);

  // useMemo will re-calculate the pivoted data only when reportData changes.
  // This is more efficient than processing it on every render.
  const pivotedData: PivotedData = useMemo(() => {
    if (!reportData) return { students: [], exercises: [], gradesMap: new Map() };

    const studentsMap = new Map<string, { id: string; name: string }>();
    const exercisesMap = new Map<string, { id: string; title: string }>();
    const gradesMap = new Map<string, { score: number | null; status: string }>();

    reportData.forEach(row => {
      if (!studentsMap.has(row.student_id)) {
        studentsMap.set(row.student_id, { id: row.student_id, name: row.student_name });
      }
      if (!exercisesMap.has(row.exercise_id)) {
        exercisesMap.set(row.exercise_id, { id: row.exercise_id, title: row.exercise_title });
      }
      gradesMap.set(`${row.student_id}-${row.exercise_id}`, {
        score: row.best_score,
        status: row.status,
      });
    });

    return {
      students: Array.from(studentsMap.values()),
      exercises: Array.from(exercisesMap.values()),
      gradesMap,
    };
  }, [reportData]);

  const handleExportToExcel = () => {
    if (!pivotedData) return;
    const { students, exercises, gradesMap } = pivotedData;

    const worksheetData = students.map(student => {
      const row: { [key: string]: string | number | null } = {
        'Nama Siswa': student.name,
      };
      exercises.forEach(exercise => {
        const grade = gradesMap.get(`${student.id}-${exercise.id}`);
        row[exercise.title] = grade && grade.score !== null ? grade.score : 'N/A';
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Nilai');
    const fileName = `laporan-nilai-kelas-${classId}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (loading) {
    return <div className="text-center p-4">Memuat laporan nilai...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  if (pivotedData.students.length === 0) {
    return <div className="text-center p-4">Belum ada siswa atau tugas di kelas ini.</div>;
  }

  const { students, exercises, gradesMap } = pivotedData;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Laporan Nilai Siswa</h2>
        <Button onClick={handleExportToExcel} disabled={exercises.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Unduh Excel
        </Button>
      </div>
      {exercises.length === 0 ? (
        <p>Belum ada latihan soal yang ditugaskan di kelas ini.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Nama Siswa
                </th>
                {exercises.map(ex => (
                  <th key={ex.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ex.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map(student => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    {student.name}
                  </td>
                  {exercises.map(ex => {
                    const grade = gradesMap.get(`${student.id}-${ex.id}`);
                    const score = grade ? grade.score : null;
                    return (
                      <td key={ex.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {score !== null ? score : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClassGradesGrid;
