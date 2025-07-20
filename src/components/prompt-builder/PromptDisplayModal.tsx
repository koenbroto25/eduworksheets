import React from 'react';
import { Copy, Download, X } from 'lucide-react';
import { Button } from '../common/Button';

interface PromptDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  onCopy: () => void;
  onDownload: () => void;
}

export const PromptDisplayModal: React.FC<PromptDisplayModalProps> = ({
  isOpen,
  onClose,
  prompt,
  onCopy,
  onDownload,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-3xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Prompt yang Dihasilkan</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(prompt)}>
              <Copy className="h-4 w-4 mr-1" />
              Salin
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-1" />
              Unduh
            </Button>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
            {prompt}
          </pre>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Langkah Selanjutnya: Gunakan Qwen AI</h4>
          <p className="text-sm text-blue-800 mb-3">
            Kami merekomendasikan **Qwen AI** untuk menghasilkan soal berkualitas tinggi.
          </p>
          <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
            <li>
              **Salin & Buka**: Klik tombol **"Salin Prompt & Buka AI"**. Ini akan menyalin prompt dan membuka situs Qwen AI di tab baru.
            </li>
            <li>
              **Pilih Model (PENTING)**: Di situs Qwen AI, pastikan Anda memilih model **Qwen2.5-Max** di bagian kiri atas untuk hasil terbaik dan bebas eror.
            </li>
            <li>
              **Daftar/Masuk**: Jika Anda belum memiliki akun, silakan mendaftar terlebih dahulu.
            </li>
            <li>
              **Tempel (Paste)**: Tempelkan prompt yang sudah Anda salin ke dalam kolom chat.
            </li>
            <li>
              **Salin Hasil JSON**: Setelah Qwen AI selesai, salin seluruh kode JSON yang diberikan.
            </li>
            <li>
              **Kembali & Tempel**: Kembali ke aplikasi ini dan tempelkan kode JSON tersebut ke kolom **"Tempel JSON"** di tab sebelumnya.
            </li>
          </ol>
          <div className="mt-4 flex justify-center gap-4">
            <Button onClick={onCopy} size="lg">
              <Copy className="h-5 w-5 mr-2" />
              Salin Prompt & Buka AI
            </Button>
            <Button onClick={onClose} size="lg" variant="secondary">
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
