import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, UserPlus } from 'lucide-react';
import { Button } from '../common/Button';
import ChildCard from './ChildCard';

interface ParentDashboardProps {
  dashboardData: any;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ dashboardData }) => {
  const navigate = useNavigate();

  if (!dashboardData || !dashboardData.children || dashboardData.children.length === 0) {
    return (
      <div className="text-center bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Selamat Datang di Dasbor Orang Tua</h2>
        <p className="text-gray-600 mb-6">
          Anda belum menautkan akun anak. Gunakan "Kode Anak" untuk mulai memantau kemajuan belajar mereka.
        </p>
        <Button onClick={() => navigate('/link-child')} size="lg" icon={<UserPlus className="h-6 w-6" />}>
          Tautkan Akun Anak
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Anak Anda</h2>
        <Button onClick={() => navigate('/link-child')} icon={<PlusCircle className="h-4 w-4" />}>
          Tautkan Anak Lain
        </Button>
      </div>
      <div className="flex flex-col gap-8">
        {dashboardData.children.map((child: any) => (
          <ChildCard key={child.id} child={child} />
        ))}
      </div>
    </div>
  );
};

export default ParentDashboard;
