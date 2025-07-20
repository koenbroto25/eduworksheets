import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExerciseBuilder } from '../components/exercise-builder/ExerciseBuilder';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';
import { Exercise, PromptBuilderForm as PromptData } from '../types';

export const ExerciseBuilderPage: React.FC = () => {
  const { user, supabase } = useAuth();
  const navigate = useNavigate();

  const [promptData, setPromptData] = useState<PromptData>(() => {
    const savedPromptData = sessionStorage.getItem('promptData');
    return savedPromptData ? JSON.parse(savedPromptData) : {
      material: '',
      difficulty: 'medium',
      learningObjectives: '',
      context: '',
      keywords: '',
      avoidTopics: '',
      feedbackType: 'rinci',
      emphasis: 'seimbang'
    };
  });

  const [exerciseData, setExerciseData] = useState(() => {
    const savedExerciseData = sessionStorage.getItem('exerciseData');
    return savedExerciseData ? JSON.parse(savedExerciseData) : {
      title: '',
      description: '',
      subject: 'Matematika',
      grade: 'Grade 7 (SMP)',
      semester: 'Semester 1',
      material: '',
      difficulty: 'medium',
      assessment_type: 'ANBK',
      
      questions: [],
      tags: [],
      numQuestions: 10,
      questionType: 'Multiple Choice',
      language: 'Indonesian',
      curriculum_type: 'Kurikulum Merdeka Belajar'
    };
  });

  useEffect(() => {
    sessionStorage.setItem('promptData', JSON.stringify(promptData));
  }, [promptData]);

  useEffect(() => {
    sessionStorage.setItem('exerciseData', JSON.stringify(exerciseData));
  }, [exerciseData]);

  const handleSaveExercise = async (exerciseData: Exercise) => {
    if (!user) {
      alert('Anda harus masuk untuk menyimpan latihan.');
      return;
    }

    const { title, subject, grade, questions } = exerciseData;

    if (!title || !subject || !grade || !questions) {
      alert('Judul, mata pelajaran, kelas, dan pertanyaan harus diisi.');
      return;
    }

    try {
      // Explicitly build the object to send to the backend, ensuring correct field names
      const exerciseToSave = {
        title: exerciseData.title,
        description: exerciseData.description,
        subject: exerciseData.subject,
        grade: exerciseData.grade,
        semester: exerciseData.semester,
        material: exerciseData.material,
        difficulty: exerciseData.difficulty,
        assessment_type: exerciseData.assessment_type,
        curriculum_type: exerciseData.curriculum_type,
        minimum_passing_grade: exerciseData.minimum_passing_grade,
        question_types: exerciseData.question_types,
        is_public: exerciseData.is_public ?? true,
        creator_id: user.id,
        questions: exerciseData.questions,
        tags: exerciseData.tags,
      };

      const { data, error } = await supabaseService.createExercise(supabase, exerciseToSave);

      if (error) {
        console.error('Gagal menyimpan latihan:', error);
        alert(`Gagal menyimpan latihan: ${error.message}`);
        throw error;
      }

      if (data) {
        alert('Latihan berhasil disimpan!');
        sessionStorage.removeItem('promptData');
        sessionStorage.removeItem('exerciseData');
        navigate(`/library/exercise/${data.id}`);
      }
    } catch (error) {
      // Error is already handled above
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Pembuat Latihan
        </h1>
        <p className="text-xl text-gray-600">
          Buat latihan interaktif menggunakan prompt bertenaga AI atau pengkodean manual
        </p>
      </div>
      
      <ExerciseBuilder
        onSave={handleSaveExercise}
        promptData={promptData}
        onPromptDataChange={setPromptData}
        exerciseData={exerciseData}
        onExerciseDataChange={setExerciseData}
      />
    </div>
  );
};
