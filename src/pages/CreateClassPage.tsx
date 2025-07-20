import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

const CreateClassPage: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();
  const { user, supabase } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      setError('Please enter a class name.');
      return;
    }

    if (!description) {
      setError('Please enter a class description.');
      return;
    }

    try {
      if (!supabase) {
        throw new Error("Supabase client is not available.");
      }
      const { data, error } = await supabaseService.createClass(supabase, {
        name,
        description,
      });

      if (error) {
        if (error.message.includes('violates row-level security policy')) {
          setError('Only teachers can create classes. Please make sure you are logged in with a teacher account.');
        } else {
          setError(error.message || 'Failed to create class.');
        }
      } else {
        navigate('/classes');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  if (user?.role !== 'teacher') {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-lg">Only teachers can create classes. Please sign up as a teacher or log in with a teacher account.</p>
        <Button onClick={() => navigate('/signup')} className="mt-4">
          Sign Up as a Teacher
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Create Class</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <Input
          label="Class Name"
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
            Description
          </label>
          <textarea
            id="description"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
          />
        </div>
        <Button type="submit">Create Class</Button>
      </form>
    </div>
  );
};

export default CreateClassPage;
