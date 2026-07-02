import React, { useState } from 'react';
import { ArrowLeft, Users, BookOpen, Plus, UserPlus, Settings } from 'lucide-react';
import { Button } from '../common/Button';
import { StudentList } from './StudentList';
import { Class, Exercise, User } from '../../types';

interface ClassDetailProps {
  classItem: Class;
  students: User[];
  exercises: Exercise[];
  onBack: () => void;
  onAddStudent: () => void;
  onAddExercise: () => void;
  onRemoveStudent: (studentId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onEditClass: () => void;
}

export const ClassDetail: React.FC<ClassDetailProps> = ({
  classItem,
  students,
  exercises,
  onBack,
  onAddStudent,
  onAddExercise,
  onRemoveStudent,
  onRemoveExercise,
  onEditClass
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'exercises'>('students');

  const tabs = [
    { id: 'students', label: 'Students', icon: Users, count: students.length },
    { id: 'exercises', label: 'Exercises', icon: BookOpen, count: exercises.length }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{classItem.name}</h1>
            <p className="text-gray-600 mt-1">{classItem.description}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onEditClass}>
            <Settings className="h-4 w-4 mr-2" />
            Edit Class
          </Button>
          {activeTab === 'students' ? (
            <Button onClick={onAddStudent}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          ) : (
            <Button onClick={onAddExercise}>
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                  <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'students' && (
            <StudentList
              students={students}
              onRemoveStudent={onRemoveStudent}
              showActions={true}
            />
          )}

          {activeTab === 'exercises' && (
            <div className="space-y-4">
              {exercises.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No exercises assigned
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Add exercises to this class to get started
                  </p>
                  <Button onClick={onAddExercise}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Exercise
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{exercise.title}</h4>
                        <button
                          onClick={() => onRemoveExercise(exercise.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {exercise.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{exercise.subject} • Grade {exercise.grade}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          exercise.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          exercise.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {exercise.difficulty}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};