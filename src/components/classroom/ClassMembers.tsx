import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { supabaseService } from '../../services/supabaseService';
import { User } from '../../types';

const ClassMembers: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [teacher, setTeacher] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!classId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabaseService.getClassMembers(supabase, classId);
        if (error) throw error;

        const teacher = data.find((member: User) => member.role === 'teacher');
        const students = data.filter((member: User) => member.role === 'student');
        
        setTeacher(teacher || null);
        setStudents(students);

      } catch (err: any) {
        setError(err.message || 'Failed to fetch class members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [classId]);

  if (isLoading) {
    return <div className="text-center p-4">Loading members...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Anggota Kelas</h2>
      
      {teacher && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Guru</h3>
          <div className="flex items-center bg-gray-100 p-3 rounded-lg">
            <img src={teacher.avatar_url || '/default-avatar.png'} alt={teacher.name} className="w-10 h-10 rounded-full mr-4" />
            <span className="font-medium">{teacher.name}</span>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold mb-2">Siswa ({students.length})</h3>
        <ul className="space-y-2">
          {students.map(student => (
            <li key={student.id} className="flex items-center bg-white p-3 rounded-lg shadow-sm">
              <img src={student.avatar_url || '/default-avatar.png'} alt={student.name} className="w-10 h-10 rounded-full mr-4" />
              <span className="font-medium">{student.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ClassMembers;
