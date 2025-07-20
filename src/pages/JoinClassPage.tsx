import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';

const JoinClassPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user, supabase } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [classDetails, setClassDetails] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMembershipAndFetchDetails = async () => {
      if (!classId) {
        setIsLoading(false);
        return;
      }

      if (user) {
        if (user.role === 'teacher') {
          navigate('/dashboard');
          return;
        }

        try {
          if (!supabase) return;
          setIsLoading(true);
          const { isMember, error: memberError } = await supabaseService.isStudentInClass(supabase, classId, user.id);
          if (memberError) throw memberError;
          setIsMember(isMember);

          if (!isMember) {
            const { data, error } = await supabaseService.getClassDetails(supabase, classId);
            if (error) throw error;
            setClassDetails(data);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to fetch class details');
        } finally {
          setIsLoading(false);
        }
      } else {
        // User is not logged in, just fetch class details
        try {
          if (!supabase) return;
          setIsLoading(true);
          const { data, error } = await supabaseService.getClassDetails(supabase, classId);
          if (error) throw error;
          setClassDetails(data);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch class details');
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkMembershipAndFetchDetails();
  }, [classId, user, navigate]);

  const handleJoinClass = async () => {
    if (!user) {
      // If user is not logged in, redirect to login page
      navigate('/login');
      return;
    }

    if (!classId || !classDetails) return;

    try {
      if (!supabase) return;
      const { error } = await supabaseService.joinClassWithCode(supabase, classDetails.class_code, user.id);
      if (error) {
        setError(error.message || 'Failed to join class');
      } else {
        navigate(`/class/${classId}`);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (isMember) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Already a Member</h1>
        <p className="text-lg mb-4">You are already a member of this class.</p>
        <Button onClick={() => navigate(`/class/${classId}`)}>Go to Class</Button>
      </div>
    );
  }

  if (!classDetails) {
    return <div className="text-center p-8">Class not found.</div>;
  }

  return (
    <div className="container mx-auto py-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Join Class</h1>
      <p className="text-lg mb-4">You've been invited to join:</p>
      <h2 className="text-2xl font-semibold mb-6">{classDetails.name}</h2>
      <Button onClick={handleJoinClass}>
        {user ? 'Join Class' : 'Log In to Join'}
      </Button>
    </div>
  );
};

export default JoinClassPage;
