
import React from 'react';
import { Search, Bell } from 'lucide-react';
import type { User } from '../types';

interface HeaderProps {
  user: User;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="flex-shrink-0 bg-light-card dark:bg-dark-card border-b border-light-border dark:border-dark-border p-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pacientes ou laudos..."
            className="w-full md:w-96 pl-10 pr-4 py-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 relative">
          <Bell className="h-6 w-6 text-secondary" />
          <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-dark-card"></span>
        </button>
        <div className="flex items-center space-x-2">
          <img src={user.avatar} alt="User Avatar" className="h-10 w-10 rounded-full" />
          <div>
            <p className="font-semibold text-sm">{user.name}</p>
            <p className="text-xs text-secondary">{user.title}</p>
          </div>
        </div>
      </div>
    </header>
  );
};