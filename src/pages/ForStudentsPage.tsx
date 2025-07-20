import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { BookOpen, Target, Award, MessageSquare } from 'lucide-react';
import ForStudentsImage from '../assets/images/landing/for-students.png';

const ForStudentsPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      title: 'Pembelajaran Interaktif',
      description: 'Lupakan lembar kerja yang statis. Latihan kami dinamis dan menarik, membuat belajar menjadi menyenangkan dan efektif.',
    },
    {
      icon: MessageSquare,
      title: 'Umpan Balik Instan & Membantu',
      description: 'Pahami kesalahan Anda secara langsung dengan penjelasan yang jelas untuk setiap pertanyaan, membantu Anda belajar dan berkembang lebih cepat.',
    },
    {
      icon: Target,
      title: 'Berlatih Sesuai Kecepatan Anda',
      description: 'Jelajahi perpustakaan latihan yang luas di berbagai mata pelajaran dan tingkat kesulitan. Latih apa yang Anda butuhkan, kapan pun Anda membutuhkannya.',
    },
    {
      icon: Award,
      title: 'Lacak Kemajuan Anda',
      description: 'Lihat skor Anda dan lacak peningkatan Anda dari waktu ke waktu. Banggalah dengan pencapaian belajar Anda!',
    },
  ];

  return (
    <div className="bg-white">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Jadikan Belajar Sebuah Petualangan
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Dengan EduWorksheets, belajar menjadi pengalaman yang interaktif dan memuaskan. Kuasai keterampilan baru dan capai tujuan akademik Anda.
          </p>
          <Button size="lg" onClick={() => navigate('/signup?role=student')}>
            Mulai Belajar Sekarang
          </Button>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="hidden md:flex items-center justify-center">
              <img src={ForStudentsImage} alt="Siswa belajar dengan EduWorksheets" className="rounded-2xl shadow-2xl" />
            </div>
            <div className="space-y-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                      <p className="text-gray-600 mt-1">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl text-white text-center py-16">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-4">
              Siap Menguasai Mata Pelajaran?
            </h2>
            <p className="text-xl mb-8 text-green-100">
              Buat akun gratis Anda dan mulailah berlatih dengan ribuan latihan.
            </p>
            <Button 
              size="lg" 
              variant="ghost"
              onClick={() => navigate('/signup?role=student')}
              className="bg-white text-green-600 hover:bg-green-100 font-semibold shadow-md"
            >
              Daftar Gratis
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ForStudentsPage;
