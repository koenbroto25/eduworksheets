import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../services/supabaseClient';

interface FindByCodeResult {
  result_type: 'class' | 'user';
  result_data: any;
}

const SearchPage = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: string; data: any } | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSearch = async () => {
    if (!code.trim()) {
      setError('Please enter a code.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    const { data, error: rpcError } = await supabaseService.findByCode(supabase, code.trim());

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
    } else if (data) {
      const result = data as FindByCodeResult;
      if (result.result_type && result.result_data) {
        setResult({
          type: result.result_type,
          data: result.result_data,
        });
      } else {
        setError('Code not found.');
      }
    } else {
      setError('Code not found.');
    }
  };

  const handleJoinClass = async (classId: string) => {
    if (!user) {
      setError('You must be logged in to join a class.');
      return;
    }
    
    const { error: joinError } = await supabase
      .from('class_students')
      .insert({ class_id: classId, student_id: user.id });

    if (joinError) {
      setError(`Failed to join class: ${joinError.message}`);
    } else {
      navigate(`/class/${classId}`);
    }
  };

  const handleLinkToChild = async (childId: string) => {
    if (!user || user.role !== 'parent') {
      setError('You must be logged in as a parent to link to a child.');
      return;
    }

    const { error: linkError } = await supabaseService.linkParentToChild(supabase, user.id, childId);

    if (linkError) {
      setError(`Failed to link to child: ${linkError.message}`);
    } else {
      // Optionally, you can add a success message or navigate somewhere
      alert('Successfully linked to child!');
    }
  };

  const renderResult = () => {
    if (!result) return null;

    if (result.type === 'class') {
      return (
        <div className="card lg:card-side bg-base-100 shadow-xl mt-6">
          <div className="card-body">
            <h2 className="card-title text-2xl">{result.data.name}</h2>
            <p className="text-gray-500">{result.data.description || 'No description available.'}</p>
            <div className="card-actions justify-end mt-4">
              <button 
                className="btn btn-primary"
                onClick={() => handleJoinClass(result.data.id)}
              >
                Join Class
              </button>
              <button 
                className="btn btn-ghost"
                onClick={() => navigate(`/class/${result.data.id}`)}
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (result.type === 'user') {
      const isParent = user?.role === 'parent';
      const isStudent = result.data.role === 'student';

      return (
        <div className="card lg:card-side bg-base-100 shadow-xl mt-6">
          <div className="card-body">
            <div className="flex items-center space-x-4">
              <div className="avatar">
                <div className="w-16 rounded-full">
                  <img src={result.data.avatar_url || `https://ui-avatars.com/api/?name=${result.data.name}&background=random`} alt="User avatar" />
                </div>
              </div>
              <div>
                <h2 className="card-title text-2xl">{result.data.name}</h2>
                <p className="text-gray-500 capitalize">{result.data.role}</p>
              </div>
            </div>
            <div className="card-actions justify-end mt-4">
              {isParent && isStudent && (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleLinkToChild(result.data.id)}
                >
                  Link to Child
                </button>
              )}
              <button 
                className="btn btn-primary"
                onClick={() => navigate(`/profile/${result.data.id}`)}
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">Find by Code</h1>
          <p className="text-lg text-gray-500 mt-2">Enter a code to find a class or user.</p>
        </div>
        
        <div className="card bg-base-100 shadow-xl p-8">
          <div className="form-control">
            <div className="input-group">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code..."
                className="input input-bordered w-full"
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="btn btn-primary" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : 'Search'}
              </button>
            </div>
          </div>

          {error && <div className="alert alert-error shadow-lg mt-4"><div><span>{error}</span></div></div>}
          
          {result && renderResult()}

          {!loading && !error && !result && (
            <div className="text-center mt-6 text-gray-400">
              <p>Results will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
