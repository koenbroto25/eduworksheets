import React, { useState, useEffect } from 'react';
import { Copy, Wand2, Download } from 'lucide-react';
import { PromptBuilderForm as FormData, curriculumTypes } from '../../types';
import { PromptDisplayModal } from './PromptDisplayModal';
import { Input } from '../common/Input';
import { FilterDropdown } from '../common/FilterDropdown';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseService } from '../../services/supabaseService';

interface PromptBuilderFormProps {
  formData: FormData;
  onFormChange: (field: keyof FormData, value: any) => void;
  onGeneratePrompt: (formData: FormData, prompt: string) => void;
  subject: string;
  grade: string;
  semester: string;
  difficulty: string;
  assessmentType: string;
  curriculum_type: string;
  numQuestions: number;
  questionType: string;
  language: string;
  onBack: () => void;
  onNavigateToPaste: () => void;
}

export const PromptBuilderForm: React.FC<PromptBuilderFormProps> = ({
  formData,
  onFormChange,
  onGeneratePrompt,
  subject,
  grade,
  semester,
  difficulty,
  assessmentType,
  curriculum_type,
  numQuestions,
  questionType,
  language,
  onBack,
  onNavigateToPaste,
}) => {
  const { user, supabase } = useAuth();

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  const handleCloseAndNavigate = () => {
    setIsPromptModalOpen(false);
    onNavigateToPaste();
  };

  const generatePrompt = () => {
    const {
      context,
      keywords,
      avoidTopics,
      emphasis,
      learningObjectives
    } = formData;

    // Handle custom inputs
    const finalGrade = grade;
    const finalSubject = subject;
    const finalChapter = formData.chapter;
    
    const finalDifficulty = difficulty;
    const finalQuestionType = questionType;

    const learningContext = 'Real-World Application';
    const inclusiveDesign = ['Illustrative Elements'];
    const vocationalField = ''; // Removed from UI

    const feedbackType = (subject === 'Matematika' || subject === 'Fisika' || subject === 'Kimia') 
      ? 'step_by_step_solution' 
      : 'detailed';

    const curriculumDetails: { [key: string]: string } = {
      'Kurikulum Merdeka Belajar': 'Focus on project-based learning (PjBL), essential concepts, and interdisciplinary approaches. Questions should encourage critical thinking and real-world problem-solving.',
      'Kurikulum Deep Learning': 'Emphasize the 6C competencies (Character, Citizenship, Collaboration, Communication, Creativity, Critical Thinking). Questions should be competency-based and assess deep understanding.',
      'Cambridge International Curriculum (CAIE)': 'Align with Cambridge learning objectives. Focus on inquiry-based learning, developing skills in analysis, evaluation, and synthesis. Use internationally relevant contexts.',
      'International Baccalaureate (IB)': 'Reflect the IB Learner Profile attributes. Questions should be concept-based, encourage international-mindedness, and often require interdisciplinary connections and higher-order thinking skills.'
    };

    const detailedCurriculumInfo = `${curriculum_type} - ${curriculumDetails[curriculum_type] || 'Standard curriculum.'}`;

    const materialFocus = formData.material || 'All materials in the chapter';

    const islamicStudiesInstructions = finalSubject === 'Pendidikan Agama Islam dan Budi Pekerti'
      ? `- **Special Instructions for Islamic Studies**:
  - **Arabic Text Accuracy**: For all quotations from the Qur'an or Hadith, it is MANDATORY to include the complete, accurate, and fully vocalized (harakat/syakal) Arabic text.
  - **Translation Requirement**: Always provide an accurate Indonesian translation for every Arabic text.
  - **Answer Key Precision**: For "short-answer" questions where the answer is in Arabic, ensure the \`answer\` field contains the precise, vocalized Arabic text as the key.`
      : '';

    const prompt = `# ROLE
You are an expert AI assistant specializing in creating high-quality, diverse, and pedagogically sound educational exercises.

# TASK
Based on the detailed instruction header below, create a JSON array of question objects. Adhere strictly to all constraints and formats specified.

# INSTRUCTION HEADER
- **Number of Questions**: ${numQuestions}
- **Grade/Level**: ${finalGrade}
- **Subject**: ${finalSubject}
- **Curriculum**: ${detailedCurriculumInfo}
- **Semester**: ${semester}
- **Chapter**: ${finalChapter || 'Not specified'}
- **Specific Material**: ${materialFocus}
- **Assessment Type**: ${assessmentType}
- **Question Type(s) to Generate**: ${finalQuestionType}
- **Difficulty Level(s)**: ${finalDifficulty}
- **Language**: ${language}
- **Learning Objectives**: ${learningObjectives || 'Not specified'}
- **Learning Context**: ${learningContext}
- **Inclusive Design Elements**: ${inclusiveDesign.join(', ')}
- **Feedback Type**: ${feedbackType}
- **Thinking Skills Emphasis**: ${emphasis}
${islamicStudiesInstructions ? `${islamicStudiesInstructions}\n` : ''}${context ? `- **Context/Scenario**: ${context}` : ''}
${keywords ? `- **Important Keywords**: ${keywords}` : ''}
${avoidTopics ? `- **Topics to Avoid**: ${avoidTopics}` : ''}
- **Author Name**: ${user?.name || 'Teacher'}

# REQUIREMENTS

## 1. JSON Output Format
- The final output MUST be a raw JSON array. Do not wrap it in markdown, backticks, or any other text.
- Each object in the array represents a single question.

## 2. Question Object Structure (Strictly Enforced)
Each question object MUST have the following properties based on its \`type\`:

### For \`type: "multiple-choice"\`
- \`type\`: "multiple-choice"
- \`question\`: (string) The question text.
- \`options\`: (array of strings) An array of 4-5 potential answers.
- \`answer\`: (number) The 0-based index of the correct option in the \`options\` array.
- \`explanation\`: (string) A clear explanation of why the answer is correct.
- \`difficulty\`: (string) e.g., "easy", "medium", "hard".

### For \`type: "short-answer"\`
- \`type\`: "short-answer"
- \`question\`: (string) The question text.
- \`answer\`: (string) The correct answer.
- \`explanation\`: (string)
- \`difficulty\`: (string)

### For \`type: "connecting-lines"\`
- \`type\`: "connecting-lines"
- \`question\`: (string) A prompt for the matching task.
- \`leftItems\`: (array of strings) Items to be placed on the left.
- \`rightItems\`: (array of strings) Items to be placed on the right.
- \`answer\`: (object) An object where each key is the index of a left item, and the value is an array containing the index of the corresponding right item(s). e.g., \`{"0": [1], "1": [0]}\`
- \`explanation\`: (string)
- \`difficulty\`: (string)

### For \`type: "sequencing"\`
- \`type\`: "sequencing"
- \`question\`: (string) A prompt for the sequencing task.
- \`items\`: (array of strings) The items to be placed in order.
- \`answer\`: (array of strings) The \`items\` array in the correct order.
- \`explanation\`: (string)
- \`difficulty\`: (string)

### For \`type: "fill-in-the-blanks"\`
- \`type\`: "fill-in-the-blanks"
- \`question\`: (string) The main text containing placeholders like \`{{blank1}}\`, \`{{blank2}}\`.
- \`wordBank\`: (array of strings, optional) A list of words to fill the blanks.
- \`answer\`: (object) An object where keys are placeholder names (\`blank1\`) and values are the correct words. e.g., \`{"blank1": "Paris", "blank2": "France"}\`
- \`explanation\`: (string)
- \`difficulty\`: (string)

## 3. Content and Feedback Instructions
- **Content Accuracy**: All questions must be factually accurate and relevant to the INSTRUCTION HEADER.
- **Feedback Quality**: The \`explanation\` field is critical.
  - For **Feedback Type** \`detailed\`, provide a comprehensive explanation.
  - For **Feedback Type** \`step_by_step_solution\`, provide a detailed, numbered, step-by-step guide to solving the problem, including any relevant formulas or logic. This is mandatory for subjects like Math, Physics, and Chemistry.

# YOUR TASK
Generate the JSON array of question objects now.
`;

    setGeneratedPrompt(prompt);
    setIsPromptModalOpen(true);
    onGeneratePrompt(formData, prompt);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    window.open('https://chat.qwen.ai/', '_blank');
  };

  const downloadPrompt = () => {
    const blob = new Blob([generatedPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-prompt.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Wand2 className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Pembuat Prompt AI</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <div><p className="text-sm font-medium text-gray-600">Mata Pelajaran</p><p className="font-semibold text-gray-800">{subject}</p></div>
              <div><p className="text-sm font-medium text-gray-600">Kelas</p><p className="font-semibold text-gray-800">{grade}</p></div>
              <div><p className="text-sm font-medium text-gray-600">Semester</p><p className="font-semibold text-gray-800">{semester}</p></div>
              <div><p className="text-sm font-medium text-gray-600">Tingkat Kesulitan</p><p className="font-semibold text-gray-800">{difficulty}</p></div>
              <div><p className="text-sm font-medium text-gray-600">Tipe Penilaian</p><p className="font-semibold text-gray-800">{assessmentType}</p></div>
              <div><p className="text-sm font-medium text-gray-600">Kurikulum</p><p className="font-semibold text-gray-800">{curriculum_type}</p></div>
              <div><p className="text-sm font-medium text-gray-600">Jumlah Pertanyaan</p><p className="font-semibold text-gray-800">{numQuestions}</p></div>
              <div><p className="text-sm font-medium text-gray-600">Tipe Pertanyaan</p><p className="font-semibold text-gray-800">{questionType}</p></div>
              <div><p className="text-sm font-medium text-gray-600">Bahasa</p><p className="font-semibold text-gray-800">{language}</p></div>
              <div><p className="text-sm font-medium text-gray-600">Bab</p><p className="font-semibold text-gray-800">{formData.chapter || 'N/A'}</p></div>
              <div className="col-span-2"><p className="text-sm font-medium text-gray-600">Materi/Bab</p><p className="font-semibold text-gray-800">{formData.material || 'N/A'}</p></div>
              <div className="col-span-2"><p className="text-sm font-medium text-gray-600">Tujuan Pembelajaran</p><p className="font-semibold text-gray-800">{formData.learningObjectives || 'N/A'}</p></div>
              <div className="col-span-2"><p className="text-sm font-medium text-gray-600">Konteks/Skenario</p><p className="font-semibold text-gray-800">{formData.context || 'N/A'}</p></div>
              <div className="col-span-2"><p className="text-sm font-medium text-gray-600">Kata Kunci</p><p className="font-semibold text-gray-800">{formData.keywords || 'N/A'}</p></div>
              <div><p className="text-sm font-medium text-gray-600">Penekanan Keterampilan Berpikir</p><p className="font-semibold text-gray-800">{formData.emphasis}</p></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The fields have been moved to ExerciseSettings.tsx */}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Pastikan data awal latihan soal anda sudah benar. Silahkan klik tombol "Kembali" apabila ingin melakukan revisi, atau klik tombol "Buat Prompt AI" untuk melanjutkan.
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={onBack} variant="outline">
                Kembali
              </Button>
              <Button onClick={generatePrompt}>
                <Wand2 className="h-4 w-4 mr-2" />
                Buat Prompt AI
              </Button>
            </div>
          </div>
        </div>
      </div>
      <PromptDisplayModal
        isOpen={isPromptModalOpen}
        onClose={handleCloseAndNavigate}
        prompt={generatedPrompt}
        onCopy={copyToClipboard}
        onDownload={downloadPrompt}
      />
    </>
  );
};
