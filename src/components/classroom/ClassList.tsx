import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseService } from '../../services/supabaseService';
import { Plus, Users, BookOpen, Calendar, Settings, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '../common/Button';
import { SearchBar } from '../common/SearchBar';
import { Class } from '../../types';

const ClassList: React.FC = () => {
  const { user, supabase } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClasses = useCallback(async () => {
    if (!user || !supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabaseService.getClassesByTeacher(supabase, user.id);
      if (error) {
        throw new Error(error.message);
      }
      // Ensure studentIds and exerciseIds are always arrays
      const formattedData = (data || []).map((c: Class) => ({
        ...c,
        studentIds: c.studentIds || [],
        exerciseIds: c.exerciseIds || [],
      }));
      setClasses(formattedData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching classes:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleDeleteClass = async (classId: string) => {
    if (!supabase) return;
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      try {
        const { error } = await supabaseService.deleteClass(supabase, classId);
        if (error) throw error;
        // Refetch classes to update the list
        fetchClasses();
      } catch (err: any) {
        console.error("Error deleting class:", err);
        alert(`Failed to delete class: ${err.message}`);
      }
    }
  };

  const filteredClasses = classes.filter(classItem =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (classItem.description && classItem.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return <div className="text-center p-4">Loading classes...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search classes..."
        />
      </div>

      {filteredClasses.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-800">
            {searchTerm ? 'No classes found' : 'You haven\'t created any classes yet.'}
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            {searchTerm
              ? 'Try adjusting your search terms.'
              : 'Get started by creating your first class.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => navigate('/create-class')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
            <div
              key={classItem.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between hover:shadow-lg transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <h3
                    className="text-lg font-bold text-gray-800 cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/class/${classItem.id}`)}
                  >
                    {classItem.name}
                  </h3>
                  <div className="relative group">
                    <button className="p-1 text-gray-500 hover:text-gray-700">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                      <button
                        onClick={() => navigate(`/class/${classItem.id}/edit`)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="h-4 w-4 mr-2 inline-block" />
                        Edit Class
                      </button>
                      <button
                        onClick={() => handleDeleteClass(classItem.id)}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <Trash2 className="h-4 w-4 mr-2 inline-block" />
                        Delete Class
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 h-10 overflow-hidden">
                  {classItem.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{classItem.studentIds.length} students</span>
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{classItem.exerciseIds.length} exercises</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Created on {new Date(classItem.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassList;
