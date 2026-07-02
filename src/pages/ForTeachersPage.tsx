import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { CheckCircle, BarChart2, Zap, Users } from 'lucide-react';
import ForTeachersImage from '../assets/images/landing/for-teachers.png';

const ForTeachersPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: 'Pembuatan Latihan Berbasis AI',
      description: 'Hasilkan berbagai latihan interaktif dalam hitungan menit, bukan jam. Dari pilihan ganda hingga kategorisasi, hemat waktu persiapan Anda yang berharga.',
    },
    {
      icon: BarChart2,
      title: 'Analitik Siswa Mendalam',
      description: 'Lacak kemajuan kelas dan individu siswa dengan dasbor analitik kami yang kuat. Identifikasi kesenjangan belajar dan sesuaikan pengajaran Anda secara efektif.',
    },
    {
      icon: Users,
      title: 'Manajemen Kelas yang Mulus',
      description: 'Atur siswa Anda ke dalam kelas, berikan latihan, dan pantau tingkat penyelesaian semua di satu tempat.',
    },
    {
      icon: CheckCircle,
      title: 'Penilaian & Umpan Balik Otomatis',
      description: 'Berikan umpan balik yang instan dan konstruktif kepada siswa Anda. Sistem kami mengotomatiskan penilaian untuk sebagian besar jenis pertanyaan, membebaskan Anda untuk fokus pada mengajar.',
    },
  ];

  return (
    <div className="bg-white">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Hemat Waktu, Mengajar Lebih Cerdas
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            EduWorksheets memberdayakan Anda dengan alat AI untuk menciptakan pengalaman belajar yang menarik dan mendapatkan wawasan berharga tentang kemajuan siswa Anda.
          </p>
          <Button size="lg" onClick={() => navigate('/signup?role=teacher')}>
            Mulai sebagai Guru
          </Button>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
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
            <div className="hidden md:flex items-center justify-center">
              <img src={ForTeachersImage} alt="Guru menggunakan dasbor analitik" className="rounded-2xl shadow-2xl" />
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white text-center py-16">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-4">
              Siap Mentransformasi Kelas Anda?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Bergabunglah dengan komunitas pendidik inovatif kami hari ini.
            </p>
            <Button 
              size="lg" 
              variant="ghost"
              onClick={() => navigate('/signup?role=teacher')}
              className="bg-white text-blue-600 hover:bg-blue-100 font-semibold shadow-md"
            >
              Daftar Gratis
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ForTeachersPage;
