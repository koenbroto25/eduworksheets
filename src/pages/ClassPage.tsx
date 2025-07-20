import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../services/supabaseClient';
import ClassDetailPage from './ClassDetailPage';
import StudentClassPage from './StudentClassPage';

const ClassPage: React.FC = () => {
  const { user } = useAuth();
  const { classId } = useParams<{ classId: string }>();
  const [isStudentMember, setIsStudentMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMembership = async () => {
      if (user?.role === 'student' && classId) {
        const { isMember, error } = await supabaseService.isStudentInClass(supabase, classId, user.id);
        if (error) {
          console.error('Error checking student membership:', error);
        } else {
          setIsStudentMember(isMember);
        }
      }
      setLoading(false);
    };

    if (user) {
      checkMembership();
    } else {
      setLoading(false);
    }
  }, [user, classId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user?.role === 'teacher') {
    return <ClassDetailPage />;
  }

  if (user?.role === 'student') {
    if (isStudentMember) {
      return <StudentClassPage />;
    } else {
      return <div>You are not a member of this class.</div>;
    }
  }

  return <div>You are not authorized to view this page.</div>;
};

export default ClassPage;
