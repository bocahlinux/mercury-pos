import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  return (
    <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Mercury POS</h1>
      <div className="flex items-center space-x-4">
        <span>{user?.email}</span>
        <button onClick={logout} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
