import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';

const AcceptInvitationPage: React.FC = () => {
  const { invitationId } = useParams<{ invitationId: string }>();
  const { user, supabase } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [invitation, setInvitation] = useState<any>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvitationDetails = async () => {
      console.log('[AcceptInvitationPage] Starting fetch. invitationId:', invitationId);

      if (!invitationId) {
        console.error('[AcceptInvitationPage] Invalid invitationId.');
        setError('ID Undangan tidak valid.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(''); // Reset error state on new fetch

      try {
        if (!supabase) {
          setError("Koneksi Supabase tidak tersedia.");
          setIsLoading(false);
          return;
        }
        console.log('[AcceptInvitationPage] Fetching parent invitation...');
        const { data, error: invitationError } = await supabaseService.getParentInvitation(supabase, invitationId);
        console.log('[AcceptInvitationPage] Invitation data:', data, 'Error:', invitationError);

        if (invitationError || !data) {
          console.error('[AcceptInvitationPage] Error fetching invitation or no data returned.', invitationError);
          setError(invitationError?.message || 'Undangan tidak ditemukan atau tidak valid.');
          setIsLoading(false); // Explicitly stop loading on error
          return;
        }
        
        setInvitation(data);
        console.log('[AcceptInvitationPage] Invitation state set:', data);

        if (user && user.role === 'student' && data.parent_id && supabase) {
          console.log(`[AcceptInvitationPage] User is student. Checking if child ${user.id} is linked to parent ${data.parent_id}`);
          const { data: isLinkedData, error: isLinkedError } = await supabaseService.isChildLinked(supabase, user.id, data.parent_id);
          console.log('[AcceptInvitationPage] isChildLinked result:', isLinkedData, 'Error:', isLinkedError);

          if (isLinkedError) {
            console.error('[AcceptInvitationPage] Error checking if child is linked.', isLinkedError);
            setError(isLinkedError.message);
          } else {
            setIsLinked(isLinkedData);
            console.log('[AcceptInvitationPage] isLinked state set:', isLinkedData);
          }
        } else {
          console.log('[AcceptInvitationPage] Skipping isChildLinked check. User:', user, 'Parent ID:', data.parent_id);
        }
      } catch (err: any) {
        console.error('[AcceptInvitationPage] Caught an exception:', err);
        setError(err.message || 'Gagal memuat detail undangan.');
      } finally {
        console.log('[AcceptInvitationPage] Fetch finished. Setting isLoading to false.');
        setIsLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [invitationId, user, navigate]);

  const handleAccept = async () => {
    if (!user) {
      // Redirect to login, but save the current location to return to after login
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!invitation || !supabase) return;

    setIsLoading(true);
    setError(''); // Clear previous errors

    try {
      const { error } = await supabaseService.acceptParentInvitation(supabase, invitation.id, user.id);
      if (error) {
        // The error from the edge function is already a string message
        setError(error.toString());
      } else {
        // On success, maybe show a success message before navigating
        alert('Undangan berhasil diterima! Anda sekarang terhubung dengan orang tua Anda.');
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan tak terduga.');
    } finally {
      setIsLoading(false);
    }
  };

  console.log('[AcceptInvitationPage] Rendering component with state:', { isLoading, error, isLinked, invitation });

  if (isLoading) {
    return <div className="text-center p-8">Memuat...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  if (isLinked) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Akun Sudah Tertaut</h1>
        <p className="text-lg mb-4">Akun Anda sudah terhubung dengan orang tua ini.</p>
        <Button onClick={() => navigate('/dashboard')}>Ke Dashboard</Button>
      </div>
    );
  }

  if (!invitation) {
    return <div className="text-center p-8">Undangan tidak ditemukan atau tidak valid.</div>;
  }

  // Safely access parent's name with a fallback
  const parentName = invitation.parent?.name || 'Orang Tua';

  return (
    <div className="container mx-auto py-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Terima Undangan Orang Tua</h1>
      <p className="text-lg mb-4">
        Anda telah diundang oleh <span className="font-semibold">{parentName}</span> untuk menautkan akun Anda.
      </p>
      <Button onClick={handleAccept} disabled={isLoading}>
        {isLoading ? 'Memproses...' : (user ? 'Terima Undangan' : 'Login untuk Menerima')}
      </Button>
    </div>
  );
};

export default AcceptInvitationPage;
