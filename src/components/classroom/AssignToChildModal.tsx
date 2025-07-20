import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Exercise, User } from '../../types';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';

interface AssignToChildModalProps {
  exercise: Exercise;
  onClose: () => void;
  onConfirmAssign: (childIds: string[]) => void;
}

export const AssignToChildModal: React.FC<AssignToChildModalProps> = ({
  exercise,
  onClose,
  onConfirmAssign,
}) => {
  const { user } = useAuth();
  const [children, setChildren] = useState<User[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      setIsLoading(true);
      const { data: links, error: linkError } = await supabase
        .from('parent_child_link')
        .select('child_id')
        .eq('parent_id', user.id);

      if (linkError) {
        console.error(linkError);
        setIsLoading(false);
        return;
      }

      const childIds = links.map(link => link.child_id);
      const { data: childProfiles, error: profileError } = await supabase
        .from('users')
        .select('*')
        .in('id', childIds);
      
      if (profileError) {
        console.error(profileError);
      } else {
        setChildren(childProfiles || []);
      }
      setIsLoading(false);
    };

    fetchChildren();
  }, [user]);

  const handleChildSelectionChange = (childId: string) => {
    setSelectedChildren(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId) 
        : [...prev, childId]
    );
  };

  const handleAssign = async () => {
    if (selectedChildren.length === 0) return;
    
    setIsAssigning(true);
    setNotification(null);
    
    try {
      await onConfirmAssign(selectedChildren);
      setNotification({ type: 'success', message: 'Latihan berhasil diberikan!' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setNotification({ type: 'error', message: 'Gagal memberikan latihan.' });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Berikan Latihan kepada Anak</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        <p className="mb-4">Pilih anak yang akan diberi latihan: <strong>{exercise.title}</strong></p>
        
        {notification && (
          <div className={`p-4 mb-4 text-sm rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {notification.message}
          </div>
        )}

        {isLoading ? (
          <p>Memuat daftar anak...</p>
        ) : children.length === 0 ? (
          <p>Anda belum menautkan akun anak.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {children.map(child => (
              <div key={child.id} className="flex items-center p-2 rounded-lg hover:bg-gray-100">
                <input
                  type="checkbox"
                  id={`child-${child.id}`}
                  checked={selectedChildren.includes(child.id)}
                  onChange={() => handleChildSelectionChange(child.id)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`child-${child.id}`} className="ml-3 block text-sm font-medium text-gray-700">
                  {child.name}
                </label>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleAssign} disabled={selectedChildren.length === 0 || isLoading || isAssigning}>
            {isAssigning ? 'Memberikan...' : 'Berikan Latihan'}
          </Button>
        </div>
      </div>
    </div>
  );
};
