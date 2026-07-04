import React, { useState } from 'react';
import { Wand2, Loader2, AlertCircle, Key } from 'lucide-react';
import { PromptBuilderForm as FormData } from '../../types';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { getGeminiApiKey, generateQuestionsWithGemini } from '../../services/aiGenerationService';

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
  onQuestionsGenerated?: (questions: any[]) => void;
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
  onQuestionsGenerated,
}) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);

  const buildPrompt = () => {
    const { context, keywords, avoidTopics, emphasis, learningObjectives } = formData;
    const feedbackType = (subject === 'Matematika' || subject === 'Fisika' || subject === 'Kimia')
      ? 'step_by_step_solution' : 'detailed';
    const curriculumDetails: Record<string, string> = {
      'Kurikulum Merdeka Belajar': 'Focus on project-based learning (PjBL), essential concepts, and interdisciplinary approaches.',
      'Kurikulum Deep Learning': 'Emphasize the 6C competencies. Questions should be competency-based.',
      'Cambridge International Curriculum (CAIE)': 'Align with Cambridge learning objectives.',
      'International Baccalaureate (IB)': 'Reflect the IB Learner Profile. Concept-based, higher-order thinking.',
    };
    const detailedCurriculumInfo = `${curriculum_type} - ${curriculumDetails[curriculum_type] || 'Standard curriculum.'}`;
    const islamicInstructions = subject === 'Pendidikan Agama Islam dan Budi Pekerti'
      ? `- **Special Instructions**: Include complete, vocalized Arabic text for Qur'an/Hadith quotes with Indonesian translation.\n` : '';

    return `# ROLE\nYou are an expert AI creating high-quality educational exercises.\n\n# TASK\nCreate a JSON array of question objects based on the instruction header below.\n\n# INSTRUCTION HEADER\n- **Number of Questions**: ${numQuestions}\n- **Grade/Level**: ${grade}\n- **Subject**: ${subject}\n- **Curriculum**: ${detailedCurriculumInfo}\n- **Semester**: ${semester}\n- **Chapter**: ${formData.chapter || 'Not specified'}\n- **Specific Material**: ${formData.material || 'All materials in the chapter'}\n- **Assessment Type**: ${assessmentType}\n- **Question Type(s)**: ${questionType}\n- **Difficulty Level(s)**: ${difficulty}\n- **Language**: ${language}\n- **Learning Objectives**: ${learningObjectives || 'Not specified'}\n- **Feedback Type**: ${feedbackType}\n- **Thinking Skills Emphasis**: ${emphasis}\n${islamicInstructions}${context ? `- **Context/Scenario**: ${context}\n` : ''}${keywords ? `- **Important Keywords**: ${keywords}\n` : ''}${avoidTopics ? `- **Topics to Avoid**: ${avoidTopics}\n` : ''}- **Author Name**: ${user?.name || 'Teacher'}\n\n# REQUIREMENTS\n## JSON Output Format\n- Output MUST be a raw JSON array only. No markdown, no backticks, no extra text.\n- Each object = one question.\n\n## Question Structure\n### type: "multiple-choice"\n{ type, question, options (array 4-5 strings), answer (0-based index number), explanation, difficulty }\n\n### type: "short-answer"\n{ type, question, answer (string), explanation, difficulty }\n\n### type: "connecting-lines"\n{ type, question, leftItems (array), rightItems (array), answer (object: {"0":[1],"1":[0]}), explanation, difficulty }\n\n### type: "sequencing"\n{ type, question, items (array), answer (array in correct order), explanation, difficulty }\n\n### type: "fill-in-the-blanks"\n{ type, question (with {{blank1}} placeholders), wordBank (optional array), answer (object: {"blank1":"word"}), explanation, difficulty }\n\n## Content Rules\n- All questions must be factually accurate.\n- Explanation must be thorough. For Math/Physics/Chemistry: numbered step-by-step solution.\n\n# GENERATE THE JSON ARRAY NOW.`;
  };

  const handleBuatSoal = async () => {
    setError('');
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      setShowApiKeyWarning(true);
      return;
    }
    setIsGenerating(true);
    try {
      const prompt = buildPrompt();
      onGeneratePrompt(formData, prompt);
      const questions = await generateQuestionsWithGemini(prompt, apiKey);
      onQuestionsGenerated?.(questions);
    } catch (e: any) {
      setError(e.message || 'Gagal generate soal. Periksa API key Anda dan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Wand2 className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Setting Soal</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
          <div><p className="text-sm font-medium text-gray-600">Mata Pelajaran</p><p className="font-semibold text-gray-800">{subject}</p></div>
          <div><p className="text-sm font-medium text-gray-600">Kelas</p><p className="font-semibold text-gray-800">{grade}</p></div>
          <div><p className="text-sm font-medium text-gray-600">Semester</p><p className="font-semibold text-gray-800">{semester}</p></div>
          <div><p className="text-sm font-medium text-gray-600">Tingkat Kesulitan</p><p className="font-semibold text-gray-800">{difficulty}</p></div>
          <div><p className="text-sm font-medium text-gray-600">Tipe Penilaian</p><p className="font-semibold text-gray-800">{assessmentType}</p></div>
          <div><p className="text-sm font-medium text-gray-600">Kurikulum</p><p className="font-semibold text-gray-800">{curriculum_type}</p></div>
          <div><p className="text-sm font-medium text-gray-600">Jumlah Soal</p><p className="font-semibold text-gray-800">{numQuestions}</p></div>
          <div><p className="text-sm font-medium text-gray-600">Tipe Soal</p><p className="font-semibold text-gray-800">{questionType}</p></div>
          <div><p className="text-sm font-medium text-gray-600">Bahasa</p><p className="font-semibold text-gray-800">{language}</p></div>
          <div><p className="text-sm font-medium text-gray-600">Bab</p><p className="font-semibold text-gray-800">{formData.chapter || 'N/A'}</p></div>
          <div className="col-span-2"><p className="text-sm font-medium text-gray-600">Materi</p><p className="font-semibold text-gray-800">{formData.material || 'N/A'}</p></div>
          <div className="col-span-2"><p className="text-sm font-medium text-gray-600">Tujuan Pembelajaran</p><p className="font-semibold text-gray-800">{formData.learningObjectives || 'N/A'}</p></div>
        </div>

        {showApiKeyWarning && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg">
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 mb-1">Gemini API Key Diperlukan</p>
                <p className="text-sm text-amber-700 mb-2">
                  Untuk menggunakan fitur pembuatan soal otomatis, Anda perlu memasukkan Gemini API Key di halaman Settings.
                  Layanan ini <strong>gratis</strong> — Google menyediakan kuota gratis yang cukup untuk penggunaan sehari-hari guru.
                  API key bersifat pribadi dan hanya tersimpan di perangkat Anda.
                </p>
                <p className="text-xs text-amber-600">
                  Cara mendapatkan API key: buka <strong>aistudio.google.com/apikey</strong> → klik "Create API Key" → salin dan tempel di Settings &gt; Pengaturan AI.
                </p>
                <div className="mt-3 flex gap-2">
                  <a href="/settings" className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded hover:bg-amber-700">
                    Buka Settings
                  </a>
                  <button onClick={() => setShowApiKeyWarning(false)} className="text-xs text-amber-600 hover:underline">
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {isGenerating && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800">Sedang membuat soal...</p>
              <p className="text-sm text-blue-600">Gemini AI sedang memproses permintaan Anda. Harap tunggu sebentar.</p>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Pastikan semua setting sudah benar. Klik <strong>"Kembali"</strong> untuk revisi, atau <strong>"Buat Soal"</strong> untuk generate soal secara otomatis.
          </p>
          <div className="flex justify-center space-x-4">
            <Button onClick={onBack} variant="outline" disabled={isGenerating}>
              Kembali
            </Button>
            <Button onClick={handleBuatSoal} disabled={isGenerating}>
              {isGenerating
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Membuat Soal...</>
                : <><Wand2 className="h-4 w-4 mr-2" />Buat Soal</>
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};