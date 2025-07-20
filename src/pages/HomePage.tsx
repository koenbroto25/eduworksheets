import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Target, Sparkles, ArrowRight, Play, User, GraduationCap, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PublicExerciseList } from '../components/public-library/PublicExerciseList';
import { SearchBar } from '../components/common/SearchBar';
import { Button } from '../components/common/Button';
import { Exercise } from '../types';
import { supabase } from '../services/supabaseClient';
import HeroImage from '../assets/images/landing/hero-image.png';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredExercises, setFeaturedExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSearch = () => {
    navigate(`/library?search=${encodeURIComponent(searchTerm)}`);
  };

  useEffect(() => {
    const fetchFeaturedExercises = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) {
        console.error('Error fetching featured exercises:', error);
      } else {
        setFeaturedExercises(data as Exercise[]);
      }
      setLoading(false);
    };

    fetchFeaturedExercises();
  }, []);

  const handleUseExercise = (exercise: Exercise) => {
    // This would typically open a modal to assign the exercise
    alert(`Assigning "${exercise.title}"...`);
    // Example: navigate(`/assign/${exercise.id}`);
  };

  const handlePractice = (exercise: Exercise) => {
    navigate(`/library/exercise/${exercise.id}/take`);
  };

  const stats = [
    { icon: BookOpen, label: 'Latihan Tersedia', value: '1,200+' },
    { icon: Users, label: 'Pengguna Aktif', value: '5,000+' },
    { icon: Target, label: 'Tingkat Keberhasilan', value: '95%' },
    { icon: Sparkles, label: 'Dihasilkan oleh AI', value: '800+' }
  ];

  const roles = [
    {
      icon: Briefcase,
      title: 'Untuk Guru',
      description: 'Buat latihan yang menarik dalam hitungan menit dan dapatkan wawasan mendalam tentang kinerja siswa.',
      link: '/for-teachers'
    },
    {
      icon: GraduationCap,
      title: 'Untuk Siswa',
      description: 'Belajar sesuai kecepatan Anda sendiri dengan latihan interaktif dan umpan balik instan.',
      link: '/for-students'
    },
    {
      icon: User,
      title: 'Untuk Orang Tua',
      description: 'Dukung perjalanan belajar anak Anda dengan latihan yang selaras dengan kurikulum.',
      link: '/for-parents'
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Transformasi Pembelajaran dengan <span className="text-blue-600">Lembar Kerja Berbasis AI</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto md:mx-0">
              Berdayakan pendidik, libatkan siswa, dan ikut sertakan orang tua dengan platform pembelajaran interaktif kami yang revolusioner.
            </p>
            
            {user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/dashboard')}
                className="text-lg px-8 py-3"
              >
                Buka Dasbor
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {user.role === 'teacher' && (
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/exercise-builder')}
                  className="text-lg px-8 py-3"
                >
                  Buat Latihan
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/signup')}
                className="text-lg px-8 py-3"
              >
                Mulai Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/login')}
                className="text-lg px-8 py-3"
              >
                Masuk
              </Button>
            </div>
          )}
          </div>
          <div className="hidden md:flex items-center justify-center">
            <img src={HeroImage} alt="Guru dan siswa menggunakan EduWorksheets" className="rounded-2xl shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Dirancang untuk Ekosistem Pendidikan Anda
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Baik Anda seorang guru, siswa, atau orang tua, EduWorksheets memiliki alat untuk meningkatkan pengalaman belajar Anda.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center transform hover:-translate-y-2 transition-transform duration-300">
                <Icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{role.title}</h3>
                <p className="text-gray-600 mb-6">{role.description}</p>
                <Button variant="outline" onClick={() => navigate(role.link)}>
                  Pelajari Lebih Lanjut <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Search Section */}
      <section className="container mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Temukan Latihan yang Sempurna
          </h2>
          <p className="text-gray-600 text-lg">
            Cari di antara ribuan latihan edukatif yang dibuat oleh para guru di seluruh dunia.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto flex gap-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Cari mata pelajaran, topik, atau jenjang kelas..."
            className="flex-1"
          />
          <Button onClick={handleSearch} size="lg">
            Cari
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <Icon className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-md text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Exercises */}
      <section className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Latihan Unggulan
            </h2>
            <p className="text-gray-600 text-lg">
              Jelajahi latihan populer dan yang baru dibuat dari komunitas kami.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/library')}
          >
            Lihat Semua
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Memuat latihan unggulan...</p>
          </div>
        ) : (
          <PublicExerciseList
            exercises={featuredExercises}
            onUseExercise={user?.role === 'teacher' ? handleUseExercise : undefined}
            onPractice={handlePractice}
          />
        )}
      </section>

      {/* Call to Action */}
      {!user && (
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white text-center py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold mb-4">
              Siap Merevolusi Pembelajaran?
            </h2>
            <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Bergabunglah dengan ribuan pendidik, siswa, dan orang tua yang menggunakan alat berbasis AI untuk membuat dan berbagi konten pendidikan yang menarik.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/signup')}
                className="bg-white text-blue-600 hover:bg-blue-50 border-transparent text-lg px-8 py-3"
              >
                Mulai Gratis
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
