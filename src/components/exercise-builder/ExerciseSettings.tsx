import React, { useState, useEffect } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { FilterDropdown } from '../common/FilterDropdown';
import { fetchFilterOptions } from '../../data/filterOptions';
import { curriculumTypes, CurriculumType, PromptBuilderForm as FormData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseService } from '../../services/supabaseService';

interface ExerciseSettingsProps {
  description: string;
  assessmentType: string;
  subject: string;
  grade: string;
  difficulty: string;
  semester: string;
  curriculum_type?: CurriculumType;
  minimumPassingGrade?: number;
  numQuestions: number;
  questionType: string;
  language: string;
  onDescriptionChange: (description: string) => void;
  onAssessmentTypeChange: (assessmentType: string) => void;
  onSubjectChange: (subject: string) => void;
  onGradeChange: (grade: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  onSemesterChange: (semester: string) => void;
  onCurriculumTypeChange: (value: CurriculumType) => void;
  onMinimumPassingGradeChange: (value: number) => void;
  onNumQuestionsChange: (value: number) => void;
  onQuestionTypeChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  // New props for prompt fields
  promptData: FormData;
  onPromptDataChange: (field: keyof FormData, value: any) => void;
  onApply: () => void;
}

export const ExerciseSettings: React.FC<ExerciseSettingsProps> = ({
  description,
  assessmentType,
  subject,
  grade,
  difficulty,
  semester,
  curriculum_type,
  minimumPassingGrade,
  numQuestions,
  questionType,
  language,
  onDescriptionChange,
  onAssessmentTypeChange,
  onSubjectChange,
  onGradeChange,
  onDifficultyChange,
  onSemesterChange,
  onCurriculumTypeChange,
  onMinimumPassingGradeChange,
  onNumQuestionsChange,
  onQuestionTypeChange,
  onLanguageChange,
  promptData,
  onPromptDataChange,
  onApply,
}) => {
  const { supabase } = useAuth();
  const [subjectOptions, setSubjectOptions] = useState<{ value: string; label: string; }[]>([]);
  const [gradeOptions, setGradeOptions] = useState<{ value: string; label: string; }[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<{ value: string; label: string; }[]>([]);
  const [difficultyOptions, setDifficultyOptions] = useState<{ value: string; label: string; }[]>([]);
  const [assessmentOptions, setAssessmentOptions] = useState<{ value: string; label: string; }[]>([]);

  // State from PromptBuilderForm
  const [chapters, setChapters] = useState<string[]>([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [topics, setTopics] = useState<{ [key: string]: { subtopics: string[], subSubtopics: { [key: string]: string[] } } }>({});
  const [selectedTopics, setSelectedTopics] = useState<{ [key: string]: string[] }>({});
  const [customChapter, setCustomChapter] = useState('');
  const [customTopics, setCustomTopics] = useState('');

  const emphasisTypes = [
    { value: 'LOTS', label: 'LOTS (Keterampilan Berpikir Tingkat Rendah)' },
    { value: 'HOTS', label: 'HOTS (Keterampilan Berpikir Tingkat Tinggi)' },
    { value: 'balanced', label: 'Seimbang' }
  ];

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    onPromptDataChange(field, value);
  };

  useEffect(() => {
    const loadOptions = async () => {
      const options = await fetchFilterOptions();
      setSubjectOptions(options.subjects);
      setGradeOptions(options.grades);
      setSemesterOptions(options.semesters);
      setDifficultyOptions(options.difficultyLevels);
      setAssessmentOptions(options.assessmentTypes);
    };
    loadOptions();
  }, []);

  useEffect(() => {
    const fetchCurriculum = async () => {
      if (!supabase || !subject || !grade || !curriculum_type) return;
      const { data } = await supabaseService.getCurriculumData(supabase, subject, grade, semester, curriculum_type);
      if (data) {
        setChapters(data.chapters);
        setTopics(data.topics);
      } else {
        setChapters([]);
        setTopics({});
      }
      setSelectedChapter('');
      setSelectedTopics({});
    };

    fetchCurriculum();
  }, [subject, grade, semester, curriculum_type, supabase]);

  useEffect(() => {
    if (selectedChapter && selectedChapter !== 'custom' && topics[selectedChapter]) {
      const material = Object.entries(selectedTopics)
        .map(([topic, subtopics]) => {
          if (subtopics && subtopics.length > 0) {
            return `${topic}: ${subtopics.join(', ')}`;
          }
          return topic;
        })
        .join('; ');
      onPromptDataChange('material', material);
    } else {
      onPromptDataChange('material', '');
    }
  }, [selectedChapter, selectedTopics, topics, onPromptDataChange]);

  const handleTopicChange = (topic: string) => {
    setSelectedTopics(prev => {
      const newSelected = { ...prev };
      if (newSelected[topic]) {
        delete newSelected[topic];
      } else {
        newSelected[topic] = [];
      }
      return newSelected;
    });
  };

  const handleSubtopicChange = (topic: string, subtopic: string) => {
    setSelectedTopics(prev => {
      const newSelected = { ...prev };
      if (!newSelected[topic]) {
        newSelected[topic] = [];
      }
      if (newSelected[topic].includes(subtopic)) {
        newSelected[topic] = newSelected[topic].filter(s => s !== subtopic);
      } else {
        newSelected[topic].push(subtopic);
      }
      return newSelected;
    });
  };

  const questionTypes = [
    { value: 'Multiple Choice', label: 'Pilihan Ganda' },
    { value: 'Short Answer', label: 'Jawaban Singkat' },
    { value: 'Connecting Lines', label: 'Menghubungkan Garis' },
    { value: 'Sequencing', label: 'Mengurutkan' },
  ];

  const languages = [
    { value: 'Indonesian', label: 'Bahasa Indonesia' },
    { value: 'English', label: 'Bahasa Inggris' }
  ];

  const curriculumOptions = curriculumTypes.map(type => ({ value: type, label: type }));

  return (
    <div className="p-6 border border-gray-200 rounded-xl">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Detail Latihan
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Existing settings */}
        <div className="space-y-4">
          <FilterDropdown
            label="Mata Pelajaran"
            value={subject}
            onChange={onSubjectChange}
            options={subjectOptions}
          />
          <FilterDropdown
            label="Kelas"
            value={grade}
            onChange={onGradeChange}
            options={gradeOptions}
          />
          <FilterDropdown
            label="Semester"
            value={semester}
            onChange={onSemesterChange}
            options={semesterOptions}
          />
          <FilterDropdown
            label="Tingkat Kesulitan"
            value={difficulty}
            onChange={onDifficultyChange}
            options={difficultyOptions}
          />
          <FilterDropdown
            label="Tipe Penilaian"
            value={assessmentType}
            onChange={onAssessmentTypeChange}
            options={assessmentOptions}
            showAllOption={false}
          />
          <FilterDropdown
            label="Tipe Kurikulum"
            value={curriculum_type || ''}
            onChange={(value) => onCurriculumTypeChange(value as CurriculumType)}
            options={curriculumOptions}
            showAllOption={false}
          />
          <Input
            label="Nilai Ketuntasan Minimum"
            type="number"
            value={minimumPassingGrade || ''}
            onChange={(e) => onMinimumPassingGradeChange(parseInt(e.target.value, 10))}
            placeholder="Contoh: 75"
          />
          <Input
            label="Jumlah Pertanyaan"
            type="number"
            value={numQuestions}
            onChange={(e) => onNumQuestionsChange(parseInt(e.target.value))}
            min={1}
            max={50}
          />
          <FilterDropdown
            label="Tipe Pertanyaan"
            value={questionType}
            onChange={onQuestionTypeChange}
            options={questionTypes}
            showAllOption={false}
          />
          <FilterDropdown
            label="Bahasa"
            value={language}
            onChange={onLanguageChange}
            options={languages}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Berikan deskripsi singkat tentang latihan"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>
        </div>

        {/* Moved fields from PromptBuilderForm */}
        <div className="space-y-4">
          <FilterDropdown
            label="Bab"
            value={selectedChapter}
            onChange={(value) => setSelectedChapter(value)}
            options={[
              ...chapters.map(c => ({ value: c, label: c })),
              { value: 'custom', label: 'Bab Kustom' }
            ]}
            disabled={chapters.length === 0 && subject !== 'custom'}
          />

          {selectedChapter === 'custom' && (
            <div className="mt-2">
              <Input
                label="Bab Kustom"
                value={customChapter}
                onChange={(e) => setCustomChapter(e.target.value)}
                placeholder="Masukkan nama bab kustom"
                required
              />
            </div>
          )}

          {selectedChapter && topics[selectedChapter] && topics[selectedChapter].subtopics.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Topik & Sub-topik</label>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-300 p-2 space-y-1">
                {topics[selectedChapter].subtopics.map((topic: string) => (
                  <div key={topic}>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`topic-${topic}`}
                        checked={!!selectedTopics[topic]}
                        onChange={() => handleTopicChange(topic)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`topic-${topic}`} className="ml-2 block text-sm font-medium text-gray-900">
                        {topic}
                      </label>
                    </div>
                    {topics[selectedChapter].subSubtopics[topic] && topics[selectedChapter].subSubtopics[topic].length > 0 && (
                      <div className="ml-6 mt-1 space-y-1">
                        {topics[selectedChapter].subSubtopics[topic].map((subtopic: string) => (
                          <div key={subtopic} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`subtopic-${subtopic}`}
                              checked={selectedTopics[topic]?.includes(subtopic) ?? false}
                              onChange={() => handleSubtopicChange(topic, subtopic)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`subtopic-${subtopic}`} className="ml-2 block text-sm text-gray-900">
                              {subtopic}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedChapter === 'custom' && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">Topik Kustom</label>
              <textarea
                value={customTopics}
                onChange={(e) => setCustomTopics(e.target.value)}
                placeholder="Masukkan topik kustom, pisahkan dengan koma"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          )}
          
          <Input
            label="Materi/Bab (Opsional)"
            value={promptData.material}
            onChange={(e) => handleInputChange('material', e.target.value)}
            placeholder="Contoh: Pecahan, Fotosintesis, dll."
            disabled
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tujuan Pembelajaran
            </label>
            <textarea
              value={promptData.learningObjectives}
              onChange={(e) => handleInputChange('learningObjectives', e.target.value)}
              placeholder="Jelaskan tujuan pembelajaran untuk latihan ini..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              rows={3}
            />
          </div>
          
          <Input
            label="Konteks/Skenario (Opsional)"
            value={promptData.context}
            onChange={(e) => handleInputChange('context', e.target.value)}
            placeholder="Contoh: Aplikasi dunia nyata, konteks cerita, dll."
          />
          
          <Input
            label="Kata Kunci (Opsional)"
            value={promptData.keywords}
            onChange={(e) => handleInputChange('keywords', e.target.value)}
            placeholder="Pisahkan dengan koma, contoh: ekosistem, rantai makanan"
          />
          
          <FilterDropdown
            label="Penekanan Keterampilan Berpikir"
            value={promptData.emphasis}
            onChange={(value) => handleInputChange('emphasis', value)}
            options={emphasisTypes}
          />
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-gray-200">
        <Button onClick={onApply} className="w-full">
          Terapkan
        </Button>
      </div>
    </div>
  );
};
