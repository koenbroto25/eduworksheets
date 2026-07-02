import React, { useState } from 'react';
import { BookOpen, Play, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { SearchBar } from '../common/SearchBar';
import { FilterDropdown } from '../common/FilterDropdown';
import { ClassExercise } from '../../types';

interface ExerciseListProps {
  classExercises: ClassExercise[];
  onStartExercise: (classExercise: ClassExercise) => void;
  completedExercises?: string[];
  onViewSettings: (classExercise: ClassExercise) => void;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  classExercises = [],
  onStartExercise,
  completedExercises = [],
  onViewSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const subjects = [...new Set(classExercises.map(ce => ce.exercise.subject))].map(subject => ({
    value: subject,
    label: subject
  }));

  const difficulties = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  const filteredExercises = classExercises.filter(ce => {
    const exercise = ce.exercise;
    const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !selectedSubject || exercise.subject === selectedSubject;
    const matchesDifficulty = !selectedDifficulty || exercise.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const isCompleted = (exerciseId: string) => completedExercises.includes(exerciseId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Class Exercises</h1>
        <p className="text-gray-600">Complete exercises assigned by your teacher</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search exercises..."
          />
          <FilterDropdown
            label="Subject"
            value={selectedSubject}
            onChange={setSelectedSubject}
            options={subjects}
          />
          <FilterDropdown
            label="Difficulty"
            value={selectedDifficulty}
            onChange={setSelectedDifficulty}
            options={difficulties}
          />
        </div>

        {filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedSubject || selectedDifficulty 
                ? 'No exercises found' 
                : 'No exercises assigned'
              }
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedSubject || selectedDifficulty
                ? 'Try adjusting your search or filters'
                : 'Your teacher will assign exercises here'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map((classExercise) => {
              const exercise = classExercise.exercise;
              const completed = isCompleted(exercise.id);
              
              return (
                <div
                  key={classExercise.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow flex flex-col"
                >
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {exercise.title}
                          </h3>
                          {completed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                          )}
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {exercise.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {exercise.subject}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        Grade {exercise.grade}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        exercise.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        exercise.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {exercise.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {exercise.questions?.length || 0} questions
                      </div>
                      <div className="flex items-center">
                        <span className={completed ? 'text-green-600' : 'text-orange-600'}>
                          {completed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto space-y-2">
                    <Button
                      onClick={() => onStartExercise(classExercise)}
                      className="w-full"
                      variant={completed ? 'outline' : 'primary'}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {completed ? 'Lihat Hasil' : 'Mulai Latihan'}
                    </Button>
                    <Button
                      onClick={() => onViewSettings(classExercise)}
                      className="w-full"
                      variant="secondary"
                    >
                      Lihat Aturan
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
