import React, { useState, useCallback } from 'react';
import { Save, Eye, Code, Settings, Wand2 } from 'lucide-react';
import { JsonPaster } from './JsonPaster';
import { ExercisePreview } from './ExercisePreview';
import { Button } from '../common/Button';
import { SaveExerciseModal } from './SaveExerciseModal';
import { PromptBuilderForm } from '../prompt-builder/PromptBuilderForm';
import { PromptBuilderForm as FormData, Question, CurriculumType } from '../../types';
import { ExerciseSettings } from './ExerciseSettings';

interface ExerciseBuilderProps {
  initialData?: any;
  onSave?: (exerciseData: any) => void;
  promptData: FormData;
  onPromptDataChange: React.Dispatch<React.SetStateAction<FormData>>;
  exerciseData: any;
  onExerciseDataChange: (data: any) => void;
}

export const ExerciseBuilder: React.FC<ExerciseBuilderProps> = ({
  initialData,
  onSave,
  promptData,
  onPromptDataChange,
  exerciseData,
  onExerciseDataChange,
}) => {
  const [activeTab, setActiveTab] = useState<'basic-setting' | 'ai-prompt' | 'paste-json' | 'preview'>('basic-setting');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [staticData, setStaticData] = useState<any>(null);

  const handleApplySettings = () => {
    setStaticData({ ...exerciseData, ...promptData });
    setActiveTab('ai-prompt');
  };

  const handlePromptFormChange = useCallback((field: keyof FormData, value: any) => {
    onPromptDataChange((prevData) => ({ ...prevData, [field]: value }));
  }, [onPromptDataChange]);

  const handlePromptGenerated = (formData: FormData, generatedPrompt: string) => {
    const header = generatedPrompt.substring(generatedPrompt.indexOf('# INSTRUCTION HEADER'), generatedPrompt.indexOf('# REQUIREMENTS'));
    const lines = header.split('\n').filter(line => line.startsWith('- '));
    const details: { [key: string]: string } = {};
    lines.forEach(line => {
      const firstColonIndex = line.indexOf(':');
      if (firstColonIndex !== -1) {
        const key = line.substring(2, firstColonIndex).trim();
        const value = line.substring(firstColonIndex + 1).trim();
        details[key] = value;
      }
    });

    const assessmentText = details['Assessment Type'] || '';
    let chapterText = details['Chapter'] || '';
    if (chapterText === 'Not specified') {
      chapterText = 'Semua Bab';
    }

    const title = `${assessmentText} ${chapterText}`.trim();
    const description = '';

    onExerciseDataChange((prev: any) => ({
      ...prev,
      title,
      description,
      subject: details['Subject'] || prev.subject,
      grade: details['Grade/Level'] || prev.grade,
      material: details['Specific Material'] || prev.material,
      difficulty: details['Difficulty Level'] || prev.difficulty,
    }));
  };

  const openSaveModal = () => {
    if (!exerciseData.questions || exerciseData.questions.length === 0) {
      alert('Please generate or add questions for the exercise.');
      setActiveTab('basic-setting');
      return;
    }
    setIsSaveModalOpen(true);
  };

  const handleFinalSave = (finalExerciseData: any) => {
    if (!finalExerciseData.subject || !finalExerciseData.grade) {
      alert('Please ensure Subject and Grade are set in the AI Prompt Settings.');
      return;
    }

    const cleanQuestions = finalExerciseData.questions.map((q: Question) => {
      // Ensure only relevant fields are sent to the backend
      const newQ: any = {
        type: q.type,
        question: q.question,
        answer: q.answer,
        explanation: q.explanation,
        difficulty: q.difficulty || 'medium',
      };
      if (q.options) newQ.options = q.options;
      if (q.items) newQ.items = q.items;
      if (q.leftItems) newQ.leftItems = q.leftItems;
      if (q.rightItems) newQ.rightItems = q.rightItems;
      return newQ;
    });

    const questionTypes = Array.from(new Set(cleanQuestions.map((q: Question) => q.type)));

    const exerciseToSave = {
      ...finalExerciseData,
      is_public: finalExerciseData.is_public ?? true,
      questions: cleanQuestions,
      question_types: questionTypes,
    };

    onSave?.(exerciseToSave);
    alert('Exercise saved successfully!');
    setIsSaveModalOpen(false);
  };

  const tabs = [
    { id: 'basic-setting', label: 'Basic Setting', icon: Settings },
    { id: 'ai-prompt', label: 'AI Prompt Setting', icon: Wand2 },
    { id: 'paste-json', label: 'Paste JSON', icon: Code },
    { id: 'preview', label: 'Preview', icon: Eye }
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Exercise Builder</h2>
          </div>

          {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center px-3 py-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className={activeTab === 'basic-setting' ? '' : 'hidden'}>
          <ExerciseSettings
              description={exerciseData.description}
              assessmentType={exerciseData.assessment_type || 'quiz'}
              subject={exerciseData.subject}
              grade={exerciseData.grade}
              semester={exerciseData.semester}
              difficulty={exerciseData.difficulty}
              curriculum_type={exerciseData.curriculum_type}
              minimumPassingGrade={exerciseData.minimum_passing_grade}
              numQuestions={exerciseData.numQuestions}
              questionType={exerciseData.questionType}
              language={exerciseData.language}
              onDescriptionChange={(description) => onExerciseDataChange((prev: any) => ({ ...prev, description }))}
              onAssessmentTypeChange={(assessmentType) => onExerciseDataChange((prev: any) => ({ ...prev, assessment_type: assessmentType }))}
              onSubjectChange={(subject) => onExerciseDataChange((prev: any) => ({ ...prev, subject }))}
              onGradeChange={(grade) => onExerciseDataChange((prev: any) => ({ ...prev, grade }))}
              onDifficultyChange={(difficulty) => onExerciseDataChange((prev: any) => ({ ...prev, difficulty }))}
              onSemesterChange={(semester) => onExerciseDataChange((prev: any) => ({ ...prev, semester }))}
              onCurriculumTypeChange={(curriculum_type) => onExerciseDataChange((prev: any) => ({ ...prev, curriculum_type }))}
              onMinimumPassingGradeChange={(minimum_passing_grade) => onExerciseDataChange((prev: any) => ({ ...prev, minimum_passing_grade }))}
              onNumQuestionsChange={(numQuestions) => onExerciseDataChange((prev: any) => ({ ...prev, numQuestions }))}
              onQuestionTypeChange={(questionType) => onExerciseDataChange((prev: any) => ({ ...prev, questionType }))}
              onLanguageChange={(language) => onExerciseDataChange((prev: any) => ({ ...prev, language }))}
              promptData={promptData}
              onPromptDataChange={handlePromptFormChange}
              onApply={handleApplySettings}
          />
        </div>

        <div className={activeTab === 'ai-prompt' ? '' : 'hidden'}>
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-xl">
               <div className="flex items-center mb-4">
                  <Wand2 className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-800">AI Prompt Settings</h3>
                </div>
              <PromptBuilderForm
                formData={staticData || { ...exerciseData, ...promptData }}
                onFormChange={handlePromptFormChange}
                onGeneratePrompt={handlePromptGenerated}
                subject={staticData?.subject || exerciseData.subject}
                grade={staticData?.grade || exerciseData.grade}
                semester={staticData?.semester || exerciseData.semester}
                difficulty={staticData?.difficulty || exerciseData.difficulty}
                assessmentType={staticData?.assessment_type || exerciseData.assessment_type}
                curriculum_type={staticData?.curriculum_type || exerciseData.curriculum_type}
                numQuestions={staticData?.numQuestions || exerciseData.numQuestions}
                questionType={staticData?.questionType || exerciseData.questionType}
                language={staticData?.language || exerciseData.language}
                onBack={() => setActiveTab('basic-setting')}
                onNavigateToPaste={() => setActiveTab('paste-json')}
              />
            </div>
          </div>
        </div>

        <div className={activeTab === 'paste-json' ? '' : 'hidden'}>
          <JsonPaster
            onJsonPaste={(jsonData) => {
              const questions = Array.isArray(jsonData) ? jsonData : jsonData.questions || [];
              onExerciseDataChange((prev: any) => ({ ...prev, questions: questions }));
              alert('JSON has been successfully applied!');
              setActiveTab('preview');
            }}
          />
        </div>

        <div className={activeTab === 'preview' ? '' : 'hidden'}>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">Simulasi Latihan Soal</h4>
              <p className="text-sm text-blue-800">
                Di sini, Anda dapat mencoba mengerjakan latihan soal persis seperti yang akan dilihat oleh siswa. Gunakan mode pratinjau ini untuk memastikan semuanya berfungsi sesuai harapan.
              </p>
              <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
                <li><b>Tombol "Submit"</b>: Klik tombol ini untuk mensimulasikan proses pengecekan jawaban. Anda akan melihat skor, jawaban yang benar, serta umpan balik (feedback) untuk setiap soal. Ini memberi Anda gambaran lengkap tentang apa yang akan dialami siswa.</li>
                <li><b>Tombol "Save Exercise"</b>: Setelah Anda puas dengan pratinjau, klik tombol ini untuk menyimpan latihan soal secara permanen.</li>
              </ul>
            </div>
            <ExercisePreview questions={exerciseData.questions || []} />
            <div className="mt-6 flex justify-end">
              <Button onClick={openSaveModal}>
                <Save className="h-4 w-4 mr-2" />
                Save Exercise
              </Button>
            </div>
        </div>
        </div>
      </div>
      <SaveExerciseModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleFinalSave}
        exerciseData={exerciseData}
        onExerciseDataChange={onExerciseDataChange}
      />
    </>
  );
};
