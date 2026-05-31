import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Package, CreditCard, FileText, Users, BarChart2, Settings, LogOut } from 'lucide-react';
import { cn } from '@/utils/cn';

const menuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/pos', label: 'POS', icon: ShoppingCart },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/transactions', label: 'Transactions', icon: CreditCard },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/reports', label: 'Reports', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="bg-sidebar text-white w-64 min-h-screen p-4 hidden md:block">
      <h2 className="text-2xl font-bold mb-6">Mercury POS</h2>
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center p-2 rounded hover:bg-primary/20',
                  isActive && 'bg-primary/30 font-medium'
                )
              }
            >
              <Icon className="mr-2" size={20} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-700">
        <button
          onClick={() => {
            // placeholder logout handled in Header
          }}
          className="flex items-center w-full p-2 hover:bg-red-500/20 rounded"
        >
          <LogOut className="mr-2" size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
