import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Heart, Shield, TrendingUp, Gift } from 'lucide-react';
import ForParentsImage from '../assets/images/landing/for-parents.png';

const ForParentsPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Heart,
      title: 'Dukung Pembelajaran Anak Anda',
      description: 'Berikan latihan yang selaras dengan kurikulum dengan mudah untuk membantu anak Anda berlatih dan memperkuat apa yang mereka pelajari di sekolah.',
    },
    {
      icon: TrendingUp,
      title: 'Pantau Kemajuan Mereka',
      description: 'Tetap terinformasi tentang kinerja anak Anda. Lihat mata pelajaran mana yang mereka kuasai dan di mana mereka mungkin memerlukan dukungan ekstra.',
    },
    {
      icon: Shield,
      title: 'Konten Aman & Berkualitas',
      description: 'Akses perpustakaan latihan yang dibuat oleh pendidik profesional, memastikan lingkungan belajar yang aman dan produktif.',
    },
    {
      icon: Gift,
      title: 'Jembatani Rumah dan Sekolah',
      description: 'Jadilah mitra aktif dalam pendidikan anak Anda. Platform kami memudahkan untuk mendukung perjalanan belajar mereka di rumah.',
    },
  ];

  return (
    <div className="bg-white">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Jadilah Juara Belajar Anak Anda
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            EduWorksheets menyediakan alat yang Anda butuhkan untuk berpartisipasi aktif dan mendukung keberhasilan pendidikan anak Anda.
          </p>
          <Button size="lg" onClick={() => navigate('/signup?role=parent')}>
            Dukung Perjalanan Anak Anda
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
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
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
              <img src={ForParentsImage} alt="Orang tua dan anak belajar bersama" className="rounded-2xl shadow-2xl" />
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white text-center py-16">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-4">
              Siap Terlibat?
            </h2>
            <p className="text-xl mb-8 text-purple-100">
              Buat akun orang tua gratis Anda dan mulailah membuat perbedaan hari ini.
            </p>
            <Button 
              size="lg" 
              variant="ghost"
              onClick={() => navigate('/signup?role=parent')}
              className="bg-white text-purple-600 hover:bg-purple-100 font-semibold shadow-md"
            >
              Daftar sebagai Orang Tua
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ForParentsPage;
