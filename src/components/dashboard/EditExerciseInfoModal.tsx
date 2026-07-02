import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { FilterDropdown } from '../common/FilterDropdown';
import { fetchFilterOptions } from '../../data/filterOptions';
import { supabaseService } from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';

interface EditExerciseInfoModalProps {
  exercise: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedExercise: any) => void;
}

export const EditExerciseInfoModal: React.FC<EditExerciseInfoModalProps> = ({ exercise, isOpen, onClose, onSave }) => {
  const { supabase } = useAuth();
  const [formData, setFormData] = useState(exercise);
  const [subjectOptions, setSubjectOptions] = useState<{ value: string; label: string }[]>([]);
  const [gradeOptions, setGradeOptions] = useState<{ value: string; label: string }[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<{ value: string; label: string }[]>([]);
  const [assessmentTypeOptions, setAssessmentTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [curriculumTypeOptions, setCurriculumTypeOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    setFormData(exercise);
  }, [exercise]);

  useEffect(() => {
    const loadOptions = async () => {
      const options = await fetchFilterOptions();
      setSubjectOptions(options.subjects);
      setGradeOptions(options.grades);
      setSemesterOptions(options.semesters);
      setAssessmentTypeOptions(options.assessmentTypes);
      setCurriculumTypeOptions(options.curriculumTypes);
    };
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDropdownChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (name === 'grade') {
      // Reset subject when grade changes
      setFormData((prev: any) => ({ ...prev, subject: 'all' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    const updates = {
      title: formData.title,
      description: formData.description,
      subject: formData.subject,
      grade: formData.grade,
      semester: formData.semester,
      curriculum_type: formData.curriculum_type,
      assessment_type: formData.assessment_type,
    };

    const { error } = await supabaseService.updateExercise(supabase, exercise.id, updates);

    if (error) {
      alert('Error updating exercise: ' + error.message);
    } else {
      onSave({ ...exercise, ...updates });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">Edit Exercise Information</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" rows={3}></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FilterDropdown label="Grade" options={gradeOptions} value={formData.grade} onChange={(value) => handleDropdownChange('grade', value)} />
            <FilterDropdown label="Subject" options={subjectOptions} value={formData.subject} onChange={(value) => handleDropdownChange('subject', value)} />
            <FilterDropdown label="Semester" options={semesterOptions} value={formData.semester} onChange={(value) => handleDropdownChange('semester', value)} />
            <FilterDropdown label="Curriculum" options={curriculumTypeOptions} value={formData.curriculum_type} onChange={(value) => handleDropdownChange('curriculum_type', value)} />
            <FilterDropdown label="Assessment Type" options={assessmentTypeOptions} value={formData.assessment_type} onChange={(value) => handleDropdownChange('assessment_type', value)} />
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
